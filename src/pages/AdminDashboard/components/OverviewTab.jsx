import React from 'react';
import { useAdminDashboard } from '../AdminDashboardContext';
import { Users, Building2, Car, TrendingUp, CheckCircle2, ShieldX, AlertTriangle, Star } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

export default function OverviewTab() {
  const context = useAdminDashboard();
  const { 
    computedStats, monthlyData, serviceDistribution, PIE_COLORS
  } = context;

  return (
    <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Tổng yêu cầu", value: computedStats.totalRequests.toLocaleString(), icon: <Car size={20} />, color: "from-pink-100 to-pink-50", text: "text-pink-600", sub: `${computedStats.completedRequests} hoàn tất` },
              { label: "Người dùng", value: computedStats.totalUsers.toLocaleString(), icon: <Users size={20} />, color: "from-pink-100 to-pink-50", text: "text-pink-600", sub: "" },
              { label: "Công ty đối tác", value: computedStats.totalCompanies, icon: <Building2 size={20} />, color: "from-purple-100 to-purple-50", text: "text-purple-600", sub: `${computedStats.verifiedCompanies} đã xác minh` },
              { label: "Doanh thu", value: `${Math.round(computedStats.totalRevenue / 1000000).toLocaleString("vi-VN")}M`, icon: <Star size={20} />, color: "from-yellow-100 to-yellow-50", text: "text-yellow-600", sub: "Từ request hoàn tất" },
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
                <BarChart data={monthlyData} barSize={18}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid #fce7f3", fontSize: "12px" }} />
                  <Bar dataKey="requests" fill="#f472b6" radius={[4, 4, 0, 0]} name="Yêu cầu" />
                  <Bar dataKey="completed" fill="#f472b6" radius={[4, 4, 0, 0]} name="Hoàn tất" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Pie chart */}
            <div className="bg-white rounded-2xl border border-pink-100 p-6">
              <h3 className="font-bold text-gray-900 mb-4">Phân bố loại dịch vụ</h3>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={serviceDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {serviceDistribution.map((entry, index) => (
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
                    width: `${computedStats.completionRate}%`,
                  }}
                />
              </div>
              <p className="text-2xl font-bold text-green-600">
                {computedStats.completionRate}%
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
  );
}
