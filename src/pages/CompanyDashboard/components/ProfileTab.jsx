import React from 'react';
import { useCompanyDashboard } from '../CompanyDashboardContext';
import { Camera, Edit, FileUp, MapPin, X } from "lucide-react";
import { updateCompany } from "../../../api/companies";
import { uploadFileToCloudinary } from "../../../api/uploads";
import LocationPickerMap from "../../../components/LocationPickerMap";

export default function ProfileTab() {
  const context = useCompanyDashboard();
  const { 
    updateCurrentUser, companyId, companyProfile, setCompanyName, setCompanyProfile, profileDraft, setProfileDraft, editingProfile, setEditingProfile, savingProfile, setSavingProfile, parseGeoJsonPoint
  } = context;

  const uploadProfileFile = async (file, folder, onDone) => {
    if (!file) return;
    try {
      const uploaded = await uploadFileToCloudinary(file, folder);
      onDone(uploaded.secureUrl);
    } catch (e) {
      console.error(e);
      window.alert(e instanceof Error ? e.message : "Tải tệp thất bại");
    }
  };

  return (
    <div className="max-w-2xl bg-white rounded-2xl border border-pink-100 p-6">
          <h2 className="font-bold text-gray-900 mb-5">Hồ sơ công ty</h2>
          {!profileDraft ? (
            <div className="text-sm text-gray-500">Đang tải hồ sơ...</div>
          ) : (
            <>
              <div className="mb-5 flex items-center gap-4 rounded-2xl border border-pink-50 bg-pink-50/60 p-4">
                {profileDraft.avatar_url ? (
                  <img src={profileDraft.avatar_url} alt="Avatar công ty" className="h-16 w-16 rounded-2xl object-cover" />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-2xl">
                    🚑
                  </div>
                )}
                <div>
                  <p className="text-sm font-semibold text-gray-800">Avatar công ty</p>
                  <label className="mt-2 inline-flex cursor-pointer items-center gap-2 rounded-xl border border-pink-200 bg-white px-3 py-2 text-xs font-medium text-pink-600 hover:bg-pink-50">
                    <Camera size={14} />
                    Tải ảnh mới
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) =>
                        uploadProfileFile(e.target.files?.[0], "rescuesos/avatars", (url) =>
                          setProfileDraft((prev) => ({ ...prev, avatar_url: url }))
                        )
                      }
                    />
                  </label>
                </div>
              </div>

              <div className="space-y-4">
                {[
                  {
                    key: "company_name",
                    label: "Tên công ty",
                    value: profileDraft.company_name,
                    editable: true,
                    required: true,
                  },
                  {
                    key: "company_phone",
                    label: "Số điện thoại",
                    value: profileDraft.company_phone,
                    editable: true,
                    required: true,
                  },
                  {
                    key: "relative_address",
                    label: "Địa chỉ (mô tả)",
                    value: profileDraft.relative_address,
                    editable: true,
                  },
                  {
                    key: "rescue_area",
                    label: "Phạm vi hoạt động",
                    value: profileDraft.rescue_area,
                    editable: true,
                  },
                  {
                    key: "company_license",
                    label: "Số giấy phép",
                    value: profileDraft.company_license,
                    editable: true,
                  },
                  {
                    key: "verified",
                    label: "Trạng thái xác minh",
                    value: companyProfile?.verified ? "✅ Đã được xác minh" : "⏳ Chưa xác minh",
                    editable: false,
                  },
                ].map((field, i) => {
                  const isEditing = !!editingProfile[field.key];
                  const displayValue = field.value ?? "";

                  return (
                    <div
                      key={i}
                      className="flex items-start justify-between gap-4 py-3 border-b border-gray-50 last:border-0"
                    >
                      <div className="flex-1">
                        <p className="text-xs text-gray-400">
                          {field.label}
                          {field.required ? " *" : ""}
                        </p>
                        {field.editable && isEditing ? (
                          <input
                            type="text"
                            value={displayValue}
                            placeholder={field.placeholder}
                            onChange={(e) =>
                              setProfileDraft((prev) => ({
                                ...prev,
                                [field.key]: e.target.value,
                              }))
                            }
                            className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100 transition-all"
                          />
                        ) : (
                          <p className="text-sm font-medium text-gray-800 mt-0.5">
                            {String(displayValue)}
                          </p>
                        )}
                      </div>

                      {field.editable && (
                        <button
                          type="button"
                          onClick={() =>
                            setEditingProfile((prev) => ({
                              ...prev,
                              [field.key]: !prev[field.key],
                            }))
                          }
                          className="text-xs text-pink-600 hover:text-pink-700 flex items-center gap-1 shrink-0"
                        >
                          <Edit size={12} />
                          {isEditing ? "Xong" : "Sửa"}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="mt-5 rounded-2xl border border-pink-100 bg-pink-50/40 p-4">
                <div className="mb-3">
                  <p className="text-sm font-semibold text-gray-800">Vị trí công ty trên bản đồ</p>
                  <p className="text-xs text-gray-500">Nhấp vào bản đồ hoặc dùng vị trí hiện tại để cập nhật điểm cứu hộ.</p>
                </div>
                <LocationPickerMap
                  lat={profileDraft.lat}
                  lng={profileDraft.lng}
                  onPick={(point) =>
                    setProfileDraft((prev) => ({
                      ...prev,
                      lat: String(point.lat),
                      lng: String(point.lng),
                    }))
                  }
                />
                <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                  <MapPin size={12} className="text-pink-500" />
                  {profileDraft.lat && profileDraft.lng
                    ? `${Number(profileDraft.lat).toFixed(5)}, ${Number(profileDraft.lng).toFixed(5)}`
                    : "Chưa chọn vị trí"}
                </div>
              </div>

              <div className="mt-5 rounded-2xl border border-purple-100 bg-purple-50/50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">Tài liệu kiểm duyệt</p>
                    <p className="text-xs text-gray-500">Giấy phép, đăng ký kinh doanh hoặc ảnh giấy tờ liên quan.</p>
                  </div>
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-purple-600 px-3 py-2 text-xs font-semibold text-white hover:bg-purple-700">
                    <FileUp size={14} />
                    Tải lên
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      multiple
                      className="hidden"
                      onChange={async (e) => {
                        const files = Array.from(e.target.files ?? []);
                        for (const file of files) {
                          await uploadProfileFile(file, "rescuesos/company-documents", (url) =>
                            setProfileDraft((prev) => ({
                              ...prev,
                              verification_document_urls: [
                                ...(prev.verification_document_urls ?? []),
                                url,
                              ],
                            }))
                          );
                        }
                      }}
                    />
                  </label>
                </div>
                <div className="mt-3 space-y-2">
                  {(profileDraft.verification_document_urls ?? []).length === 0 ? (
                    <p className="text-xs text-yellow-700">Chưa có tài liệu. Công ty cần tải tài liệu để admin kiểm duyệt.</p>
                  ) : (
                    profileDraft.verification_document_urls.map((url, index) => (
                      <div key={url} className="flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-xs">
                        <a href={url} target="_blank" rel="noreferrer" className="min-w-0 flex-1 truncate text-pink-600 hover:underline">
                          Tài liệu {index + 1}
                        </a>
                        <button
                          type="button"
                          onClick={() =>
                            setProfileDraft((prev) => ({
                              ...prev,
                              verification_document_urls: prev.verification_document_urls.filter((item) => item !== url),
                            }))
                          }
                          className="text-gray-400 hover:text-red-500"
                          aria-label="Xóa tài liệu"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <button
                type="button"
                disabled={savingProfile}
                onClick={async () => {
                  if (!companyId) return;
                  setSavingProfile(true);
                  try {
                    const company_name = profileDraft.company_name.trim();
                    const company_phone = profileDraft.company_phone.trim();
                    if (!company_name) {
                      window.alert("Vui lòng nhập tên công ty");
                      return;
                    }
                    if (!company_phone) {
                      window.alert("Vui lòng nhập số điện thoại");
                      return;
                    }

                    const latRaw = profileDraft.lat.trim();
                    const lngRaw = profileDraft.lng.trim();
                    const lat = latRaw ? Number.parseFloat(latRaw) : null;
                    const lng = lngRaw ? Number.parseFloat(lngRaw) : null;
                    const hasGeo = latRaw.length > 0 || lngRaw.length > 0;
                    if (hasGeo && (!Number.isFinite(lat) || !Number.isFinite(lng))) {
                      window.alert("Tọa độ GPS không hợp lệ (lat/lng)");
                      return;
                    }

                    const updated = await updateCompany(companyId, {
                      company_name,
                      company_phone,
                      avatar_url: profileDraft.avatar_url || null,
                      relative_address: profileDraft.relative_address.trim() || null,
                      rescue_area: profileDraft.rescue_area.trim() || null,
                      company_license: profileDraft.company_license.trim() || null,
                      verification_document_urls: profileDraft.verification_document_urls ?? [],
                      absolute_address:
                        hasGeo && Number.isFinite(lat) && Number.isFinite(lng)
                          ? { lat, lng }
                          : null,
                    });

                    const point = parseGeoJsonPoint(updated.absolute_address);
                    setCompanyName(updated.company_name);
                    setCompanyProfile({
                      address: updated.relative_address ?? "",
                      phone: updated.company_phone,
                      avatarUrl: updated.avatar_url ?? "",
                      rescueArea: updated.rescue_area ?? "",
                      license: updated.company_license ?? "",
                      verificationDocumentUrls: Array.isArray(updated.verification_document_urls)
                        ? updated.verification_document_urls
                        : [],
                      verified: !!updated.is_verified,
                      lat: point.lat != null ? String(point.lat) : "",
                      lng: point.lng != null ? String(point.lng) : "",
                    });
                    setProfileDraft({
                      company_name: updated.company_name ?? "",
                      company_phone: updated.company_phone ?? "",
                      avatar_url: updated.avatar_url ?? "",
                      relative_address: updated.relative_address ?? "",
                      rescue_area: updated.rescue_area ?? "",
                      company_license: updated.company_license ?? "",
                      verification_document_urls: Array.isArray(updated.verification_document_urls)
                        ? updated.verification_document_urls
                        : [],
                      lat: point.lat != null ? String(point.lat) : "",
                      lng: point.lng != null ? String(point.lng) : "",
                    });
                    setEditingProfile({});

                    updateCurrentUser({
                      name: updated.company_name,
                      phone: updated.company_phone,
                      avatar: updated.company_name?.slice(0, 1)?.toUpperCase() || "C",
                      avatarUrl: updated.avatar_url ?? "",
                    });
                    window.alert("Đã lưu hồ sơ công ty");
                  } catch (e) {
                    console.error(e);
                    window.alert(e instanceof Error ? e.message : "Lưu hồ sơ thất bại");
                  } finally {
                    setSavingProfile(false);
                  }
                }}
                className="mt-6 w-full bg-linear-to-r from-pink-500 to-pink-400 text-white py-3 rounded-xl font-semibold hover:shadow-md hover:shadow-pink-200 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {savingProfile ? "Đang lưu..." : "Lưu thay đổi"}
              </button>
            </>
          )}
        </div>
  );
}
