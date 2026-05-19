import React from 'react';
import { useCompanyDashboard } from '../CompanyDashboardContext';
import { Edit } from "lucide-react";
import { updateCompany } from "../../../api/companies";

export default function ProfileTab() {
  const context = useCompanyDashboard();
  const { 
    updateCurrentUser, companyId, companyProfile, setCompanyName, setCompanyProfile, profileDraft, setProfileDraft, editingProfile, setEditingProfile, savingProfile, setSavingProfile, parseGeoJsonPoint
  } = context;

  return (
    <div className="max-w-2xl bg-white rounded-2xl border border-pink-100 p-6">
          <h2 className="font-bold text-gray-900 mb-5">Hồ sơ công ty</h2>
          {!profileDraft ? (
            <div className="text-sm text-gray-500">Đang tải hồ sơ...</div>
          ) : (
            <>
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
                    key: "lat",
                    label: "GPS (lat)",
                    value: profileDraft.lat,
                    editable: true,
                    placeholder: "21.0278",
                  },
                  {
                    key: "lng",
                    label: "GPS (lng)",
                    value: profileDraft.lng,
                    editable: true,
                    placeholder: "105.8342",
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
                            className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
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
                          className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 shrink-0"
                        >
                          <Edit size={12} />
                          {isEditing ? "Xong" : "Sửa"}
                        </button>
                      )}
                    </div>
                  );
                })}
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
                      relative_address: profileDraft.relative_address.trim() || null,
                      rescue_area: profileDraft.rescue_area.trim() || null,
                      company_license: profileDraft.company_license.trim() || null,
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
                      rescueArea: updated.rescue_area ?? "",
                      license: updated.company_license ?? "",
                      verified: !!updated.is_verified,
                      lat: point.lat != null ? String(point.lat) : "",
                      lng: point.lng != null ? String(point.lng) : "",
                    });
                    setProfileDraft({
                      company_name: updated.company_name ?? "",
                      company_phone: updated.company_phone ?? "",
                      relative_address: updated.relative_address ?? "",
                      rescue_area: updated.rescue_area ?? "",
                      company_license: updated.company_license ?? "",
                      lat: point.lat != null ? String(point.lat) : "",
                      lng: point.lng != null ? String(point.lng) : "",
                    });
                    setEditingProfile({});

                    updateCurrentUser({ name: updated.company_name, phone: updated.company_phone });
                    window.alert("Đã lưu hồ sơ công ty");
                  } catch (e) {
                    console.error(e);
                    window.alert(e instanceof Error ? e.message : "Lưu hồ sơ thất bại");
                  } finally {
                    setSavingProfile(false);
                  }
                }}
                className="mt-6 w-full bg-linear-to-r from-blue-500 to-blue-400 text-white py-3 rounded-xl font-semibold hover:shadow-md hover:shadow-blue-200 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {savingProfile ? "Đang lưu..." : "Lưu thay đổi"}
              </button>
            </>
          )}
        </div>
  );
}
