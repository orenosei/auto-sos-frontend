import React, { useMemo, useState } from 'react';
import { useAdminDashboard } from '../AdminDashboardContext';
import { AlertTriangle, Eye, Search } from "lucide-react";

export default function RequestsTab() {
  const context = useAdminDashboard();
  const { 
    requests, loading, searchText, setSearchText, statusConfig, setSelectedRequest
  } = context;
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const isEmergency = (request) => ["critical", "emergency", "urgent", "high"].includes(request.priority);

  const filteredRequests = useMemo(() => {
    const keyword = searchText.trim().toLowerCase();
    const rows = requests.filter((r) => {
      const matchesSearch =
        !keyword ||
        r.id.toLowerCase().includes(keyword) ||
        String(r.userName ?? "").toLowerCase().includes(keyword) ||
        String(r.userPhone ?? "").toLowerCase().includes(keyword) ||
        String(r.serviceType ?? "").toLowerCase().includes(keyword) ||
        String(r.companyName ?? "").toLowerCase().includes(keyword);
      const matchesStatus = statusFilter === "all" || r.status === statusFilter;
      const matchesPriority =
        priorityFilter === "all" ||
        (priorityFilter === "emergency" ? isEmergency(r) : !isEmergency(r));
      return matchesSearch && matchesStatus && matchesPriority;
    });

    rows.sort((a, b) => {
      if (sortBy === "oldest") return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
      if (sortBy === "emergency") return Number(isEmergency(b)) - Number(isEmergency(a));
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    });
    return rows;
  }, [priorityFilter, requests, searchText, sortBy, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredRequests.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageRequests = filteredRequests.slice((safePage - 1) * pageSize, safePage * pageSize);

  return (
    <div>
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <div className="relative flex-1 max-w-xs">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm yêu cầu..."
                value={searchText}
                onChange={(e) => {
                  setSearchText(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-100"
            >
              <option value="all">Tất cả trạng thái</option>
              {Object.entries(statusConfig).map(([key, value]) => (
                <option key={key} value={key}>{value.label}</option>
              ))}
            </select>
            <select
              value={priorityFilter}
              onChange={(e) => {
                setPriorityFilter(e.target.value);
                setPage(1);
              }}
              className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-100"
            >
              <option value="all">Tất cả mức độ</option>
              <option value="emergency">Khẩn cấp</option>
              <option value="normal">Thường</option>
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-100"
            >
              <option value="newest">Mới nhất</option>
              <option value="oldest">Cũ nhất</option>
              <option value="emergency">Ưu tiên khẩn cấp</option>
            </select>
          </div>
          <div className="bg-white rounded-2xl border border-pink-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">ID</th>
                    <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">Mức độ</th>
                    <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">Người dùng</th>
                    <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">Dịch vụ</th>
                    <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">Công ty</th>
                    <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">Trạng thái</th>
                    <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">Ngày tạo</th>
                    <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {pageRequests.map((req) => (
                      <tr key={req.id} className="border-b border-gray-50 hover:bg-purple-50/20 transition-colors">
                        <td className="px-4 py-3 text-xs text-gray-400 font-mono">{req.id}</td>
                        <td className="px-4 py-3">
                          {isEmergency(req) ? (
                            <span className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-600">
                              <AlertTriangle size={12} />
                              Khẩn cấp
                            </span>
                          ) : (
                            <span className="rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-xs text-gray-500">
                              Thường
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <p className="text-sm font-medium text-gray-800">{req.userName || req.contactName || "Chưa điền"}</p>
                            <p className="text-xs text-gray-400">{req.userPhone || req.contactPhone || "Chưa điền"}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{req.serviceType}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{req.companyName || "—"}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full border ${(statusConfig[req.status] ?? statusConfig.pending).color}`}>
                            {(statusConfig[req.status] ?? statusConfig.pending).label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-400">
                          {new Date(req.createdAt).toLocaleDateString("vi-VN")}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => setSelectedRequest(req)}
                            className="p-1.5 rounded-lg hover:bg-pink-50 text-pink-500 transition-colors"
                            title="Xem chi tiết"
                          >
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
          <div className="mt-4 flex items-center justify-between gap-3 text-sm text-gray-500">
            <span>
              Trang {safePage}/{totalPages} · {filteredRequests.length} kết quả
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                disabled={safePage === 1}
                className="rounded-xl border border-gray-200 px-3 py-2 font-medium text-gray-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Trước
              </button>
              <button
                onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={safePage === totalPages}
                className="rounded-xl border border-gray-200 px-3 py-2 font-medium text-gray-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Sau
              </button>
            </div>
          </div>
        </div>
  );
}
