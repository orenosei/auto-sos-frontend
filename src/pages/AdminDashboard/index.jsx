import { useEffect, useMemo, useState } from "react";
import {
  Users,
  Building2,
  Car,
  TrendingUp,
  ShieldCheck,
  ShieldX,
  CheckCircle2,
  XCircle,
  Search,
  Eye,
  Trash2,
  AlertTriangle,
  Star,
} from "lucide-react";
import OverviewTab from './components/OverviewTab';
import UsersTab from './components/UsersTab';
import CompaniesTab from './components/CompaniesTab';
import RequestsTab from './components/RequestsTab';
import ContentTab from './components/ContentTab';
import { AdminDashboardContext } from "./AdminDashboardContext";
import { deleteUser, getUsers, updateUser } from "../../api/users";
import { getCompanies, updateCompany } from "../../api/companies";
import { getRequests, getRequestServices } from "../../api/requests";
import { toUiRequest } from "../../api/mappers";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const PIE_COLORS = ["#f472b6", "#60a5fa", "#a78bfa", "#fb923c", "#34d399"];

const statusConfig = {
  pending: { label: "Chờ tiếp nhận", color: "text-yellow-600 bg-yellow-50 border-yellow-200" },
  accepted: { label: "Đã tiếp nhận", color: "text-blue-600 bg-blue-50 border-blue-200" },
  heading: { label: "Đang di chuyển", color: "text-indigo-600 bg-indigo-50 border-indigo-200" },
  arrived: { label: "Đã đến nơi", color: "text-cyan-600 bg-cyan-50 border-cyan-200" },
  processing: { label: "Đang xử lý", color: "text-purple-600 bg-purple-50 border-purple-200" },
  completed: { label: "Hoàn tất", color: "text-green-600 bg-green-50 border-green-200" },
  cancelled: { label: "Đã hủy", color: "text-gray-500 bg-gray-50 border-gray-200" },
};

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [searchText, setSearchText] = useState("");

  const [users, setUsers] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);

  const computedStats = useMemo(() => {
    const totalUsers = users.length;
    const totalCompanies = companies.length;
    const verifiedCompanies = companies.filter((c) => c.verified).length;
    const totalRequests = requests.length;
    const completedRequests = requests.filter((r) => r.status === "completed").length;
    const pendingRequests = requests.filter((r) => r.status === "pending").length;
    const activeUsers = users.filter((u) => u.isActive).length;
    const totalRevenue = requests.reduce((sum, r) => sum + (Number(r.finalPrice ?? r.servicePrice) || 0), 0);
    const completionRate =
      totalRequests === 0 ? 0 : Math.round((completedRequests / totalRequests) * 100);

    return {
      totalUsers,
      activeUsers,
      totalCompanies,
      verifiedCompanies,
      totalRequests,
      completedRequests,
      pendingRequests,
      totalRevenue,
      completionRate,
    };
  }, [users, companies, requests]);

  const monthlyData = useMemo(() => {
    const buckets = new Map();
    for (let month = 1; month <= 12; month += 1) {
      buckets.set(month, { month: `Th.${month}`, requests: 0, completed: 0 });
    }

    for (const request of requests) {
      const date = new Date(request.createdAt);
      if (!Number.isFinite(date.getTime())) continue;
      const bucket = buckets.get(date.getMonth() + 1);
      if (!bucket) continue;
      bucket.requests += 1;
      if (request.status === "completed") bucket.completed += 1;
    }

    return Array.from(buckets.values());
  }, [requests]);

  const serviceDistribution = useMemo(() => {
    const counts = new Map();
    for (const request of requests) {
      const key = request.serviceType || "Khác";
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }

    const total = Array.from(counts.values()).reduce((sum, value) => sum + value, 0);
    if (total === 0) return [];

    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({
        name,
        value: Math.round((count / total) * 100),
      }));
  }, [requests]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [u, c] = await Promise.all([getUsers(), getCompanies()]);
        if (cancelled) return;

        const uiUsers = u.map((x) => ({
          id: String(x.user_id),
          name: x.full_name || x.user_name,
          email: x.user_email ?? "",
          phone: x.user_phone,
          role: x.user_role ?? "user",
          isActive: x.is_active !== false,
          createdAt: x.registered_at,
        }));
        setUsers(uiUsers);

        const uiCompanies = c.map((x) => ({
          id: String(x.company_id),
          name: x.company_name,
          address: x.relative_address ?? "",
          operatingArea: x.rescue_area ?? "",
          license: x.company_license ?? "",
          avatarUrl: x.avatar_url ?? "",
          verificationDocumentUrls: Array.isArray(x.verification_document_urls)
            ? x.verification_document_urls
            : [],
          verified: !!x.is_verified,
          rating: 4.5,
          totalReviews: 0,
        }));
        setCompanies(uiCompanies);

        const userById = new Map(uiUsers.map((x) => [x.id, x]));
        const companyNameById = new Map(uiCompanies.map((x) => [x.id, x.name]));

        const requestsById = new Map();
        const settled = await Promise.allSettled(
          uiCompanies.map(async (co) => {
            const backend = await getRequests({ company_id: co.id });
            for (const r of backend) {
              let serviceType = "";
              let servicePrice = null;
              try {
                const svc = await getRequestServices(r.request_id);
                serviceType = svc.data?.[0]?.service_name ?? "";
                servicePrice = svc.data?.[0]?.service_price ?? null;
              } catch {
                // ignore
              }

              const urow = r.user_id != null ? userById.get(String(r.user_id)) : undefined;

              const mapped = toUiRequest(r, {
                userName: urow?.name ?? "",
                userPhone: urow?.phone ?? "",
                companyName: r.company_id != null ? companyNameById.get(String(r.company_id)) : undefined,
                serviceType,
                servicePrice,
              });

              requestsById.set(mapped.id, mapped);
            }
          })
        );

        if (cancelled) return;
        // ignore individual company failures
        void settled;

        setRequests(Array.from(requestsById.values()).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)));
      } catch (e) {
        console.error(e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const tabs = [
    { key: "overview", label: "Tổng quan", icon: <TrendingUp size={16} /> },
    { key: "users", label: "Người dùng", icon: <Users size={16} /> },
    { key: "companies", label: "Công ty", icon: <Building2 size={16} /> },
    { key: "requests", label: "Yêu cầu", icon: <Car size={16} /> },
    { key: "content", label: "Kiểm duyệt", icon: <ShieldCheck size={16} /> },
  ];

  const handleToggleUserActive = async (user) => {
    try {
      const updated = await updateUser(user.id, { is_active: !user.isActive });
      setUsers((prev) =>
        prev.map((u) =>
          u.id === user.id
            ? { ...u, isActive: updated.is_active !== false, role: updated.user_role ?? u.role }
            : u
        )
      );
    } catch (e) {
      console.error(e);
      window.alert(e instanceof Error ? e.message : "Cập nhật tài khoản thất bại");
    }
  };

  const handleDeleteUser = async (user) => {
    const ok = window.confirm(`Xóa tài khoản "${user.name}"?`);
    if (!ok) return;

    try {
      await deleteUser(user.id);
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
    } catch (e) {
      console.error(e);
      window.alert(e instanceof Error ? e.message : "Xóa tài khoản thất bại");
    }
  };

  const handleToggleCompanyVerified = async (company) => {
    if (!company.verified && company.verificationDocumentUrls.length === 0) {
      window.alert("Công ty cần tải tài liệu kiểm duyệt trước khi xác minh");
      return;
    }
    try {
      const updated = await updateCompany(company.id, { is_verified: !company.verified });
      setCompanies((prev) =>
        prev.map((c) =>
          c.id === company.id ? { ...c, verified: !!updated.is_verified } : c
        )
      );
    } catch (e) {
      console.error(e);
      window.alert(e instanceof Error ? e.message : "Cập nhật xác minh thất bại");
    }
  };

  const contextValue = {
    activeTab, setActiveTab, users, setUsers, companies, setCompanies, requests, setRequests, loading, setLoading, searchText, setSearchText, computedStats, monthlyData, serviceDistribution, handleDeleteUser, handleToggleUserActive, handleToggleCompanyVerified, statusConfig, PIE_COLORS
  };

  return (
    <AdminDashboardContext.Provider value={contextValue}>
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bảng điều khiển quản trị</h1>
          <p className="text-gray-500 text-sm">Quản lý và giám sát hệ thống RescueGo</p>
        </div>
        <div className="flex items-center gap-2 bg-purple-50 border border-purple-200 rounded-xl px-4 py-2">
          <ShieldCheck size={16} className="text-purple-600" />
          <span className="text-sm font-medium text-purple-700">Quản trị viên</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-2xl mb-6 overflow-x-auto w-fit">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === t.key
                ? "bg-white text-purple-600 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && <OverviewTab />}

      {/* Users Tab */}
      {activeTab === "users" && <UsersTab />}

      {/* Companies Tab */}
      {activeTab === "companies" && <CompaniesTab />}

      {/* Requests Tab */}
      {activeTab === "requests" && <RequestsTab />}

      {/* Content Moderation Tab */}
      {activeTab === "content" && <ContentTab />}
    </div>
    </AdminDashboardContext.Provider>
  );
}
