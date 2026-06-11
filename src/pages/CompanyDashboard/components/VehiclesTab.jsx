import React from 'react';
import { useCompanyDashboard } from '../CompanyDashboardContext';
import { Car, Edit, Plus, Trash2 } from "lucide-react";

export default function VehiclesTab() {
  const context = useCompanyDashboard();
  const { 
    vehicles, vehicleFormOpen, setVehicleFormOpen, editingVehicleId, savingVehicle, vehicleDraft, setVehicleDraft, resetVehicleDraft, startEditVehicle, handleSaveVehicle, handleDeleteVehicle
  } = context;

  return (
    <div>
          <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
            <div>
              <h2 className="font-bold text-gray-900">Phương tiện cứu hộ</h2>
              <p className="text-sm text-gray-500">Quản lý xe và thiết bị hỗ trợ dùng khi điều phối yêu cầu</p>
            </div>
            <button
              type="button"
              onClick={() => {
                resetVehicleDraft();
                setVehicleFormOpen((v) => !v);
              }}
              className="flex items-center gap-1.5 bg-pink-500 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-pink-600 transition-colors"
            >
              <Plus size={16} />
              Thêm phương tiện
            </button>
          </div>

          {vehicleFormOpen && (
            <div className="bg-white rounded-2xl border border-pink-100 p-5 mb-4">
              <h3 className="font-semibold text-gray-800 mb-3">
                {editingVehicleId ? "Cập nhật phương tiện" : "Thêm phương tiện mới"}
              </h3>
              <div className="grid md:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400">Biển số *</label>
                  <input
                    value={vehicleDraft.vehicle_license}
                    onChange={(e) => setVehicleDraft((prev) => ({ ...prev, vehicle_license: e.target.value }))}
                    className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100"
                    placeholder="Ví dụ: 30A-12345"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400">Loại xe *</label>
                  <input
                    value={vehicleDraft.vehicle_type}
                    onChange={(e) => setVehicleDraft((prev) => ({ ...prev, vehicle_type: e.target.value }))}
                    className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100"
                    placeholder="Xe kéo, xe kỹ thuật..."
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400">Trạng thái</label>
                  <select
                    value={vehicleDraft.vehicle_status}
                    onChange={(e) => setVehicleDraft((prev) => ({ ...prev, vehicle_status: e.target.value }))}
                    className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100 bg-white"
                  >
                    <option value="available">Sẵn sàng</option>
                    <option value="busy">Đang bận</option>
                    <option value="maintenance">Bảo trì</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-400">Thiết bị đi kèm</label>
                  <input
                    value={vehicleDraft.equipment_description}
                    onChange={(e) => setVehicleDraft((prev) => ({ ...prev, equipment_description: e.target.value }))}
                    className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100"
                    placeholder="Cẩu kéo, kích lốp, bình kích điện..."
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button
                  type="button"
                  disabled={savingVehicle}
                  onClick={handleSaveVehicle}
                  className="bg-pink-500 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-pink-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {savingVehicle ? "Đang lưu..." : editingVehicleId ? "Lưu thay đổi" : "Thêm"}
                </button>
                <button
                  type="button"
                  disabled={savingVehicle}
                  onClick={() => {
                    resetVehicleDraft();
                    setVehicleFormOpen(false);
                  }}
                  className="px-4 py-2 rounded-xl text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Hủy
                </button>
              </div>
            </div>
          )}

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {vehicles.map((vehicle) => {
              const statusMeta =
                vehicle.vehicle_status === "available"
                  ? "bg-green-50 text-green-600 border-green-200"
                  : vehicle.vehicle_status === "busy"
                  ? "bg-purple-50 text-purple-600 border-purple-200"
                  : "bg-yellow-50 text-yellow-600 border-yellow-200";
              const statusLabel =
                vehicle.vehicle_status === "available"
                  ? "Sẵn sàng"
                  : vehicle.vehicle_status === "busy"
                  ? "Đang bận"
                  : "Bảo trì";

              return (
                <div key={vehicle.vehicle_id} className="bg-white rounded-2xl border border-pink-100 p-5 hover:shadow-md hover:shadow-pink-50 transition-all">
                  <div className="flex items-start justify-between gap-3">
                    <div className="w-11 h-11 rounded-xl bg-pink-50 flex items-center justify-center text-pink-500">
                      <Car size={22} />
                    </div>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => startEditVehicle(vehicle)}
                        className="p-1.5 rounded-lg hover:bg-pink-50 text-pink-500 transition-colors"
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteVehicle(vehicle)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  <h3 className="font-semibold text-gray-800 mt-3">{vehicle.vehicle_license}</h3>
                  <p className="text-sm text-gray-500 mt-0.5">{vehicle.vehicle_type}</p>
                  <span className={`inline-flex mt-3 text-xs px-2 py-0.5 rounded-full border ${statusMeta}`}>
                    {statusLabel}
                  </span>
                  {vehicle.equipment_description && (
                    <p className="mt-3 text-xs text-gray-500 leading-relaxed">
                      {vehicle.equipment_description}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          {vehicles.length === 0 && (
            <div className="bg-white rounded-2xl border border-pink-100 p-8 text-center">
              <Car size={40} className="text-pink-200 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">Chưa có phương tiện cứu hộ nào</p>
            </div>
          )}
        </div>
  );
}
