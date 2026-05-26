import React from 'react';
import { useUserDashboard } from '../UserDashboardContext';
import { CheckCircle2, Loader2, Star, MapPin, X, Camera, Send, Clock } from "lucide-react";
import LocationPickerMap from "../../../components/LocationPickerMap";

export default function NewTab() {
  const context = useUserDashboard();
  const { 
    setActiveTab, companies, newReq, setNewReq, submittingRequest, imageUploading, imageInputRef, availableRequestServices, selectedCompany, selectedCompanyService, companiesWithDistance, handleImageSelection, removeUploadedImage, submitRequest, serviceIconMap
  } = context;

  const openImagePicker = () => {
    imageInputRef.current?.click();
  };

  return (
    <div className="bg-white rounded-2xl border border-pink-100 p-6 max-w-2xl">
          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-6">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                    newReq.step >= step
                      ? "bg-linear-to-br from-pink-500 to-pink-400 text-white"
                      : "bg-gray-100 text-gray-400"
                  }`}
                >
                  {newReq.step > step ? <CheckCircle2 size={16} /> : step}
                </div>
                <span className={`text-sm ${newReq.step >= step ? "text-pink-600 font-medium" : "text-gray-400"}`}>
                  {step === 1 ? "Chọn đơn vị" : step === 2 ? "Loại sự cố" : "Thông tin & Vị trí"}
                </span>
                {step < 3 && <div className={`w-8 h-0.5 ${newReq.step > step ? "bg-pink-300" : "bg-gray-200"}`} />}
              </div>
            ))}
          </div>

          {/* Step 1: Choose company */}
          {newReq.step === 1 && (
            <div>
              <h2 className="text-lg font-bold text-gray-800 mb-2">Chọn đơn vị cứu hộ</h2>
              <p className="text-sm text-gray-500 mb-4">
                {Number.isFinite(newReq.latitude) && Number.isFinite(newReq.longitude)
                  ? "Các đơn vị gần bạn nhất (sắp xếp theo GPS):"
                  : "Các đơn vị gần bạn nhất (hãy bấm GPS để sắp xếp chính xác):"}
              </p>
              <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                {companiesWithDistance.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setNewReq({ ...newReq, selectedCompanyId: c.id })}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                      newReq.selectedCompanyId === c.id
                        ? "border-pink-400 bg-pink-50"
                        : "border-gray-100 hover:border-pink-200"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-gray-800">{c.name}</p>
                        <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Star size={11} className="fill-yellow-400 text-yellow-400" />
                            {c.rating}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin size={11} className="text-pink-400" />
                            {Number.isFinite(c.distanceKm) ? `${c.distanceKm.toFixed(1)} km` : "Chưa có dữ liệu"}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock size={11} className="text-blue-400" />
                            {Number.isFinite(c.etaMinutes)
                              ? `~${c.etaMinutes} phút`
                              : Number.isFinite(Number(c.responseTime))
                              ? `~${Number(c.responseTime)} phút`
                              : "Chưa có ETA"}
                          </span>
                        </div>
                      </div>
                      {newReq.selectedCompanyId === c.id && (
                        <CheckCircle2 size={20} className="text-pink-500" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
              <button
                disabled={!newReq.selectedCompanyId}
                onClick={() => setNewReq({ ...newReq, step: 2 })}
                className="mt-6 w-full bg-linear-to-r from-pink-500 to-pink-400 text-white py-3 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-md hover:shadow-pink-200 transition-all"
              >
                Tiếp theo
              </button>
            </div>
          )}

          {/* Step 2: Service type */}
          {newReq.step === 2 && (
            <div>
              <h2 className="text-lg font-bold text-gray-800 mb-4">Chọn loại sự cố</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {availableRequestServices.map((s) => {
                  const companyService = selectedCompany?.serviceDetails?.find((x) => x.name === s.name);
                  const servicePrice =
                    companyService && Number.isFinite(companyService.price)
                      ? `${companyService.price.toLocaleString("vi-VN")}đ`
                      : s.price;
                  return (
                  <button
                    key={s.id}
                    onClick={() => setNewReq({ ...newReq, serviceType: s.name })}
                    className={`p-4 rounded-2xl border-2 text-left transition-all ${
                      newReq.serviceType === s.name
                        ? "border-pink-400 bg-pink-50"
                        : "border-gray-100 hover:border-pink-200 hover:bg-pink-50/50"
                    }`}
                  >
                    <div className="text-2xl mb-2">{s.icon}</div>
                    <p className="text-sm font-medium text-gray-800 leading-tight">{s.name}</p>
                    <p className="text-xs text-gray-400 mt-1">{servicePrice}</p>
                  </button>
                  );
                })}
              </div>
              {availableRequestServices.length === 0 && (
                <div className="rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-700">
                  Công ty này chưa khai báo dịch vụ. Hãy chọn công ty khác hoặc yêu cầu công ty cập nhật dịch vụ.
                </div>
              )}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setNewReq({ ...newReq, step: 1 })}
                  className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition-colors"
                >
                  Quay lại
                </button>
                <button
                  disabled={!newReq.serviceType}
                  onClick={() => setNewReq({ ...newReq, step: 3 })}
                  className="flex-1 bg-linear-to-r from-pink-500 to-pink-400 text-white py-3 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-md hover:shadow-pink-200 transition-all"
                >
                  Tiếp theo
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Details */}
          {newReq.step === 3 && (
            <div>
              <h2 className="text-lg font-bold text-gray-800 mb-4">Mô tả sự cố & Vị trí</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Đơn vị đã chọn
                  </label>
                  <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-2.5 text-sm text-blue-700 font-medium">
                    {companies.find((c) => c.id === newReq.selectedCompanyId)?.name || "Chưa chọn đơn vị"}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Dịch vụ đã chọn
                  </label>
                  <div className="flex items-center gap-2 bg-pink-50 px-4 py-2.5 rounded-xl border border-pink-200">
                    {serviceIconMap[newReq.serviceType]}
                    <span className="text-sm font-medium text-pink-700">{newReq.serviceType}</span>
                    {selectedCompanyService && Number.isFinite(selectedCompanyService.price) && (
                      <span className="ml-auto text-sm font-semibold text-pink-700">
                        {selectedCompanyService.price.toLocaleString("vi-VN")}đ
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Mô tả tình trạng xe <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    placeholder="Ví dụ: Xe bị xì lốp trước bên phải, cần thay lốp dự phòng..."
                    value={newReq.description}
                    onChange={(e) => setNewReq({ ...newReq, description: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100 resize-none"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Địa chỉ mô tả <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <MapPin size={16} className="absolute left-3 top-3 text-pink-400" />
                    <input
                      type="text"
                      value={newReq.location}
                      onChange={(e) => setNewReq({ ...newReq, location: e.target.value })}
                      className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Chọn vị trí trên bản đồ <span className="text-red-400">*</span>
                  </label>
                  <LocationPickerMap
                    lat={newReq.latitude}
                    lng={newReq.longitude}
                    onPick={(point) =>
                      setNewReq({
                        ...newReq,
                        latitude: point.lat,
                        longitude: point.lng,
                      })
                    }
                  />
                  <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                    <MapPin size={12} className="text-pink-400" />
                    {Number.isFinite(newReq.latitude) && Number.isFinite(newReq.longitude)
                      ? `${Number(newReq.latitude).toFixed(5)}, ${Number(newReq.longitude).toFixed(5)}`
                      : "Nhấp vào bản đồ để chọn điểm gặp sự cố"}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Hình ảnh (không bắt buộc)
                  </label>
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleImageSelection}
                  />
                  <button
                    type="button"
                    onClick={openImagePicker}
                    disabled={imageUploading}
                    className="w-full border-2 border-dashed border-pink-200 rounded-xl py-6 flex flex-col items-center gap-2 text-pink-400 hover:border-pink-400 hover:bg-pink-50 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {imageUploading ? <Loader2 size={24} className="animate-spin" /> : <Camera size={24} />}
                    <span className="text-sm">
                      {imageUploading ? "Đang tải ảnh lên..." : "Chụp hoặc tải ảnh lên"}
                    </span>
                  </button>
                  {newReq.imageUrls.length > 0 && (
                    <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {newReq.imageUrls.map((imageUrl) => (
                        <div key={imageUrl} className="relative rounded-xl overflow-hidden border border-pink-100 bg-pink-50">
                          <img src={imageUrl} alt="Ảnh sự cố" className="h-24 w-full object-cover" />
                          <button
                            type="button"
                            onClick={() => removeUploadedImage(imageUrl)}
                            className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70"
                            aria-label="Xóa ảnh"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => setNewReq({ ...newReq, step: 2 })}
                  className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition-colors"
                >
                  Quay lại
                </button>
                <button
                  disabled={
                    !newReq.selectedCompanyId ||
                    !newReq.description ||
                    !newReq.location ||
                    !Number.isFinite(newReq.latitude) ||
                    !Number.isFinite(newReq.longitude) ||
                    imageUploading ||
                    submittingRequest
                  }
                  onClick={async () => {
                    try {
                      await submitRequest();
                      const rememberedCompanyId = newReq.selectedCompanyId;
                      setActiveTab("requests");
                      setNewReq({
                        serviceType: "",
                        description: "",
                        location: "Đường Phạm Văn Đồng, Q. Bình Thạnh, TP.HCM",
                        latitude: undefined,
                        longitude: undefined,
                        step: 1,
                        selectedCompanyId: rememberedCompanyId,
                        imageUrls: [],
                      });
                    } catch (e) {
                      console.error(e);
                      window.alert(e instanceof Error ? e.message : "Gửi yêu cầu thất bại");
                    }
                  }}
                  className="flex-1 bg-linear-to-r from-pink-500 to-pink-400 text-white py-3 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-md hover:shadow-pink-200 transition-all flex items-center justify-center gap-2"
                >
                  {submittingRequest ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                  {submittingRequest ? "Đang gửi..." : "Gửi yêu cầu"}
                </button>
              </div>
            </div>
          )}
        </div>
  );
}
