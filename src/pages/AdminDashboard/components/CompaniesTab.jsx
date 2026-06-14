import React, { useMemo, useState } from 'react';
import { useAdminDashboard } from '../AdminDashboardContext';
import { ShieldCheck, ShieldX, Search, Eye, Star, CheckCircle2, Lock, Trash2, Unlock } from "lucide-react";

export default function CompaniesTab() {
  const context = useAdminDashboard();
  const { 
    companies, searchText, setSearchText, handleToggleCompanyVerified, handleLockCompany, handleUnlockCompany, handleDeleteCompany, setSelectedCompany, getCompanyRequestCount
  } = context;
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [page, setPage] = useState(1);
  const pageSize = 6;

  const filteredCompanies = useMemo(() => {
    const keyword = searchText.trim().toLowerCase();
    const rows = companies.filter((c) => {
      const matchesSearch =
        !keyword ||
        c.name.toLowerCase().includes(keyword) ||
        c.operatingArea.toLowerCase().includes(keyword) ||
        c.address.toLowerCase().includes(keyword) ||
        c.phone.toLowerCase().includes(keyword);
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "verified" && c.verified) ||
        (statusFilter === "pending" && !c.verified && !c.locked) ||
        (statusFilter === "locked" && c.locked);
      return matchesSearch && matchesStatus;
    });

    rows.sort((a, b) => {
      if (sortBy === "requests") return getCompanyRequestCount(b.id) - getCompanyRequestCount(a.id);
      if (sortBy === "rating") return (b.rating || 0) - (a.rating || 0);
      return new Date(b.registeredAt || 0) - new Date(a.registeredAt || 0);
    });
    return rows;
  }, [companies, getCompanyRequestCount, searchText, sortBy, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredCompanies.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageCompanies = filteredCompanies.slice((safePage - 1) * pageSize, safePage * pageSize);

  return (
    <div>
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <div className="relative flex-1 max-w-xs">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm công ty..."
                value={searchText}
                onChange={(e) => {
                  setSearchText(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-100"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="verified">Đã xác minh</option>
              <option value="pending">Chờ xác minh</option>
              <option value="locked">Đã khóa</option>
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-100"
            >
              <option value="newest">Mới nhất</option>
              <option value="requests">Nhiều yêu cầu</option>
              <option value="rating">Đánh giá cao</option>
            </select>
          </div>
          <div className="space-y-4">
            {pageCompanies.map((company) => (
                <div key={company.id} className="bg-white rounded-2xl border border-pink-100 p-5">
                  <div className="flex items-start justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                      {company.avatarUrl ? (
                        <img src={company.avatarUrl} alt={company.name} className="h-12 w-12 rounded-2xl object-cover" />
                      ) : (
                        <div className="w-12 h-12 rounded-2xl bg-linear-to-br from-pink-100 to-pink-100 flex items-center justify-center text-2xl">
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
                                : company.locked
                                ? "bg-red-50 text-red-600 border border-red-200"
                                : "bg-yellow-50 text-yellow-600 border border-yellow-200"
                            }`}
                          >
                            {company.verified ? <ShieldCheck size={11} /> : <ShieldX size={11} />}
                            {company.locked ? "Đã khóa" : company.verified ? "Đã xác minh" : "Chờ xác minh"}
                          </span>
                        </div>
                          <p className="text-sm text-gray-500">{company.address}</p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                          <span className="flex items-center gap-1">
                            <Star size={11} className="text-yellow-400" />
                            {company.rating} ({company.totalReviews})
                          </span>
                          <span>GP: {company.license}</span>
                          <span>{getCompanyRequestCount(company.id)} yêu cầu</span>
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
                                className="rounded-full border border-pink-100 bg-pink-50 px-2 py-0.5 text-xs text-pink-600 hover:bg-pink-100"
                              >
                                Tài liệu {index + 1}
                              </a>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {company.locked ? (
                        <button
                          onClick={() => handleUnlockCompany(company)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-green-50 text-green-600 border border-green-200 rounded-xl text-xs font-medium hover:bg-green-100 transition-colors"
                        >
                          <Unlock size={13} />
                          Mở khóa
                        </button>
                      ) : !company.verified && (
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
                          <button
                            onClick={() => handleLockCompany(company)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-500 border border-red-200 rounded-xl text-xs font-medium hover:bg-red-100 transition-colors"
                          >
                            <Lock size={13} />
                            Khóa
                          </button>
                        </>
                      )}
                      {company.verified && !company.locked && (
                        <button
                          onClick={() => handleLockCompany(company)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-yellow-50 text-yellow-600 border border-yellow-200 rounded-xl text-xs font-medium hover:bg-yellow-100 transition-colors"
                        >
                          <Lock size={13} />
                          Khóa
                        </button>
                      )}
                      <button
                        onClick={() => setSelectedCompany(company)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-pink-50 text-pink-600 border border-pink-200 rounded-xl text-xs font-medium hover:bg-pink-100 transition-colors"
                      >
                        <Eye size={13} />
                        Xem
                      </button>
                      <button
                        onClick={() => handleDeleteCompany(company)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-500 border border-red-200 rounded-xl text-xs font-medium hover:bg-red-100 transition-colors"
                      >
                        <Trash2 size={13} />
                        Xóa
                      </button>
                    </div>
                  </div>
                </div>
              ))}
          </div>
          <div className="mt-4 flex items-center justify-between gap-3 text-sm text-gray-500">
            <span>
              Trang {safePage}/{totalPages} · {filteredCompanies.length} kết quả
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                disabled={safePage === 1}
                className="rounded-xl border border-gray-200 px-3 py-2 font-medium text-gray-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Trước
              </button>
              <button
                onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={safePage === totalPages}
                className="rounded-xl border border-gray-200 px-3 py-2 font-medium text-gray-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Sau
              </button>
            </div>
          </div>
        </div>
  );
}
