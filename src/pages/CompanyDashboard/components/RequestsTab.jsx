import React from 'react';
import { useCompanyDashboard } from '../CompanyDashboardContext';
import { Bell, CheckCircle2, Loader2, MapPin, MessageCircle, Phone, ChevronRight, XCircle, AlertTriangle } from "lucide-react";

export default function RequestsTab() {
  const context = useCompanyDashboard();
  const { 
    selectedReq, setSelectedReq, filterStatus, setFilterStatus, loadingRequests, selectedVehicleId, setSelectedVehicleId, etaMinutes, setEtaMinutes, finalPrice, setFinalPrice, statusUpdating, vehicles, availableVehicles, filtered, handleStatusUpdate, openMessageModal, statusConfig
  } = context;

  return (
    <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            {/* Filter */}
            <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
              {[
                { key: "all", label: "Tất cả" },
                { key: "pending", label: "Chờ tiếp nhận" },
                { key: "accepted", label: "Đã tiếp nhận" },
                { key: "heading", label: "Đang di chuyển" },
                { key: "arrived", label: "Đã đến nơi" },
                { key: "processing", label: "Đang xử lý" },
                { key: "completed", label: "Hoàn tất" },
                { key: "cancelled", label: "Đã hủy" },
              ].map((f) => (
                <button
                  key={f.key}
                  onClick={() => setFilterStatus(f.key)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                    filterStatus === f.key
                      ? "bg-pink-500 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-pink-100 hover:text-pink-600"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="space-y-3">
              {loadingRequests && (
                <div className="bg-white rounded-2xl border border-pink-100 p-4 text-sm text-gray-500">
                  Đang tải yêu cầu...
                </div>
              )}
              {filtered.map((req) => {
                const status = statusConfig[req.status] ?? statusConfig.pending;
                return (
                  <div
                    key={req.id}
                    onClick={() => setSelectedReq(req)}
                    className={`bg-white rounded-2xl border p-4 cursor-pointer transition-all hover:shadow-md ${
                      selectedReq?.id === req.id
                        ? "border-pink-300 shadow-md shadow-pink-50"
                        : "border-pink-100 hover:border-pink-200"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 gap-3">
                        {req.userAvatarUrl ? (
                          <img src={req.userAvatarUrl} alt={req.userName || "Khách hàng"} className="h-10 w-10 rounded-full object-cover" />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-pink-50 text-sm font-semibold text-pink-600">
                            {(req.userName || "U").slice(0, 1).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${status.color}`}>
                            {status.label}
                          </span>
                          {req.priority && req.priority !== "normal" && (
                            <span className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-600">
                              <AlertTriangle size={11} />
                              Ưu tiên cao
                            </span>
                          )}
                          <h3 className="font-semibold text-gray-800 text-sm">{req.serviceType}</h3>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{req.contactName || req.userName} · {req.contactPhone || req.userPhone}</p>
                        <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                          <MapPin size={11} className="text-pink-400" />
                          {req.location}
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{req.description}</p>
                        </div>
                      </div>
                      <ChevronRight size={16} className="text-gray-300 shrink-0 mt-1" />
                    </div>
                    <p className="text-xs text-gray-400 mt-2">{new Date(req.createdAt).toLocaleString("vi-VN")}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Detail panel */}
          <div>
            {selectedReq ? (
              <div className="bg-white rounded-2xl border border-pink-100 p-5 sticky top-24">
                <h3 className="font-bold text-gray-900 mb-4">Chi tiết yêu cầu #{selectedReq.id}</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Trạng thái</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${(statusConfig[selectedReq.status] ?? statusConfig.pending).color}`}>
                      {(statusConfig[selectedReq.status] ?? statusConfig.pending).label}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Khách hàng</span>
                    <span className="font-medium text-gray-800">{selectedReq.contactName || selectedReq.userName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Điện thoại</span>
                    <span className="font-medium text-pink-600">{selectedReq.contactPhone || selectedReq.userPhone}</span>
                  </div>
                  {selectedReq.contactBackNow && (
                    <div className="rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-xs font-semibold text-red-600">
                      Khách yêu cầu công ty liên hệ lại ngay lập tức.
                    </div>
                  )}
                  {selectedReq.priority && selectedReq.priority !== "normal" && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Ưu tiên</span>
                      <span className="font-semibold text-red-600">Cao</span>
                    </div>
                  )}
                  <div>
                    <span className="text-gray-500">Vị trí</span>
                    <p className="font-medium text-gray-800 mt-0.5">{selectedReq.location}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Mô tả</span>
                    <p className="text-gray-700 mt-0.5">{selectedReq.description}</p>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Dịch vụ</span>
                    <span className="font-medium text-gray-800">{selectedReq.serviceType}</span>
                  </div>
                  {selectedReq.price && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Chi phí</span>
                      <span className="font-semibold text-pink-600">{selectedReq.price}</span>
                    </div>
                  )}
                  {selectedReq.estimatedArrival && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">ETA</span>
                      <span className="font-medium text-gray-800">
                        {new Date(selectedReq.estimatedArrival).toLocaleString("vi-VN")}
                      </span>
                    </div>
                  )}
                  {selectedReq.vehicleId && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Xe cứu hộ</span>
                      <span className="font-medium text-gray-800">
                        {vehicles.find((v) => String(v.vehicle_id) === String(selectedReq.vehicleId))?.vehicle_license ?? `#${selectedReq.vehicleId}`}
                      </span>
                    </div>
                  )}
                  {selectedReq.imageUrls?.length > 0 && (
                    <div>
                      <span className="text-gray-500">Ảnh người dùng đã tải</span>
                      <div className="mt-2 grid grid-cols-2 gap-2">
                        {selectedReq.imageUrls.map((url) => (
                          <a key={url} href={url} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-xl border border-gray-100">
                            <img src={url} alt="Ảnh sự cố" className="h-24 w-full object-cover" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="space-y-2 mt-5">
                  {selectedReq.status === "pending" && (
                    <div className="space-y-2 rounded-xl border border-pink-100 bg-pink-50 p-3">
                      <div>
                        <label className="text-xs text-pink-700 font-medium">Xe cứu hộ điều phối</label>
                        <select
                          value={selectedVehicleId}
                          onChange={(e) => setSelectedVehicleId(e.target.value)}
                          disabled={!!statusUpdating[selectedReq.id]}
                          className="mt-1 w-full rounded-lg border border-pink-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-100"
                        >
                          <option value="">Chưa chọn xe</option>
                          {availableVehicles.map((v) => (
                            <option key={v.vehicle_id} value={String(v.vehicle_id)}>
                              {v.vehicle_license} - {v.vehicle_type}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-pink-700 font-medium">Thời gian dự kiến đến nơi (phút)</label>
                        <input
                          type="number"
                          min="1"
                          value={etaMinutes}
                          onChange={(e) => setEtaMinutes(e.target.value)}
                          disabled={!!statusUpdating[selectedReq.id]}
                          className="mt-1 w-full rounded-lg border border-pink-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-100"
                        />
                      </div>
                      <button
                        onClick={() => {
                          const eta = Number(etaMinutes);
                          handleStatusUpdate(selectedReq, "accepted", {
                            vehicle_id: selectedVehicleId ? Number(selectedVehicleId) : null,
                            eta_minutes: Number.isFinite(eta) && eta > 0 ? eta : 20,
                            note: "Company accepted request",
                          });
                        }}
                        disabled={!!statusUpdating[selectedReq.id]}
                        className="w-full bg-linear-to-r from-pink-500 to-pink-400 text-white py-2.5 rounded-xl text-sm font-semibold hover:shadow-md hover:shadow-pink-200 transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {statusUpdating[selectedReq.id] ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                        {statusUpdating[selectedReq.id] ? "Đang xử lý..." : "Tiếp nhận yêu cầu"}
                      </button>
                    </div>
                  )}
                  {selectedReq.status === "accepted" && (
                    <button
                      onClick={() => handleStatusUpdate(selectedReq, "heading", { note: "Vehicle is heading to customer" })}
                      disabled={!!statusUpdating[selectedReq.id]}
                      className="w-full bg-linear-to-r from-pink-500 to-pink-400 text-white py-2.5 rounded-xl text-sm font-semibold hover:shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {statusUpdating[selectedReq.id] ? <Loader2 size={16} className="animate-spin" /> : <Loader2 size={16} />}
                      {statusUpdating[selectedReq.id] ? "Đang xử lý..." : "Bắt đầu di chuyển"}
                    </button>
                  )}
                  {selectedReq.status === "heading" && (
                    <button
                      onClick={() => handleStatusUpdate(selectedReq, "arrived", { note: "Vehicle arrived" })}
                      disabled={!!statusUpdating[selectedReq.id]}
                      className="w-full bg-linear-to-r from-pink-500 to-pink-400 text-white py-2.5 rounded-xl text-sm font-semibold hover:shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {statusUpdating[selectedReq.id] ? <Loader2 size={16} className="animate-spin" /> : <MapPin size={16} />}
                      {statusUpdating[selectedReq.id] ? "Đang xử lý..." : "Đã đến hiện trường"}
                    </button>
                  )}
                  {selectedReq.status === "arrived" && (
                    <button
                      onClick={() => handleStatusUpdate(selectedReq, "processing", { note: "Started processing incident" })}
                      disabled={!!statusUpdating[selectedReq.id]}
                      className="w-full bg-linear-to-r from-purple-500 to-purple-400 text-white py-2.5 rounded-xl text-sm font-semibold hover:shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {statusUpdating[selectedReq.id] ? <Loader2 size={16} className="animate-spin" /> : <Loader2 size={16} />}
                      {statusUpdating[selectedReq.id] ? "Đang xử lý..." : "Bắt đầu xử lý"}
                    </button>
                  )}
                  {selectedReq.status === "processing" && (
                    <div className="space-y-2 rounded-xl border border-green-100 bg-green-50 p-3">
                      <div>
                        <label className="text-xs text-green-700 font-medium">Chi phí cuối cùng (VND)</label>
                        <input
                          type="number"
                          min="0"
                          value={finalPrice}
                          onChange={(e) => setFinalPrice(e.target.value)}
                          className="mt-1 w-full rounded-lg border border-green-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-100"
                        />
                      </div>
                      <button
                        onClick={() => {
                          const price = Number(finalPrice);
                          handleStatusUpdate(selectedReq, "completed", {
                            final_price: Number.isFinite(price) && price >= 0 ? price : null,
                            note: "Request completed",
                          });
                        }}
                        disabled={!!statusUpdating[selectedReq.id]}
                        className="w-full bg-linear-to-r from-green-500 to-green-400 text-white py-2.5 rounded-xl text-sm font-semibold hover:shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {statusUpdating[selectedReq.id] ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                        {statusUpdating[selectedReq.id] ? "Đang xử lý..." : "Xác nhận hoàn tất"}
                      </button>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <button onClick={() => openMessageModal(selectedReq)} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-pink-200 text-pink-600 text-sm hover:bg-pink-50 transition-colors">
                      <MessageCircle size={15} />
                      Nhắn tin
                    </button>
                    <a href={`tel:${selectedReq.contactPhone || selectedReq.userPhone}`} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-pink-200 text-pink-600 text-sm hover:bg-pink-50 transition-colors">
                      <Phone size={15} />
                      Gọi điện
                    </a>
                  </div>
                  {selectedReq.status === "pending" && (
                    <button
                      onClick={() => handleStatusUpdate(selectedReq, "cancelled", {
                        cancelled_by: "company",
                        cancel_reason: "Company rejected request",
                        note: "Company rejected request",
                      })}
                      disabled={!!statusUpdating[selectedReq.id]}
                      className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-red-200 text-red-500 text-sm hover:bg-red-50 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {statusUpdating[selectedReq.id] ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={15} />}
                      {statusUpdating[selectedReq.id] ? "Đang xử lý..." : "Từ chối"}
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-pink-100 p-8 text-center">
                <Bell size={40} className="text-pink-200 mx-auto mb-3" />
                <p className="text-gray-400 text-sm">Chọn một yêu cầu để xem chi tiết</p>
              </div>
            )}
          </div>
        </div>
  );
}
