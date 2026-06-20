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
import { useApp } from "../../context/useApp";
import { getCompanies, getCompanyReviews, getCompanyServices, getNearbyCompanies } from "../../api/companies";
import { getServices } from "../../api/services";
import { createRequest, getRequestServices, getRequests, updateRequestStatus } from "../../api/requests";
import { addRequestImage, getRequestImages, uploadRequestImageToCloudinary } from "../../api/requestImages";
import RequestsTab from './components/RequestsTab';
import NewTab from './components/NewTab';
import TrackTab from './components/TrackTab';
import { UserDashboardContext } from "./UserDashboardContext";
import { useToast } from "../../components/ui/toastContext";
import { toUiCompany, toUiRequest, toUiService } from "../../api/mappers";
import { getRequestMessages, addRequestMessage, markMessageSeen } from "../../api/messages";
import { addReview, deleteReview, updateReview } from "../../api/reviews";
import { getVehicles } from "../../api/vehicles";
import { updateUser } from "../../api/users";
import { uploadFileToCloudinary } from "../../api/uploads";
import { reverseGeocode, formatAddress, calculateDistance, calculateETA } from "../../utils/gpsUtils";

const statusConfig = {
  pending: { label: "Chờ tiếp nhận", color: "text-yellow-600 bg-yellow-50 border-yellow-200", icon: <Clock size={14} /> },
  accepted: { label: "Đã tiếp nhận", color: "text-pink-600 bg-pink-50 border-pink-200", icon: <AlertCircle size={14} /> },
  heading: { label: "Đang di chuyển", color: "text-pink-600 bg-pink-50 border-pink-200", icon: <Navigation size={14} /> },
  arrived: { label: "Đã đến nơi", color: "text-pink-600 bg-pink-50 border-pink-200", icon: <MapPin size={14} /> },
  processing: { label: "Đang xử lý", color: "text-purple-600 bg-purple-50 border-purple-200", icon: <Loader2 size={14} className="animate-spin" /> },
  completed: { label: "Hoàn tất", color: "text-green-600 bg-green-50 border-green-200", icon: <CheckCircle2 size={14} /> },
  cancelled: { label: "Đã hủy", color: "text-gray-500 bg-gray-50 border-gray-200", icon: <XCircle size={14} /> },
};

const activeStatuses = new Set(["accepted", "heading", "arrived", "processing"]);

const serviceIconMap = {
  "Vá lốp / Thay lốp": <Wrench size={20} className="text-pink-500" />,
  "Kéo xe / Cẩu xe": <Car size={20} className="text-pink-500" />,
  "Thay / Nạp ắc quy": <Zap size={20} className="text-purple-500" />,
  "Nạp nhiên liệu": <Fuel size={20} className="text-orange-500" />,
  "Sửa chữa tại chỗ": <Wrench size={20} className="text-pink-500" />,
  "Hỗ trợ tai nạn": <AlertTriangle size={20} className="text-red-500" />,
};

const SELECTED_COMPANY_STORAGE_KEY = "rescuesos:selected-company-id";

