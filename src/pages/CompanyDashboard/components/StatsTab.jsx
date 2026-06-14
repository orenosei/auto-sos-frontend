import React, { useMemo, useState } from "react";
import { useCompanyDashboard } from "../CompanyDashboardContext";
import {
  BarChart3,
  CalendarDays,
  Clock,
  Download,
  Star,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const PERIODS = [
  { key: "week", label: "Tuần này" },
  { key: "month", label: "Tháng này" },
  { key: "year", label: "Năm nay" },
];

const statusLabels = {
  pending: "Chờ tiếp nhận",
  accepted: "Đã tiếp nhận",
  heading: "Đang di chuyển",
  arrived: "Đã đến nơi",
  processing: "Đang xử lý",
  completed: "Hoàn tất",
  cancelled: "Đã hủy",
};

function formatVnd(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) return "0đ";
  return `${Math.round(amount).toLocaleString("vi-VN")}đ`;
}

function toDate(value) {
  const date = value ? new Date(value) : null;
  return date && Number.isFinite(date.getTime()) ? date : null;
}

function getRevenue(request) {
  const amount = Number(request.finalPrice ?? request.servicePrice ?? 0);
  return Number.isFinite(amount) ? amount : 0;
}

function getMetricDate(request) {
  return toDate(request.completedAt ?? request.updatedAt ?? request.createdAt);
}

function isSameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function startOfWeek(date) {
  const result = new Date(date);
  const diffToMonday = (result.getDay() + 6) % 7;
  result.setDate(result.getDate() - diffToMonday);
  result.setHours(0, 0, 0, 0);
  return result;
}

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function startOfYear(date) {
  return new Date(date.getFullYear(), 0, 1);
}

function getPeriodRange(period, now) {
  if (period === "week") {
    const start = startOfWeek(now);
    const end = new Date(start);
    end.setDate(start.getDate() + 7);
    return { start, end };
  }
  if (period === "month") {
    return {
      start: startOfMonth(now),
      end: new Date(now.getFullYear(), now.getMonth() + 1, 1),
    };
  }
  return {
    start: startOfYear(now),
    end: new Date(now.getFullYear() + 1, 0, 1),
  };
}

function inRange(date, start, end) {
  return date && date >= start && date < end;
}

function getPeriodLabel(period) {
  if (period === "week") return "ngày";
  if (period === "month") return "ngày";
  return "tháng";
}

function buildTimeline(requests, period, now) {
  const { start, end } = getPeriodRange(period, now);
  if (period === "week") {
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      const rows = requests.filter((request) => {
        const metricDate = getMetricDate(request);
        return metricDate && isSameDay(metricDate, date);
      });
      const completed = rows.filter((request) => request.status === "completed");
      return {
        label: date.toLocaleDateString("vi-VN", { weekday: "short" }),
        requests: rows.length,
        completed: completed.length,
        revenue: completed.reduce((sum, request) => sum + getRevenue(request), 0),
      };
    });
  }

  if (period === "month") {
    const days = Math.round((end - start) / 86400000);
    return Array.from({ length: days }, (_, index) => {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      const rows = requests.filter((request) => {
        const metricDate = getMetricDate(request);
        return metricDate && isSameDay(metricDate, date);
      });
      const completed = rows.filter((request) => request.status === "completed");
      return {
        label: String(index + 1),
        requests: rows.length,
        completed: completed.length,
        revenue: completed.reduce((sum, request) => sum + getRevenue(request), 0),
      };
    });
  }

  return Array.from({ length: 12 }, (_, month) => {
    const rows = requests.filter((request) => {
      const metricDate = getMetricDate(request);
      return metricDate && metricDate.getFullYear() === now.getFullYear() && metricDate.getMonth() === month;
    });
    const completed = rows.filter((request) => request.status === "completed");
    return {
      label: `T${month + 1}`,
      requests: rows.length,
      completed: completed.length,
      revenue: completed.reduce((sum, request) => sum + getRevenue(request), 0),
    };
  });
}

