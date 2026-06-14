import React, { useMemo, useState } from 'react';
import { useAdminDashboard } from '../AdminDashboardContext';
import { ShieldCheck, ShieldX, Search, Eye, Trash2 } from "lucide-react";

export default function UsersTab() {
  const context = useAdminDashboard();
  const { 
    users, searchText, setSearchText, computedStats, handleDeleteUser, handleToggleUserActive, setSelectedUser
  } = context;
  const [statusFilter, setStatusFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [page, setPage] = useState(1);
  const pageSize = 8;

  const filteredUsers = useMemo(() => {
    const keyword = searchText.trim().toLowerCase();
    return users.filter((u) => {
      const matchesSearch =
        !keyword ||
        u.name.toLowerCase().includes(keyword) ||
        u.email.toLowerCase().includes(keyword) ||
        String(u.phone ?? "").toLowerCase().includes(keyword);
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" ? u.isActive : !u.isActive);
      const matchesRole = roleFilter === "all" || u.role === roleFilter;
      return matchesSearch && matchesStatus && matchesRole;
    });
  }, [roleFilter, searchText, statusFilter, users]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageUsers = filteredUsers.slice((safePage - 1) * pageSize, safePage * pageSize);

  return (
    <div>
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <div className="relative flex-1 max-w-xs">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm người dùng..."
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
              <option value="active">Hoạt động</option>
              <option value="locked">Đã khóa</option>
            </select>
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setPage(1);
              }}
              className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-100"
            >
              <option value="all">Tất cả vai trò</option>
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
            <span className="text-sm text-gray-500">
              Tổng: {computedStats.totalUsers.toLocaleString()} người dùng · {filteredUsers.length} phù hợp
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
                  {pageUsers.map((user) => (
                      <tr key={user.id} className="border-b border-gray-50 hover:bg-pink-50/30 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-linear-to-br from-pink-300 to-pink-300 flex items-center justify-center text-white text-xs font-bold">
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
                            <button
                              onClick={() => setSelectedUser(user)}
                              className="p-1.5 rounded-lg hover:bg-pink-50 text-pink-500 transition-colors"
                              title="Xem chi tiết"
                            >
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
          <div className="mt-4 flex items-center justify-between gap-3 text-sm text-gray-500">
            <span>
              Trang {safePage}/{totalPages} · {filteredUsers.length} kết quả
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
