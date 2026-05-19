import React from 'react';
import { useAdminDashboard } from '../AdminDashboardContext';
import { ShieldCheck, ShieldX, Search, Eye, Trash2 } from "lucide-react";

export default function UsersTab() {
  const context = useAdminDashboard();
  const { 
    users, searchText, setSearchText, computedStats, handleDeleteUser, handleToggleUserActive
  } = context;

  return (
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
            <span className="text-sm text-gray-500">
              Tổng: {computedStats.totalUsers.toLocaleString()} người dùng · {computedStats.activeUsers} đang hoạt động
            </span>
          </div>
          <div className="bg-white rounded-2xl border border-pink-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">Người dùng</th>
                    <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">Email</th>
                    <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">Điện thoại</th>
                    <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">Vai trò</th>
                    <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">Trạng thái</th>
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
                        <td className="px-4 py-3">
                          <span className="text-xs px-2 py-0.5 rounded-full border border-purple-200 bg-purple-50 text-purple-600">
                            {user.role === "admin" ? "Admin" : "User"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full border ${
                            user.isActive
                              ? "border-green-200 bg-green-50 text-green-600"
                              : "border-gray-200 bg-gray-50 text-gray-500"
                          }`}>
                            {user.isActive ? "Hoạt động" : "Đã khóa"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {user.createdAt ? new Date(user.createdAt).toLocaleDateString("vi-VN") : ""}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <button className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-500 transition-colors">
                              <Eye size={14} />
                            </button>
                            <button
                              onClick={() => handleToggleUserActive(user)}
                              className={`p-1.5 rounded-lg transition-colors ${
                                user.isActive
                                  ? "hover:bg-yellow-50 text-yellow-500"
                                  : "hover:bg-green-50 text-green-500"
                              }`}
                              title={user.isActive ? "Khóa tài khoản" : "Mở khóa tài khoản"}
                            >
                              {user.isActive ? <ShieldX size={14} /> : <ShieldCheck size={14} />}
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user)}
                              className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 transition-colors"
                            >
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
  );
}
