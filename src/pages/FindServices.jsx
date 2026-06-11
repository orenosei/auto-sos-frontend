import { useEffect, useState, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  MapPin,
  Star,
  Clock,
  Phone,
  Shield,
  Filter,
  ChevronDown,
  CheckCircle2,
  Loader,
  AlertCircle,
} from "lucide-react";
import { getCompanies, getNearbyCompanies } from "../api/companies";
import { getServices } from "../api/services";
import { toUiCompany, toUiService } from "../api/mappers";
import { useGPS } from "../hooks/useGPS";
import { calculateDistance, calculateETA, formatAddress } from "../utils/gpsUtils";
import ServiceMap from "../components/ServiceMap";

export default function FindServices() {
  const [searchText, setSearchText] = useState("");
  const [selectedService, setSelectedService] = useState("Tất cả");
  const [sortBy, setSortBy] = useState("distance");
  const [showFilter, setShowFilter] = useState(false);
  const [useGPSLocation, setUseGPSLocation] = useState(false);

  const [services, setServices] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [displayAddress, setDisplayAddress] = useState("Đang xác định vị trí...");
  const [loadingNearby, setLoadingNearby] = useState(false);

  const { location, fullAddress, addressComponents, loading: gpsLoading, error: gpsError, getCurrentLocation } = useGPS();

  // Tự động quét vị trí ngay khi vào trang
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        await getCurrentLocation();
        if (!cancelled) setUseGPSLocation(true);
      } catch (error) {
        // Không chặn trang nếu user từ chối GPS
        console.error("Không thể tự động lấy vị trí:", error);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [getCurrentLocation]);

  // Lấy danh sách dịch vụ và công ty
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const [svc, comps] = await Promise.all([getServices(), getCompanies()]);
        if (cancelled) return;

        setServices(svc.map(toUiService));

        // Backend now returns services bundled per company as `services`.
        const withServices = comps.map((c) => toUiCompany(c, c.services || []));

        if (!cancelled) setCompanies(withServices);
      } catch (e) {
        console.error(e);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // Lấy vị trí hiện tại khi người dùng nhấn nút
  const handleGetLocation = async () => {
    try {
      setLoadingNearby(true);
      await getCurrentLocation();
      setUseGPSLocation(true);
    } catch (error) {
      console.error("Lỗi lấy vị trí:", error);
    } finally {
      setLoadingNearby(false);
    }
  };

  useEffect(() => {
    if (useGPSLocation && fullAddress) {
      // Format địa chỉ để hiển thị đẹp hơn
      const formatted = formatAddress(fullAddress, addressComponents);
      setDisplayAddress(formatted);
    }
  }, [useGPSLocation, fullAddress, addressComponents]);

  // Xử lý click trên công ty trong bản đồ
  const handleMapCompanyClick = (company) => {
    // Scroll to company in list
    const element = document.getElementById(`company-${company.company_id}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
      element.classList.add("ring-2", "ring-pink-400");
      setTimeout(() => {
        element.classList.remove("ring-2", "ring-pink-400");
      }, 2000);
    }
  };

  // Tìm công ty gần nhất khi có vị trí GPS
  useEffect(() => {
    if (location && useGPSLocation) {
      let cancelled = false;

      (async () => {
        try {
          setLoadingNearby(true);
          const nearbyData = await getNearbyCompanies(location.latitude, location.longitude, 10);
          
          if (cancelled) return;

          const nearbyDistanceMap = new Map(
            (nearbyData.data ?? []).map((item) => [item.company_id, Number(item.distance_km) || 99])
          );

          // Tích hợp distance và sắp xếp gần nhất ngay trong state
          setCompanies((prev) =>
            [...prev]
              .map((c) => ({
                ...c,
                distance: nearbyDistanceMap.has(c.company_id) ? nearbyDistanceMap.get(c.company_id) : 99,
              }))
              .sort((a, b) => (a.distance || 99) - (b.distance || 99))
          );
        } catch (e) {
          console.error("Lỗi lấy công ty gần nhất:", e);
        } finally {
          setLoadingNearby(false);
        }
      })();

      return () => {
        cancelled = true;
      };
    }
  }, [location, useGPSLocation]);

  const serviceOptions = useMemo(() => ["Tất cả", ...services.map((s) => s.name)], [services]);

  const getCompanyDistanceKm = useCallback((company) => {
    const apiDistance = Number(company.distance);
    if (Number.isFinite(apiDistance) && apiDistance < 99) return apiDistance;

    if (!location || !Array.isArray(company.absolute_address?.coordinates)) return null;

    const [lng, lat] = company.absolute_address.coordinates;
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

    return calculateDistance(location.latitude, location.longitude, lat, lng);
  }, [location]);

  const filtered = useMemo(() => {
    const result = companies
      .filter((c) => {
        const matchSearch =
          c.name.toLowerCase().includes(searchText.toLowerCase()) ||
          c.operatingArea.toLowerCase().includes(searchText.toLowerCase());
        const matchService =
          selectedService === "Tất cả" ||
          c.services.some((s) => s.includes(selectedService.split(" ")[0]));
        return matchSearch && matchService;
      })
      .sort((a, b) => {
        if (sortBy === "distance") {
          const da = getCompanyDistanceKm(a) ?? 999;
          const db = getCompanyDistanceKm(b) ?? 999;
          return da - db;
        }
        if (sortBy === "rating") {
          const ra = Number.isFinite(a.rating) ? a.rating : -1;
          const rb = Number.isFinite(b.rating) ? b.rating : -1;
          return rb - ra;
        }
        if (sortBy === "response") {
          const ta = Number.isFinite(a.responseTime) ? a.responseTime : 999;
          const tb = Number.isFinite(b.responseTime) ? b.responseTime : 999;
          return ta - tb;
        }
        return 0;
      });

    return result;
  }, [companies, searchText, selectedService, sortBy, getCompanyDistanceKm]);

  const mapCompanies = useMemo(() => {
    if (!(useGPSLocation && location)) return [];

    const withCoords = filtered.filter(
      (c) => Array.isArray(c.absolute_address?.coordinates) && c.absolute_address.coordinates.length >= 2
    );

    const nearby = withCoords.filter((c) => {
      const d = getCompanyDistanceKm(c);
      return Number.isFinite(d) && d <= 10;
    });

    if (nearby.length > 0) return nearby;

    const knownDistance = withCoords
      .filter((c) => Number.isFinite(getCompanyDistanceKm(c)))
      .sort((a, b) => (getCompanyDistanceKm(a) ?? 999) - (getCompanyDistanceKm(b) ?? 999))
      .slice(0, 20);

    if (knownDistance.length > 0) return knownDistance;

    // Fallback cuối: vẫn hiển thị các công ty có tọa độ để map không rỗng
    return withCoords.slice(0, 20);
  }, [filtered, useGPSLocation, location, getCompanyDistanceKm]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Tìm dịch vụ cứu hộ</h1>
        <p className="text-gray-500">Danh sách các đơn vị cứu hộ xe uy tín gần bạn</p>
      </div>

      {/* Search & Filter bar */}
      <div className="bg-white rounded-2xl border border-pink-100 shadow-sm p-4 mb-6">
        {/* Search row */}
        <div className="mb-3">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm theo tên công ty hoặc khu vực..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100"
            />
          </div>
        </div>

        {/* Location + controls row */}
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1 min-w-0">
            <MapPin size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-pink-400" />
            <input
              type="text"
              placeholder="Vị trí của bạn..."
              value={displayAddress}
              readOnly
              className="w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100 bg-gray-50"
            />
            {loadingNearby && (
              <Loader size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-pink-400 animate-spin" />
            )}
          </div>

          <button
            onClick={handleGetLocation}
            disabled={gpsLoading || loadingNearby}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-pink-500 text-white rounded-xl text-sm hover:bg-pink-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {gpsLoading || loadingNearby ? (
              <Loader size={14} className="animate-spin" />
            ) : (
              <MapPin size={14} />
            )}
            {gpsLoading ? "Đang lấy..." : "Vị trí hiện tại"}
          </button>

          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full appearance-none pl-4 pr-8 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100 cursor-pointer"
            >
              <option value="distance">Gần nhất</option>
              <option value="rating">Đánh giá cao nhất</option>
              <option value="response">Phản hồi nhanh nhất</option>
            </select>
            <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>

          <button
            onClick={() => setShowFilter(!showFilter)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 border border-pink-200 text-pink-600 rounded-xl text-sm hover:bg-pink-50 transition-colors"
          >
            <Filter size={16} />
            Bộ lọc
          </button>
        </div>

        {/* Filter chips */}
        {showFilter && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-500 mb-2 font-medium">Loại dịch vụ:</p>
            <div className="flex flex-wrap gap-2">
              {serviceOptions.map((s) => (
                <button
                  key={s}
                  onClick={() => setSelectedService(s)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    selectedService === s
                      ? "bg-pink-500 text-white shadow-sm"
                      : "bg-gray-100 text-gray-600 hover:bg-pink-100 hover:text-pink-600"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* GPS Error Alert */}
        {gpsError && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle size={16} className="text-red-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm text-red-700 font-medium">Lỗi GPS</p>
              <p className="text-xs text-red-600">{gpsError}</p>
            </div>
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-6 gap-6">
        {/* Company list */}
        <div className="lg:col-span-3 space-y-4">
          <p className="text-sm text-gray-500">
            Tìm thấy <span className="font-semibold text-pink-600">{filtered.length}</span> đơn vị cứu hộ
          </p>
          {filtered.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-pink-100">
              <p className="text-gray-400 text-lg">Không tìm thấy kết quả phù hợp</p>
              <p className="text-gray-300 text-sm mt-1">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
            </div>
          ) : (
            filtered.map((company) => (
              <div
                id={`company-${company.company_id || company.id}`}
                key={company.id}
                className="bg-white rounded-2xl border border-pink-100 p-5 hover:border-pink-300 hover:shadow-lg hover:shadow-pink-50 transition-all"
              >
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-linear-to-br from-pink-100 to-pink-100 flex items-center justify-center text-3xl shrink-0">
                    🚑
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between flex-wrap gap-2">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-gray-900">{company.name}</h3>
                          {company.verified && (
                            <span className="flex items-center gap-1 text-[10px] font-medium text-pink-600 bg-pink-50 px-2 py-0.5 rounded-full">
                              <Shield size={10} />
                              Đã xác minh
                            </span>
                          )}
                        </div>
                        {Number.isFinite(company.rating) ? (
                          <div className="flex items-center gap-1 mt-1">
                            <Star size={14} className="fill-yellow-400 text-yellow-400" />
                            <span className="text-sm font-semibold text-gray-700">{Number(company.rating).toFixed(1)}</span>
                            {Number.isFinite(company.totalReviews) && Number(company.totalReviews) > 0 ? (
                              <span className="text-xs text-gray-400">({Number(company.totalReviews)} đánh giá)</span>
                            ) : null}
                          </div>
                        ) : (
                          <p className="text-xs text-gray-400 mt-1">Chưa có đánh giá</p>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="inline-flex items-center gap-1 text-sm font-medium text-green-600 bg-green-50 px-3 py-1 rounded-full">
                          <MapPin size={12} />
                          {Number.isFinite(getCompanyDistanceKm(company))
                            ? `${(getCompanyDistanceKm(company) ?? 0).toFixed(1)} km`
                            : "Chưa có dữ liệu"}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3 mt-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <MapPin size={12} className="text-pink-400" />
                        {company.address || "Chưa cập nhật địa chỉ"}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={12} className="text-pink-400" />
                        {(() => {
                          const distance = getCompanyDistanceKm(company);
                          const eta = Number.isFinite(distance) ? calculateETA(distance) : null;
                          return eta !== null ? `~${eta} phút` : "Chưa có ETA";
                        })()}
                      </span>
                      <span className="flex items-center gap-1">
                        <Phone size={12} className="text-green-400" />
                        {company.phone || "Chưa cập nhật"}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {company.services.slice(0, 4).map((s) => (
                        <span
                          key={s}
                          className="text-xs bg-pink-50 text-pink-600 px-2 py-0.5 rounded-full border border-pink-100"
                        >
                          {s}
                        </span>
                      ))}
                      {company.services.length > 4 && (
                        <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                          +{company.services.length - 4}
                        </span>
                      )}
                    </div>

                    <div className="flex gap-3 mt-4">
                      <Link
                        to="/dashboard"
                        state={{
                          preselectedCompanyId: company.id,
                          preselectedLat: location?.latitude,
                          preselectedLng: location?.longitude,
                          preselectedAddress: displayAddress,
                        }}
                        className="flex-1 text-center bg-linear-to-r from-pink-500 to-pink-400 text-white text-sm font-medium py-2 rounded-xl hover:shadow-md hover:shadow-pink-200 transition-all"
                      >
                        Gửi yêu cầu
                      </Link>
                      <button className="flex items-center gap-1 px-4 py-2 border border-pink-200 text-pink-600 text-sm rounded-xl hover:bg-pink-50 transition-colors">
                        <Phone size={14} />
                        Gọi ngay
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-3 space-y-5">
          {/* Interactive Map */}
          <ServiceMap
            userLocation={location}
            companies={mapCompanies}
            onCompanyClick={handleMapCompanyClick}
          />

          {/* Quick call */}
          <div className="bg-linear-to-br from-pink-500 to-pink-400 rounded-2xl p-5 text-white">
            <h3 className="font-bold mb-1">Cần hỗ trợ khẩn cấp?</h3>
            <p className="text-pink-100 text-sm mb-3">Gọi hotline miễn phí 24/7</p>
            <a
              href="tel:18006789"
              className="flex items-center justify-center gap-2 bg-white text-pink-600 font-semibold py-2.5 rounded-xl hover:bg-pink-50 transition-colors"
            >
              <Phone size={18} />
              1800 6789
            </a>
          </div>

          {/* Service categories
          <div className="bg-white rounded-2xl border border-pink-100 p-5">
            <h3 className="font-semibold text-gray-800 mb-3">Dịch vụ phổ biến</h3>
            <div className="space-y-2">
              {services.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSelectedService(s.name)}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl text-sm transition-colors ${
                    selectedService === s.name
                      ? "bg-pink-50 text-pink-700"
                      : "hover:bg-gray-50 text-gray-700"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span>{s.icon}</span>
                    {s.name}
                  </span>
                  {selectedService === s.name && (
                    <CheckCircle2 size={16} className="text-pink-500" />
                  )}
                </button>
              ))}
            </div>
          </div> */}
        </div>
      </div>
    </div>
  );
}
