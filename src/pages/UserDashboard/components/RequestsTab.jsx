import React, { useMemo, useState } from 'react';
import { useUserDashboard } from '../UserDashboardContext';
import { Car, Wrench, MapPin, Star, ChevronRight, Pencil, Trash2 } from "lucide-react";

export default function RequestsTab() {
  const context = useUserDashboard();
  const { 
    requests, setActiveTab, setSelectedRequest, openRatingModal, handleDeleteReview, statusConfig, serviceIconMap
  } = context;
  const userRequests = requests;
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchText, setSearchText] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const filteredRequests = useMemo(() => {
    const keyword = searchText.trim().toLowerCase();
    return userRequests.filter((req) => {
      const matchesStatus = statusFilter === "all" || req.status === statusFilter;
      const haystack = [
        req.serviceType,
        req.companyName,
        req.location,
        req.description,
        req.price,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return matchesStatus && (!keyword || haystack.includes(keyword));
    });
  }, [searchText, statusFilter, userRequests]);
  const totalPages = Math.max(1, Math.ceil(filteredRequests.length / itemsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const pagedRequests = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * itemsPerPage;
    return filteredRequests.slice(startIndex, startIndex + itemsPerPage);
  }, [safeCurrentPage, filteredRequests]);

  return (
    <div className="space-y-4">
          <div className="flex flex-col gap-3 rounded-2xl border border-pink-100 bg-white p-4 sm:flex-row">
            <input
              value={searchText}
              onChange={(e) => {
                setSearchText(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Tìm theo dịch vụ, công ty, địa điểm..."
              className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-100"
            />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-100"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="pending">Chờ tiếp nhận</option>
              <option value="accepted">Đã tiếp nhận</option>
              <option value="heading">Đang di chuyển</option>
              <option value="arrived">Đã đến nơi</option>
              <option value="processing">Đang xử lý</option>
              <option value="completed">Hoàn tất</option>
              <option value="cancelled">Đã hủy</option>
            </select>
          </div>
          {userRequests.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-pink-100">
              <Car size={48} className="text-pink-200 mx-auto mb-3" />
              <p className="text-gray-400">Bạn chưa có yêu cầu cứu hộ nào</p>
              <button
                onClick={() => setActiveTab("new")}
                className="mt-4 bg-pink-500 text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-pink-600 transition-colors"
              >
                Gửi yêu cầu đầu tiên
              </button>
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-pink-100">
              <Car size={40} className="text-pink-200 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">Không tìm thấy yêu cầu phù hợp</p>
            </div>
          ) : (
            pagedRequests.map((req) => {
              const status = statusConfig[req.status] ?? statusConfig.pending;
              return (
                <div
                  key={req.id}
                  className="bg-white rounded-2xl border border-pink-100 p-5 hover:shadow-md hover:shadow-pink-50 transition-all cursor-pointer"
                  onClick={() => { setSelectedRequest(req); setActiveTab("track"); }}
                >
                  <div className="flex items-start justify-between flex-wrap gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-pink-50 flex items-center justify-center shrink-0">
                        {serviceIconMap[req.serviceType] || <Wrench size={20} className="text-pink-500" />}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-800">{req.serviceType}</h3>
                        <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">{req.description}</p>
                        <div className="flex items-center gap-1 mt-1 text-xs text-gray-400">
                          <MapPin size={11} className="text-pink-400" />
                          {req.location}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className={`flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full border ${status.color}`}>
                        {status.icon}
                        {status.label}
                      </span>
                      {req.price && (
                        <span className="text-sm font-semibold text-gray-800">{req.price}</span>
                      )}
                    </div>
                  </div>

                  {req.imageUrls?.length > 0 && (
                    <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                      {req.imageUrls.map((imageUrl, index) => (
                        <a
                          key={`${req.id}-${imageUrl}`}
                          href={imageUrl}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="block h-16 w-20 shrink-0 overflow-hidden rounded-xl border border-pink-100 bg-pink-50"
                        >
                          <img
                            src={imageUrl}
                            alt={`Ảnh yêu cầu ${index + 1}`}
                            className="h-full w-full object-cover"
                          />
                        </a>
                      ))}
                    </div>
                  )}

                  {req.companyName && (
                    <div className="mt-3 pt-3 border-t border-gray-50 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <div className="w-6 h-6 rounded-full bg-pink-100 flex items-center justify-center text-xs">🚑</div>
                        {req.companyName}
                        {req.estimatedTime && (
                          <span className="text-xs text-pink-500">· ~{req.estimatedTime} phút</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {req.rating ? (
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1">
                              {[1, 2, 3, 4, 5].map((s) => (
                                <Star key={s} size={12} className={s <= req.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-200"} />
                              ))}
                            </div>
                            <button
                              title="Sửa đánh giá"
                              onClick={(e) => {
                                e.stopPropagation();
                                openRatingModal(req);
                              }}
                              className="text-pink-500 hover:text-pink-700"
                            >
                              <Pencil size={13} />
                            </button>
                            <button
                              title="Xóa đánh giá"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteReview(req);
                              }}
                              className="text-red-400 hover:text-red-600"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        ) : req.status === "completed" ? (
                          <button
                            className="text-xs text-pink-600 font-medium hover:text-pink-700"
                            onClick={(e) => { e.stopPropagation(); openRatingModal(req); }}
                          >
                            Đánh giá dịch vụ
                          </button>
                        ) : null}
                        <ChevronRight size={16} className="text-gray-400" />
                      </div>
                    </div>
                  )}

                  <p className="text-xs text-gray-400 mt-2">
                    {new Date(req.createdAt).toLocaleString("vi-VN")}
                  </p>
                </div>
              );
            })
          )}
          {filteredRequests.length > itemsPerPage && (
            <div className="flex items-center justify-between rounded-2xl border border-pink-100 bg-white px-4 py-3 text-sm">
              <span className="text-gray-500">
                Trang {safeCurrentPage}/{totalPages} · {filteredRequests.length} yêu cầu
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                  disabled={safeCurrentPage === 1}
                  className="rounded-lg border border-pink-200 px-3 py-1.5 text-pink-600 disabled:opacity-40"
                >
                  Trước
                </button>
                <button
                  onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                  disabled={safeCurrentPage === totalPages}
                  className="rounded-lg border border-pink-200 px-3 py-1.5 text-pink-600 disabled:opacity-40"
                >
                  Sau
                </button>
              </div>
            </div>
          )}
        </div>
  );
}