export default function UserDashboard() {
  const { currentUser, isLoggedIn, updateCurrentUser } = useApp();
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
    note: "",
    location: "Đường Phạm Văn Đồng, Q. Bình Thạnh, TP.HCM",
    latitude: undefined,
    longitude: undefined,
    step: 1,
    selectedCompanyId: preselectedCompanyId,
    imageUrls: [],
  });
  const [ratingModal, setRatingModal] = useState({ open: false, requestId: "" });
  const [companyReviewModal, setCompanyReviewModal] = useState({
    open: false,
    company: null,
    reviews: [],
    loading: false,
  });
  const [starValue, setStarValue] = useState(0);
  const [ratingText, setRatingText] = useState("");
  const [messageOpen, setMessageOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState("");
  const messageTimerRef = useRef(null);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [submittingRequest, setSubmittingRequest] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const toast = useToast();

  const openCompanyReviews = async (company) => {
    setCompanyReviewModal({ open: true, company, reviews: [], loading: true });
    try {
      const reviews = await getCompanyReviews(company.id ?? company.company_id);
      setCompanyReviewModal({ open: true, company, reviews: reviews ?? [], loading: false });
    } catch (e) {
      console.error(e);
      setCompanyReviewModal({ open: true, company, reviews: [], loading: false });
    }
  };

  const openMessageModal = async (req) => {
    setSelectedRequest(req);
    setMessageOpen(true);
    try {
      const msgs = await getRequestMessages(req.id);
      setMessages(msgs);
      // mark company messages as seen
      msgs.forEach((m) => {
        if (m.message_sender === 'company' && !m.is_seen) {
          markMessageSeen(req.id, m.message_id).catch(() => {});
        }
      });
    } catch (e) {
      console.error(e);
    }

    if (messageTimerRef.current) clearInterval(messageTimerRef.current);
    messageTimerRef.current = setInterval(async () => {
      try {
        const msgs = await getRequestMessages(req.id);
        setMessages(msgs);
      } catch (e) {
        console.warn(e);
      }
    }, 3000);
  };

  const closeMessageModal = () => {
    setMessageOpen(false);
    if (messageTimerRef.current) {
      clearInterval(messageTimerRef.current);
      messageTimerRef.current = null;
    }
    setMessageInput("");
  };
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

  const refreshRequests = async (companyById, { silent = false } = {}) => {
    if (!userId) {
      setRequests([]);
      return;
    }

    if (!silent) setLoadingRequests(true);
    try {
      const backend = await getRequests({ user_id: userId });
      const companyIds = [
        ...new Set(
          backend
            .map((request) => request.company_id)
            .filter((id) => id != null)
            .map((id) => String(id))
        ),
      ];
      const reviewRows = (
        await Promise.all(
          companyIds.map(async (companyId) => {
            try {
              return await getCompanyReviews(companyId);
            } catch (err) {
              console.warn(err);
              return [];
            }
          })
        )
      ).flat();
      const reviewByRequestId = new Map(
        reviewRows.map((review) => [String(review.request_id), review])
      );
      const vehicleRows = (
        await Promise.all(
          companyIds.map(async (companyId) => {
            try {
              return await getVehicles(companyId);
            } catch (err) {
              console.warn(err);
              return [];
            }
          })
        )
      ).flat();
      const vehicleById = new Map(
        vehicleRows.map((vehicle) => [String(vehicle.vehicle_id), vehicle])
      );

      const mapped = await Promise.all(
        backend.map(async (r) => {
          let serviceType = "";
          let servicePrice = null;
          let imageUrls = [];
          try {
            const svc = await getRequestServices(r.request_id);
            serviceType = svc.data?.[0]?.service_name ?? "";
            servicePrice = svc.data?.[0]?.service_price ?? null;
          } catch (err) {
            console.warn(err);
          }

          try {
            const images = await getRequestImages(r.request_id);
            imageUrls = (images.data ?? []).map((image) => image.image_url).filter(Boolean);
          } catch (err) {
            console.warn(err);
          }

          const company =
            r.company_id != null ? companyById?.get(String(r.company_id)) : undefined;
          const vehicle =
            r.vehicle_id != null ? vehicleById.get(String(r.vehicle_id)) : undefined;

          return {
            ...toUiRequest(r, {
              userName: currentUser?.name ?? "",
              userPhone: currentUser?.phone ?? "",
              companyName: typeof company === "string" ? company : company?.name,
              companyPhone: company?.phone ?? company?.company_phone ?? "",
              serviceType,
              servicePrice,
              vehicleLicense: vehicle?.vehicle_license ?? "",
              vehicleType: vehicle?.vehicle_type ?? "",
            }),
            imageUrls,
            rating: reviewByRequestId.has(String(r.request_id))
              ? Number(reviewByRequestId.get(String(r.request_id)).review_rating)
              : null,
            review: reviewByRequestId.get(String(r.request_id))?.review_comment ?? "",
            reviewId: reviewByRequestId.get(String(r.request_id))?.review_id ?? null,
            reviewedAt: reviewByRequestId.get(String(r.request_id))?.reviewed_at ?? null,
          };
        })
      );

      setRequests(mapped);
      setSelectedRequest((prev) => {
        if (!prev) return prev;
        return mapped.find((request) => request.id === prev.id) ?? prev;
      });
    } finally {
      if (!silent) setLoadingRequests(false);
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
        const companyMap = new Map(withServices.map((c) => [c.id, c]));
        await refreshRequests(companyMap);
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
    if (!userId || companies.length === 0) return undefined;
    const companyMap = new Map(companies.map((company) => [company.id, company]));
    const timer = window.setInterval(() => {
      refreshRequests(companyMap, { silent: true }).catch((error) => console.warn(error));
    }, 5000);
    return () => window.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, companies]);

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
    if (submittingRequest) return;
    setSubmittingRequest(true);
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

    let created;
    try {
      created = await createRequest({
      user_id: userId,
      company_id: companyId != null && Number.isFinite(companyId) ? companyId : null,
      absolute_location: { lat, lng },
      relative_location: newReq.location,
      request_description: newReq.description,
      request_note: newReq.note,
      issue_type: newReq.serviceType,
      priority: "normal",
      service_id: Number.isFinite(serviceId) ? serviceId : null,
      service_quantity: 1,
      service_price:
        selectedCompanyService && Number.isFinite(selectedCompanyService.price)
          ? selectedCompanyService.price
          : null,
      });
    } catch (err) {
      console.error(err);
      try {
        toast.push({ title: "Gửi thất bại", description: err?.message ?? "Không thể gửi yêu cầu", type: "error" });
      } catch (e) { console.warn(e); }
      setSubmittingRequest(false);
      throw err;
    }
    // success
    try {
      toast.push({ title: "Gửi thành công", description: "Yêu cầu của bạn đã được gửi", type: "success" });
    } catch (e) { console.warn(e); }
    setSubmittingRequest(false);

    if (created && Array.isArray(newReq.imageUrls) && newReq.imageUrls.length > 0) {
      for (const imageUrl of newReq.imageUrls) {
        try {
          await addRequestImage(created.request_id, { image_url: imageUrl });
        } catch (error) {
          console.error("Không thể lưu ảnh cho yêu cầu:", error);
        }
      }
    }

    const companyMap = new Map(companies.map((c) => [c.id, c]));
    await refreshRequests(companyMap);
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
      const companyMap = new Map(companies.map((c) => [c.id, c]));
      await refreshRequests(companyMap);
      setSelectedRequest((prev) => (prev?.id === request.id ? { ...prev, status: "cancelled" } : prev));
    } catch (e) {
      console.error(e);
      window.alert(e instanceof Error ? e.message : "Hủy yêu cầu thất bại");
    }
  };

  const handleUserAvatarUpload = async (file) => {
    if (!file || !userId) return;
    setUploadingAvatar(true);
    try {
      const uploaded = await uploadFileToCloudinary(file, "rescuesos/avatars");
      const updated = await updateUser(userId, { avatar_url: uploaded.secureUrl });
      updateCurrentUser({
        avatar: currentUser?.name?.slice(0, 1)?.toUpperCase() || currentUser?.avatar || "U",
        avatarUrl: updated.avatar_url ?? "",
      });
    } catch (e) {
      console.error(e);
      window.alert(e instanceof Error ? e.message : "Tải avatar thất bại");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleRatingSubmit = async () => {
    const currentRequest = requests.find((request) => request.id === ratingModal.requestId);
    if (!starValue) {
      window.alert("Vui lòng chọn số sao đánh giá.");
      return;
    }

    try {
      const payload = {
        review_rating: starValue,
        review_comment: ratingText,
      };
      if (currentRequest?.reviewId || currentRequest?.rating) {
        await updateReview(ratingModal.requestId, payload);
      } else {
        await addReview(ratingModal.requestId, payload);
      }
    } catch (e) {
      console.error(e);
      window.alert(e instanceof Error ? e.message : "Gửi đánh giá thất bại");
      return;
    }

    setRatingModal({ open: false, requestId: "" });
    setStarValue(0);
    setRatingText("");

    const companyMap = new Map(companies.map((c) => [c.id, c]));
    await refreshRequests(companyMap);
  };

  const openRatingModal = (request) => {
    setStarValue(Number(request?.rating) || 0);
    setRatingText(request?.review ?? "");
    setRatingModal({ open: true, requestId: request?.id ?? "" });
  };

  const handleDeleteReview = async (request) => {
    if (!request?.id || !window.confirm("Bạn có chắc muốn xóa đánh giá này?")) return;
    try {
      await deleteReview(request.id);
      const companyMap = new Map(companies.map((c) => [c.id, c]));
      await refreshRequests(companyMap);
    } catch (error) {
      console.error(error);
      window.alert(error instanceof Error ? error.message : "Xóa đánh giá thất bại");
    }
  };

  const contextValue = {
    currentUser, isLoggedIn, locationState, preselectedCompanyId, preselectedLat, preselectedLng, preselectedAddress, userId, services, setServices, companies, setCompanies, requests, setRequests, setLoadingRequests, activeTab, setActiveTab, selectedRequest, setSelectedRequest, newReq, setNewReq, ratingModal, setRatingModal, companyReviewModal, setCompanyReviewModal, openCompanyReviews, starValue, setStarValue, ratingText, setRatingText, messageOpen, setMessageOpen, messages, setMessages, messageInput, setMessageInput, messageTimerRef, sendingMessage, setSendingMessage, submittingRequest, setSubmittingRequest, gpsLoading, setGpsLoading, imageUploading, setImageUploading, imageInputRef, hasAutoGpsTriedRef, toast, refreshRequests, openMessageModal, closeMessageModal, requestServiceByName, availableRequestServices, selectedCompany, selectedCompanyService, companiesWithDistance, getGpsLocation, handleImageSelection, removeUploadedImage, handleRatingSubmit, openRatingModal, handleDeleteReview, submitRequest, cancelRequest, statusConfig, serviceIconMap, formatAddress, calculateDistance, calculateETA
  };

  return (
    <UserDashboardContext.Provider value={contextValue}>
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <label className="relative block h-14 w-14 shrink-0 cursor-pointer overflow-hidden rounded-full border border-pink-100 bg-pink-50">
            {currentUser?.avatarUrl || (typeof currentUser?.avatar === "string" && currentUser.avatar.startsWith("http")) ? (
              <img src={currentUser.avatarUrl || currentUser.avatar} alt={currentUser?.name || "Người dùng"} className="h-full w-full object-cover" />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-lg font-bold text-pink-600">
                {(currentUser?.name || "U").slice(0, 1).toUpperCase()}
              </span>
            )}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleUserAvatarUpload(e.target.files?.[0])}
            />
          </label>
          <div>
          <h1 className="text-2xl font-bold text-gray-900">Xin chào, {currentUser?.name ?? ""}</h1>
          <p className="text-gray-500 text-sm mt-1">Quản lý yêu cầu cứu hộ của bạn</p>
          {uploadingAvatar && <p className="text-xs text-pink-500 mt-1">Đang tải avatar...</p>}
          </div>
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
      {activeTab === "requests" && <RequestsTab />}

      {/* Tab: New Request */}
      {activeTab === "new" && <NewTab />}

      {/* Tab: Track */}
      {activeTab === "track" && <TrackTab />}

      {/* Company reviews modal */}
      {companyReviewModal.open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-5 w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-gray-900">{companyReviewModal.company?.name}</h3>
                <p className="text-xs text-gray-500">Đánh giá từ những người dùng trước</p>
              </div>
              <button
                onClick={() => setCompanyReviewModal({ open: false, company: null, reviews: [], loading: false })}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>
            <div className="max-h-80 space-y-3 overflow-y-auto pr-1">
              {companyReviewModal.loading ? (
                <div className="flex items-center justify-center gap-2 py-10 text-sm text-gray-500">
                  <Loader2 size={16} className="animate-spin" />
                  Đang tải đánh giá...
                </div>
              ) : companyReviewModal.reviews.length === 0 ? (
                <p className="py-10 text-center text-sm text-gray-400">Công ty này chưa có đánh giá.</p>
              ) : (
                companyReviewModal.reviews.map((review) => {
                  const reviewerName = review.full_name || review.user_name || "Người dùng cũ";
                  return (
                    <div key={review.review_id} className="rounded-xl border border-pink-100 bg-pink-50/40 p-3">
                      <div className="flex items-start gap-3">
                        {review.avatar_url ? (
                          <img src={review.avatar_url} alt={reviewerName} className="h-9 w-9 rounded-full object-cover" />
                        ) : (
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-sm font-bold text-pink-600">
                            {reviewerName.slice(0, 1).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className="truncate text-sm font-semibold text-gray-800">{reviewerName}</p>
                            <div className="flex shrink-0 items-center gap-0.5">
                              {[1, 2, 3, 4, 5].map((s) => (
                                <Star key={s} size={12} className={s <= Number(review.review_rating) ? "fill-yellow-400 text-yellow-400" : "text-gray-200"} />
                              ))}
                            </div>
                          </div>
                          {review.review_comment && (
                            <p className="mt-1 text-sm text-gray-600">{review.review_comment}</p>
                          )}
                          <p className="mt-1 text-[11px] text-gray-400">
                            {new Date(review.reviewed_at).toLocaleString("vi-VN")}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Rating modal */}
      {ratingModal.open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900">
                {requests.find((request) => request.id === ratingModal.requestId)?.reviewId
                  ? "Sửa đánh giá"
                  : "Đánh giá dịch vụ"}
              </h3>
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
              value={ratingText}
              onChange={(e) => setRatingText(e.target.value)}
              placeholder="Chia sẻ cảm nhận của bạn về dịch vụ..."
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:border-pink-400"
              rows={3}
            />
            <button
              onClick={handleRatingSubmit}
              className="mt-4 w-full bg-linear-to-r from-pink-500 to-pink-400 text-white py-3 rounded-xl font-semibold hover:shadow-md transition-all"
            >
              {requests.find((request) => request.id === ratingModal.requestId)?.reviewId
                ? "Lưu đánh giá"
                : "Gửi đánh giá"}
            </button>
          </div>
        </div>
      )}

      {/* Message modal */}
      {messageOpen && selectedRequest && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-pink-50 px-4 py-3">
              <div>
                <h3 className="font-bold text-gray-900">Chat với {selectedRequest.companyName || 'đơn vị cứu hộ'}</h3>
                <p className="text-xs text-gray-500">Yêu cầu #{selectedRequest.id}</p>
              </div>
              <button onClick={() => closeMessageModal()} className="text-gray-400 hover:text-gray-600"><X /></button>
            </div>

            <div className="h-72 overflow-auto bg-gray-50 p-4" id="messages-scroll">
              {messages.length === 0 ? (
                <p className="py-10 text-center text-sm text-gray-400">Chưa có tin nhắn nào</p>
              ) : (
                messages.map((m) => {
                  const isMine = m.message_sender === "user";
                  const senderName = isMine ? (currentUser?.name || "Bạn") : (selectedRequest.companyName || "Đơn vị cứu hộ");
                  return (
                    <div key={m.message_id} className={`mb-3 flex ${isMine ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[78%] rounded-2xl px-3 py-2 shadow-sm ${isMine ? "bg-pink-500 text-white" : "bg-white text-gray-800 border border-gray-100"}`}>
                        <div className={`mb-1 text-[11px] font-semibold ${isMine ? "text-pink-100" : "text-pink-600"}`}>{senderName}</div>
                        <div className="text-sm leading-relaxed">{m.message_content}</div>
                        <div className={`mt-1 text-[10px] ${isMine ? "text-pink-100" : "text-gray-400"}`}>
                          {new Date(m.sent_at).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="flex gap-2 border-t border-pink-50 p-3">
              <input value={messageInput} onChange={(e) => setMessageInput(e.target.value)} placeholder="Nhập tin nhắn..." className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-pink-100" />
              <button
                onClick={async () => {
                  if (!messageInput.trim() || sendingMessage) return;
                  setSendingMessage(true);
                  try {
                    const created = await addRequestMessage(selectedRequest.id, { message_sender: 'user', message_content: messageInput });
                    setMessages((prev) => [...prev, created]);
                    setMessageInput('');
                    try { toast.push({ title: 'Đã gửi', description: 'Tin nhắn đã được gửi', type: 'success' }); } catch (err) { console.warn(err); }
                  } catch (e) {
                    console.error(e);
                    try { toast.push({ title: 'Lỗi', description: e?.message ?? 'Gửi tin nhắn thất bại', type: 'error' }); } catch (err) { console.warn(err); }
                  } finally {
                    setSendingMessage(false);
                  }
                }}
                disabled={sendingMessage}
                className="px-4 py-2 bg-pink-500 text-white rounded-xl disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {sendingMessage ? <Loader2 size={14} className="animate-spin" /> : <Send size={16} />}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </UserDashboardContext.Provider>
  );
}
