import React from 'react';
import { useCompanyDashboard } from '../CompanyDashboardContext';
import { Clock, Edit, Plus, Trash2 } from "lucide-react";

export default function ServicesTab() {
  const context = useCompanyDashboard();
  const { 
    companyServices, addingServiceOpen, setAddingServiceOpen, addingService, newServiceId, setNewServiceId, newServicePrice, setNewServicePrice, editingServiceId, editingServicePrice, setEditingServicePrice, savingService, availableServices, handleAddService, startEditService, cancelEditService, handleSaveServicePrice, handleDeleteService, formatVnd
  } = context;

  return (
    <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-900">Danh sách dịch vụ</h2>
            <button
              type="button"
              onClick={() => setAddingServiceOpen((v) => !v)}
              className="flex items-center gap-1.5 bg-pink-500 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-pink-600 transition-colors"
            >
              <Plus size={16} />
              Thêm dịch vụ
            </button>
          </div>

          {addingServiceOpen && (
            <div className="bg-white rounded-2xl border border-pink-100 p-5 mb-4">
              <h3 className="font-semibold text-gray-800 mb-3">Thêm dịch vụ mới</h3>
              <div className="grid md:grid-cols-3 gap-3">
                <div className="md:col-span-2">
                  <label className="text-xs text-gray-400">Dịch vụ</label>
                  <select
                    value={newServiceId}
                    onChange={(e) => setNewServiceId(e.target.value)}
                    className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100 transition-all bg-white"
                  >
                    <option value="">-- Chọn dịch vụ --</option>
                    {availableServices.map((s) => (
                      <option key={s.service_id} value={String(s.service_id)}>
                        {s.service_name}
                      </option>
                    ))}
                  </select>
                  {availableServices.length === 0 && (
                    <p className="text-xs text-gray-400 mt-1">
                      Công ty đã có tất cả dịch vụ hiện có.
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-xs text-gray-400">Giá (VND)</label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={newServicePrice}
                    onChange={(e) => setNewServicePrice(e.target.value)}
                    className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100 transition-all"
                    placeholder="Ví dụ: 200000"
                  />
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                <button
                  type="button"
                  disabled={addingService || availableServices.length === 0}
                  onClick={handleAddService}
                  className="bg-pink-500 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-pink-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {addingService ? "Đang thêm..." : "Thêm"}
                </button>
                <button
                  type="button"
                  disabled={addingService}
                  onClick={() => {
                    setAddingServiceOpen(false);
                    setNewServiceId("");
                    setNewServicePrice("");
                  }}
                  className="px-4 py-2 rounded-xl text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  Hủy
                </button>
              </div>
            </div>
          )}

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {companyServices.map((s) => (
              <div key={s.service_id} className="bg-white rounded-2xl border border-pink-100 p-5 hover:shadow-md hover:shadow-pink-50 transition-all">
                <div className="flex items-start justify-between">
                  <div className="text-3xl">🛠️</div>
                  <div className="flex gap-1">
                    {String(editingServiceId) === String(s.service_id) ? (
                      <>
                        <button
                          type="button"
                          disabled={savingService}
                          onClick={handleSaveServicePrice}
                          className="px-2 py-1 rounded-lg hover:bg-pink-50 text-pink-600 text-xs font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          {savingService ? "Đang lưu..." : "Lưu"}
                        </button>
                        <button
                          type="button"
                          disabled={savingService}
                          onClick={cancelEditService}
                          className="px-2 py-1 rounded-lg hover:bg-gray-50 text-gray-600 text-xs font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          Hủy
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => startEditService(s)}
                          className="p-1.5 rounded-lg hover:bg-pink-50 text-pink-500 transition-colors"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteService(s)}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
                <h3 className="font-semibold text-gray-800 mt-3 mb-1">{s.service_name}</h3>
                <p className="text-xs text-gray-500 mb-3">{s.service_description ?? ""}</p>
                <div className="flex items-center justify-between text-xs">
                  {String(editingServiceId) === String(s.service_id) ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        step="1000"
                        value={editingServicePrice}
                        onChange={(e) => setEditingServicePrice(e.target.value)}
                        className="w-32 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100 transition-all"
                      />
                      <span className="text-gray-400">VND</span>
                    </div>
                  ) : (
                    <span className="text-pink-600 font-semibold">{formatVnd(s.service_price)}</span>
                  )}
                  <span className="text-gray-400 flex items-center gap-1">
                    <Clock size={11} />
                    
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
  );
}
