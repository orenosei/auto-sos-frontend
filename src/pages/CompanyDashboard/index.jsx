import { useEffect, useMemo, useRef, useState } from "react";
import {
  Car,
  Bell,
  CheckCircle2,
  Clock,
  XCircle,
  X,
  Star,
  Phone,
  MapPin,
  MessageCircle,
  ChevronRight,
  Loader2,
  TrendingUp,
  Users,
  Award,
  Wrench,
  Edit,
  Plus,
  Trash2,
  Send,
} from "lucide-react";
import { useApp } from "../../context/useApp";
import {
  addCompanyService,
  deleteCompanyService,
  getCompany,
  getCompanyServices,
  updateCompanyService,
  getCompanyReviews,
} from "../../api/companies";
import { getServices } from "../../api/services";
import { getRequests, getRequestServices, updateRequestStatus } from "../../api/requests";
import { getUser } from "../../api/users";
import { getRequestImages } from "../../api/requestImages";
import { createVehicle, deleteVehicle, getVehicles, updateVehicle } from "../../api/vehicles";
import { toUiRequest } from "../../api/mappers";
import { getRequestMessages, addRequestMessage, markMessageSeen } from "../../api/messages";
import RequestsTab from './components/RequestsTab';
import StatsTab from './components/StatsTab';
import ServicesTab from './components/ServicesTab';
import VehiclesTab from './components/VehiclesTab';
import ProfileTab from './components/ProfileTab';
import { CompanyDashboardContext } from "./CompanyDashboardContext";
import { useToast } from "../../components/ui/toastContext";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const statusConfig = {
  pending: { label: "Chờ tiếp nhận", color: "text-yellow-600 bg-yellow-50 border-yellow-200" },
  accepted: { label: "Đã tiếp nhận", color: "text-pink-600 bg-pink-50 border-pink-200" },
  heading: { label: "Đang di chuyển", color: "text-pink-600 bg-pink-50 border-pink-200" },
  arrived: { label: "Đã đến nơi", color: "text-pink-600 bg-pink-50 border-pink-200" },
  processing: { label: "Đang xử lý", color: "text-purple-600 bg-purple-50 border-purple-200" },
  completed: { label: "Hoàn tất", color: "text-green-600 bg-green-50 border-green-200" },
  cancelled: { label: "Đã hủy", color: "text-gray-500 bg-gray-50 border-gray-200" },
};

const isEmergencyRequest = (req) => ["emergency", "critical"].includes(req?.priority);

// (weekly sample data removed - chart data is computed from real requests)


