import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Plus,
  Clock,
  MapPin,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  Star,
  Phone,
  MessageCircle,
  ChevronRight,
  Car,
  Wrench,
  Fuel,
  Zap,
  AlertTriangle,
  X,
  Camera,
  Navigation,
  Send,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { getCompanies, getCompanyServices, getNearbyCompanies } from "../api/companies";
import { getServices } from "../api/services";
import { createRequest, getRequestServices, getRequests, updateRequestStatus } from "../api/requests";
import { addRequestImage, uploadRequestImageToCloudinary } from "../api/requestImages";
import { toUiCompany, toUiRequest, toUiService } from "../api/mappers";
import { reverseGeocode, formatAddress, calculateDistance, calculateETA } from "../utils/gpsUtils";

const statusConfig = {
  pending: { label: "Chờ tiếp nhận", color: "text-yellow-600 bg-yellow-50 border-yellow-200", icon: <Clock size={14} /> },
  accepted: { label: "Đã tiếp nhận", color: "text-blue-600 bg-blue-50 border-blue-200", icon: <AlertCircle size={14} /> },
  heading: { label: "Đang di chuyển", color: "text-indigo-600 bg-indigo-50 border-indigo-200", icon: <Navigation size={14} /> },
  arrived: { label: "Đã đến nơi", color: "text-cyan-600 bg-cyan-50 border-cyan-200", icon: <MapPin size={14} /> },
  processing: { label: "Đang xử lý", color: "text-purple-600 bg-purple-50 border-purple-200", icon: <Loader2 size={14} className="animate-spin" /> },
  completed: { label: "Hoàn tất", color: "text-green-600 bg-green-50 border-green-200", icon: <CheckCircle2 size={14} /> },
  cancelled: { label: "Đã hủy", color: "text-gray-500 bg-gray-50 border-gray-200", icon: <XCircle size={14} /> },
};

const activeStatuses = new Set(["accepted", "heading", "arrived", "processing"]);

const serviceIconMap = {
  "Vá lốp / Thay lốp": <Wrench size={20} className="text-pink-500" />,
  "Kéo xe / Cẩu xe": <Car size={20} className="text-blue-500" />,
  "Thay / Nạp ắc quy": <Zap size={20} className="text-purple-500" />,
  "Nạp nhiên liệu": <Fuel size={20} className="text-orange-500" />,
  "Sửa chữa tại chỗ": <Wrench size={20} className="text-teal-500" />,
  "Hỗ trợ tai nạn": <AlertTriangle size={20} className="text-red-500" />,
};

const SELECTED_COMPANY_STORAGE_KEY = "auto-sos:selected-company-id";

