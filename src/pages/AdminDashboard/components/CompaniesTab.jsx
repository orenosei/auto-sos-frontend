import React from 'react';
import { useAdminDashboard } from '../AdminDashboardContext';
import { ShieldCheck, ShieldX, Search, Eye, Star , CheckCircle2, XCircle} from "lucide-react";

export default function CompaniesTab() {
  const context = useAdminDashboard();
  const { 
    companies, searchText, setSearchText, handleToggleCompanyVerified
  } = context;

  return (
    <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="relative flex-1 max-w-xs">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm công ty..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
              />
            </div>
          </div>
          <div className="space-y-4">
            {companies
              .filter(
                (c) =>
                  c.name.toLowerCase().includes(searchText.toLowerCase()) ||
                  c.operatingArea.toLowerCase().includes(searchText.toLowerCase())
              )
              .map((company) => (
                <div key={company.id} className="bg-white rounded-2xl border border-pink-100 p-5">
                  <div className="flex items-start justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                      {company.avatarUrl ? (
                        <img src={company.avatarUrl} alt={company.name} className="h-12 w-12 rounded-2xl object-cover" />
                      ) : (
                        <div className="w-12 h-12 rounded-2xl bg-linear-to-br from-blue-100 to-pink-100 flex items-center justify-center text-2xl">
                          🚑
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-gray-800">{company.name}</h3>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full flex items-center gap-1 ${
                              company.verified
                                ? "bg-green-50 text-green-600 border border-green-200"
                                : "bg-yellow-50 text-yellow-600 border border-yellow-200"
                            }`}
                          >
                            {company.verified ? <ShieldCheck size={11} /> : <ShieldX size={11} />}
                            {company.verified ? "Đã xác minh" : "Chờ xác minh"}
                          </span>
                        </div>
                          <p className="text-sm text-gray-500">{company.address}</p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                          <span className="flex items-center gap-1">
                            <Star size={11} className="text-yellow-400" />
                            {company.rating} ({company.totalReviews})
                          </span>
                          <span>GP: {company.license}</span>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {company.verificationDocumentUrls.length === 0 ? (
                            <span className="rounded-full border border-red-100 bg-red-50 px-2 py-0.5 text-xs text-red-600">
                              Chưa tải tài liệu kiểm duyệt
                            </span>
                          ) : (
                            company.verificationDocumentUrls.map((url, index) => (
                              <a
                                key={url}
                                href={url}
                                target="_blank"
                                rel="noreferrer"
                                className="rounded-full border border-blue-100 bg-blue-50 px-2 py-0.5 text-xs text-blue-600 hover:bg-blue-100"
                              >
                                Tài liệu {index + 1}
                              </a>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {!company.verified && (
                        <>
                          <button
                            onClick={() => handleToggleCompanyVerified(company)}
                            disabled={company.verificationDocumentUrls.length === 0}
                            className="flex items-center gap-1 px-3 py-1.5 bg-green-500 text-white rounded-xl text-xs font-medium hover:bg-green-600 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                            title={company.verificationDocumentUrls.length === 0 ? "Công ty cần tải tài liệu kiểm duyệt trước" : undefined}
                          >
                            <CheckCircle2 size={13} />
                            Xác minh
                          </button>
                          <button className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-500 border border-red-200 rounded-xl text-xs font-medium hover:bg-red-100 transition-colors">
                            <XCircle size={13} />
                            Từ chối
                          </button>
                        </>
                      )}
                      {company.verified && (
                        <button
                          onClick={() => handleToggleCompanyVerified(company)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-yellow-50 text-yellow-600 border border-yellow-200 rounded-xl text-xs font-medium hover:bg-yellow-100 transition-colors"
                        >
                          <ShieldX size={13} />
                          Bỏ xác minh
                        </button>
                      )}
                      <button className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-600 border border-blue-200 rounded-xl text-xs font-medium hover:bg-blue-100 transition-colors">
                        <Eye size={13} />
                        Xem
                      </button>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
  );
}
