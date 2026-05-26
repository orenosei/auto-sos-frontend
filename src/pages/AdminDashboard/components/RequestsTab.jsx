import React from 'react';
import { useAdminDashboard } from '../AdminDashboardContext';
import { Search, ChevronRight, Eye } from "lucide-react";

export default function RequestsTab() {
  const context = useAdminDashboard();
  const { 
    requests, loading, searchText, setSearchText, statusConfig
  } = context;

  return (
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
                          <span className={`text-xs px-2 py-0.5 rounded-full border ${(statusConfig[req.status] ?? statusConfig.pending).color}`}>
                            {(statusConfig[req.status] ?? statusConfig.pending).label}
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
  );
}
