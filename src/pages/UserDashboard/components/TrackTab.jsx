import React from 'react';
import { useUserDashboard } from '../UserDashboardContext';
import { MapPin, CheckCircle2, XCircle, Star, Phone, MessageCircle, ChevronRight, Car, Wrench, Navigation } from "lucide-react";

export default function TrackTab() {
  const context = useUserDashboard();
  const { 
    requests, selectedRequest, setSelectedRequest, openMessageModal, cancelRequest, statusConfig
  } = context;
  const userRequests = requests;

  return (
    <div className="grid md:grid-cols-2 gap-6">
          {/* Request selector */}
          <div>
            <h2 className="font-semibold text-gray-800 mb-3">Chọn yêu cầu để theo dõi</h2>
            <div className="space-y-3">
              {userRequests.filter((r) => r.status !== "completed" && r.status !== "cancelled").length === 0 ? (
                <div className="text-center py-10 bg-white rounded-2xl border border-pink-100">
                  <CheckCircle2 size={40} className="text-green-300 mx-auto mb-3" />
                  <p className="text-gray-400 text-sm">Không có yêu cầu nào đang xử lý</p>
                </div>
              ) : (
                userRequests
                  .filter((r) => r.status !== "completed" && r.status !== "cancelled")
                  .map((req) => {
                    const status = statusConfig[req.status] ?? statusConfig.pending;
                    return (
                      <button
                        key={req.id}
                        onClick={() => setSelectedRequest(req)}
                        className={`w-full text-left p-4 rounded-2xl border-2 transition-all ${
                          selectedRequest?.id === req.id
                            ? "border-pink-400 bg-pink-50"
                            : "border-gray-100 bg-white hover:border-pink-200"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-800 text-sm">{req.serviceType}</p>
                            <p className="text-xs text-gray-500 mt-0.5">{new Date(req.createdAt).toLocaleDateString("vi-VN")}</p>
                          </div>
                          <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${status.color}`}>
                            {status.label}
                          </span>
                        </div>
                      </button>
                    );
                  })
              )}
            </div>
          </div>

          {/* Request detail */}
          <div>
            {selectedRequest ? (
              <div className="bg-white rounded-2xl border border-pink-100 p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-bold text-gray-900">Chi tiết yêu cầu</h2>
                  <span className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border ${(statusConfig[selectedRequest.status] ?? statusConfig.pending).color}`}>
                    {(statusConfig[selectedRequest.status] ?? statusConfig.pending).icon}
                    {(statusConfig[selectedRequest.status] ?? statusConfig.pending).label}
                  </span>
                </div>

                {/* Timeline */}
                <div className="space-y-3 mb-4">
                  {[
                    { label: "Gửi yêu cầu", done: true, time: new Date(selectedRequest.createdAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }) },
                    { label: "Tiếp nhận bởi " + (selectedRequest.companyName || "..."), done: selectedRequest.status !== "pending", time: selectedRequest.acceptedAt ? new Date(selectedRequest.acceptedAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }) : "" },
                    { label: "Xe cứu hộ đang đến", done: ["heading", "arrived", "processing", "completed"].includes(selectedRequest.status), time: selectedRequest.estimatedTime != null ? `~${selectedRequest.estimatedTime} phút` : "" },
                    { label: "Đã đến hiện trường", done: ["arrived", "processing", "completed"].includes(selectedRequest.status), time: selectedRequest.arrivedAt ? new Date(selectedRequest.arrivedAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }) : "" },
                    { label: "Đang xử lý sự cố", done: ["processing", "completed"].includes(selectedRequest.status), time: "" },
                    { label: "Hoàn tất dịch vụ", done: selectedRequest.status === "completed", time: selectedRequest.status === "completed" ? new Date(selectedRequest.updatedAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }) : "" },
                  ].map((t, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${t.done ? "bg-pink-500" : "bg-gray-200"}`}>
                        {t.done ? <CheckCircle2 size={14} className="text-white" /> : <div className="w-2 h-2 rounded-full bg-gray-400" />}
                      </div>
                      <div>
                        <p className={`text-sm font-medium ${t.done ? "text-gray-800" : "text-gray-400"}`}>{t.label}</p>
                        {t.time && <p className="text-xs text-gray-400">{t.time}</p>}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-2 text-sm pt-4 border-t border-gray-100">
                  <div className="flex gap-2">
                    <MapPin size={14} className="text-pink-400 mt-0.5 shrink-0" />
                    <span className="text-gray-600">{selectedRequest.location}</span>
                  </div>
                  <div className="flex gap-2">
                    <Wrench size={14} className="text-pink-400 mt-0.5 shrink-0" />
                    <span className="text-gray-600">{selectedRequest.serviceType}</span>
                  </div>
                  {selectedRequest.price && (
                    <div className="flex gap-2">
                      <span className="text-xs text-gray-400">💰</span>
                      <span className="text-gray-600 font-semibold">{selectedRequest.price}</span>
                    </div>
                  )}
                </div>

                {selectedRequest.imageUrls?.length > 0 && (
                  <div className="mt-4 border-t border-gray-100 pt-4">
                    <p className="mb-2 text-sm font-semibold text-gray-800">Ảnh đã tải lên</p>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {selectedRequest.imageUrls.map((imageUrl, index) => (
                        <a
                          key={`${selectedRequest.id}-${imageUrl}`}
                          href={imageUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="block overflow-hidden rounded-xl border border-pink-100 bg-pink-50"
                        >
                          <img
                            src={imageUrl}
                            alt={`Ảnh yêu cầu ${index + 1}`}
                            className="h-24 w-full object-cover"
                          />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Review */}
                {selectedRequest.rating && (
                  <div className="mt-4 pt-4 border-t border-gray-100 bg-yellow-50 rounded-xl p-3">
                    <div className="flex items-center gap-1 mb-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} size={14} className={s <= selectedRequest.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-200"} />
                      ))}
                    </div>
                    <p className="text-xs text-gray-600 italic">"{selectedRequest.review}"</p>
                  </div>
                )}

                {/* Actions */}
                {selectedRequest.status !== "completed" && selectedRequest.status !== "cancelled" && (
                  <div className="flex gap-3 mt-4">
                    <button onClick={() => openMessageModal(selectedRequest)} className="flex-1 flex items-center justify-center gap-2 bg-pink-50 text-pink-600 py-2.5 rounded-xl text-sm font-medium hover:bg-pink-100 transition-colors">
                      <MessageCircle size={16} />
                      Nhắn tin
                    </button>
                    <button className="flex-1 flex items-center justify-center gap-2 bg-pink-50 text-pink-600 py-2.5 rounded-xl text-sm font-medium hover:bg-pink-100 transition-colors">
                      <Phone size={16} />
                      Gọi điện
                    </button>
                    {selectedRequest.status === "pending" && (
                      <button
                        onClick={() => cancelRequest(selectedRequest)}
                        className="flex-1 flex items-center justify-center gap-2 bg-red-50 text-red-500 py-2.5 rounded-xl text-sm font-medium hover:bg-red-100 transition-colors"
                      >
                        <XCircle size={16} />
                        Hủy
                      </button>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-pink-100 p-8 text-center">
                <Navigation size={40} className="text-pink-200 mx-auto mb-3" />
                <p className="text-gray-400 text-sm">Chọn một yêu cầu để xem chi tiết và theo dõi trạng thái</p>
              </div>
            )}
          </div>
        </div>
  );
}