export default function UserDashboard() {
  const { currentUser, isLoggedIn } = useApp();
  const locationState = useLocation();

  const preselectedCompanyId = useMemo(() => {
    const fromRoute = locationState.state?.preselectedCompanyId;
    if (fromRoute != null) return String(fromRoute);

    if (typeof window !== "undefined") {
      return window.localStorage.getItem(SELECTED_COMPANY_STORAGE_KEY) ?? "";
    }

    return "";
  }, [locationState.state]);

  const preselectedLat = useMemo(() => {
    const value = Number(locationState.state?.preselectedLat);
    return Number.isFinite(value) ? value : undefined;
  }, [locationState.state]);

  const preselectedLng = useMemo(() => {
    const value = Number(locationState.state?.preselectedLng);
    return Number.isFinite(value) ? value : undefined;
  }, [locationState.state]);

  const preselectedAddress = useMemo(() => {
    const value = locationState.state?.preselectedAddress;
    return typeof value === "string" && value.trim() ? value : undefined;
  }, [locationState.state]);

  const userId = useMemo(() => {
    if (!currentUser) return null;
    if (currentUser.role !== "user" && currentUser.role !== "admin") return null;
    const parsed = Number(currentUser.id);
    return Number.isFinite(parsed) ? parsed : null;
  }, [currentUser]);

  const [services, setServices] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [requests, setRequests] = useState([]);
  const [, setLoadingRequests] = useState(false);

  const [activeTab, setActiveTab] = useState("new");
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [newReq, setNewReq] = useState({
    serviceType: "",
    description: "",
    location: "Đường Phạm Văn Đồng, Q. Bình Thạnh, TP.HCM",
    latitude: undefined,
    longitude: undefined,
    step: 1,
    selectedCompanyId: preselectedCompanyId,
    imageUrls: [],
  });
  const [ratingModal, setRatingModal] = useState({ open: false, requestId: "" });
  const [starValue, setStarValue] = useState(0);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const hasAutoGpsTriedRef = useRef(false);
  const imageInputRef = useRef(null);

  const userRequests = requests;

  const tabs = [
    { key: "new", label: "Gửi yêu cầu mới", icon: <Plus size={16} /> },
    { key: "track", label: "Theo dõi", icon: <Navigation size={16} /> },
    { key: "requests", label: "Yêu cầu của tôi", icon: <Car size={16} /> },
  ];

  const activeRequest = userRequests.find((r) => activeStatuses.has(r.status));

  const refreshRequests = async (companyNameById) => {
    if (!userId) {
      setRequests([]);
      return;
    }

    setLoadingRequests(true);
    try {
      const backend = await getRequests({ user_id: userId });

      const mapped = await Promise.all(
        backend.map(async (r) => {
          let serviceType = "";
          let servicePrice = null;
          try {
            const svc = await getRequestServices(r.request_id);
            serviceType = svc.data?.[0]?.service_name ?? "";
            servicePrice = svc.data?.[0]?.service_price ?? null;
          } catch {
            // ignore
          }

          const companyName =
            r.company_id != null ? companyNameById?.get(String(r.company_id)) : undefined;

          return toUiRequest(r, {
            userName: currentUser?.name ?? "",
            userPhone: currentUser?.phone ?? "",
            companyName,
            serviceType,
            servicePrice,
          });
        })
      );

      setRequests(mapped);
    } finally {
      setLoadingRequests(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const [svc, comps] = await Promise.all([getServices(), getCompanies()]);
        if (cancelled) return;

        setServices(svc.map(toUiService));

        const withServices = await Promise.all(
          comps.map(async (c) => {
            try {
              const cs = await getCompanyServices(c.company_id);
              return toUiCompany(c, cs);
            } catch {
              return toUiCompany(c, []);
            }
          })
        );

        if (cancelled) return;
        setCompanies(withServices);
        const mapName = new Map(withServices.map((c) => [c.id, c.name]));
        await refreshRequests(mapName);
      } catch (e) {
        console.error(e);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, isLoggedIn]);

  useEffect(() => {
    if (!preselectedCompanyId) return;

    setActiveTab("new");
    setNewReq((prev) => ({
      ...prev,
      selectedCompanyId: preselectedCompanyId,
      latitude: preselectedLat ?? prev.latitude,
      longitude: preselectedLng ?? prev.longitude,
      location: preselectedAddress ?? prev.location,
      step: 1,
    }));
  }, [preselectedCompanyId, preselectedLat, preselectedLng, preselectedAddress]);

  useEffect(() => {
    if (!newReq.selectedCompanyId || typeof window === "undefined") return;
    window.localStorage.setItem(SELECTED_COMPANY_STORAGE_KEY, String(newReq.selectedCompanyId));
  }, [newReq.selectedCompanyId]);

  useEffect(() => {
    const hasCompany = !!newReq.selectedCompanyId;
    const hasGps = Number.isFinite(newReq.latitude) && Number.isFinite(newReq.longitude);

    if (!hasCompany || hasGps || hasAutoGpsTriedRef.current) return;

    hasAutoGpsTriedRef.current = true;
    void getGpsLocation();
  }, [newReq.selectedCompanyId, newReq.latitude, newReq.longitude]);

  useEffect(() => {
    if (!Number.isFinite(newReq.latitude) || !Number.isFinite(newReq.longitude)) return;

    let cancelled = false;

    (async () => {
      try {
        const nearbyData = await getNearbyCompanies(newReq.latitude, newReq.longitude, 30);
        if (cancelled) return;

        const nearbyDistanceMap = new Map(
          (nearbyData.data ?? []).map((item) => [String(item.company_id), Number(item.distance_km)])
        );

        setCompanies((prev) =>
          prev.map((c) => {
            const d = nearbyDistanceMap.get(String(c.company_id ?? c.id));
            return {
              ...c,
              distance: Number.isFinite(d) ? d : c.distance,
            };
          })
        );
      } catch (error) {
        console.error("Lỗi lấy khoảng cách công ty gần nhất:", error);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [newReq.latitude, newReq.longitude]);

  const requestServiceByName = useMemo(() => {
    const map = new Map();
    for (const s of services) map.set(s.name, s);
    return map;
  }, [services]);

  const selectedCompany = useMemo(
    () => companies.find((c) => String(c.id) === String(newReq.selectedCompanyId)),
    [companies, newReq.selectedCompanyId]
  );

  const selectedCompanyService = useMemo(() => {
    if (!selectedCompany || !newReq.serviceType) return null;
    return selectedCompany.serviceDetails?.find((s) => s.name === newReq.serviceType) ?? null;
  }, [selectedCompany, newReq.serviceType]);

  const availableRequestServices = useMemo(() => {
    const names = new Set((selectedCompany?.serviceDetails ?? []).map((s) => s.name));
    if (names.size === 0) return [];
    return services.filter((s) => names.has(s.name));
  }, [selectedCompany, services]);

  const { latitude, longitude, selectedCompanyId } = newReq;

  const companiesWithDistance = useMemo(() => {
    const sortedByGps = [...companies]
      .map((company) => {
        let distanceKm = Number.isFinite(Number(company.distance)) && Number(company.distance) < 99
          ? Number(company.distance)
          : null;

        if (
          distanceKm == null &&
          Number.isFinite(latitude) &&
          Number.isFinite(longitude) &&
          (Array.isArray(company.absolute_address?.coordinates) ||
            (Number.isFinite(company.lat) && Number.isFinite(company.lng)))
        ) {
          const [lng, lat] = Array.isArray(company.absolute_address?.coordinates)
            ? company.absolute_address.coordinates
            : [company.lng, company.lat];
          if (Number.isFinite(lat) && Number.isFinite(lng)) {
            distanceKm = calculateDistance(latitude, longitude, lat, lng);
          }
        }

        return {
          ...company,
          distanceKm,
          etaMinutes: Number.isFinite(distanceKm) ? calculateETA(distanceKm) : null,
        };
      })
      .sort((a, b) => (a.distanceKm ?? 999) - (b.distanceKm ?? 999));

    if (!selectedCompanyId) return sortedByGps;

    const selectedIndex = sortedByGps.findIndex((c) => String(c.id) === String(selectedCompanyId));
    if (selectedIndex <= 0) return sortedByGps;

    const selectedCompany = sortedByGps[selectedIndex];
    return [selectedCompany, ...sortedByGps.slice(0, selectedIndex), ...sortedByGps.slice(selectedIndex + 1)];
  }, [companies, latitude, longitude, selectedCompanyId]);

  const getGpsLocation = async () => {
    if (!navigator.geolocation) {
      window.alert("Trình duyệt không hỗ trợ GPS.");
      return null;
    }

    setGpsLoading(true);

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };

          let formattedAddress = "Vị trí hiện tại";
          try {
            const geocoded = await reverseGeocode(coords.lat, coords.lng);
            formattedAddress = formatAddress(geocoded.fullAddress, geocoded.address_components);
          } catch (error) {
            console.error("Không thể chuyển tọa độ sang địa chỉ:", error);
          }

          setNewReq((prev) => ({
            ...prev,
            latitude: coords.lat,
            longitude: coords.lng,
            location: formattedAddress,
          }));
          setGpsLoading(false);
          resolve(coords);
        },
        () => {
          window.alert("Không lấy được vị trí GPS. Vui lòng cấp quyền vị trí.");
          setGpsLoading(false);
          resolve(null);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });
  };

  const openImagePicker = () => {
    imageInputRef.current?.click();
  };

  const handleImageSelection = async (event) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";

    if (files.length === 0) return;

    setImageUploading(true);
    try {
      const uploaded = [];

      for (const file of files) {
        if (!file.type.startsWith("image/")) {
          continue;
        }

        const result = await uploadRequestImageToCloudinary(file);
        uploaded.push(result.secureUrl);
      }

      if (uploaded.length > 0) {
        setNewReq((prev) => ({
          ...prev,
          imageUrls: [...prev.imageUrls, ...uploaded],
        }));
      }
    } catch (error) {
      console.error("Không thể tải ảnh lên Cloudinary:", error);
      window.alert(error instanceof Error ? error.message : "Không thể tải ảnh lên");
    } finally {
      setImageUploading(false);
    }
  };

  const removeUploadedImage = (imageUrl) => {
    setNewReq((prev) => ({
      ...prev,
      imageUrls: prev.imageUrls.filter((url) => url !== imageUrl),
    }));
  };

  const submitRequest = async () => {
    if (!isLoggedIn || !userId) {
      window.alert("Vui lòng đăng nhập để gửi yêu cầu.");
      return;
    }

    let lat = newReq.latitude;
    let lng = newReq.longitude;
    if (lat == null || lng == null) {
      const coords = await getGpsLocation();
      if (coords) {
        lat = coords.lat;
        lng = coords.lng;
      }
    }

    if (lat == null || lng == null) {
      return;
    }

    const companyId = newReq.selectedCompanyId ? Number(newReq.selectedCompanyId) : null;
    const pickedService = requestServiceByName.get(newReq.serviceType);
    const serviceId = pickedService ? Number(pickedService.id) : null;

    const created = await createRequest({
      user_id: userId,
      company_id: companyId != null && Number.isFinite(companyId) ? companyId : null,
      absolute_location: { lat, lng },
      relative_location: newReq.location,
      request_description: newReq.description,
      issue_type: newReq.serviceType,
      priority: "normal",
      service_id: Number.isFinite(serviceId) ? serviceId : null,
      service_quantity: 1,
      service_price:
        selectedCompanyService && Number.isFinite(selectedCompanyService.price)
          ? selectedCompanyService.price
          : null,
    });

    if (Array.isArray(newReq.imageUrls) && newReq.imageUrls.length > 0) {
      for (const imageUrl of newReq.imageUrls) {
        try {
          await addRequestImage(created.request_id, { image_url: imageUrl });
        } catch (error) {
          console.error("Không thể lưu ảnh cho yêu cầu:", error);
        }
      }
    }

    const mapName = new Map(companies.map((c) => [c.id, c.name]));
    await refreshRequests(mapName);
  };

  const cancelRequest = async (request) => {
    const reason = window.prompt("Lý do hủy yêu cầu (không bắt buộc):", "");
    try {
      await updateRequestStatus(request.id, "cancelled", {
        cancelled_by: "user",
        cancel_reason: reason || null,
        changed_by: "user",
        note: reason || "User cancelled request",
      });
      const mapName = new Map(companies.map((c) => [c.id, c.name]));
      await refreshRequests(mapName);
      setSelectedRequest((prev) => (prev?.id === request.id ? { ...prev, status: "cancelled" } : prev));
    } catch (e) {
      console.error(e);
      window.alert(e instanceof Error ? e.message : "Hủy yêu cầu thất bại");
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Xin chào, {currentUser?.name ?? ""} 👋</h1>
          <p className="text-gray-500 text-sm mt-1">Quản lý yêu cầu cứu hộ của bạn</p>
        </div>
        {activeRequest && (
          <div className="flex items-center gap-2 bg-purple-50 border border-purple-200 rounded-xl px-4 py-2">
            <Loader2 size={16} className="text-purple-500 animate-spin" />
            <span className="text-sm font-medium text-purple-700">Có yêu cầu đang xử lý</span>
          </div>
        )}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Tổng yêu cầu", value: userRequests.length, color: "from-pink-100 to-pink-50", text: "text-pink-600" },
          { label: "Đang xử lý", value: userRequests.filter((r) => activeStatuses.has(r.status)).length, color: "from-purple-100 to-purple-50", text: "text-purple-600" },
          { label: "Hoàn tất", value: userRequests.filter((r) => r.status === "completed").length, color: "from-green-100 to-green-50", text: "text-green-600" },
          { label: "Đã hủy", value: userRequests.filter((r) => r.status === "cancelled").length, color: "from-gray-100 to-gray-50", text: "text-gray-600" },
        ].map((s, i) => (
          <div key={i} className={`bg-linear-to-br ${s.color} rounded-2xl p-4 border border-white`}>
            <p className="text-xs text-gray-500 mb-1">{s.label}</p>
            <p className={`text-3xl font-bold ${s.text}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-2xl mb-6 w-fit">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              activeTab === t.key
                ? "bg-white text-pink-600 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab: My Requests */}
      {activeTab === "requests" && (
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

                  {req.companyName && (
                    <div className="mt-3 pt-3 border-t border-gray-50 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-xs">🚑</div>
                        {req.companyName}
                        {req.estimatedTime && (
                          <span className="text-xs text-blue-500">· ~{req.estimatedTime} phút</span>
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
      )}

      {/* Tab: New Request */}
      {activeTab === "new" && (
        <div className="bg-white rounded-2xl border border-pink-100 p-6 max-w-2xl">
          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-6">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                    newReq.step >= step
                      ? "bg-linear-to-br from-pink-500 to-pink-400 text-white"
                      : "bg-gray-100 text-gray-400"
                  }`}
                >
                  {newReq.step > step ? <CheckCircle2 size={16} /> : step}
                </div>
                <span className={`text-sm ${newReq.step >= step ? "text-pink-600 font-medium" : "text-gray-400"}`}>
                  {step === 1 ? "Chọn đơn vị" : step === 2 ? "Loại sự cố" : "Thông tin & Vị trí"}
                </span>
                {step < 3 && <div className={`w-8 h-0.5 ${newReq.step > step ? "bg-pink-300" : "bg-gray-200"}`} />}
              </div>
            ))}
          </div>

          {/* Step 1: Choose company */}
          {newReq.step === 1 && (
            <div>
              <h2 className="text-lg font-bold text-gray-800 mb-2">Chọn đơn vị cứu hộ</h2>
              <p className="text-sm text-gray-500 mb-4">
                {Number.isFinite(newReq.latitude) && Number.isFinite(newReq.longitude)
                  ? "Các đơn vị gần bạn nhất (sắp xếp theo GPS):"
                  : "Các đơn vị gần bạn nhất (hãy bấm GPS để sắp xếp chính xác):"}
              </p>
              <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                {companiesWithDistance.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setNewReq({ ...newReq, selectedCompanyId: c.id })}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                      newReq.selectedCompanyId === c.id
                        ? "border-pink-400 bg-pink-50"
                        : "border-gray-100 hover:border-pink-200"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-gray-800">{c.name}</p>
                        <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Star size={11} className="fill-yellow-400 text-yellow-400" />
                            {c.rating}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin size={11} className="text-pink-400" />
                            {Number.isFinite(c.distanceKm) ? `${c.distanceKm.toFixed(1)} km` : "Chưa có dữ liệu"}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock size={11} className="text-blue-400" />
                            {Number.isFinite(c.etaMinutes)
                              ? `~${c.etaMinutes} phút`
                              : Number.isFinite(Number(c.responseTime))
                              ? `~${Number(c.responseTime)} phút`
                              : "Chưa có ETA"}
                          </span>
                        </div>
                      </div>
                      {newReq.selectedCompanyId === c.id && (
                        <CheckCircle2 size={20} className="text-pink-500" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
              <button
                disabled={!newReq.selectedCompanyId}
                onClick={() => setNewReq({ ...newReq, step: 2 })}
                className="mt-6 w-full bg-linear-to-r from-pink-500 to-pink-400 text-white py-3 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-md hover:shadow-pink-200 transition-all"
              >
                Tiếp theo
              </button>
            </div>
          )}

          {/* Step 2: Service type */}
          {newReq.step === 2 && (
            <div>
              <h2 className="text-lg font-bold text-gray-800 mb-4">Chọn loại sự cố</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {availableRequestServices.map((s) => {
                  const companyService = selectedCompany?.serviceDetails?.find((x) => x.name === s.name);
                  const servicePrice =
                    companyService && Number.isFinite(companyService.price)
                      ? `${companyService.price.toLocaleString("vi-VN")}đ`
                      : s.price;
                  return (
                  <button
                    key={s.id}
                    onClick={() => setNewReq({ ...newReq, serviceType: s.name })}
                    className={`p-4 rounded-2xl border-2 text-left transition-all ${
                      newReq.serviceType === s.name
                        ? "border-pink-400 bg-pink-50"
                        : "border-gray-100 hover:border-pink-200 hover:bg-pink-50/50"
                    }`}
                  >
                    <div className="text-2xl mb-2">{s.icon}</div>
                    <p className="text-sm font-medium text-gray-800 leading-tight">{s.name}</p>
                    <p className="text-xs text-gray-400 mt-1">{servicePrice}</p>
                  </button>
                  );
                })}
              </div>
              {availableRequestServices.length === 0 && (
                <div className="rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-700">
                  Công ty này chưa khai báo dịch vụ. Hãy chọn công ty khác hoặc yêu cầu công ty cập nhật dịch vụ.
                </div>
              )}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setNewReq({ ...newReq, step: 1 })}
                  className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition-colors"
                >
                  Quay lại
                </button>
                <button
                  disabled={!newReq.serviceType}
                  onClick={() => setNewReq({ ...newReq, step: 3 })}
                  className="flex-1 bg-linear-to-r from-pink-500 to-pink-400 text-white py-3 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-md hover:shadow-pink-200 transition-all"
                >
                  Tiếp theo
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Details */}
          {newReq.step === 3 && (
            <div>
              <h2 className="text-lg font-bold text-gray-800 mb-4">Mô tả sự cố & Vị trí</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Đơn vị đã chọn
                  </label>
                  <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-2.5 text-sm text-blue-700 font-medium">
                    {companies.find((c) => c.id === newReq.selectedCompanyId)?.name || "Chưa chọn đơn vị"}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Dịch vụ đã chọn
                  </label>
                  <div className="flex items-center gap-2 bg-pink-50 px-4 py-2.5 rounded-xl border border-pink-200">
                    {serviceIconMap[newReq.serviceType]}
                    <span className="text-sm font-medium text-pink-700">{newReq.serviceType}</span>
                    {selectedCompanyService && Number.isFinite(selectedCompanyService.price) && (
                      <span className="ml-auto text-sm font-semibold text-pink-700">
                        {selectedCompanyService.price.toLocaleString("vi-VN")}đ
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Mô tả tình trạng xe <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    placeholder="Ví dụ: Xe bị xì lốp trước bên phải, cần thay lốp dự phòng..."
                    value={newReq.description}
                    onChange={(e) => setNewReq({ ...newReq, description: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100 resize-none"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Vị trí hiện tại <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <MapPin size={16} className="absolute left-3 top-3 text-pink-400" />
                    <input
                      type="text"
                      value={newReq.location}
                      onChange={(e) => setNewReq({ ...newReq, location: e.target.value })}
                      className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={getGpsLocation}
                    disabled={gpsLoading}
                    className="mt-1.5 text-xs text-blue-600 flex items-center gap-1 hover:text-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {gpsLoading ? <Loader2 size={12} className="animate-spin" /> : <Navigation size={12} />}
                    {gpsLoading ? "Đang lấy GPS..." : "Dùng vị trí GPS hiện tại"}
                  </button>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Hình ảnh (không bắt buộc)
                  </label>
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleImageSelection}
                  />
                  <button
                    type="button"
                    onClick={openImagePicker}
                    disabled={imageUploading}
                    className="w-full border-2 border-dashed border-pink-200 rounded-xl py-6 flex flex-col items-center gap-2 text-pink-400 hover:border-pink-400 hover:bg-pink-50 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {imageUploading ? <Loader2 size={24} className="animate-spin" /> : <Camera size={24} />}
                    <span className="text-sm">
                      {imageUploading ? "Đang tải ảnh lên..." : "Chụp hoặc tải ảnh lên"}
                    </span>
                  </button>
                  {newReq.imageUrls.length > 0 && (
                    <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {newReq.imageUrls.map((imageUrl) => (
                        <div key={imageUrl} className="relative rounded-xl overflow-hidden border border-pink-100 bg-pink-50">
                          <img src={imageUrl} alt="Ảnh sự cố" className="h-24 w-full object-cover" />
                          <button
                            type="button"
                            onClick={() => removeUploadedImage(imageUrl)}
                            className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70"
                            aria-label="Xóa ảnh"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => setNewReq({ ...newReq, step: 2 })}
                  className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition-colors"
                >
                  Quay lại
                </button>
                <button
                  disabled={!newReq.selectedCompanyId || !newReq.description || !newReq.location || imageUploading}
                  onClick={() => {
                    submitRequest()
                      .then(() => {
                        const rememberedCompanyId = newReq.selectedCompanyId;
                        setActiveTab("requests");
                        setNewReq({
                          serviceType: "",
                          description: "",
                          location: "Đường Phạm Văn Đồng, Q. Bình Thạnh, TP.HCM",
                          latitude: undefined,
                          longitude: undefined,
                          step: 1,
                          selectedCompanyId: rememberedCompanyId,
                          imageUrls: [],
                        });
                      })
                      .catch((e) => {
                        console.error(e);
                        window.alert(e instanceof Error ? e.message : "Gửi yêu cầu thất bại");
                      });
                  }}
                  className="flex-1 bg-linear-to-r from-pink-500 to-pink-400 text-white py-3 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-md hover:shadow-pink-200 transition-all flex items-center justify-center gap-2"
                >
                  <Send size={16} />
                  Gửi yêu cầu
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab: Track */}
      {activeTab === "track" && (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Request selector */}
          <div>
            <h2 className="font-semibold text-gray-800 mb-3">Chọn yêu cầu để theo dõi</h2>
            <div className="space-y-3">
              {userRequests.filter((r) => r.status !== "completed" && r.status !== "cancelled").length === 0 ? (
                <div className="text-center py-10 bg-white rounded-2xl border border-pink-100">
                  <CheckCircle2 size={40} className="text-green-300 mx-auto mb-3" />
                  <p className="text-gray-400 text-sm">Không có yêu cầu nào đang xử lý</p>
                </div>
              ) : (
                userRequests
                  .filter((r) => r.status !== "completed" && r.status !== "cancelled")
                  .map((req) => {
                    const status = statusConfig[req.status] ?? statusConfig.pending;
                    return (
                      <button
                        key={req.id}
                        onClick={() => setSelectedRequest(req)}
                        className={`w-full text-left p-4 rounded-2xl border-2 transition-all ${
                          selectedRequest?.id === req.id
                            ? "border-pink-400 bg-pink-50"
                            : "border-gray-100 bg-white hover:border-pink-200"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-800 text-sm">{req.serviceType}</p>
                            <p className="text-xs text-gray-500 mt-0.5">{new Date(req.createdAt).toLocaleDateString("vi-VN")}</p>
                          </div>
                          <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${status.color}`}>
                            {status.label}
                          </span>
                        </div>
                      </button>
                    );
                  })
              )}
            </div>
          </div>

          {/* Request detail */}
          <div>
            {selectedRequest ? (
              <div className="bg-white rounded-2xl border border-pink-100 p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-bold text-gray-900">Chi tiết yêu cầu</h2>
                  <span className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border ${(statusConfig[selectedRequest.status] ?? statusConfig.pending).color}`}>
                    {(statusConfig[selectedRequest.status] ?? statusConfig.pending).icon}
                    {(statusConfig[selectedRequest.status] ?? statusConfig.pending).label}
                  </span>
                </div>

                {/* Timeline */}
                <div className="space-y-3 mb-4">
                  {[
                    { label: "Gửi yêu cầu", done: true, time: new Date(selectedRequest.createdAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }) },
                    { label: "Tiếp nhận bởi " + (selectedRequest.companyName || "..."), done: selectedRequest.status !== "pending", time: selectedRequest.acceptedAt ? new Date(selectedRequest.acceptedAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }) : "" },
                    { label: "Xe cứu hộ đang đến", done: ["heading", "arrived", "processing", "completed"].includes(selectedRequest.status), time: selectedRequest.estimatedTime != null ? `~${selectedRequest.estimatedTime} phút` : "" },
                    { label: "Đã đến hiện trường", done: ["arrived", "processing", "completed"].includes(selectedRequest.status), time: selectedRequest.arrivedAt ? new Date(selectedRequest.arrivedAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }) : "" },
                    { label: "Đang xử lý sự cố", done: ["processing", "completed"].includes(selectedRequest.status), time: "" },
                    { label: "Hoàn tất dịch vụ", done: selectedRequest.status === "completed", time: selectedRequest.status === "completed" ? new Date(selectedRequest.updatedAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }) : "" },
                  ].map((t, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${t.done ? "bg-pink-500" : "bg-gray-200"}`}>
                        {t.done ? <CheckCircle2 size={14} className="text-white" /> : <div className="w-2 h-2 rounded-full bg-gray-400" />}
                      </div>
                      <div>
                        <p className={`text-sm font-medium ${t.done ? "text-gray-800" : "text-gray-400"}`}>{t.label}</p>
                        {t.time && <p className="text-xs text-gray-400">{t.time}</p>}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-2 text-sm pt-4 border-t border-gray-100">
                  <div className="flex gap-2">
                    <MapPin size={14} className="text-pink-400 mt-0.5 shrink-0" />
                    <span className="text-gray-600">{selectedRequest.location}</span>
                  </div>
                  <div className="flex gap-2">
                    <Wrench size={14} className="text-blue-400 mt-0.5 shrink-0" />
                    <span className="text-gray-600">{selectedRequest.serviceType}</span>
                  </div>
                  {selectedRequest.price && (
                    <div className="flex gap-2">
                      <span className="text-xs text-gray-400">💰</span>
                      <span className="text-gray-600 font-semibold">{selectedRequest.price}</span>
                    </div>
                  )}
                </div>

                {/* Review */}
                {selectedRequest.rating && (
                  <div className="mt-4 pt-4 border-t border-gray-100 bg-yellow-50 rounded-xl p-3">
                    <div className="flex items-center gap-1 mb-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} size={14} className={s <= selectedRequest.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-200"} />
                      ))}
                    </div>
                    <p className="text-xs text-gray-600 italic">"{selectedRequest.review}"</p>
                  </div>
                )}

                {/* Actions */}
                {selectedRequest.status !== "completed" && selectedRequest.status !== "cancelled" && (
                  <div className="flex gap-3 mt-4">
                    <button className="flex-1 flex items-center justify-center gap-2 bg-blue-50 text-blue-600 py-2.5 rounded-xl text-sm font-medium hover:bg-blue-100 transition-colors">
                      <MessageCircle size={16} />
                      Nhắn tin
                    </button>
                    <button className="flex-1 flex items-center justify-center gap-2 bg-blue-50 text-blue-600 py-2.5 rounded-xl text-sm font-medium hover:bg-blue-100 transition-colors">
                      <Phone size={16} />
                      Gọi điện
                    </button>
                    {selectedRequest.status === "pending" && (
                      <button
                        onClick={() => cancelRequest(selectedRequest)}
                        className="flex-1 flex items-center justify-center gap-2 bg-red-50 text-red-500 py-2.5 rounded-xl text-sm font-medium hover:bg-red-100 transition-colors"
                      >
                        <XCircle size={16} />
                        Hủy
                      </button>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-pink-100 p-8 text-center">
                <Navigation size={40} className="text-pink-200 mx-auto mb-3" />
                <p className="text-gray-400 text-sm">Chọn một yêu cầu để xem chi tiết và theo dõi trạng thái</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Rating modal */}
      {ratingModal.open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900">Đánh giá dịch vụ</h3>
              <button onClick={() => setRatingModal({ open: false, requestId: "" })} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <div className="flex items-center justify-center gap-2 mb-4">
              {[1, 2, 3, 4, 5].map((s) => (
                <button key={s} onClick={() => setStarValue(s)}>
                  <Star size={32} className={s <= starValue ? "fill-yellow-400 text-yellow-400" : "text-gray-300"} />
                </button>
              ))}
            </div>
            <textarea
              placeholder="Chia sẻ cảm nhận của bạn về dịch vụ..."
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:border-pink-400"
              rows={3}
            />
            <button
              onClick={() => setRatingModal({ open: false, requestId: "" })}
              className="mt-4 w-full bg-linear-to-r from-pink-500 to-pink-400 text-white py-3 rounded-xl font-semibold hover:shadow-md transition-all"
            >
              Gửi đánh giá
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
