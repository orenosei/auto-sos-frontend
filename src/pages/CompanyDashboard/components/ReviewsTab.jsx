import React, { useMemo, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  MapPin,
  MessageSquareText,
  Search,
  Star,
  Wrench,
} from "lucide-react";
import { useCompanyDashboard } from "../CompanyDashboardContext";

export default function ReviewsTab() {
  const { companyReviews, ratingSummary, requests } = useCompanyDashboard();
  const [starFilter, setStarFilter] = useState("all");
  const [searchText, setSearchText] = useState("");

  const requestById = useMemo(
    () => new Map(requests.map((request) => [String(request.id), request])),
    [requests]
  );

  const distribution = useMemo(
    () =>
      [5, 4, 3, 2, 1].map((rating) => {
        const count = companyReviews.filter(
          (review) => Number(review.review_rating) === rating
        ).length;
        return {
          rating,
          count,
          percent: companyReviews.length
            ? Math.round((count / companyReviews.length) * 100)
            : 0,
        };
      }),
    [companyReviews]
  );

  const filteredReviews = useMemo(() => {
    const keyword = searchText.trim().toLowerCase();
    return companyReviews.filter((review) => {
      const request = requestById.get(String(review.request_id));
      const matchesStar =
        starFilter === "all" || Number(review.review_rating) === Number(starFilter);
      const searchable = [
        review.full_name,
        review.user_name,
        review.review_comment,
        review.request_id,
        request?.serviceType,
        request?.location,
        request?.contactName,
        request?.userName,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return matchesStar && (!keyword || searchable.includes(keyword));
    });
  }, [companyReviews, requestById, searchText, starFilter]);

  const average = Number(ratingSummary.average ?? 0);
  const positiveCount = companyReviews.filter(
    (review) => Number(review.review_rating) >= 4
  ).length;
  const positiveRate = companyReviews.length
    ? Math.round((positiveCount / companyReviews.length) * 100)
    : 0;

  return (
    <div className="space-y-5">
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-pink-100 bg-white p-5">
          <p className="text-sm font-semibold text-gray-700">Điểm đánh giá trung bình</p>
          <div className="mt-3 flex items-end gap-2">
            <span className="text-4xl font-bold text-gray-900">{average.toFixed(1)}</span>
            <span className="mb-1 text-sm text-gray-400">/ 5</span>
          </div>
          <div className="mt-2 flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                size={19}
                className={
                  star <= Math.round(average)
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-gray-200"
                }
              />
            ))}
          </div>
          <p className="mt-2 text-xs text-gray-500">
            Dựa trên {companyReviews.length} đánh giá
          </p>
        </div>

        <div className="rounded-2xl border border-pink-100 bg-white p-5">
          <p className="text-sm font-semibold text-gray-700">Phân bố đánh giá</p>
          <div className="mt-3 space-y-2">
            {distribution.map((item) => (
              <button
                key={item.rating}
                onClick={() => setStarFilter(String(item.rating))}
                className="grid w-full grid-cols-[36px_1fr_42px] items-center gap-2 text-xs"
              >
                <span className="flex items-center gap-1 text-gray-600">
                  {item.rating}
                  <Star size={11} className="fill-yellow-400 text-yellow-400" />
                </span>
                <span className="h-2 overflow-hidden rounded-full bg-gray-100">
                  <span
                    className="block h-full rounded-full bg-yellow-400"
                    style={{ width: `${item.percent}%` }}
                  />
                </span>
                <span className="text-right text-gray-400">{item.count}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-pink-100 bg-white p-5">
          <p className="text-sm font-semibold text-gray-700">Mức độ hài lòng</p>
          <p className="mt-3 text-4xl font-bold text-green-600">{positiveRate}%</p>
          <p className="mt-2 text-xs text-gray-500">Khách hàng đánh giá từ 4 sao trở lên</p>
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-green-50 px-3 py-2 text-xs font-medium text-green-700">
            <CheckCircle2 size={15} />
            {positiveCount}/{companyReviews.length} khách hàng hài lòng
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-pink-100 bg-white p-4 sm:flex-row">
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            placeholder="Tìm khách hàng, dịch vụ, nội dung đánh giá..."
            className="w-full rounded-xl border border-gray-200 py-2.5 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-pink-100"
          />
        </div>
        <select
          value={starFilter}
          onChange={(event) => setStarFilter(event.target.value)}
          className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-100"
        >
          <option value="all">Tất cả số sao</option>
          {[5, 4, 3, 2, 1].map((rating) => (
            <option key={rating} value={rating}>
              {rating} sao
            </option>
          ))}
        </select>
      </div>

      {companyReviews.length === 0 ? (
        <div className="rounded-2xl border border-pink-100 bg-white py-14 text-center">
          <MessageSquareText size={40} className="mx-auto mb-3 text-pink-200" />
          <p className="text-sm text-gray-400">Công ty chưa nhận được đánh giá nào.</p>
        </div>
      ) : filteredReviews.length === 0 ? (
        <div className="rounded-2xl border border-pink-100 bg-white py-12 text-center">
          <Search size={36} className="mx-auto mb-3 text-pink-200" />
          <p className="text-sm text-gray-400">Không tìm thấy đánh giá phù hợp.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReviews.map((review) => {
            const customerName =
              review.full_name || review.user_name || "Khách hàng";
            const request = requestById.get(String(review.request_id));

            return (
              <div
                key={review.review_id}
                className="rounded-2xl border border-pink-100 bg-white p-5"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                  {review.avatar_url ? (
                    <img
                      src={review.avatar_url}
                      alt={customerName}
                      className="h-11 w-11 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-pink-50 font-bold text-pink-600">
                      {customerName.slice(0, 1).toUpperCase()}
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-gray-800">{customerName}</p>
                        <p className="mt-0.5 text-xs text-gray-400">
                          Yêu cầu #{review.request_id}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              size={16}
                              className={
                                star <= Number(review.review_rating)
                                  ? "fill-yellow-400 text-yellow-400"
                                  : "text-gray-200"
                              }
                            />
                          ))}
                        </div>
                        <p className="mt-1 text-[11px] text-gray-400">
                          {new Date(review.reviewed_at).toLocaleString("vi-VN")}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 rounded-xl bg-yellow-50 px-4 py-3">
                      <p className="text-sm leading-relaxed text-gray-700">
                        {review.review_comment || "Khách hàng không để lại nhận xét."}
                      </p>
                    </div>

                    <div className="mt-4 grid gap-2 text-xs text-gray-500 sm:grid-cols-2">
                      <div className="flex items-center gap-2">
                        <Wrench size={14} className="shrink-0 text-pink-400" />
                        <span>{request?.serviceType || "Chưa có thông tin dịch vụ"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CalendarDays size={14} className="shrink-0 text-pink-400" />
                        <span>
                          Hoàn thành:{" "}
                          {request?.completedAt
                            ? new Date(request.completedAt).toLocaleString("vi-VN")
                            : "Chưa có dữ liệu"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 sm:col-span-2">
                        <MapPin size={14} className="shrink-0 text-pink-400" />
                        <span className="truncate">
                          {request?.location || "Chưa có thông tin địa điểm"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
