import { useState, useEffect, useRef, useCallback } from "react";
import {
  AlertTriangle,
  X,
  MapPin,
  Phone,
  Clock,
  CheckCircle2,
  Navigation,
  ChevronRight,
  Star,
  Shield,
  Radio,
  XCircle,
  PhoneCall,
} from "lucide-react";
import { useApp } from "../../context/useApp";
import { useGPS } from "../../hooks/useGPS";
import { getCompanies, getNearbyCompanies, getCompanyServices } from "../../api/companies";
import { createRequest, updateRequestStatus } from "../../api/requests";
import { calculateDistance } from "../../utils/gpsUtils";

/* ─── Constants ──────────────────────────────────────── */
const ISSUE_TYPES = [
  {
    id: "accident",
    label: "Tai nạn / Hỏng nặng",
    emoji: "🚨",
    color: "text-red-600",
    bg: "bg-red-50 border-red-200 hover:border-red-400",
    urgency: "critical",
  },
  {
    id: "tire",
    label: "Nổ lốp / Thủng lốp",
    emoji: "🔧",
    color: "text-orange-600",
    bg: "bg-orange-50 border-orange-200 hover:border-orange-400",
    urgency: "high",
  },
  {
    id: "fuel",
    label: "Hết xăng / Chết máy",
    emoji: "⛽",
    color: "text-yellow-600",
    bg: "bg-yellow-50 border-yellow-200 hover:border-yellow-400",
    urgency: "medium",
  },
  {
    id: "battery",
    label: "Hết bình ắc quy",
    emoji: "🔋",
    color: "text-pink-600",
    bg: "bg-pink-50 border-pink-200 hover:border-pink-400",
    urgency: "medium",
  },
];

const URGENCY_LABELS = {
  critical: { label: "Khẩn cấp", color: "text-red-600 bg-red-100" },
  high: { label: "Ưu tiên cao", color: "text-orange-600 bg-orange-100" },
  medium: { label: "Bình thường", color: "text-pink-600 bg-pink-100" },
};

function parseGeoJsonPoint(geoJson) {
  if (!geoJson) return null;
  try {
    const parsed = typeof geoJson === "string" ? JSON.parse(geoJson) : geoJson;
    if (parsed?.type === "Point" && Array.isArray(parsed.coordinates) && parsed.coordinates.length >= 2) {
      const [lng, lat] = parsed.coordinates;
      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        return { lat, lng };
      }
    }
  } catch (err) {
    console.warn(err);
  }
  return null;
}

function getDistanceFromLocation(company, coords) {
  const point = parseGeoJsonPoint(company.absolute_address);
  if (!point || !coords) return null;
  return calculateDistance(coords.latitude, coords.longitude, point.lat, point.lng);
}

/* ─── Sub-components ─────────────────────────────────── */
function PulseRing({ delay = 0 }) {
  return (
    <span
      className="absolute inset-0 rounded-full bg-red-400 animate-ping opacity-30"
      style={{ animationDelay: `${delay}ms` }}
    />
  );
}

function LocatingStep() {
  return (
    <div className="flex flex-col items-center py-8 gap-6">
      <div className="relative w-24 h-24 flex items-center justify-center">
        {[0, 400, 800].map((d) => (
          <PulseRing key={d} delay={d} />
        ))}
        <div className="relative w-20 h-20 rounded-full bg-linear-to-br from-pink-500 to-red-500 flex items-center justify-center shadow-xl">
          <Navigation size={32} className="text-white animate-bounce" />
        </div>
      </div>
      <div className="text-center">
        <h3 className="text-lg font-bold text-gray-800 mb-1">Đang xác định vị trí...</h3>
        <p className="text-sm text-gray-500">GPS đang quét vị trí của bạn</p>
      </div>
      <div className="w-full max-w-xs bg-gray-100 rounded-full h-2 overflow-hidden">
        <div className="h-full bg-linear-to-r from-pink-500 to-red-500 rounded-full animate-[loading_1.8s_ease-in-out_infinite]" />
      </div>
      <div className="flex gap-2 text-xs text-gray-400">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          GPS
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-pink-400 animate-pulse" style={{ animationDelay: "200ms" }} />
          Mạng
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" style={{ animationDelay: "400ms" }} />
          Dịch vụ
        </span>
      </div>
    </div>
  );
}

