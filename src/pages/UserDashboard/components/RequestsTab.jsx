import React from 'react';
import { useUserDashboard } from '../UserDashboardContext';
import { Car, Wrench, MapPin, CheckCircle2, Star, ChevronRight } from "lucide-react";

export default function RequestsTab() {
  const context = useUserDashboard();
  const { 
    requests, setActiveTab, setSelectedRequest, setRatingModal, statusConfig, serviceIconMap
  } = context;
  const userRequests = requests;

  return (
    <div className="space-y-4">
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
          ) : (
            userRequests.map((req) => {
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
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star key={s} size={12} className={s <= req.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-200"} />
                            ))}
                          </div>
                        ) : req.status === "completed" ? (
                          <button
                            className="text-xs text-pink-600 font-medium hover:text-pink-700"
                            onClick={(e) => { e.stopPropagation(); setRatingModal({ open: true, requestId: req.id }); }}
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
        </div>
  );
}
