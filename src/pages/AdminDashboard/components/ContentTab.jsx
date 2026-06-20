import React, { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Loader2, Search, XCircle } from "lucide-react";
import {
  getCommunityReports,
  updateCommunityCommentStatus,
  updateCommunityPostStatus,
  updateCommunityReportStatus,
} from "../../../api/community";

function getReportContent(item) {
  return item.target_type === "post" ? item.post_content : item.comment_content;
}

function getReportTitle(item) {
  if (item.target_type === "post") return item.post_title || "Bài viết cộng đồng";
  return "Bình luận cộng đồng";
}

const reportStatusLabel = {
  pending: "Đang chờ",
  reviewed: "Đã xử lý",
  dismissed: "Đã bỏ qua",
};

export default function ContentTab() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [targetFilter, setTargetFilter] = useState("all");
  const [page, setPage] = useState(1);
  const pageSize = 6;

  const filteredReports = useMemo(() => {
    const keyword = searchText.trim().toLowerCase();
    return reports.filter((item) => {
      const content = `${getReportTitle(item)} ${getReportContent(item) || ""} ${item.reason || ""} ${item.reporter_full_name || ""} ${item.reporter_user_name || ""}`.toLowerCase();
      const matchesSearch = !keyword || content.includes(keyword);
      const matchesStatus = statusFilter === "all" || item.status === statusFilter;
      const matchesTarget = targetFilter === "all" || item.target_type === targetFilter;
      return matchesSearch && matchesStatus && matchesTarget;
    });
  }, [reports, searchText, statusFilter, targetFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredReports.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageReports = filteredReports.slice((safePage - 1) * pageSize, safePage * pageSize);

  const loadReports = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getCommunityReports();
      setReports(data ?? []);
    } catch (err) {
      setError(err.message || "Không thể tải báo cáo nội dung");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const updateReport = async (item, action) => {
    setUpdatingId(item.report_id);
    setError("");
    try {
      if (action === "remove") {
        if (item.target_type === "post") {
          await updateCommunityPostStatus(item.target_id, "removed");
        } else {
          await updateCommunityCommentStatus(item.target_id, "removed");
        }
        await updateCommunityReportStatus(item.report_id, "reviewed");
      } else {
        await updateCommunityReportStatus(item.report_id, "dismissed");
      }
      await loadReports();
    } catch (err) {
      setError(err.message || "Không thể cập nhật báo cáo");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div>
      <div className="mb-4">
        <h2 className="font-bold text-gray-900 mb-1">Kiểm duyệt nội dung</h2>
        <p className="text-sm text-gray-500">Xem các báo cáo bài viết và bình luận vi phạm từ cộng đồng</p>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm báo cáo..."
            value={searchText}
            onChange={(e) => {
              setSearchText(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-xl border border-gray-200 py-2.5 pl-9 pr-4 text-sm focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-100"
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
          <option value="pending">Đang chờ</option>
          <option value="reviewed">Đã xử lý</option>
          <option value="dismissed">Đã bỏ qua</option>
        </select>
        <select
          value={targetFilter}
          onChange={(e) => {
            setTargetFilter(e.target.value);
            setPage(1);
          }}
          className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-100"
        >
          <option value="all">Tất cả nội dung</option>
          <option value="post">Bài đăng</option>
          <option value="comment">Bình luận</option>
        </select>
      </div>

      {error && (
        <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16 bg-white rounded-2xl border border-pink-100">
          <Loader2 size={28} className="animate-spin text-pink-500" />
        </div>
      ) : filteredReports.length === 0 ? (
        <div className="bg-white rounded-2xl border border-pink-100 p-8 text-center text-sm text-gray-400">
          Chưa có báo cáo nội dung nào
        </div>
      ) : (
        <>
        <div className="space-y-4">
          {pageReports.map((item) => {
            const busy = updatingId === item.report_id;
            return (
              <div key={item.report_id} className="bg-white rounded-2xl border border-pink-100 p-5">
                <div className="flex items-start justify-between flex-wrap gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-linear-to-br from-pink-300 to-pink-300 flex items-center justify-center text-white text-xs font-bold shrink-0">
                      {(item.reporter_full_name || item.reporter_user_name || "U")[0]}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-gray-800 text-sm">
                          {item.reporter_full_name || item.reporter_user_name || "Người dùng"}
                        </span>
                        <span className="text-xs bg-pink-50 text-pink-600 px-2 py-0.5 rounded-full">
                          {item.target_type === "post" ? "Bài đăng" : "Bình luận"}
                        </span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${
                            item.status === "pending"
                              ? "bg-red-50 text-red-500"
                              : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          {reportStatusLabel[item.status] ?? item.status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {getReportTitle(item)} {item.target_author_name ? `- ${item.target_author_name}` : ""}
                      </p>
                      <p className="text-sm text-gray-700 mt-2 leading-relaxed">"{getReportContent(item) || "Nội dung không còn tồn tại"}"</p>
                      <p className="text-xs text-red-500 mt-2 flex items-center gap-1">
                        <AlertTriangle size={12} />
                        Lý do: {item.reason}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">{new Date(item.created_at).toLocaleString("vi-VN")}</p>
                    </div>
                  </div>
                  {item.status === "pending" ? <div className="flex gap-2">
                    <button
                      onClick={() => updateReport(item, "dismiss")}
                      disabled={busy}
                      className="flex items-center gap-1 px-3 py-1.5 bg-green-500 text-white rounded-xl text-xs font-medium hover:bg-green-600 transition-colors disabled:opacity-50"
                    >
                      {busy ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
                      Bỏ qua
                    </button>
                    <button
                      onClick={() => updateReport(item, "remove")}
                      disabled={busy}
                      className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-500 border border-red-200 rounded-xl text-xs font-medium hover:bg-red-100 transition-colors disabled:opacity-50"
                    >
                      <XCircle size={13} />
                      Gỡ nội dung
                    </button>
                  </div> : (
                    <div className="flex items-center gap-1 rounded-xl bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-500">
                      <CheckCircle2 size={13} />
                      {reportStatusLabel[item.status] ?? "Đã xử lý"}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-4 flex items-center justify-between gap-3 text-sm text-gray-500">
          <span>
            Trang {safePage}/{totalPages} · {filteredReports.length} kết quả
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
        </>
      )}
    </div>
  );
}