/* ─── Main Component ─────────────────────────────────── */
export function EmergencySOS() {
  const { emergencyOpen, setEmergencyOpen, currentUser } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState("idle");
  const [location, setLocation] = useState("");
  const [gpsCoords, setGpsCoords] = useState(null);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [contactInfo, setContactInfo] = useState({
    name: "",
    phone: "",
    contactBackNow: true,
  });
  const [nearbyCompanies, setNearbyCompanies] = useState([]);
  const [etaSeconds, setEtaSeconds] = useState(0);
  const [initialEtaSeconds, setInitialEtaSeconds] = useState(0);
  const [requestId, setRequestId] = useState("");
  const [creatingRequest, setCreatingRequest] = useState(false);
  const [gpsError, setGpsError] = useState(null);
  const timerRef = useRef(null);

  const { getCurrentLocation, error: gpsHookError } = useGPS();

  const openSOS = useCallback(() => {
    setIsOpen(true);
    setStep("locating");
    setLocation("");
    setGpsCoords(null);
    setSelectedIssue(null);
    setSelectedCompany(null);
    setContactInfo({
      name: currentUser?.name ?? "",
      phone: currentUser?.phone ?? "",
      contactBackNow: true,
    });
    setNearbyCompanies([]);
    setEtaSeconds(0);
    setInitialEtaSeconds(0);
    setRequestId("");
    setGpsError(null);
    setCreatingRequest(false);
  }, [currentUser?.name, currentUser?.phone]);

  const closeSOS = useCallback(() => {
    setIsOpen(false);
    setStep("idle");
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  /* Sync with context */
  useEffect(() => {
    if (emergencyOpen && !isOpen) {
      openSOS();
      setEmergencyOpen(false);
    }
  }, [emergencyOpen, isOpen, openSOS, setEmergencyOpen]);

  /* ── Real GPS Location ── */
  useEffect(() => {
    if (step === "locating") {
      setGpsError(null);
      
      const getLocationAndNearby = async () => {
        try {
          const coords = await getCurrentLocation();
          setGpsCoords(coords);
          setLocation(coords.fullAddress || coords.address || `${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}`);

          const response = await getNearbyCompanies(
            coords.latitude,
            coords.longitude,
            15
          );

          let companyRows = response.data ?? [];

          if (companyRows.length === 0) {
            const allCompanies = await getCompanies();
            companyRows = (Array.isArray(allCompanies) ? allCompanies : [])
              .map((company) => {
                const distanceKm = getDistanceFromLocation(company, coords);
                if (!Number.isFinite(distanceKm)) return null;
                return {
                  ...company,
                  distance_km: distanceKm,
                };
              })
              .filter(Boolean)
              .sort((a, b) => Number(a.distance_km) - Number(b.distance_km))
              .slice(0, 5);
          }

          const companiesWithServices = await Promise.all(
            companyRows.map(async (c) => {
              const distanceKm = Number(c.distance_km ?? c.distance ?? 0);
              const responseTime = Math.max(5, Math.round(distanceKm * 4 + 8));

              try {
                const services = await getCompanyServices(c.company_id).catch(() => []);
                return {
                  ...c,
                  company_id: c.company_id,
                  company_name: c.company_name,
                  company_phone: c.company_phone,
                  distance: distanceKm,
                  name: c.company_name,
                  phone: c.company_phone,
                  verified: !!c.is_verified,
                  responseTime,
                  rating: Number(c.average_rating ?? c.rating ?? 0),
                  reviewCount: Number(c.review_count ?? c.total_reviews ?? 0),
                  services: Array.isArray(services) ? services.map((s) => s.service_name) : [],
                  serviceDetails: Array.isArray(services)
                    ? services.map((s) => ({
                        service_id: s.service_id,
                        service_name: s.service_name,
                        service_price: Number(s.service_price),
                      }))
                    : [],
                };
              } catch {
                return {
                  ...c,
                  company_id: c.company_id,
                  company_name: c.company_name,
                  company_phone: c.company_phone,
                  name: c.company_name,
                  phone: c.company_phone,
                  verified: !!c.is_verified,
                  distance: distanceKm,
                  responseTime,
                  rating: 0,
                  reviewCount: 0,
                  services: [],
                  serviceDetails: [],
                };
              }
            })
          );

          setNearbyCompanies(companiesWithServices);

          setStep("select_issue");
        } catch (error) {
          console.error("GPS Error:", error);
          setGpsError(error instanceof Error ? error.message : "Không thể xác định vị trí");
          setLocation("Không thể xác định vị trí");
          setNearbyCompanies([]);
          setStep("select_issue");
        }
      };

      getLocationAndNearby();
    }
  }, [step, getCurrentLocation]);

  /* ── Countdown Timer ── */
  useEffect(() => {
    if (step === "tracking" && etaSeconds > 0) {
      timerRef.current = setInterval(() => {
        setEtaSeconds((s) => {
          if (s <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [step, etaSeconds]);

  const handleSelectIssue = (issue) => {
    setSelectedIssue(issue);
    setStep("select_company");
  };

  const findServiceForIssue = (company, issue) => {
    const keywords = {
      accident: ["tai nạn", "kéo", "cẩu", "hỗ trợ"],
      tire: ["lốp", "vá", "thay lốp"],
      fuel: ["nhiên liệu", "xăng", "chết máy", "sửa chữa"],
      battery: ["ắc quy", "ac quy", "điện", "sửa chữa"],
    };
    const list = keywords[issue?.id] ?? [];
    return (
      company.serviceDetails?.find((service) =>
        list.some((keyword) => service.service_name?.toLowerCase().includes(keyword))
      ) ??
      company.serviceDetails?.[0] ??
      null
    );
  };

  const handleSelectCompany = async (company) => {
    if (!gpsCoords) {
      setGpsError("Không có tọa độ GPS để tạo yêu cầu.");
      return;
    }
    if (!contactInfo.name.trim() || !contactInfo.phone.trim()) {
      setGpsError("Vui lòng nhập tên và số điện thoại để công ty liên hệ lại.");
      return;
    }

    setCreatingRequest(true);
    try {
      const matchedService = findServiceForIssue(company, selectedIssue);
      const created = await createRequest({
        user_id: currentUser?.role === "user" ? Number(currentUser.id) : null,
        company_id: company.company_id,
        absolute_location: {
          lat: gpsCoords.latitude,
          lng: gpsCoords.longitude,
        },
        relative_location: location,
        request_description: selectedIssue?.label ?? "Yêu cầu cứu hộ khẩn cấp",
        issue_type: selectedIssue?.id ?? null,
        contact_name: contactInfo.name.trim() || currentUser?.name || null,
        contact_phone: contactInfo.phone.trim() || currentUser?.phone || null,
        contact_back_now: contactInfo.contactBackNow,
        priority: selectedIssue?.urgency === "critical" ? "emergency" : "critical",
        service_id: matchedService?.service_id ?? null,
        service_quantity: 1,
        service_price:
          matchedService && Number.isFinite(matchedService.service_price)
            ? matchedService.service_price
            : null,
      });

      setSelectedCompany(company);
      const eta = Math.max(5, Number(company.responseTime ?? 5)) * 60;
      setEtaSeconds(eta);
      setInitialEtaSeconds(eta);
      setRequestId(String(created.request_id));
      setStep("tracking");
    } catch (error) {
      console.error("Không thể tạo yêu cầu SOS:", error);
      setGpsError(error instanceof Error ? error.message : "Không thể tạo yêu cầu SOS");
    } finally {
      setCreatingRequest(false);
    }
  };

  const handleCancel = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (requestId) {
      try {
        await updateRequestStatus(requestId, "cancelled", {
          cancelled_by: "user",
          cancel_reason: "User cancelled SOS request",
          changed_by: "user",
        });
      } catch (error) {
        console.error("Không thể hủy yêu cầu SOS:", error);
      }
    }
    setStep("cancelled");
    setTimeout(closeSOS, 1800);
  };

  /* ─ Format ETA ─ */
  const formatEta = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    if (m === 0) return `${s} giây`;
    return `${m} phút ${s.toString().padStart(2, "0")} giây`;
  };

  const etaMinutes = Math.ceil(etaSeconds / 60);

  /* ─ Progress % for tracking bar ─ */
  const totalEta = initialEtaSeconds || (selectedCompany ? selectedCompany.responseTime * 60 : etaSeconds);
  const progress = totalEta > 0 ? Math.min(100, ((totalEta - etaSeconds) / totalEta) * 100) : 100;
  const showGpsNotice = Boolean(gpsError || gpsHookError);

  return (
    <>
      {/* ── Floating SOS Button ── */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
        {/* Tooltip label */}
        {!isOpen && (
          <div className="bg-gray-900 text-white text-xs px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none select-none shadow-lg whitespace-nowrap hidden sm:block" style={{ opacity: 0.85 }}>
            🚨 Gọi cứu hộ khẩn cấp
          </div>
        )}

        {!isOpen && (
          <button
            onClick={openSOS}
            className="group relative w-20 h-20 rounded-full flex items-center justify-center shadow-2xl focus:outline-none focus-visible:ring-4 focus-visible:ring-red-400"
            aria-label="Gọi cứu hộ khẩn cấp SOS"
          >
            {/* Pulsing rings */}
            <span className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-25" />
            <span className="absolute inset-0 rounded-full bg-red-400 animate-ping opacity-15" style={{ animationDelay: "300ms" }} />
            {/* Main circle */}
            <span className="relative w-full h-full rounded-full bg-linear-to-br from-red-500 to-pink-600 flex items-center justify-center shadow-xl hover:scale-110 transition-transform duration-200">
              <span className="text-white font-black text-2xl tracking-widest select-none">SOS</span>
            </span>
          </button>
        )}
      </div>

      {/* ── Modal Overlay ── */}
      {isOpen && (
        <div className="fixed inset-0 z-100 flex items-end sm:items-center justify-center p-0 sm:p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => step !== "tracking" && closeSOS()}
          />

          {/* Modal Card */}
          <div className="relative w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden animate-[slideUp_0.35s_ease-out]">
            {/* Header */}
            <div className="relative bg-linear-to-r from-red-500 via-pink-500 to-red-400 px-6 pt-6 pb-5 text-white">
              {/* Decorative blobs */}
              <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/10 rounded-full" />
              <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-white/10 rounded-full" />

              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
                    <AlertTriangle size={20} className="text-white" />
                  </div>
                  <div>
                    <h2 className="font-black text-lg tracking-wide leading-none">🚨 CỨU HỘ KHẨN CẤP</h2>
                    <p className="text-red-100 text-xs mt-0.5">
                      {step === "locating" && "Đang xác định vị trí GPS..."}
                      {step === "select_issue" && "Chọn loại sự cố của bạn"}
                      {step === "select_company" && "Chọn đơn vị cứu hộ gần nhất"}
                      {step === "tracking" && `Mã yêu cầu: ${requestId}`}
                      {step === "cancelled" && "Yêu cầu đã hủy"}
                    </p>
                  </div>
                </div>
                {step !== "tracking" ? (
                  <button
                    onClick={closeSOS}
                    className="flex items-center gap-1 rounded-full bg-white/20 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-white/30"
                  >
                    <X size={14} className="text-white" />
                    Thoát
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={closeSOS}
                      className="flex items-center gap-1 rounded-full bg-white/20 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-white/30"
                    >
                      <X size={14} />
                      Thoát
                    </button>
                    <button
                      onClick={handleCancel}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/20 hover:bg-white/30 transition-colors text-white text-xs font-medium"
                    >
                      <XCircle size={14} />
                      Hủy
                    </button>
                  </div>
                )}
              </div>

              {/* Location bar */}
              {(step === "select_issue" || step === "select_company" || step === "tracking") && location && (
                <div className="relative mt-4 flex items-center gap-2 bg-white/15 backdrop-blur rounded-xl px-3 py-2">
                  <MapPin size={14} className="text-white shrink-0" />
                  <span className="text-xs text-white/90 truncate">{location}</span>
                  <span className="ml-auto text-[10px] text-green-300 font-medium shrink-0 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                    GPS Live
                  </span>
                </div>
              )}

              {/* GPS Error Notice */}
              {showGpsNotice && (
                <div className="relative mt-3 mx-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-xs text-yellow-700">
                    <span className="font-semibold">Lưu ý:</span> Không thể xác định vị trí chính xác. Sử dụng danh sách công ty gần nhất.
                  </p>
                </div>
              )}
            </div>

            {/* Body */}
            <div className="max-h-[70vh] overflow-y-auto">
              {/* ── Step: Locating ── */}
              {step === "locating" && (
                <div>
                  <LocatingStep />
                  <div className="px-5 pb-5">
                    <button
                      onClick={closeSOS}
                      className="w-full rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
                    >
                      Thoát về màn hình chính
                    </button>
                  </div>
                </div>
              )}

              {/* ── Step: Select Issue ── */}
              {step === "select_issue" && (
                <div className="p-5">
                  <p className="text-sm text-gray-500 mb-4 text-center">
                    Bạn đang gặp sự cố gì? Chọn để hệ thống ưu tiên cứu hộ phù hợp
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {ISSUE_TYPES.map((issue) => (
                      <button
                        key={issue.id}
                        onClick={() => handleSelectIssue(issue)}
                        className={`relative p-4 rounded-2xl border-2 text-left transition-all hover:scale-[1.02] active:scale-[0.98] ${issue.bg}`}
                      >
                        <span className="text-3xl mb-2 block">{issue.emoji}</span>
                        <p className={`text-sm font-semibold leading-tight ${issue.color}`}>
                          {issue.label}
                        </p>
                        <span
                          className={`absolute top-2 right-2 text-[10px] px-1.5 py-0.5 rounded-full font-medium ${URGENCY_LABELS[issue.urgency].color}`}
                        >
                          {URGENCY_LABELS[issue.urgency].label}
                        </span>
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={closeSOS}
                    className="mt-4 w-full py-2.5 rounded-xl border border-gray-200 text-sm text-gray-500 hover:bg-gray-50 transition-colors"
                  >
                    Thoát về màn hình chính
                  </button>
                </div>
              )}

              {/* ── Step: Select Company ── */}
              {step === "select_company" && (
                <div className="p-5">
                  {/* Selected issue chip */}
                  {selectedIssue && (
                    <div className="flex items-center gap-2 mb-4 bg-pink-50 border border-pink-200 rounded-xl px-3 py-2">
                      <span>{selectedIssue.emoji}</span>
                      <span className="text-sm font-medium text-pink-700">{selectedIssue.label}</span>
                      <button
                        onClick={() => setStep("select_issue")}
                        className="ml-auto text-xs text-pink-400 hover:text-pink-600"
                      >
                        Đổi
                      </button>
                    </div>
                  )}

                  <div className="mb-4 rounded-2xl border border-red-100 bg-red-50 p-3">
                    <div className="grid grid-cols-1 gap-2">
                      <input
                        type="text"
                        value={contactInfo.name}
                        onChange={(e) => setContactInfo((prev) => ({ ...prev, name: e.target.value }))}
                        placeholder="Tên người cần hỗ trợ"
                        className="w-full rounded-xl border border-red-100 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-100"
                      />
                      <input
                        type="tel"
                        value={contactInfo.phone}
                        onChange={(e) => setContactInfo((prev) => ({ ...prev, phone: e.target.value }))}
                        placeholder="Số điện thoại liên hệ ngay"
                        className="w-full rounded-xl border border-red-100 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-100"
                      />
                      <label className="flex items-center gap-2 text-xs font-medium text-red-700">
                        <input
                          type="checkbox"
                          checked={contactInfo.contactBackNow}
                          onChange={(e) =>
                            setContactInfo((prev) => ({
                              ...prev,
                              contactBackNow: e.target.checked,
                            }))
                          }
                          className="h-4 w-4 accent-red-500"
                        />
                        Yêu cầu công ty liên hệ lại ngay lập tức
                      </label>
                    </div>
                  </div>

                  <p className="text-sm text-gray-500 mb-3 text-center">
                    <span className="inline-flex items-center gap-1 text-green-600 font-medium">
                      <Radio size={13} className="animate-pulse" />
                      {nearbyCompanies.length} đơn vị sẵn sàng gần bạn
                    </span>
                  </p>

                  <div className="space-y-3">
                    {nearbyCompanies.length === 0 && (
                      <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-700">
                        Chưa tìm thấy đơn vị cứu hộ gần vị trí hiện tại. Vui lòng thử lại hoặc gọi hotline.
                      </div>
                    )}
                    {nearbyCompanies.map((company, idx) => (
                      <button
                        key={company.company_id}
                        disabled={creatingRequest}
                        onClick={() => handleSelectCompany(company)}
                        className="w-full text-left bg-white border-2 border-gray-100 hover:border-pink-300 hover:shadow-md rounded-2xl p-4 transition-all active:scale-[0.98] group disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-11 h-11 rounded-xl bg-linear-to-br from-pink-100 to-pink-100 flex items-center justify-center text-xl shrink-0 relative">
                            🚑
                            {idx === 0 && (
                              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                                <span className="text-[9px] text-white font-bold">✓1</span>
                              </span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <span className="font-semibold text-gray-800 text-sm truncate group-hover:text-pink-600 transition-colors">
                                {company.name}
                              </span>
                              {company.verified && (
                                <Shield size={12} className="text-pink-400 shrink-0" />
                              )}
                            </div>
                            <div className="flex items-center gap-3 text-xs text-gray-500">
                              <span className="flex items-center gap-0.5">
                                <Star size={11} className="fill-yellow-400 text-yellow-400" />
                                  {company.reviewCount ? company.rating : "Chưa có"}
                              </span>
                              <span className="flex items-center gap-0.5">
                                <MapPin size={11} className="text-pink-400" />
                                  {Number(company.distance).toFixed(1)} km
                              </span>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded-lg">
                              ~{company.responseTime} phút
                            </div>
                            {creatingRequest ? (
                              <span className="text-xs text-gray-400">Đang gửi...</span>
                            ) : (
                              <ChevronRight size={16} className="text-gray-300 mt-1 ml-auto group-hover:text-pink-400 transition-colors" />
                            )}
                          </div>
                        </div>
                        <div className="flex gap-1.5 mt-2.5 flex-wrap">
                          {company.services.slice(0, 3).map((s) => (
                            <span
                              key={s}
                              className="text-[10px] bg-gray-50 text-gray-500 px-2 py-0.5 rounded-full border border-gray-100"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => setStep("select_issue")}
                    className="mt-4 w-full py-2.5 rounded-xl border border-gray-200 text-sm text-gray-500 hover:bg-gray-50 transition-colors"
                  >
                    ← Quay lại
                  </button>
                  <button
                    onClick={closeSOS}
                    className="mt-2 w-full py-2.5 rounded-xl border border-gray-200 text-sm text-gray-500 hover:bg-gray-50 transition-colors"
                  >
                    Thoát về màn hình chính
                  </button>
                </div>
              )}

              {/* ── Step: Tracking ── */}
              {step === "tracking" && selectedCompany && (
                <div className="p-5">
                  {/* Success banner */}
                  <div className="flex flex-col items-center mb-5">
                    <div className="relative w-16 h-16 mb-3">
                      <div className="absolute inset-0 rounded-full bg-green-100 animate-ping opacity-40" />
                      <div className="relative w-full h-full rounded-full bg-green-100 flex items-center justify-center">
                        <CheckCircle2 size={32} className="text-green-500" />
                      </div>
                    </div>
                    <h3 className="font-bold text-gray-800 text-lg">Yêu cầu đã được gửi!</h3>
                    <p className="text-sm text-gray-500 text-center mt-1">
                      Cứu hộ đang trên đường đến chỗ bạn
                    </p>
                  </div>

                  {/* ETA Countdown */}
                  <div className="bg-linear-to-br from-pink-50 to-pink-50 border border-pink-100 rounded-2xl p-4 mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Clock size={12} className="text-pink-400" />
                        Thời gian đến nơi ước tính
                      </span>
                      <span className="text-[10px] text-green-600 bg-green-100 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                        Đang di chuyển
                      </span>
                    </div>
                    <div className="text-3xl font-black text-pink-600 mb-2">
                      {etaSeconds > 0 ? formatEta(etaSeconds) : "Đã đến nơi! 🎉"}
                    </div>
                    {/* Progress bar */}
                    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full bg-linear-to-r from-pink-500 to-pink-400 rounded-full transition-all duration-1000"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    {etaSeconds > 0 && (
                      <p className="text-xs text-gray-400 mt-1 text-right">
                        ~{etaMinutes} phút nữa
                      </p>
                    )}
                  </div>

                  {/* Company info */}
                  <div className="bg-white border border-gray-100 rounded-2xl p-4 mb-4 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-linear-to-br from-pink-100 to-pink-100 flex items-center justify-center text-2xl">
                        🚑
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-800">{selectedCompany.name}</p>
                        <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                          <span className="flex items-center gap-0.5">
                            <Star size={10} className="fill-yellow-400 text-yellow-400" />
                            {selectedCompany.reviewCount ? selectedCompany.rating : "Chưa có"}
                          </span>
                          <span>•</span>
                          <span>{selectedCompany.phone}</span>
                        </div>
                      </div>
                      <a
                        href={`tel:${selectedCompany.phone}`}
                        className="w-10 h-10 rounded-full bg-green-100 hover:bg-green-200 flex items-center justify-center transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <PhoneCall size={18} className="text-green-600" />
                      </a>
                    </div>

                    {selectedIssue && (
                      <div className="mt-3 pt-3 border-t border-gray-50 flex items-center gap-2">
                        <span className="text-lg">{selectedIssue.emoji}</span>
                        <span className="text-sm text-gray-600">{selectedIssue.label}</span>
                        <span
                          className={`ml-auto text-[10px] px-2 py-0.5 rounded-full font-medium ${URGENCY_LABELS[selectedIssue.urgency].color}`}
                        >
                          {URGENCY_LABELS[selectedIssue.urgency].label}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Location */}
                  <div className="flex items-start gap-2 bg-pink-50 border border-pink-100 rounded-xl px-3 py-2.5 mb-5">
                    <MapPin size={14} className="text-pink-500 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-pink-500 font-medium">Vị trí của bạn</p>
                      <p className="text-xs text-gray-600 mt-0.5">{location}</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3">
                    <a
                      href="tel:18006789"
                      className="flex-1 flex items-center justify-center gap-2 bg-linear-to-r from-green-500 to-green-400 text-white py-3 rounded-2xl font-semibold shadow-md hover:shadow-lg transition-shadow text-sm"
                    >
                      <Phone size={16} />
                      Gọi trực tiếp
                    </a>
                    <button
                      onClick={closeSOS}
                      className="flex-1 rounded-2xl border border-gray-200 py-3 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-50"
                    >
                      Thoát
                    </button>
                  </div>

                  <p className="text-center text-[10px] text-gray-400 mt-3">
                    Mã yêu cầu: <strong>{requestId}</strong> • Hotline: 1800 6789 (miễn phí)
                  </p>
                </div>
              )}

              {/* ── Step: Cancelled ── */}
              {step === "cancelled" && (
                <div className="flex flex-col items-center py-10 gap-3">
                  <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
                    <XCircle size={32} className="text-gray-400" />
                  </div>
                  <p className="font-semibold text-gray-700">Yêu cầu đã được hủy</p>
                  <p className="text-sm text-gray-400">Cửa sổ sẽ tự đóng...</p>
                </div>
              )}
            </div>

            {/* Hot-line bar at bottom */}
            {step !== "tracking" && step !== "cancelled" && (
              <div className="px-5 pb-5 pt-1">
                <div className="flex items-center justify-center gap-2 text-xs text-gray-400 border-t border-gray-100 pt-3">
                  <Phone size={12} className="text-pink-400" />
                  Hoặc gọi hotline miễn phí:
                  <a href="tel:18006789" className="font-bold text-pink-600 hover:underline">
                    1800 6789
                  </a>
                  <span className="text-gray-300">•</span>
                  <span className="text-green-500">24/7</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Inline styles for custom keyframes */}
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(40px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)   scale(1); }
        }
        @keyframes loading {
          0%   { width: 0%; margin-left: 0; }
          50%  { width: 60%; margin-left: 20%; }
          100% { width: 0%; margin-left: 100%; }
        }
      `}</style>
    </>
  );
}
