import React from 'react';
import { useCompanyDashboard } from '../CompanyDashboardContext';
import { Clock, Star, Users } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function StatsTab() {
  const context = useCompanyDashboard();
  const { 
    chartData, companyStats
  } = context;

  return (
    <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-pink-100 p-6">
            <h3 className="font-bold text-gray-900 mb-4">Yêu cầu theo ngày trong tuần</h3>
              <ResponsiveContainer width="100%" height={250}>
              <BarChart data={chartData} barSize={32}>
                <CartesianGrid key="grid" strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis key="xaxis" dataKey="day" tick={{ fontSize: 12, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                <YAxis key="yaxis" tick={{ fontSize: 12, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                <Tooltip
                  key="tooltip"
                  contentStyle={{ borderRadius: "12px", border: "1px solid #fce7f3", fontSize: "12px" }}
                />
                <Bar key="bar-requests" dataKey="requests" fill="#f472b6" radius={[6, 6, 0, 0]} name="Yêu cầu" />
                <Bar key="bar-completed" dataKey="completed" fill="#f472b6" radius={[6, 6, 0, 0]} name="Hoàn tất" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl border border-pink-100 p-5">
              <div className="flex items-center gap-2 mb-2">
                <Star size={18} className="text-yellow-500" />
                <span className="font-semibold text-gray-700">Đánh giá</span>
              </div>
              <p className="text-3xl font-bold text-gray-900">
                {(companyStats.averageRating ?? 0).toFixed(1)}
              </p>
              <div className="flex items-center gap-0.5 mt-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    size={14}
                    className={s <= Math.round(companyStats.averageRating ?? 0) ? "fill-yellow-400 text-yellow-400" : "text-gray-200"}
                  />
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-1">{companyStats.reviewCount} đánh giá tổng</p>
            </div>
            <div className="bg-white rounded-2xl border border-pink-100 p-5">
              <div className="flex items-center gap-2 mb-2">
                <Clock size={18} className="text-pink-500" />
                <span className="font-semibold text-gray-700">Thời gian phản hồi</span>
              </div>
              <p className="text-3xl font-bold text-gray-900">
                {companyStats.avgResponseMinutes != null ? `${companyStats.avgResponseMinutes} phút` : "--"}
              </p>
              <p className="text-xs text-gray-500 mt-1">Trung bình thời gian đến nơi</p>
            </div>
            <div className="bg-white rounded-2xl border border-pink-100 p-5">
              <div className="flex items-center gap-2 mb-2">
                <Users size={18} className="text-pink-500" />
                <span className="font-semibold text-gray-700">Tỷ lệ hài lòng</span>
              </div>
              <p className="text-3xl font-bold text-gray-900">
                {companyStats.satisfactionRate != null ? `${companyStats.satisfactionRate}%` : "--"}
              </p>
              <p className="text-xs text-gray-500 mt-1">Dựa trên phản hồi khách hàng</p>
            </div>
          </div>
        </div>
  );
}