export default function CompanyDashboard() {
  const { currentUser, isLoggedIn, updateCurrentUser } = useApp();

  const companyId = useMemo(() => {
    if (!currentUser || currentUser.role !== "company") return null;
    const parsed = Number(currentUser.id);
    return Number.isFinite(parsed) ? parsed : null;
  }, [currentUser]);

  const [activeTab, setActiveTab] = useState("requests");
  const [selectedReq, setSelectedReq] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all");

  const [companyName, setCompanyName] = useState(currentUser?.name ?? "");
  const [companyProfile, setCompanyProfile] = useState(null);
  const [profileDraft, setProfileDraft] = useState(null);
  const [editingProfile, setEditingProfile] = useState({});
  const [savingProfile, setSavingProfile] = useState(false);
  const [companyServices, setCompanyServices] = useState([]);
  const [allServices, setAllServices] = useState([]);

  const [addingServiceOpen, setAddingServiceOpen] = useState(false);
  const [addingService, setAddingService] = useState(false);
  const [newServiceId, setNewServiceId] = useState("");
  const [newServicePrice, setNewServicePrice] = useState("");

  const [editingServiceId, setEditingServiceId] = useState(null);
  const [editingServicePrice, setEditingServicePrice] = useState("");
  const [savingService, setSavingService] = useState(false);
  const [requests, setRequests] = useState([]);
  // Compute chart data (requests + completed) for current week (Mon..Sun) from real requests
  const chartData = useMemo(() => {
    // Monday-based week labels
    const labels = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
    const now = new Date();
    const day = now.getDay(); // 0 Sun .. 6 Sat
    const diffToMonday = (day + 6) % 7; // days to subtract to get Monday
    const monday = new Date(now);
    monday.setHours(0, 0, 0, 0);
    monday.setDate(now.getDate() - diffToMonday);

    const arr = labels.map((label, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const dayStr = d.toDateString();
      const requestsCount = requests.filter((r) => new Date(r.createdAt).toDateString() === dayStr).length;
      const completedCount = requests.filter((r) => r.completedAt && new Date(r.completedAt).toDateString() === dayStr).length;
      return { day: label, requests: requestsCount, completed: completedCount };
    });

    return arr;
  }, [requests]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [messageOpen, setMessageOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState("");
  const messageTimerRef = useRef(null);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState({});
  const toast = useToast();
  const [vehicles, setVehicles] = useState([]);
  const [ratingSummary, setRatingSummary] = useState({ average: null, count: 0 });
  const [satisfactionRate, setSatisfactionRate] = useState(null);
  const [selectedVehicleId, setSelectedVehicleId] = useState("");
  const [etaMinutes, setEtaMinutes] = useState("20");
  const [finalPrice, setFinalPrice] = useState("");
  const [vehicleFormOpen, setVehicleFormOpen] = useState(false);
  const [editingVehicleId, setEditingVehicleId] = useState(null);
  const [savingVehicle, setSavingVehicle] = useState(false);
  const [vehicleDraft, setVehicleDraft] = useState({
    vehicle_license: "",
    vehicle_type: "",
    vehicle_status: "available",
    equipment_description: "",
  });

  const parseGeoJsonPoint = (geoJson) => {
    if (!geoJson) return {};
    try {
      const obj = typeof geoJson === "string" ? JSON.parse(geoJson) : geoJson;
      if (
        obj &&
        obj.type === "Point" &&
        Array.isArray(obj.coordinates) &&
        obj.coordinates.length >= 2
      ) {
        const [lng, lat] = obj.coordinates;
        if (typeof lat === "number" && typeof lng === "number") {
          return { lat, lng };
        }
      }
    } catch (err) {
      console.warn(err);
    }
    return {};
  };

  const companyStats = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);

    const startOfWeek = new Date(now);
    const day = now.getDay();
    const diffToMonday = (day + 6) % 7;
    startOfWeek.setDate(now.getDate() - diffToMonday);
    startOfWeek.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const todayRequests = requests.filter((r) => {
      const createdAt = new Date(r.createdAt);
      return Number.isFinite(createdAt.getTime()) && createdAt >= startOfToday;
    }).length;

    const activeRequests = requests.filter((r) => ["accepted", "heading", "arrived", "processing"].includes(r.status)).length;

    const completedThisWeek = requests.filter((r) => {
      if (r.status !== "completed" || !r.completedAt) return false;
      const completedAt = new Date(r.completedAt);
      return Number.isFinite(completedAt.getTime()) && completedAt >= startOfWeek;
    }).length;

    const monthlyRevenue = requests.reduce((total, r) => {
      if (r.status !== "completed") return total;
      const completedAt = r.completedAt ? new Date(r.completedAt) : null;
      if (!completedAt || !Number.isFinite(completedAt.getTime()) || completedAt < startOfMonth) return total;
      const amount = Number(r.finalPrice ?? r.servicePrice ?? 0);
      return total + (Number.isFinite(amount) ? amount : 0);
    }, 0);

    const responseSamples = requests
      .filter((r) => r.acceptedAt && (r.arrivedAt || r.completedAt))
      .map((r) => {
        const acceptedAt = new Date(r.acceptedAt);
        const endAt = new Date(r.arrivedAt ?? r.completedAt);
        if (!Number.isFinite(acceptedAt.getTime()) || !Number.isFinite(endAt.getTime())) return null;
        return Math.max(0, Math.round((endAt.getTime() - acceptedAt.getTime()) / 60000));
      })
      .filter((v) => Number.isFinite(v));

    const avgResponseMinutes = responseSamples.length
      ? Math.round(responseSamples.reduce((sum, v) => sum + v, 0) / responseSamples.length)
      : null;

    const averageRating = Number.isFinite(ratingSummary.average) ? ratingSummary.average : null;
    const reviewCount = Number.isFinite(ratingSummary.count) ? ratingSummary.count : 0;

    return {
      todayRequests,
      activeRequests,
      completedThisWeek,
      monthlyRevenue,
      avgResponseMinutes,
      averageRating,
      reviewCount,
      satisfactionRate,
    };
  }, [requests, ratingSummary.average, ratingSummary.count, satisfactionRate]);

  const formatRevenue = (value) => {
    if (!Number.isFinite(value) || value <= 0) return "0đ";
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(value >= 10000000 ? 1 : 2).replace(/\.0$/, "")}M`;
    }
    return `${Math.round(value).toLocaleString("vi-VN")}đ`;
  };

  const companyRequests = requests;

  const filtered = companyRequests.filter(
    (r) => filterStatus === "all" || r.status === filterStatus
  );

  const refreshRequests = async () => {
    if (!companyId) {
      setRequests([]);
      return;
    }

    setLoadingRequests(true);
    try {
      const backend = await getRequests({ company_id: companyId });

      const mapped = await Promise.all(
        backend.map(async (r) => {
          const [svc, usr, imageRows] = await Promise.all([
            (async () => {
              try {
                const res = await getRequestServices(r.request_id);
                return {
                  name: res.data?.[0]?.service_name ?? "",
                  price: res.data?.[0]?.service_price ?? null,
                };
              } catch {
                return { name: "", price: null };
              }
            })(),
            (async () => {
              if (r.user_id == null) return null;
              try {
                const u = await getUser(r.user_id);
                return u;
              } catch {
                return null;
              }
            })(),
            (async () => {
              try {
                const res = await getRequestImages(r.request_id);
                return res.data ?? [];
              } catch {
                return [];
              }
            })(),
          ]);

          return {
            ...toUiRequest(r, {
            userName: usr?.full_name || usr?.user_name || "",
            userPhone: usr?.user_phone || "",
            userAvatarUrl: usr?.avatar_url || "",
            companyName,
            serviceType: svc.name,
            servicePrice: svc.price,
            }),
            imageUrls: imageRows.map((image) => image.image_url).filter(Boolean),
          };
        })
      );

      setRequests(mapped);
      setSelectedReq((prev) => {
        if (!prev) return prev;
        return mapped.find((x) => x.id === prev.id) ?? null;
      });
    } finally {
      setLoadingRequests(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!isLoggedIn || !companyId) return;
      try {
        const [c, cs, services, vehicleRows] = await Promise.all([
          getCompany(companyId),
          getCompanyServices(companyId),
          getServices(),
          getVehicles(companyId),
        ]);
        if (cancelled) return;

        setCompanyName(c.company_name);
        const point = parseGeoJsonPoint(c.absolute_address);
        setCompanyProfile({
          address: c.relative_address ?? "",
          phone: c.company_phone,
          avatarUrl: c.avatar_url ?? "",
          rescueArea: c.rescue_area ?? "",
          license: c.company_license ?? "",
          verificationDocumentUrls: Array.isArray(c.verification_document_urls)
            ? c.verification_document_urls
            : [],
          verified: !!c.is_verified,
          lat: point.lat != null ? String(point.lat) : "",
          lng: point.lng != null ? String(point.lng) : "",
        });
        setProfileDraft({
          company_name: c.company_name ?? "",
          company_phone: c.company_phone ?? "",
          avatar_url: c.avatar_url ?? "",
          relative_address: c.relative_address ?? "",
          rescue_area: c.rescue_area ?? "",
          company_license: c.company_license ?? "",
          verification_document_urls: Array.isArray(c.verification_document_urls)
            ? c.verification_document_urls
            : [],
          lat: point.lat != null ? String(point.lat) : "",
          lng: point.lng != null ? String(point.lng) : "",
        });
        setEditingProfile({});
        setCompanyServices(cs);
        setAllServices(Array.isArray(services) ? services : []);
        setVehicles(Array.isArray(vehicleRows) ? vehicleRows : []);

        setAddingServiceOpen(false);
        setNewServiceId("");
        setNewServicePrice("");
        setEditingServiceId(null);
        setEditingServicePrice("");

        await refreshRequests();
        // fetch rating and reviews summary: prefer aggregated values returned with company
        if (companyId) {
          try {
            if (!cancelled && c && c.average_rating != null) {
              setRatingSummary({ average: Number(c.average_rating), count: Number(c.review_count ?? 0) });
            } else {
              // fallback to dedicated endpoint if aggregated values not present
              try {
                const r = await getCompanyReviews(companyId);
                if (!cancelled && Array.isArray(r)) {
                  const rows = r;
                  const satisfied = rows.filter((x) => Number(x.review_rating) >= 4).length;
                  const rate = rows.length > 0 ? Math.round((satisfied / rows.length) * 100) : null;
                  setSatisfactionRate(rate);
                  setRatingSummary({ average: rows.length ? Number((rows.reduce((s, v) => s + Number(v.review_rating), 0) / rows.length).toFixed(2)) : null, count: rows.length });
                }
              } catch (err) {
                console.warn(err);
              }
            }

            // Always fetch reviews list to compute satisfactionRate if available
            try {
              const rev = await getCompanyReviews(companyId);
              if (!cancelled && Array.isArray(rev)) {
                const rows = rev;
                const satisfied = rows.filter((x) => Number(x.review_rating) >= 4).length;
                const rate = rows.length > 0 ? Math.round((satisfied / rows.length) * 100) : null;
                setSatisfactionRate(rate);
              }
            } catch (err) {
              console.warn(err);
            }
          } catch (err) {
            console.warn(err);
          }
        }
      } catch (e) {
        console.error(e);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId, isLoggedIn]);

  // Cleanup polling interval on unmount
  useEffect(() => {
    return () => {
      if (messageTimerRef.current) {
        clearInterval(messageTimerRef.current);
        messageTimerRef.current = null;
      }
    };
  }, []);

  const handleStatusUpdate = async (req, next, extra = {}) => {
    setStatusUpdating((s) => ({ ...s, [req.id]: true }));
    try {
      await updateRequestStatus(req.id, next, {
        changed_by: "company",
        ...extra,
      });
      await refreshRequests();
      if (companyId) {
        const vehicleRows = await getVehicles(companyId);
        setVehicles(Array.isArray(vehicleRows) ? vehicleRows : []);
      }
      try { toast.push({ title: 'Cập nhật', description: 'Cập nhật trạng thái thành công', type: 'success' }); } catch (err) { console.warn(err); }
    } catch (e) {
      console.error(e);
      try { toast.push({ title: 'Lỗi', description: e?.message ?? 'Cập nhật trạng thái thất bại', type: 'error' }); } catch (err) { console.warn(err); }
      window.alert(e instanceof Error ? e.message : "Cập nhật trạng thái thất bại");
    } finally {
      setStatusUpdating((s) => ({ ...s, [req.id]: false }));
    }
  };

  const availableVehicles = useMemo(
    () =>
      vehicles.filter(
        (v) =>
          v.vehicle_status === "available" ||
          String(v.vehicle_id) === String(selectedReq?.vehicleId)
      ),
    [vehicles, selectedReq?.vehicleId]
  );

  useEffect(() => {
    if (!selectedReq) return;
    setSelectedVehicleId(selectedReq.vehicleId || "");
    setFinalPrice(
      selectedReq.finalPrice != null && selectedReq.finalPrice !== ""
        ? String(selectedReq.finalPrice)
        : selectedReq.servicePrice != null
        ? String(selectedReq.servicePrice)
        : ""
    );
  }, [selectedReq]);

  const formatVnd = (value) => {
    const amount = Number(value);
    if (!Number.isFinite(amount)) return "Liên hệ";
    return `${amount.toLocaleString("vi-VN")}đ`;
  };

  const availableServices = useMemo(() => {
    const existing = new Set(companyServices.map((s) => String(s.service_id)));
    return allServices.filter((s) => !existing.has(String(s.service_id)));
  }, [allServices, companyServices]);

  const handleAddService = async () => {
    if (!companyId) return;
    const serviceId = Number.parseInt(newServiceId, 10);
    const price = Number.parseFloat(newServicePrice);
    if (!Number.isFinite(serviceId)) {
      window.alert("Vui lòng chọn dịch vụ");
      return;
    }
    if (!Number.isFinite(price) || price < 0) {
      window.alert("Giá dịch vụ phải là số không âm");
      return;
    }

    setAddingService(true);
    try {
      const created = await addCompanyService(companyId, {
        service_id: serviceId,
        service_price: price,
      });
      setCompanyServices((prev) => {
        const next = prev.filter((x) => String(x.service_id) !== String(created.service_id));
        next.push(created);
        next.sort((a, b) => String(a.service_name ?? "").localeCompare(String(b.service_name ?? "")));
        return next;
      });
      setNewServiceId("");
      setNewServicePrice("");
      setAddingServiceOpen(false);
    } catch (e) {
      console.error(e);
      window.alert(e instanceof Error ? e.message : "Thêm dịch vụ thất bại");
    } finally {
      setAddingService(false);
    }
  };

  const startEditService = (service) => {
    setEditingServiceId(service.service_id);
    setEditingServicePrice(
      typeof service.service_price === "number" && Number.isFinite(service.service_price)
        ? String(service.service_price)
        : "0"
    );
  };

  const cancelEditService = () => {
    setEditingServiceId(null);
    setEditingServicePrice("");
  };

  const handleSaveServicePrice = async () => {
    if (!companyId) return;
    if (editingServiceId == null) return;
    const price = Number.parseFloat(editingServicePrice);
    if (!Number.isFinite(price) || price < 0) {
      window.alert("Giá dịch vụ phải là số không âm");
      return;
    }

    setSavingService(true);
    try {
      const updated = await updateCompanyService(companyId, editingServiceId, {
        service_price: price,
      });
      setCompanyServices((prev) =>
        prev.map((x) => (String(x.service_id) === String(updated.service_id) ? updated : x))
      );
      cancelEditService();
    } catch (e) {
      console.error(e);
      window.alert(e instanceof Error ? e.message : "Cập nhật giá thất bại");
    } finally {
      setSavingService(false);
    }
  };

  const handleDeleteService = async (service) => {
    if (!companyId) return;
    const ok = window.confirm(`Xóa dịch vụ "${service.service_name}" khỏi công ty?`);
    if (!ok) return;

    try {
      await deleteCompanyService(companyId, service.service_id);
      setCompanyServices((prev) => prev.filter((x) => String(x.service_id) !== String(service.service_id)));
      if (String(editingServiceId) === String(service.service_id)) cancelEditService();
    } catch (e) {
      console.error(e);
      window.alert(e instanceof Error ? e.message : "Xóa dịch vụ thất bại");
    }
  };

  const resetVehicleDraft = () => {
    setEditingVehicleId(null);
    setVehicleDraft({
      vehicle_license: "",
      vehicle_type: "",
      vehicle_status: "available",
      equipment_description: "",
    });
  };

  const startEditVehicle = (vehicle) => {
    setEditingVehicleId(vehicle.vehicle_id);
    setVehicleFormOpen(true);
    setVehicleDraft({
      vehicle_license: vehicle.vehicle_license ?? "",
      vehicle_type: vehicle.vehicle_type ?? "",
      vehicle_status: vehicle.vehicle_status ?? "available",
      equipment_description: vehicle.equipment_description ?? "",
    });
  };

  const handleSaveVehicle = async () => {
    if (!companyId) return;

    const vehicle_license = vehicleDraft.vehicle_license.trim();
    const vehicle_type = vehicleDraft.vehicle_type.trim();
    if (!vehicle_license) {
      window.alert("Vui lòng nhập biển số xe");
      return;
    }
    if (!vehicle_type) {
      window.alert("Vui lòng nhập loại phương tiện");
      return;
    }

    setSavingVehicle(true);
    try {
      const payload = {
        company_id: companyId,
        vehicle_license,
        vehicle_type,
        vehicle_status: vehicleDraft.vehicle_status,
        equipment_description: vehicleDraft.equipment_description.trim() || null,
      };

      if (editingVehicleId) {
        const updated = await updateVehicle(editingVehicleId, payload);
        setVehicles((prev) =>
          prev.map((v) => (String(v.vehicle_id) === String(updated.vehicle_id) ? updated : v))
        );
      } else {
        const created = await createVehicle(payload);
        setVehicles((prev) => [created, ...prev]);
      }

      resetVehicleDraft();
      setVehicleFormOpen(false);
    } catch (e) {
      console.error(e);
      window.alert(e instanceof Error ? e.message : "Lưu phương tiện thất bại");
    } finally {
      setSavingVehicle(false);
    }
  };

  const handleDeleteVehicle = async (vehicle) => {
    const ok = window.confirm(`Xóa phương tiện "${vehicle.vehicle_license}"?`);
    if (!ok) return;

    try {
      await deleteVehicle(vehicle.vehicle_id);
      setVehicles((prev) => prev.filter((v) => String(v.vehicle_id) !== String(vehicle.vehicle_id)));
      if (String(editingVehicleId) === String(vehicle.vehicle_id)) resetVehicleDraft();
    } catch (e) {
      console.error(e);
      window.alert(e instanceof Error ? e.message : "Xóa phương tiện thất bại");
    }
  };

  // Chat handlers for company side
  const openMessageModal = async (req) => {
    if (!req) return;
    if (isEmergencyRequest(req)) {
      setMessageOpen(false);
      return;
    }
    setSelectedReq(req);
    setMessageOpen(true);
    try {
      const msgs = await getRequestMessages(req.id);
      setMessages(msgs);
      // mark user messages as seen
      msgs.forEach((m) => {
        if (m.message_sender === "user" && !m.is_seen) {
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
      } catch (err) {
        console.warn(err);
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

  const tabs = [
    { key: "requests", label: "Yêu cầu", icon: <Bell size={16} /> },
    { key: "stats", label: "Thống kê", icon: <TrendingUp size={16} /> },
    { key: "services", label: "Dịch vụ", icon: <Wrench size={16} /> },
    { key: "vehicles", label: "Phương tiện", icon: <Car size={16} /> },
    { key: "profile", label: "Hồ sơ công ty", icon: <Award size={16} /> },
  ];

  const contextValue = {
    currentUser, isLoggedIn, updateCurrentUser, companyId, activeTab, setActiveTab, selectedReq, setSelectedReq, filterStatus, setFilterStatus, companyName, setCompanyName, companyProfile, setCompanyProfile, profileDraft, setProfileDraft, editingProfile, setEditingProfile, savingProfile, setSavingProfile, companyServices, setCompanyServices, allServices, setAllServices, addingServiceOpen, setAddingServiceOpen, addingService, setAddingService, newServiceId, setNewServiceId, newServicePrice, setNewServicePrice, editingServiceId, setEditingServiceId, editingServicePrice, setEditingServicePrice, savingService, setSavingService, requests, setRequests, chartData, loadingRequests, setLoadingRequests, messageOpen, setMessageOpen, messages, setMessages, messageInput, setMessageInput, messageTimerRef, sendingMessage, setSendingMessage, statusUpdating, setStatusUpdating, toast, vehicles, setVehicles, ratingSummary, setRatingSummary, satisfactionRate, setSatisfactionRate, selectedVehicleId, setSelectedVehicleId, etaMinutes, setEtaMinutes, finalPrice, setFinalPrice, vehicleFormOpen, setVehicleFormOpen, editingVehicleId, setEditingVehicleId, savingVehicle, setSavingVehicle, vehicleDraft, setVehicleDraft, parseGeoJsonPoint, companyStats, formatRevenue, companyRequests, filtered, refreshRequests, handleStatusUpdate, availableVehicles, formatVnd, availableServices, handleAddService, startEditService, cancelEditService, handleSaveServicePrice, handleDeleteService, resetVehicleDraft, startEditVehicle, handleSaveVehicle, handleDeleteVehicle, openMessageModal, closeMessageModal, statusConfig
  };

  return (
    <CompanyDashboardContext.Provider value={contextValue}>
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div className="flex items-center gap-3">
          {companyProfile?.avatarUrl ? (
            <img src={companyProfile.avatarUrl} alt={companyName || "Công ty"} className="h-12 w-12 rounded-2xl object-cover shadow-md" />
          ) : (
            <div className="w-12 h-12 rounded-2xl bg-linear-to-br from-pink-400 to-pink-300 flex items-center justify-center text-2xl shadow-md">
              🚑
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{companyName || currentUser?.name || ""}</h1>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    size={12}
                    className={s <= Math.round(companyStats.averageRating ?? 0) ? "fill-yellow-400 text-yellow-400" : "text-gray-200"}
                  />
                ))}
              </div>
              <span className="text-sm text-gray-500">
                {(companyStats.averageRating ?? 0).toFixed(1)} · {companyStats.reviewCount} đánh giá
              </span>
              {companyProfile?.verified && (
                <span className="text-xs bg-pink-50 text-pink-600 px-2 py-0.5 rounded-full border border-pink-200 flex items-center gap-1">
                  ✓ Đã xác minh
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-sm text-green-600 bg-green-50 px-3 py-1.5 rounded-full border border-green-200">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            Đang hoạt động
          </span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          {
            label: "Yêu cầu hôm nay",
            value: String(companyStats.todayRequests),
            change: "",
            color: "from-pink-100 to-pink-50",
            text: "text-pink-600",
            icon: <Bell size={18} />,
          },
          {
            label: "Đang xử lý",
            value: String(companyStats.activeRequests),
            change: "",
            color: "from-purple-100 to-purple-50",
            text: "text-purple-600",
            icon: <Loader2 size={18} className="animate-spin" />,
          },
          {
            label: "Hoàn tất tuần này",
            value: String(companyStats.completedThisWeek),
            change: "",
            color: "from-green-100 to-green-50",
            text: "text-green-600",
            icon: <CheckCircle2 size={18} />,
          },
          {
            label: "Doanh thu tháng",
            value: formatRevenue(companyStats.monthlyRevenue),
            change: "",
            color: "from-pink-100 to-pink-50",
            text: "text-pink-600",
            icon: <TrendingUp size={18} />,
          },
        ].map((card, i) => (
          <div key={i} className={`bg-linear-to-br ${card.color} rounded-2xl p-4 border border-white shadow-sm`}>
            <div className="flex items-center justify-between mb-2">
              <div className={`w-8 h-8 rounded-xl bg-white/60 flex items-center justify-center ${card.text}`}>
                {card.icon}
              </div>
              {card.change && (
                <span className="text-xs font-medium text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full">
                  {card.change}
                </span>
              )}
            </div>
            <p className={`text-2xl font-bold ${card.text}`}>{card.value}</p>
            <p className="text-xs text-gray-500">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-2xl mb-6 w-fit overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
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

      {/* Tab: Requests */}
      {activeTab === "requests" && <RequestsTab />}

      {/* Message modal for company */}
      {messageOpen && selectedReq && !isEmergencyRequest(selectedReq) && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-pink-50 px-4 py-3">
              <div>
                <h3 className="font-bold text-gray-900">Chat với {selectedReq.contactName || selectedReq.userName || 'khách hàng'}</h3>
                <p className="text-xs text-gray-500">Yêu cầu #{selectedReq.id}</p>
              </div>
              <button onClick={() => closeMessageModal()} className="text-gray-400 hover:text-gray-600"><X /></button>
            </div>

            <div className="h-72 overflow-auto bg-gray-50 p-4" id="company-messages-scroll">
              {messages.length === 0 ? (
                <p className="py-10 text-center text-sm text-gray-400">Chưa có tin nhắn nào</p>
              ) : (
                messages.map((m) => {
                  const isMine = m.message_sender === "company";
                  const senderName = isMine
                    ? (companyName || currentUser?.name || "Công ty")
                    : (selectedReq.contactName || selectedReq.userName || "Khách hàng");
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
                    const created = await addRequestMessage(selectedReq.id, { message_sender: 'company', message_content: messageInput });
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
                className="px-4 py-2 bg-pink-600 text-white rounded-xl disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {sendingMessage ? <Loader2 size={14} className="animate-spin" /> : <Send size={16} />}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Stats */}
      {activeTab === "stats" && <StatsTab />}

      {/* Tab: Services */}
      {activeTab === "services" && <ServicesTab />}

      {/* Tab: Vehicles */}
      {activeTab === "vehicles" && <VehiclesTab />}

      {/* Tab: Profile */}
      {activeTab === "profile" && <ProfileTab />}
    </div>
    </CompanyDashboardContext.Provider>
  );
}
