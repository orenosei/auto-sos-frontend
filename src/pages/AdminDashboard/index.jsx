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
import { deleteCompany, getCompanies, updateCompany } from "../../api/companies";
import { getRequests } from "../../api/requests";
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

const PIE_COLORS = ["#f472b6", "#f472b6", "#a78bfa", "#fb923c", "#34d399"];
const LOCKED_COMPANIES_KEY = "rescuesos.admin.lockedCompanies";

const loadLockedCompanies = () => {
  try {
    const raw = window.localStorage.getItem(LOCKED_COMPANIES_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
};

const saveLockedCompanies = (ids) => {
  try {
    window.localStorage.setItem(LOCKED_COMPANIES_KEY, JSON.stringify(ids));
  } catch {
    // ignore storage failures
  }
};

const statusConfig = {
  pending: { label: "Chờ tiếp nhận", color: "text-yellow-600 bg-yellow-50 border-yellow-200" },
  accepted: { label: "Đã tiếp nhận", color: "text-pink-600 bg-pink-50 border-pink-200" },
  heading: { label: "Đang di chuyển", color: "text-pink-600 bg-pink-50 border-pink-200" },
  arrived: { label: "Đã đến nơi", color: "text-pink-600 bg-pink-50 border-pink-200" },
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
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [lockedCompanyIds, setLockedCompanyIds] = useState(loadLockedCompanies);

  const computedStats = useMemo(() => {
    const totalUsers = users.length;
    const totalCompanies = companies.length;
    const verifiedCompanies = companies.filter((c) => c.verified).length;
    const totalRequests = requests.length;
    const completedRequests = requests.filter((r) => r.status === "completed").length;
    const pendingRequests = requests.filter((r) => r.status === "pending").length;
    const emergencyRequests = requests.filter((r) => ["critical", "emergency", "urgent", "high"].includes(r.priority)).length;
    const activeUsers = users.filter((u) => u.isActive).length;
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
      emergencyRequests,
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

        const lockedIds = new Set(loadLockedCompanies());
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
          phone: x.company_phone ?? "",
          registeredAt: x.registered_at,
          rating: Number(x.average_rating ?? 0) || 0,
          totalReviews: Number(x.review_count ?? 0) || 0,
          responseTime: Number(x.avg_response_minutes ?? 0) || 0,
          locked: lockedIds.has(String(x.company_id)),
        }));
        setCompanies(uiCompanies);

        const userById = new Map(uiUsers.map((x) => [x.id, x]));
        const companyNameById = new Map(uiCompanies.map((x) => [x.id, x.name]));

        const requestsById = new Map();
        const backendRequests = await getRequests();
        for (const r of backendRequests) {
            const urow = r.user_id != null ? userById.get(String(r.user_id)) : undefined;
            const mapped = toUiRequest(r, {
              userName: urow?.name ?? r.contact_name ?? "",
              userPhone: urow?.phone ?? r.contact_phone ?? "",
              companyName: r.company_id != null ? companyNameById.get(String(r.company_id)) : undefined,
              serviceType: r.issue_type || "Chưa chọn dịch vụ",
            });

            requestsById.set(mapped.id, mapped);
        }

        if (cancelled) return;

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
      const nextLockedIds = lockedCompanyIds.filter((id) => id !== String(company.id));
      setLockedCompanyIds(nextLockedIds);
      saveLockedCompanies(nextLockedIds);
      setCompanies((prev) =>
        prev.map((c) =>
          c.id === company.id ? { ...c, verified: !!updated.is_verified, locked: false } : c
        )
      );
    } catch (e) {
      console.error(e);
      window.alert(e instanceof Error ? e.message : "Cập nhật xác minh thất bại");
    }
  };

  const handleLockCompany = async (company) => {
    const ok = window.confirm(`Bạn có chắc muốn khóa công ty "${company.name}"?`);
    if (!ok) return;
    try {
      const updated = await updateCompany(company.id, { is_verified: false });
      const nextLockedIds = Array.from(new Set([...lockedCompanyIds, String(company.id)]));
      setLockedCompanyIds(nextLockedIds);
      saveLockedCompanies(nextLockedIds);
      setCompanies((prev) =>
        prev.map((c) =>
          c.id === company.id ? { ...c, verified: !!updated.is_verified, locked: true } : c
        )
      );
    } catch (e) {
      console.error(e);
      window.alert(e instanceof Error ? e.message : "Khóa công ty thất bại");
    }
  };

  const handleUnlockCompany = async (company) => {
    const ok = window.confirm(`Mở khóa công ty "${company.name}"?`);
    if (!ok) return;
    const nextLockedIds = lockedCompanyIds.filter((id) => id !== String(company.id));
    setLockedCompanyIds(nextLockedIds);
    saveLockedCompanies(nextLockedIds);
    setCompanies((prev) =>
      prev.map((c) =>
        c.id === company.id ? { ...c, locked: false, verified: false } : c
      )
    );
  };

  const handleDeleteCompany = async (company) => {
    const ok = window.confirm(`Xóa công ty "${company.name}"? Các dữ liệu liên quan có thể bị ảnh hưởng.`);
    if (!ok) return;
    try {
      await deleteCompany(company.id);
      setCompanies((prev) => prev.filter((c) => c.id !== company.id));
      setRequests((prev) => prev.map((r) => (r.companyId === company.id ? { ...r, companyName: "" } : r)));
    } catch (e) {
      console.error(e);
      window.alert(e instanceof Error ? e.message : "Xóa công ty thất bại");
    }
  };

  const getCompanyRequestCount = (companyId) =>
    requests.filter((r) => r.companyId === String(companyId)).length;

  const getUserRequestCount = (userId) =>
    requests.filter((r) => r.userId === String(userId)).length;

  const contextValue = {
    activeTab, setActiveTab, users, setUsers, companies, setCompanies, requests, setRequests, loading, setLoading, searchText, setSearchText, computedStats, monthlyData, serviceDistribution, handleDeleteUser, handleToggleUserActive, handleToggleCompanyVerified, handleLockCompany, handleUnlockCompany, handleDeleteCompany, setSelectedUser, setSelectedCompany, setSelectedRequest, getCompanyRequestCount, getUserRequestCount, statusConfig, PIE_COLORS
  };

  return (
    <AdminDashboardContext.Provider value={contextValue}>
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bảng điều khiển quản trị</h1>
          <p className="text-gray-500 text-sm">Quản lý và giám sát hệ thống RescueSOS</p>
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

      {selectedUser && (
        <DetailModal title="Chi tiết người dùng" onClose={() => setSelectedUser(null)}>
          <DetailRow label="Tên" value={selectedUser.name} />
          <DetailRow label="Email" value={selectedUser.email || "Chưa cập nhật"} />
          <DetailRow label="Điện thoại" value={selectedUser.phone || "Chưa cập nhật"} />
          <DetailRow label="Vai trò" value={selectedUser.role === "admin" ? "Admin" : "User"} />
          <DetailRow label="Trạng thái" value={selectedUser.isActive ? "Hoạt động" : "Đã khóa"} />
          <DetailRow label="Số yêu cầu" value={getUserRequestCount(selectedUser.id)} />
          <DetailRow label="Ngày tham gia" value={selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleString("vi-VN") : ""} />
        </DetailModal>
      )}

      {selectedCompany && (
        <DetailModal title="Chi tiết công ty" onClose={() => setSelectedCompany(null)}>
          <DetailRow label="Tên công ty" value={selectedCompany.name} />
          <DetailRow label="Điện thoại" value={selectedCompany.phone || "Chưa cập nhật"} />
          <DetailRow label="Địa chỉ" value={selectedCompany.address || "Chưa cập nhật"} />
          <DetailRow label="Khu vực hoạt động" value={selectedCompany.operatingArea || "Chưa cập nhật"} />
          <DetailRow label="Giấy phép" value={selectedCompany.license || "Chưa cập nhật"} />
          <DetailRow label="Trạng thái" value={selectedCompany.locked ? "Đã khóa" : selectedCompany.verified ? "Đã xác minh" : "Chờ xác minh"} />
          <DetailRow label="Đánh giá" value={`${selectedCompany.rating || 0}/5 (${selectedCompany.totalReviews || 0} lượt)`} />
          <DetailRow label="Số yêu cầu" value={getCompanyRequestCount(selectedCompany.id)} />
          <DetailRow label="Ngày đăng ký" value={selectedCompany.registeredAt ? new Date(selectedCompany.registeredAt).toLocaleString("vi-VN") : ""} />
          {selectedCompany.verificationDocumentUrls?.length > 0 && (
            <div className="pt-3">
              <p className="mb-2 text-xs font-semibold uppercase text-gray-400">Tài liệu kiểm duyệt</p>
              <div className="flex flex-wrap gap-2">
                {selectedCompany.verificationDocumentUrls.map((url, index) => (
                  <a key={url} href={url} target="_blank" rel="noreferrer" className="rounded-lg border border-pink-100 px-3 py-1.5 text-sm text-pink-600 hover:bg-pink-50">
                    Tài liệu {index + 1}
                  </a>
                ))}
              </div>
            </div>
          )}
        </DetailModal>
      )}

      {selectedRequest && (
        <DetailModal title="Chi tiết yêu cầu" onClose={() => setSelectedRequest(null)}>
          <DetailRow label="Mã yêu cầu" value={selectedRequest.id} />
          <DetailRow label="Mức độ" value={["critical", "emergency", "urgent", "high"].includes(selectedRequest.priority) ? "Khẩn cấp" : "Thường"} />
          <DetailRow label="Người dùng" value={`${selectedRequest.userName || selectedRequest.contactName || "Chưa điền"} - ${selectedRequest.userPhone || selectedRequest.contactPhone || "Chưa điền"}`} />
          <DetailRow label="Công ty" value={selectedRequest.companyName || "Chưa có công ty"} />
          <DetailRow label="Dịch vụ" value={selectedRequest.serviceType || selectedRequest.issueType || "Chưa chọn"} />
          <DetailRow label="Trạng thái" value={(statusConfig[selectedRequest.status] ?? statusConfig.pending).label} />
          <DetailRow label="Địa chỉ" value={selectedRequest.location || "Chưa cập nhật"} />
          <DetailRow label="Tọa độ" value={selectedRequest.latitude && selectedRequest.longitude ? `${Number(selectedRequest.latitude).toFixed(5)}, ${Number(selectedRequest.longitude).toFixed(5)}` : "Không có"} />
          <DetailRow label="Mô tả" value={selectedRequest.description || "Không có"} />
          <DetailRow label="Ngày tạo" value={selectedRequest.createdAt ? new Date(selectedRequest.createdAt).toLocaleString("vi-VN") : ""} />
        </DetailModal>
      )}
    </div>
    </AdminDashboardContext.Provider>
  );
}

function DetailModal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-gray-900">{title}</h2>
          <button onClick={onClose} className="rounded-xl border border-gray-200 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50">
            Đóng
          </button>
        </div>
        <div className="divide-y divide-gray-100">{children}</div>
      </div>
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="grid gap-1 py-3 sm:grid-cols-[180px_1fr] sm:gap-4">
      <p className="text-xs font-semibold uppercase text-gray-400">{label}</p>
      <p className="text-sm font-medium text-gray-800">{value}</p>
    </div>
  );
}