function groupBy(rows, getKey) {
  const map = new Map();
  for (const row of rows) {
    const key = getKey(row) || "Chưa cập nhật";
    const current = map.get(key) ?? {
      name: key,
      requests: 0,
      completed: 0,
      revenue: 0,
    };
    current.requests += 1;
    if (row.status === "completed") {
      current.completed += 1;
      current.revenue += getRevenue(row);
    }
    map.set(key, current);
  }
  return [...map.values()].sort((a, b) => b.revenue - a.revenue || b.requests - a.requests);
}

function escapeCell(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function tableHtml(title, headers, rows) {
  return `
    <h2>${escapeCell(title)}</h2>
    <table border="1">
      <thead><tr>${headers.map((header) => `<th>${escapeCell(header)}</th>`).join("")}</tr></thead>
      <tbody>
        ${rows
          .map((row) => `<tr>${row.map((cell) => `<td>${escapeCell(cell)}</td>`).join("")}</tr>`)
          .join("")}
      </tbody>
    </table>
  `;
}

function downloadExcel({ companyName, periodLabel, summary, timeline, serviceRows, statusRows, requestRows }) {
  const html = `
    <html>
      <head>
        <meta charset="UTF-8" />
        <style>
          table { border-collapse: collapse; margin-bottom: 24px; }
          th { background: #fce7f3; font-weight: 700; }
          td, th { padding: 8px; }
          h1, h2 { font-family: Arial, sans-serif; }
        </style>
      </head>
      <body>
        <h1>Báo cáo doanh số ${escapeCell(companyName || "công ty")}</h1>
        <p>Kỳ báo cáo: ${escapeCell(periodLabel)}</p>
        ${tableHtml("Tổng quan", ["Chỉ số", "Giá trị"], summary)}
        ${tableHtml("Doanh số theo thời gian", ["Mốc", "Yêu cầu", "Hoàn tất", "Doanh thu"], timeline)}
        ${tableHtml("Doanh số theo dịch vụ", ["Dịch vụ", "Yêu cầu", "Hoàn tất", "Doanh thu"], serviceRows)}
        ${tableHtml("Trạng thái yêu cầu", ["Trạng thái", "Số lượng", "Doanh thu"], statusRows)}
        ${tableHtml("Chi tiết yêu cầu", ["Mã", "Khách hàng", "Dịch vụ", "Trạng thái", "Ngày tạo", "Ngày hoàn tất", "Doanh thu"], requestRows)}
      </body>
    </html>
  `;
  const blob = new Blob(["\ufeff", html], { type: "application/vnd.ms-excel;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `bao-cao-doanh-so-${new Date().toISOString().slice(0, 10)}.xls`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export default function StatsTab() {
  const context = useCompanyDashboard();
  const { chartData, companyStats, requests, companyName } = context;
  const [period, setPeriod] = useState("month");

  const report = useMemo(() => {
    const now = new Date();
    const { start, end } = getPeriodRange(period, now);
    const periodRequests = requests.filter((request) => inRange(getMetricDate(request), start, end));
    const completed = periodRequests.filter((request) => request.status === "completed");
    const cancelled = periodRequests.filter((request) => request.status === "cancelled");
    const active = periodRequests.filter((request) =>
      ["accepted", "heading", "arrived", "processing"].includes(request.status)
    );
    const revenue = completed.reduce((sum, request) => sum + getRevenue(request), 0);
    const avgOrderValue = completed.length ? revenue / completed.length : 0;
    const completionRate = periodRequests.length ? Math.round((completed.length / periodRequests.length) * 100) : 0;
    const cancelRate = periodRequests.length ? Math.round((cancelled.length / periodRequests.length) * 100) : 0;
    const timeline = buildTimeline(periodRequests, period, now);
    const serviceRows = groupBy(periodRequests, (request) => request.serviceType);
    const statusRows = groupBy(periodRequests, (request) => statusLabels[request.status] ?? request.status);
    const customerRows = groupBy(periodRequests, (request) => request.contactName || request.userName);
    const bestService = serviceRows[0];
    const bestCustomer = customerRows[0];

    const requestRows = periodRequests
      .slice()
      .sort((a, b) => (toDate(b.createdAt)?.getTime() ?? 0) - (toDate(a.createdAt)?.getTime() ?? 0));

    return {
      periodRequests,
      completed,
      active,
      cancelled,
      revenue,
      avgOrderValue,
      completionRate,
      cancelRate,
      timeline,
      serviceRows,
      statusRows,
      customerRows,
      bestService,
      bestCustomer,
      requestRows,
      start,
      end,
    };
  }, [period, requests]);

  const periodTitle = PERIODS.find((item) => item.key === period)?.label ?? "";
  const maxRevenuePoint = report.timeline.reduce(
    (best, item) => (item.revenue > best.revenue ? item : best),
    { label: "--", revenue: 0 }
  );

  const handleExport = () => {
    downloadExcel({
      companyName,
      periodLabel: periodTitle,
      summary: [
        ["Tổng yêu cầu", report.periodRequests.length],
        ["Yêu cầu hoàn tất", report.completed.length],
        ["Yêu cầu đang xử lý", report.active.length],
        ["Yêu cầu đã hủy", report.cancelled.length],
        ["Doanh thu", formatVnd(report.revenue)],
        ["Giá trị trung bình/yêu cầu hoàn tất", formatVnd(report.avgOrderValue)],
        ["Tỷ lệ hoàn tất", `${report.completionRate}%`],
        ["Tỷ lệ hủy", `${report.cancelRate}%`],
        ["Dịch vụ doanh thu cao nhất", report.bestService?.name ?? "--"],
        ["Khách hàng doanh thu cao nhất", report.bestCustomer?.name ?? "--"],
      ],
      timeline: report.timeline.map((item) => [
        item.label,
        item.requests,
        item.completed,
        formatVnd(item.revenue),
      ]),
      serviceRows: report.serviceRows.map((item) => [
        item.name,
        item.requests,
        item.completed,
        formatVnd(item.revenue),
      ]),
      statusRows: report.statusRows.map((item) => [item.name, item.requests, formatVnd(item.revenue)]),
      requestRows: report.requestRows.map((request) => [
        `#${request.id}`,
        request.contactName || request.userName || "Khách vãng lai",
        request.serviceType || "--",
        statusLabels[request.status] ?? request.status,
        toDate(request.createdAt)?.toLocaleString("vi-VN") ?? "",
        toDate(request.completedAt)?.toLocaleString("vi-VN") ?? "",
        request.status === "completed" ? formatVnd(getRevenue(request)) : "0đ",
      ]),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Báo cáo doanh số</h2>
          <p className="text-sm text-gray-500">
            Theo dõi hiệu quả vận hành, doanh thu và chất lượng xử lý yêu cầu.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="flex rounded-xl bg-gray-100 p-1">
            {PERIODS.map((item) => (
              <button
                key={item.key}
                onClick={() => setPeriod(item.key)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                  period === item.key ? "bg-white text-pink-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={handleExport}
            className="inline-flex items-center gap-2 rounded-xl bg-pink-500 px-4 py-2 text-sm font-semibold text-white hover:bg-pink-600"
          >
            <Download size={16} />
            Xuất Excel
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: "Doanh thu",
            value: formatVnd(report.revenue),
            hint: `${report.completed.length} yêu cầu hoàn tất`,
            icon: <Wallet size={18} />,
            color: "text-pink-600 bg-pink-50 border-pink-100",
          },
          {
            label: "Giá trị TB/yêu cầu",
            value: formatVnd(report.avgOrderValue),
            hint: "Tính trên yêu cầu hoàn tất",
            icon: <TrendingUp size={18} />,
            color: "text-green-600 bg-green-50 border-green-100",
          },
          {
            label: "Tỷ lệ hoàn tất",
            value: `${report.completionRate}%`,
            hint: `${report.cancelRate}% yêu cầu bị hủy`,
            icon: <BarChart3 size={18} />,
            color: "text-purple-600 bg-purple-50 border-purple-100",
          },
          {
            label: "Đỉnh doanh thu",
            value: formatVnd(maxRevenuePoint.revenue),
            hint: `Theo ${getPeriodLabel(period)}: ${maxRevenuePoint.label}`,
            icon: <CalendarDays size={18} />,
            color: "text-orange-600 bg-orange-50 border-orange-100",
          },
        ].map((card) => (
          <div key={card.label} className={`rounded-2xl border bg-white p-5 ${card.color}`}>
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-700">{card.label}</span>
              <span className={`rounded-xl p-2 ${card.color}`}>{card.icon}</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{card.value}</p>
            <p className="mt-1 text-xs text-gray-500">{card.hint}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-pink-100 bg-white p-6">
          <h3 className="mb-4 font-bold text-gray-900">Doanh thu theo {getPeriodLabel(period)}</h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={report.timeline}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <Tooltip
                formatter={(value, name) => [name === "revenue" ? formatVnd(value) : value, name === "revenue" ? "Doanh thu" : name]}
                contentStyle={{ borderRadius: "12px", border: "1px solid #fce7f3", fontSize: "12px" }}
              />
              <Line type="monotone" dataKey="revenue" stroke="#ec4899" strokeWidth={3} dot={{ r: 3 }} name="Doanh thu" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-2xl border border-pink-100 bg-white p-6">
          <h3 className="mb-4 font-bold text-gray-900">Yêu cầu và hoàn tất</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={report.timeline} barSize={24}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid #fce7f3", fontSize: "12px" }} />
              <Bar dataKey="requests" fill="#f9a8d4" radius={[6, 6, 0, 0]} name="Yêu cầu" />
              <Bar dataKey="completed" fill="#ec4899" radius={[6, 6, 0, 0]} name="Hoàn tất" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-pink-100 bg-white p-5">
          <h3 className="mb-3 font-bold text-gray-900">Top dịch vụ theo doanh thu</h3>
          <div className="space-y-3">
            {report.serviceRows.slice(0, 6).map((item) => (
              <div key={item.name} className="rounded-xl bg-pink-50/50 p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-gray-800">{item.name}</p>
                  <span className="text-sm font-bold text-pink-600">{formatVnd(item.revenue)}</span>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  {item.requests} yêu cầu · {item.completed} hoàn tất
                </p>
              </div>
            ))}
            {report.serviceRows.length === 0 && <p className="py-8 text-center text-sm text-gray-400">Chưa có dữ liệu</p>}
          </div>
        </div>

        <div className="rounded-2xl border border-pink-100 bg-white p-5">
          <h3 className="mb-3 font-bold text-gray-900">Trạng thái yêu cầu</h3>
          <div className="space-y-3">
            {report.statusRows.map((item) => (
              <div key={item.name} className="flex items-center justify-between rounded-xl border border-gray-100 p-3">
                <div>
                  <p className="text-sm font-semibold text-gray-800">{item.name}</p>
                  <p className="text-xs text-gray-500">{item.requests} yêu cầu</p>
                </div>
                <span className="text-sm font-bold text-pink-600">{formatVnd(item.revenue)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-pink-100 bg-white p-5">
          <h3 className="mb-3 font-bold text-gray-900">Chất lượng vận hành</h3>
          <div className="grid grid-cols-1 gap-3">
            <div className="rounded-xl bg-yellow-50 p-3">
              <div className="flex items-center gap-2">
                <Star size={16} className="fill-yellow-400 text-yellow-400" />
                <span className="text-sm font-semibold text-gray-700">Đánh giá trung bình</span>
              </div>
              <p className="mt-1 text-2xl font-bold text-gray-900">{(companyStats.averageRating ?? 0).toFixed(1)}</p>
              <p className="text-xs text-gray-500">{companyStats.reviewCount} đánh giá tổng</p>
            </div>
            <div className="rounded-xl bg-pink-50 p-3">
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-pink-500" />
                <span className="text-sm font-semibold text-gray-700">Thời gian phản hồi TB</span>
              </div>
              <p className="mt-1 text-2xl font-bold text-gray-900">
                {companyStats.avgResponseMinutes != null ? `${companyStats.avgResponseMinutes} phút` : "--"}
              </p>
            </div>
            <div className="rounded-xl bg-green-50 p-3">
              <div className="flex items-center gap-2">
                <Users size={16} className="text-green-500" />
                <span className="text-sm font-semibold text-gray-700">Tỷ lệ hài lòng</span>
              </div>
              <p className="mt-1 text-2xl font-bold text-gray-900">
                {companyStats.satisfactionRate != null ? `${companyStats.satisfactionRate}%` : "--"}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-pink-100 bg-white p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-bold text-gray-900">Chi tiết yêu cầu trong kỳ</h3>
          <span className="text-xs text-gray-500">{report.requestRows.length} dòng dữ liệu</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead>
              <tr className="border-b border-pink-100 text-xs text-gray-500">
                <th className="py-2 pr-3">Mã</th>
                <th className="py-2 pr-3">Khách hàng</th>
                <th className="py-2 pr-3">Dịch vụ</th>
                <th className="py-2 pr-3">Trạng thái</th>
                <th className="py-2 pr-3">Ngày tạo</th>
                <th className="py-2 pr-3">Hoàn tất</th>
                <th className="py-2 pr-3 text-right">Doanh thu</th>
              </tr>
            </thead>
            <tbody>
              {report.requestRows.slice(0, 20).map((request) => (
                <tr key={request.id} className="border-b border-gray-50">
                  <td className="py-3 pr-3 font-semibold text-gray-800">#{request.id}</td>
                  <td className="py-3 pr-3 text-gray-600">{request.contactName || request.userName || "Khách vãng lai"}</td>
                  <td className="py-3 pr-3 text-gray-600">{request.serviceType || "--"}</td>
                  <td className="py-3 pr-3 text-gray-600">{statusLabels[request.status] ?? request.status}</td>
                  <td className="py-3 pr-3 text-gray-500">{toDate(request.createdAt)?.toLocaleDateString("vi-VN") ?? "--"}</td>
                  <td className="py-3 pr-3 text-gray-500">{toDate(request.completedAt)?.toLocaleDateString("vi-VN") ?? "--"}</td>
                  <td className="py-3 pr-3 text-right font-semibold text-pink-600">
                    {request.status === "completed" ? formatVnd(getRevenue(request)) : "0đ"}
                  </td>
                </tr>
              ))}
              {report.requestRows.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-gray-400">
                    Chưa có yêu cầu trong kỳ này
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {report.requestRows.length > 20 && (
          <p className="mt-3 text-xs text-gray-500">Bảng chỉ hiển thị 20 dòng mới nhất. File Excel sẽ có đầy đủ dữ liệu.</p>
        )}
      </div>

      <div className="rounded-2xl border border-pink-100 bg-white p-6">
        <h3 className="mb-4 font-bold text-gray-900">Yêu cầu theo ngày trong tuần</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={chartData} barSize={32}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis dataKey="day" tick={{ fontSize: 12, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 12, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ borderRadius: "12px", border: "1px solid #fce7f3", fontSize: "12px" }}
            />
            <Bar dataKey="requests" fill="#f472b6" radius={[6, 6, 0, 0]} name="Yêu cầu" />
            <Bar dataKey="completed" fill="#be185d" radius={[6, 6, 0, 0]} name="Hoàn tất" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
