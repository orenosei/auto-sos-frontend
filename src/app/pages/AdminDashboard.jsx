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
  Clock,
} from "lucide-react";
import { adminStats } from "../data/mockData";
import { getUsers } from "../api/users";
import { getCompanies } from "../api/companies";
import { getRequests, getRequestServices } from "../api/requests";
import { toUiRequest } from "../api/mappers";
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
  in_progress: { label: "Đang xử lý", color: "text-purple-600 bg-purple-50 border-purple-200" },
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

    return {
      totalUsers,
      totalCompanies,
      verifiedCompanies,
      totalRequests,
      completedRequests,
      pendingRequests,
    };
  }, [users, companies, requests]);

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
          createdAt: x.registered_at,
        }));
        setUsers(uiUsers);

        const uiCompanies = c.map((x) => ({
          id: String(x.company_id),
          name: x.company_name,
          address: x.relative_address ?? "",
          operatingArea: x.rescue_area ?? "",
          license: x.company_license ?? "",
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
              try {
                const svc = await getRequestServices(r.request_id);
                serviceType = svc.data?.[0]?.service_name ?? "";
              } catch {
                // ignore
              }

              const urow = r.user_id != null ? userById.get(String(r.user_id)) : undefined;

              const mapped = toUiRequest(r, {
                userName: urow?.name ?? "",
                userPhone: urow?.phone ?? "",
                companyName: r.company_id != null ? companyNameById.get(String(r.company_id)) : undefined,
                serviceType,
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

  return (
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
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Tổng yêu cầu", value: computedStats.totalRequests.toLocaleString(), icon: <Car size={20} />, color: "from-pink-100 to-pink-50", text: "text-pink-600", sub: `${computedStats.completedRequests} hoàn tất` },
              { label: "Người dùng", value: computedStats.totalUsers.toLocaleString(), icon: <Users size={20} />, color: "from-blue-100 to-blue-50", text: "text-blue-600", sub: "" },
              { label: "Công ty đối tác", value: computedStats.totalCompanies, icon: <Building2 size={20} />, color: "from-purple-100 to-purple-50", text: "text-purple-600", sub: `${computedStats.verifiedCompanies} đã xác minh` },
              { label: "Đánh giá TB", value: adminStats.avgRating, icon: <Star size={20} />, color: "from-yellow-100 to-yellow-50", text: "text-yellow-600", sub: "Rất tốt" },
            ].map((card, i) => (
              <div key={i} className={`bg-linear-to-br ${card.color} rounded-2xl p-5 border border-white shadow-sm`}>
                <div className={`w-10 h-10 rounded-xl bg-white/60 flex items-center justify-center ${card.text} mb-3`}>
                  {card.icon}
                </div>
                <p className={`text-2xl font-bold ${card.text}`}>{card.value}</p>
                <p className="text-sm text-gray-600 mt-0.5">{card.label}</p>
                {card.sub && <p className="text-xs text-gray-400 mt-0.5">{card.sub}</p>}
              </div>
            ))}
          </div>

          {/* Charts row */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Bar chart */}
            <div className="bg-white rounded-2xl border border-pink-100 p-6">
              <h3 className="font-bold text-gray-900 mb-4">Yêu cầu cứu hộ theo tháng</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={adminStats.monthlyData} barSize={18}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid #fce7f3", fontSize: "12px" }} />
                  <Bar dataKey="requests" fill="#f472b6" radius={[4, 4, 0, 0]} name="Yêu cầu" />
                  <Bar dataKey="completed" fill="#60a5fa" radius={[4, 4, 0, 0]} name="Hoàn tất" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Pie chart */}
            <div className="bg-white rounded-2xl border border-pink-100 p-6">
              <h3 className="font-bold text-gray-900 mb-4">Phân bố loại dịch vụ</h3>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={adminStats.serviceDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {adminStats.serviceDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend
                    formatter={(value) => <span style={{ fontSize: "11px", color: "#6b7280" }}>{value}</span>}
                  />
                  <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid #fce7f3", fontSize: "12px" }} formatter={(v) => `${v}%`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Quick stats */}
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl border border-pink-100 p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-gray-700">Tỷ lệ hoàn thành</span>
                <CheckCircle2 size={18} className="text-green-500" />
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2.5 mb-2">
                <div
                  className="bg-linear-to-r from-green-400 to-green-500 h-2.5 rounded-full"
                  style={{
                    width:
                      computedStats.totalRequests === 0
                        ? "0%"
                        : `${Math.round((computedStats.completedRequests / computedStats.totalRequests) * 100)}%`,
                  }}
                />
              </div>
              <p className="text-2xl font-bold text-green-600">
                {computedStats.totalRequests === 0
                  ? "0%"
                  : `${Math.round((computedStats.completedRequests / computedStats.totalRequests) * 100)}%`}
              </p>
            </div>
            <div className="bg-white rounded-2xl border border-pink-100 p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-gray-700">Chờ xử lý</span>
                <AlertTriangle size={18} className="text-yellow-500" />
              </div>
              <p className="text-2xl font-bold text-yellow-600">{computedStats.pendingRequests}</p>
              <p className="text-xs text-gray-400">yêu cầu đang chờ</p>
            </div>
            <div className="bg-white rounded-2xl border border-pink-100 p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-gray-700">Công ty chờ xác minh</span>
                <ShieldX size={18} className="text-red-400" />
              </div>
              <p className="text-2xl font-bold text-red-500">
                {computedStats.totalCompanies - computedStats.verifiedCompanies}
              </p>
              <p className="text-xs text-gray-400">công ty chờ duyệt</p>
            </div>
          </div>
        </div>
      )}

      {/* Users Tab */}
      {activeTab === "users" && (
        <div>
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <div className="relative flex-1 max-w-xs">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm người dùng..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
              />
            </div>
            <span className="text-sm text-gray-500">Tổng: {computedStats.totalUsers.toLocaleString()} người dùng</span>
          </div>
          <div className="bg-white rounded-2xl border border-pink-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">Người dùng</th>
                    <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">Email</th>
                    <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">Điện thoại</th>
                    <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">Ngày tham gia</th>
                    <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {users
                    .filter(
                      (u) =>
                        u.name.toLowerCase().includes(searchText.toLowerCase()) ||
                        u.email.toLowerCase().includes(searchText.toLowerCase())
                    )
                    .map((user) => (
                      <tr key={user.id} className="border-b border-gray-50 hover:bg-pink-50/30 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-linear-to-br from-pink-300 to-blue-300 flex items-center justify-center text-white text-xs font-bold">
                              {user.name[0]}
                            </div>
                            <span className="text-sm font-medium text-gray-800">{user.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{user.email}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{user.phone}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {user.createdAt ? new Date(user.createdAt).toLocaleDateString("vi-VN") : ""}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <button className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-500 transition-colors">
                              <Eye size={14} />
                            </button>
                            <button className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 transition-colors">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Companies Tab */}
      {activeTab === "companies" && (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="relative flex-1 max-w-xs">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm công ty..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
              />
            </div>
          </div>
          <div className="space-y-4">
            {companies
              .filter(
                (c) =>
                  c.name.toLowerCase().includes(searchText.toLowerCase()) ||
                  c.operatingArea.toLowerCase().includes(searchText.toLowerCase())
              )
              .map((company) => (
                <div key={company.id} className="bg-white rounded-2xl border border-pink-100 p-5">
                  <div className="flex items-start justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-linear-to-br from-blue-100 to-pink-100 flex items-center justify-center text-2xl">
                        🚑
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-gray-800">{company.name}</h3>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full flex items-center gap-1 ${
                              company.verified
                                ? "bg-green-50 text-green-600 border border-green-200"
                                : "bg-yellow-50 text-yellow-600 border border-yellow-200"
                            }`}
                          >
                            {company.verified ? <ShieldCheck size={11} /> : <ShieldX size={11} />}
                            {company.verified ? "Đã xác minh" : "Chờ xác minh"}
                          </span>
                        </div>
                          <p className="text-sm text-gray-500">{company.address}</p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                          <span className="flex items-center gap-1">
                            <Star size={11} className="text-yellow-400" />
                            {company.rating} ({company.totalReviews})
                          </span>
                          <span>GP: {company.license}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {!company.verified && (
                        <>
                          <button className="flex items-center gap-1 px-3 py-1.5 bg-green-500 text-white rounded-xl text-xs font-medium hover:bg-green-600 transition-colors">
                            <CheckCircle2 size={13} />
                            Xác minh
                          </button>
                          <button className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-500 border border-red-200 rounded-xl text-xs font-medium hover:bg-red-100 transition-colors">
                            <XCircle size={13} />
                            Từ chối
                          </button>
                        </>
                      )}
                      <button className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-600 border border-blue-200 rounded-xl text-xs font-medium hover:bg-blue-100 transition-colors">
                        <Eye size={13} />
                        Xem
                      </button>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Requests Tab */}
      {activeTab === "requests" && (
        <div>
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <div className="relative flex-1 max-w-xs">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm yêu cầu..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
              />
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-pink-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">ID</th>
                    <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">Người dùng</th>
                    <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">Dịch vụ</th>
                    <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">Công ty</th>
                    <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">Trạng thái</th>
                    <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">Ngày tạo</th>
                    <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {requests
                    .filter(
                      (r) =>
                        r.userName.toLowerCase().includes(searchText.toLowerCase()) ||
                        r.serviceType.toLowerCase().includes(searchText.toLowerCase())
                    )
                    .map((req) => (
                      <tr key={req.id} className="border-b border-gray-50 hover:bg-purple-50/20 transition-colors">
                        <td className="px-4 py-3 text-xs text-gray-400 font-mono">{req.id}</td>
                        <td className="px-4 py-3">
                          <div>
                            <p className="text-sm font-medium text-gray-800">{req.userName}</p>
                            <p className="text-xs text-gray-400">{req.userPhone}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{req.serviceType}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{req.companyName || "—"}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full border ${statusConfig[req.status]?.color}`}>
                            {statusConfig[req.status]?.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-400">
                          {new Date(req.createdAt).toLocaleDateString("vi-VN")}
                        </td>
                        <td className="px-4 py-3">
                          <button className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-500 transition-colors">
                            <Eye size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
          {loading && (
            <div className="mt-3 text-sm text-gray-500">Đang tải dữ liệu...</div>
          )}
        </div>
      )}

      {/* Content Moderation Tab */}
      {activeTab === "content" && (
        <div>
          <div className="mb-4">
            <h2 className="font-bold text-gray-900 mb-1">Kiểm duyệt nội dung</h2>
            <p className="text-sm text-gray-500">Xem xét và phê duyệt các đánh giá và bình luận trên hệ thống</p>
          </div>
          <div className="space-y-4">
            {[
              { user: "Nguyễn Văn An", content: "Dịch vụ rất tệ, nhân viên không chuyên nghiệp, trễ 30 phút so với hẹn!", type: "Đánh giá", target: "Cứu Hộ Đông Nam", flag: "Cần xem xét", time: "5 phút trước" },
              { user: "Phạm Thị C", content: "Vá lốp nhanh chóng, nhân viên nhiệt tình. Sẽ giới thiệu bạn bè!", type: "Đánh giá", target: "Cứu Hộ Sao Mai", flag: null, time: "15 phút trước" },
              { user: "Lê Văn D", content: "Xe tôi bị hỏng máy. Ai có kinh nghiệm với xe Honda Civic cho tôi hỏi?", type: "Bài đăng cộng đồng", target: null, flag: null, time: "32 phút trước" },
            ].map((item, i) => (
              <div key={i} className="bg-white rounded-2xl border border-pink-100 p-5">
                <div className="flex items-start justify-between flex-wrap gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-linear-to-br from-pink-300 to-blue-300 flex items-center justify-center text-white text-xs font-bold shrink-0">
                      {item.user[0]}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-gray-800 text-sm">{item.user}</span>
                        <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">{item.type}</span>
                        {item.flag && (
                          <span className="text-xs bg-red-50 text-red-500 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <AlertTriangle size={10} />
                            {item.flag}
                          </span>
                        )}
                      </div>
                      {item.target && (
                        <p className="text-xs text-gray-400 mt-0.5">→ {item.target}</p>
                      )}
                      <p className="text-sm text-gray-700 mt-2 leading-relaxed">"{item.content}"</p>
                      <p className="text-xs text-gray-400 mt-1">{item.time}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="flex items-center gap-1 px-3 py-1.5 bg-green-500 text-white rounded-xl text-xs font-medium hover:bg-green-600 transition-colors">
                      <CheckCircle2 size={13} />
                      Duyệt
                    </button>
                    <button className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-500 border border-red-200 rounded-xl text-xs font-medium hover:bg-red-100 transition-colors">
                      <XCircle size={13} />
                      Xóa
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
