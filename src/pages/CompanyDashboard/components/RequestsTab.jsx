import React from 'react';
import { useCompanyDashboard } from '../CompanyDashboardContext';
import { Bell, CheckCircle2, Loader2, MapPin, MessageCircle, Phone, ChevronRight, XCircle, AlertTriangle, Star, Banknote, CreditCard } from "lucide-react";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

function RequestLocationMap({ request }) {
  const lat = Number(request?.latitude);
  const lng = Number(request?.longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return (
      <div className="mt-2 rounded-xl border border-yellow-100 bg-yellow-50 px-3 py-2 text-xs text-yellow-700">
        Yêu cầu này chưa có tọa độ GPS để hiển thị trên bản đồ.
      </div>
    );
  }

  return (
    <div className="mt-2 h-48 overflow-hidden rounded-xl border border-pink-100 bg-gray-100">
      <MapContainer
        center={[lat, lng]}
        zoom={15}
        className="h-full w-full"
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[lat, lng]}>
          <Popup>
            <div>
              <p className="font-semibold">Vị trí khách hàng</p>
              <p>{request.location || `${lat.toFixed(5)}, ${lng.toFixed(5)}`}</p>
            </div>
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}

export default function RequestsTab() {
  const context = useCompanyDashboard();
  const { 
    selectedReq, setSelectedReq, filterStatus, setFilterStatus, loadingRequests, selectedVehicleId, setSelectedVehicleId, etaMinutes, setEtaMinutes, finalPrice, setFinalPrice, statusUpdating, paymentConfirming, vehicles, availableVehicles, filtered, handleStatusUpdate, handleConfirmCashPayment, openMessageModal, statusConfig, companyReviews
  } = context;
  const isEmergencyRequest = (req) => ["emergency", "critical"].includes(req?.priority);
  const contactName = (req) => req.contactName || req.userName || "Chưa điền thông tin";
  const contactPhone = (req) => req.contactPhone || req.userPhone || "Chưa điền thông tin";
  const selectedContactPhone = selectedReq ? selectedReq.contactPhone || selectedReq.userPhone : "";
  const reviewByRequestId = new Map(
    companyReviews.map((review) => [String(review.request_id), review])
  );
  const selectedReview = selectedReq
    ? reviewByRequestId.get(String(selectedReq.id))
    : null;

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
                const requestReview = reviewByRequestId.get(String(req.id));
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
                          {req.assignmentMode === "automatic" && (
                            <span className="rounded-full border border-pink-200 bg-pink-50 px-2 py-0.5 text-xs font-semibold text-pink-600">
                              Hệ thống phân công
                            </span>
                          )}
                          <h3 className="font-semibold text-gray-800 text-sm">{req.serviceType}</h3>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{contactName(req)} · {contactPhone(req)}</p>
                        <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                          <MapPin size={11} className="text-pink-400" />
                          {req.location}
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{req.description}</p>
                        </div>
                      </div>
                      <ChevronRight size={16} className="text-gray-300 shrink-0 mt-1" />
                    </div>
                    {requestReview && (
                      <div className="mt-3 flex items-center gap-2 rounded-xl border border-yellow-100 bg-yellow-50 px-3 py-2">
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              size={12}
                              className={
                                star <= Number(requestReview.review_rating)
                                  ? "fill-yellow-400 text-yellow-400"
                                  : "text-gray-200"
                              }
                            />
                          ))}
                        </div>
                        <p className="truncate text-xs text-gray-600">
                          {requestReview.review_comment || "Khách hàng không để lại nhận xét"}
                        </p>
                      </div>
                    )}
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
                  {selectedReq.assignmentMode === "automatic" && (
                    <div className="rounded-xl border border-pink-100 bg-pink-50 px-3 py-2 text-xs font-semibold text-pink-600">
                      Yêu cầu được hệ thống tự động phân công
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-500">Khách hàng</span>
                    <span className="font-medium text-gray-800">{contactName(selectedReq)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Điện thoại</span>
                    <span className="font-medium text-pink-600">{contactPhone(selectedReq)}</span>
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
                    <RequestLocationMap request={selectedReq} />
                  </div>
                  <div>
                    <span className="text-gray-500">Mô tả</span>
                    <p className="text-gray-700 mt-0.5">{selectedReq.description}</p>
                  </div>
                  {selectedReq.note && (
                    <div className="rounded-xl border border-pink-100 bg-pink-50 p-3">
                      <span className="text-xs font-semibold text-pink-700">Ghi chú của khách hàng</span>
                      <p className="mt-1 text-gray-700">{selectedReq.note}</p>
                    </div>
                  )}
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
                  {selectedReview && (
                    <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-yellow-700">
                          Đánh giá của khách hàng
                        </span>
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              size={14}
                              className={
                                star <= Number(selectedReview.review_rating)
                                  ? "fill-yellow-400 text-yellow-400"
                                  : "text-gray-200"
                              }
                            />
                          ))}
                        </div>
                      </div>
                      <p className="mt-2 text-sm text-gray-700">
                        {selectedReview.review_comment || "Khách hàng không để lại nhận xét."}
                      </p>
                      <p className="mt-1 text-[11px] text-gray-400">
                        {new Date(selectedReview.reviewed_at).toLocaleString("vi-VN")}
                      </p>
                    </div>
                  )}
                  {selectedReq.status === "completed" && (
                    <div className="rounded-xl border border-blue-100 bg-blue-50 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-blue-700">
                          Trạng thái thanh toán
                        </span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                            selectedReq.paymentStatus === "paid"
                              ? "bg-green-100 text-green-700"
                              : selectedReq.paymentStatus === "pending"
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {selectedReq.paymentStatus === "paid"
                            ? "Đã thanh toán"
                            : selectedReq.paymentStatus === "pending"
                              ? "Chờ thanh toán/xác nhận"
                              : "Chưa thanh toán"}
                        </span>
                      </div>
                      {selectedReq.paymentMethod && (
                        <p className="mt-2 flex items-center gap-1.5 text-sm text-gray-700">
                          {selectedReq.paymentMethod === "vnpay" ? (
                            <CreditCard size={14} className="text-blue-600" />
                          ) : (
                            <Banknote size={14} className="text-green-600" />
                          )}
                          {selectedReq.paymentMethod === "vnpay" ? "VNPay" : "Tiền mặt"}
                        </p>
                      )}
                      {selectedReq.paymentMethod === "cash" &&
                        selectedReq.paymentStatus === "pending" && (
                          <button
                            onClick={() => handleConfirmCashPayment(selectedReq)}
                            disabled={!!paymentConfirming[selectedReq.id]}
                            className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-green-600 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
                          >
                            {paymentConfirming[selectedReq.id] ? (
                              <Loader2 size={15} className="animate-spin" />
                            ) : (
                              <CheckCircle2 size={15} />
                            )}
                            Xác nhận đã nhận tiền mặt
                          </button>
                        )}
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
                    {!isEmergencyRequest(selectedReq) && (
                      <button onClick={() => openMessageModal(selectedReq)} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-pink-200 text-pink-600 text-sm hover:bg-pink-50 transition-colors">
                        <MessageCircle size={15} />
                        Nhắn tin
                      </button>
                    )}
                    <a href={selectedContactPhone ? `tel:${selectedContactPhone}` : undefined} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-pink-200 text-pink-600 text-sm hover:bg-pink-50 transition-colors">
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
