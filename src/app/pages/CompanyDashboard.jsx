import { useEffect, useMemo, useState } from "react";
import {
  Car,
  Bell,
  CheckCircle2,
  Clock,
  XCircle,
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
} from "lucide-react";
import { useApp } from "../context/AppContext";
import {
  addCompanyService,
  deleteCompanyService,
  getCompany,
  getCompanyServices,
  updateCompany,
  updateCompanyService,
} from "../api/companies";
import { getServices } from "../api/services";
import { getRequests, getRequestServices, updateRequestStatus } from "../api/requests";
import { getUser } from "../api/users";
import { createVehicle, deleteVehicle, getVehicles, updateVehicle } from "../api/vehicles";
import { toUiRequest } from "../api/mappers";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const statusConfig = {
  pending: { label: "Chờ tiếp nhận", color: "text-yellow-600 bg-yellow-50 border-yellow-200" },
  accepted: { label: "Đã tiếp nhận", color: "text-blue-600 bg-blue-50 border-blue-200" },
  heading: { label: "Đang di chuyển", color: "text-indigo-600 bg-indigo-50 border-indigo-200" },
  arrived: { label: "Đã đến nơi", color: "text-cyan-600 bg-cyan-50 border-cyan-200" },
  processing: { label: "Đang xử lý", color: "text-purple-600 bg-purple-50 border-purple-200" },
  completed: { label: "Hoàn tất", color: "text-green-600 bg-green-50 border-green-200" },
  cancelled: { label: "Đã hủy", color: "text-gray-500 bg-gray-50 border-gray-200" },
};

const weeklyData = [
  { day: "T2", requests: 5, completed: 4 },
  { day: "T3", requests: 8, completed: 7 },
  { day: "T4", requests: 6, completed: 6 },
  { day: "T5", requests: 10, completed: 9 },
  { day: "T6", requests: 12, completed: 11 },
  { day: "T7", requests: 9, completed: 8 },
  { day: "CN", requests: 7, completed: 6 },
];

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
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [vehicles, setVehicles] = useState([]);
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
    } catch {
      // ignore
    }
    return {};
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
          const [svc, usr] = await Promise.all([
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
          ]);

          return toUiRequest(r, {
            userName: usr?.full_name || usr?.user_name || "",
            userPhone: usr?.user_phone || "",
            companyName,
            serviceType: svc.name,
            servicePrice: svc.price,
          });
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
          rescueArea: c.rescue_area ?? "",
          license: c.company_license ?? "",
          verified: !!c.is_verified,
          lat: point.lat != null ? String(point.lat) : "",
          lng: point.lng != null ? String(point.lng) : "",
        });
        setProfileDraft({
          company_name: c.company_name ?? "",
          company_phone: c.company_phone ?? "",
          relative_address: c.relative_address ?? "",
          rescue_area: c.rescue_area ?? "",
          company_license: c.company_license ?? "",
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
      } catch (e) {
        console.error(e);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId, isLoggedIn]);

  const handleStatusUpdate = async (req, next, extra = {}) => {
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
    } catch (e) {
      console.error(e);
      window.alert(e instanceof Error ? e.message : "Cập nhật trạng thái thất bại");
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
    if (typeof value !== "number" || !Number.isFinite(value)) return "Liên hệ";
    return `${value.toLocaleString("vi-VN")}đ`;
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

  const tabs = [
    { key: "requests", label: "Yêu cầu", icon: <Bell size={16} /> },
    { key: "stats", label: "Thống kê", icon: <TrendingUp size={16} /> },
    { key: "services", label: "Dịch vụ", icon: <Wrench size={16} /> },
    { key: "vehicles", label: "Phương tiện", icon: <Car size={16} /> },
    { key: "profile", label: "Hồ sơ công ty", icon: <Award size={16} /> },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-linear-to-br from-blue-400 to-blue-300 flex items-center justify-center text-2xl shadow-md">
            🚑
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{companyName || currentUser?.name || ""}</h1>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} size={12} className={s <= 4 ? "fill-yellow-400 text-yellow-400" : "text-gray-200"} />
                ))}
              </div>
              <span className="text-sm text-gray-500">4.8 · 256 đánh giá</span>
              {companyProfile?.verified && (
                <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full border border-blue-200 flex items-center gap-1">
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
          { label: "Yêu cầu hôm nay", value: "12", change: "+3", color: "from-pink-100 to-pink-50", text: "text-pink-600", icon: <Bell size={18} /> },
          { label: "Đang xử lý", value: "3", change: "", color: "from-purple-100 to-purple-50", text: "text-purple-600", icon: <Loader2 size={18} className="animate-spin" /> },
          { label: "Hoàn tất tuần này", value: "51", change: "+8%", color: "from-green-100 to-green-50", text: "text-green-600", icon: <CheckCircle2 size={18} /> },
          { label: "Doanh thu tháng", value: "12.5M", change: "+15%", color: "from-blue-100 to-blue-50", text: "text-blue-600", icon: <TrendingUp size={18} /> },
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
                ? "bg-white text-blue-600 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab: Requests */}
      {activeTab === "requests" && (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            {/* Filter */}
            <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
              {[
                { key: "all", label: "Tất cả" },
                { key: "pending", label: "Chờ tiếp nhận" },
                { key: "accepted", label: "Đã tiếp nhận" },
                { key: "heading", label: "Đang di chuyển" },
                { key: "arrived", label: "Đã đến nơi" },
                { key: "processing", label: "Đang xử lý" },
                { key: "completed", label: "Hoàn tất" },
                { key: "cancelled", label: "Đã hủy" },
              ].map((f) => (
                <button
                  key={f.key}
                  onClick={() => setFilterStatus(f.key)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                    filterStatus === f.key
                      ? "bg-blue-500 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-blue-100 hover:text-blue-600"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="space-y-3">
              {loadingRequests && (
                <div className="bg-white rounded-2xl border border-pink-100 p-4 text-sm text-gray-500">
                  Đang tải yêu cầu...
                </div>
              )}
              {filtered.map((req) => {
                const status = statusConfig[req.status] ?? statusConfig.pending;
                return (
                  <div
                    key={req.id}
                    onClick={() => setSelectedReq(req)}
                    className={`bg-white rounded-2xl border p-4 cursor-pointer transition-all hover:shadow-md ${
                      selectedReq?.id === req.id
                        ? "border-blue-300 shadow-md shadow-blue-50"
                        : "border-pink-100 hover:border-blue-200"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${status.color}`}>
                            {status.label}
                          </span>
                          <h3 className="font-semibold text-gray-800 text-sm">{req.serviceType}</h3>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{req.userName} · {req.userPhone}</p>
                        <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                          <MapPin size={11} className="text-pink-400" />
                          {req.location}
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{req.description}</p>
                      </div>
                      <ChevronRight size={16} className="text-gray-300 shrink-0 mt-1" />
                    </div>
                    <p className="text-xs text-gray-400 mt-2">{new Date(req.createdAt).toLocaleString("vi-VN")}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Detail panel */}
          <div>
            {selectedReq ? (
              <div className="bg-white rounded-2xl border border-blue-100 p-5 sticky top-24">
                <h3 className="font-bold text-gray-900 mb-4">Chi tiết yêu cầu #{selectedReq.id}</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Trạng thái</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${(statusConfig[selectedReq.status] ?? statusConfig.pending).color}`}>
                      {(statusConfig[selectedReq.status] ?? statusConfig.pending).label}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Khách hàng</span>
                    <span className="font-medium text-gray-800">{selectedReq.userName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Điện thoại</span>
                    <span className="font-medium text-blue-600">{selectedReq.userPhone}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Vị trí</span>
                    <p className="font-medium text-gray-800 mt-0.5">{selectedReq.location}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Mô tả</span>
                    <p className="text-gray-700 mt-0.5">{selectedReq.description}</p>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Dịch vụ</span>
                    <span className="font-medium text-gray-800">{selectedReq.serviceType}</span>
                  </div>
                  {selectedReq.price && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Chi phí</span>
                      <span className="font-semibold text-pink-600">{selectedReq.price}</span>
                    </div>
                  )}
                  {selectedReq.estimatedArrival && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">ETA</span>
                      <span className="font-medium text-gray-800">
                        {new Date(selectedReq.estimatedArrival).toLocaleString("vi-VN")}
                      </span>
                    </div>
                  )}
                  {selectedReq.vehicleId && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Xe cứu hộ</span>
                      <span className="font-medium text-gray-800">
                        {vehicles.find((v) => String(v.vehicle_id) === String(selectedReq.vehicleId))?.vehicle_license ?? `#${selectedReq.vehicleId}`}
                      </span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="space-y-2 mt-5">
                  {selectedReq.status === "pending" && (
                    <div className="space-y-2 rounded-xl border border-blue-100 bg-blue-50 p-3">
                      <div>
                        <label className="text-xs text-blue-700 font-medium">Xe cứu hộ điều phối</label>
                        <select
                          value={selectedVehicleId}
                          onChange={(e) => setSelectedVehicleId(e.target.value)}
                          className="mt-1 w-full rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
                        >
                          <option value="">Chưa chọn xe</option>
                          {availableVehicles.map((v) => (
                            <option key={v.vehicle_id} value={String(v.vehicle_id)}>
                              {v.vehicle_license} - {v.vehicle_type}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-blue-700 font-medium">Thời gian dự kiến đến nơi (phút)</label>
                        <input
                          type="number"
                          min="1"
                          value={etaMinutes}
                          onChange={(e) => setEtaMinutes(e.target.value)}
                          className="mt-1 w-full rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
                        />
                      </div>
                      <button
                        onClick={() => {
                          const eta = Number(etaMinutes);
                          handleStatusUpdate(selectedReq, "accepted", {
                            vehicle_id: selectedVehicleId ? Number(selectedVehicleId) : null,
                            eta_minutes: Number.isFinite(eta) && eta > 0 ? eta : 20,
                            note: "Company accepted request",
                          });
                        }}
                        className="w-full bg-linear-to-r from-blue-500 to-blue-400 text-white py-2.5 rounded-xl text-sm font-semibold hover:shadow-md hover:shadow-blue-200 transition-all flex items-center justify-center gap-2"
                      >
                        <CheckCircle2 size={16} />
                        Tiếp nhận yêu cầu
                      </button>
                    </div>
                  )}
                  {selectedReq.status === "accepted" && (
                    <button
                      onClick={() => handleStatusUpdate(selectedReq, "heading", { note: "Vehicle is heading to customer" })}
                      className="w-full bg-linear-to-r from-indigo-500 to-indigo-400 text-white py-2.5 rounded-xl text-sm font-semibold hover:shadow-md transition-all flex items-center justify-center gap-2"
                    >
                      <Loader2 size={16} />
                      Bắt đầu di chuyển
                    </button>
                  )}
                  {selectedReq.status === "heading" && (
                    <button
                      onClick={() => handleStatusUpdate(selectedReq, "arrived", { note: "Vehicle arrived" })}
                      className="w-full bg-linear-to-r from-cyan-500 to-cyan-400 text-white py-2.5 rounded-xl text-sm font-semibold hover:shadow-md transition-all flex items-center justify-center gap-2"
                    >
                      <MapPin size={16} />
                      Đã đến hiện trường
                    </button>
                  )}
                  {selectedReq.status === "arrived" && (
                    <button
                      onClick={() => handleStatusUpdate(selectedReq, "processing", { note: "Started processing incident" })}
                      className="w-full bg-linear-to-r from-purple-500 to-purple-400 text-white py-2.5 rounded-xl text-sm font-semibold hover:shadow-md transition-all flex items-center justify-center gap-2"
                    >
                      <Loader2 size={16} />
                      Bắt đầu xử lý
                    </button>
                  )}
                  {selectedReq.status === "processing" && (
                    <div className="space-y-2 rounded-xl border border-green-100 bg-green-50 p-3">
                      <div>
                        <label className="text-xs text-green-700 font-medium">Chi phí cuối cùng (VND)</label>
                        <input
                          type="number"
                          min="0"
                          value={finalPrice}
                          onChange={(e) => setFinalPrice(e.target.value)}
                          className="mt-1 w-full rounded-lg border border-green-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-100"
                        />
                      </div>
                      <button
                        onClick={() => {
                          const price = Number(finalPrice);
                          handleStatusUpdate(selectedReq, "completed", {
                            final_price: Number.isFinite(price) && price >= 0 ? price : null,
                            note: "Request completed",
                          });
                        }}
                        className="w-full bg-linear-to-r from-green-500 to-green-400 text-white py-2.5 rounded-xl text-sm font-semibold hover:shadow-md transition-all flex items-center justify-center gap-2"
                      >
                        <CheckCircle2 size={16} />
                        Xác nhận hoàn tất
                      </button>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <button className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-blue-200 text-blue-600 text-sm hover:bg-blue-50 transition-colors">
                      <MessageCircle size={15} />
                      Nhắn tin
                    </button>
                    <button className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-blue-200 text-blue-600 text-sm hover:bg-blue-50 transition-colors">
                      <Phone size={15} />
                      Gọi điện
                    </button>
                  </div>
                  {selectedReq.status === "pending" && (
                    <button
                      onClick={() => handleStatusUpdate(selectedReq, "cancelled", {
                        cancelled_by: "company",
                        cancel_reason: "Company rejected request",
                        note: "Company rejected request",
                      })}
                      className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-red-200 text-red-500 text-sm hover:bg-red-50 transition-colors"
                    >
                      <XCircle size={15} />
                      Từ chối
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-blue-100 p-8 text-center">
                <Bell size={40} className="text-blue-200 mx-auto mb-3" />
                <p className="text-gray-400 text-sm">Chọn một yêu cầu để xem chi tiết</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab: Stats */}
      {activeTab === "stats" && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-pink-100 p-6">
            <h3 className="font-bold text-gray-900 mb-4">Yêu cầu theo ngày trong tuần</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={weeklyData} barSize={32}>
                <CartesianGrid key="grid" strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis key="xaxis" dataKey="day" tick={{ fontSize: 12, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                <YAxis key="yaxis" tick={{ fontSize: 12, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                <Tooltip
                  key="tooltip"
                  contentStyle={{ borderRadius: "12px", border: "1px solid #fce7f3", fontSize: "12px" }}
                />
                <Bar key="bar-requests" dataKey="requests" fill="#f472b6" radius={[6, 6, 0, 0]} name="Yêu cầu" />
                <Bar key="bar-completed" dataKey="completed" fill="#60a5fa" radius={[6, 6, 0, 0]} name="Hoàn tất" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl border border-pink-100 p-5">
              <div className="flex items-center gap-2 mb-2">
                <Star size={18} className="text-yellow-500" />
                <span className="font-semibold text-gray-700">Đánh giá</span>
              </div>
              <p className="text-3xl font-bold text-gray-900">4.8</p>
              <div className="flex items-center gap-0.5 mt-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} size={14} className={s <= 4 ? "fill-yellow-400 text-yellow-400" : "text-gray-200"} />
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-1">256 đánh giá tổng</p>
            </div>
            <div className="bg-white rounded-2xl border border-pink-100 p-5">
              <div className="flex items-center gap-2 mb-2">
                <Clock size={18} className="text-blue-500" />
                <span className="font-semibold text-gray-700">Thời gian phản hồi</span>
              </div>
              <p className="text-3xl font-bold text-gray-900">15 phút</p>
              <p className="text-xs text-gray-500 mt-1">Trung bình thời gian đến nơi</p>
            </div>
            <div className="bg-white rounded-2xl border border-pink-100 p-5">
              <div className="flex items-center gap-2 mb-2">
                <Users size={18} className="text-pink-500" />
                <span className="font-semibold text-gray-700">Tỷ lệ hài lòng</span>
              </div>
              <p className="text-3xl font-bold text-gray-900">96%</p>
              <p className="text-xs text-gray-500 mt-1">Dựa trên phản hồi khách hàng</p>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Services */}
      {activeTab === "services" && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-900">Danh sách dịch vụ</h2>
            <button
              type="button"
              onClick={() => setAddingServiceOpen((v) => !v)}
              className="flex items-center gap-1.5 bg-blue-500 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-blue-600 transition-colors"
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
                    className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all bg-white"
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
                    className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
                    placeholder="Ví dụ: 200000"
                  />
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                <button
                  type="button"
                  disabled={addingService || availableServices.length === 0}
                  onClick={handleAddService}
                  className="bg-blue-500 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-blue-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
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
                          className="px-2 py-1 rounded-lg hover:bg-blue-50 text-blue-600 text-xs font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
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
                          className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-500 transition-colors"
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
                        className="w-32 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
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
      )}

      {/* Tab: Vehicles */}
      {activeTab === "vehicles" && (
        <div>
          <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
            <div>
              <h2 className="font-bold text-gray-900">Phương tiện cứu hộ</h2>
              <p className="text-sm text-gray-500">Quản lý xe và thiết bị hỗ trợ dùng khi điều phối yêu cầu</p>
            </div>
            <button
              type="button"
              onClick={() => {
                resetVehicleDraft();
                setVehicleFormOpen((v) => !v);
              }}
              className="flex items-center gap-1.5 bg-blue-500 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-blue-600 transition-colors"
            >
              <Plus size={16} />
              Thêm phương tiện
            </button>
          </div>

          {vehicleFormOpen && (
            <div className="bg-white rounded-2xl border border-blue-100 p-5 mb-4">
              <h3 className="font-semibold text-gray-800 mb-3">
                {editingVehicleId ? "Cập nhật phương tiện" : "Thêm phương tiện mới"}
              </h3>
              <div className="grid md:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400">Biển số *</label>
                  <input
                    value={vehicleDraft.vehicle_license}
                    onChange={(e) => setVehicleDraft((prev) => ({ ...prev, vehicle_license: e.target.value }))}
                    className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                    placeholder="Ví dụ: 30A-12345"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400">Loại xe *</label>
                  <input
                    value={vehicleDraft.vehicle_type}
                    onChange={(e) => setVehicleDraft((prev) => ({ ...prev, vehicle_type: e.target.value }))}
                    className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                    placeholder="Xe kéo, xe kỹ thuật..."
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400">Trạng thái</label>
                  <select
                    value={vehicleDraft.vehicle_status}
                    onChange={(e) => setVehicleDraft((prev) => ({ ...prev, vehicle_status: e.target.value }))}
                    className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 bg-white"
                  >
                    <option value="available">Sẵn sàng</option>
                    <option value="busy">Đang bận</option>
                    <option value="maintenance">Bảo trì</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-400">Thiết bị đi kèm</label>
                  <input
                    value={vehicleDraft.equipment_description}
                    onChange={(e) => setVehicleDraft((prev) => ({ ...prev, equipment_description: e.target.value }))}
                    className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                    placeholder="Cẩu kéo, kích lốp, bình kích điện..."
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button
                  type="button"
                  disabled={savingVehicle}
                  onClick={handleSaveVehicle}
                  className="bg-blue-500 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-blue-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {savingVehicle ? "Đang lưu..." : editingVehicleId ? "Lưu thay đổi" : "Thêm"}
                </button>
                <button
                  type="button"
                  disabled={savingVehicle}
                  onClick={() => {
                    resetVehicleDraft();
                    setVehicleFormOpen(false);
                  }}
                  className="px-4 py-2 rounded-xl text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Hủy
                </button>
              </div>
            </div>
          )}

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {vehicles.map((vehicle) => {
              const statusMeta =
                vehicle.vehicle_status === "available"
                  ? "bg-green-50 text-green-600 border-green-200"
                  : vehicle.vehicle_status === "busy"
                  ? "bg-purple-50 text-purple-600 border-purple-200"
                  : "bg-yellow-50 text-yellow-600 border-yellow-200";
              const statusLabel =
                vehicle.vehicle_status === "available"
                  ? "Sẵn sàng"
                  : vehicle.vehicle_status === "busy"
                  ? "Đang bận"
                  : "Bảo trì";

              return (
                <div key={vehicle.vehicle_id} className="bg-white rounded-2xl border border-pink-100 p-5 hover:shadow-md hover:shadow-pink-50 transition-all">
                  <div className="flex items-start justify-between gap-3">
                    <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500">
                      <Car size={22} />
                    </div>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => startEditVehicle(vehicle)}
                        className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-500 transition-colors"
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteVehicle(vehicle)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  <h3 className="font-semibold text-gray-800 mt-3">{vehicle.vehicle_license}</h3>
                  <p className="text-sm text-gray-500 mt-0.5">{vehicle.vehicle_type}</p>
                  <span className={`inline-flex mt-3 text-xs px-2 py-0.5 rounded-full border ${statusMeta}`}>
                    {statusLabel}
                  </span>
                  {vehicle.equipment_description && (
                    <p className="mt-3 text-xs text-gray-500 leading-relaxed">
                      {vehicle.equipment_description}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          {vehicles.length === 0 && (
            <div className="bg-white rounded-2xl border border-pink-100 p-8 text-center">
              <Car size={40} className="text-blue-200 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">Chưa có phương tiện cứu hộ nào</p>
            </div>
          )}
        </div>
      )}

      {/* Tab: Profile */}
      {activeTab === "profile" && (
        <div className="max-w-2xl bg-white rounded-2xl border border-pink-100 p-6">
          <h2 className="font-bold text-gray-900 mb-5">Hồ sơ công ty</h2>
          {!profileDraft ? (
            <div className="text-sm text-gray-500">Đang tải hồ sơ...</div>
          ) : (
            <>
              <div className="space-y-4">
                {[
                  {
                    key: "company_name",
                    label: "Tên công ty",
                    value: profileDraft.company_name,
                    editable: true,
                    required: true,
                  },
                  {
                    key: "company_phone",
                    label: "Số điện thoại",
                    value: profileDraft.company_phone,
                    editable: true,
                    required: true,
                  },
                  {
                    key: "relative_address",
                    label: "Địa chỉ (mô tả)",
                    value: profileDraft.relative_address,
                    editable: true,
                  },
                  {
                    key: "rescue_area",
                    label: "Phạm vi hoạt động",
                    value: profileDraft.rescue_area,
                    editable: true,
                  },
                  {
                    key: "company_license",
                    label: "Số giấy phép",
                    value: profileDraft.company_license,
                    editable: true,
                  },
                  {
                    key: "lat",
                    label: "GPS (lat)",
                    value: profileDraft.lat,
                    editable: true,
                    placeholder: "21.0278",
                  },
                  {
                    key: "lng",
                    label: "GPS (lng)",
                    value: profileDraft.lng,
                    editable: true,
                    placeholder: "105.8342",
                  },
                  {
                    key: "verified",
                    label: "Trạng thái xác minh",
                    value: companyProfile?.verified ? "✅ Đã được xác minh" : "⏳ Chưa xác minh",
                    editable: false,
                  },
                ].map((field, i) => {
                  const isEditing = !!editingProfile[field.key];
                  const displayValue = field.value ?? "";

                  return (
                    <div
                      key={i}
                      className="flex items-start justify-between gap-4 py-3 border-b border-gray-50 last:border-0"
                    >
                      <div className="flex-1">
                        <p className="text-xs text-gray-400">
                          {field.label}
                          {field.required ? " *" : ""}
                        </p>
                        {field.editable && isEditing ? (
                          <input
                            type="text"
                            value={displayValue}
                            placeholder={field.placeholder}
                            onChange={(e) =>
                              setProfileDraft((prev) => ({
                                ...prev,
                                [field.key]: e.target.value,
                              }))
                            }
                            className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
                          />
                        ) : (
                          <p className="text-sm font-medium text-gray-800 mt-0.5">
                            {String(displayValue)}
                          </p>
                        )}
                      </div>

                      {field.editable && (
                        <button
                          type="button"
                          onClick={() =>
                            setEditingProfile((prev) => ({
                              ...prev,
                              [field.key]: !prev[field.key],
                            }))
                          }
                          className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 shrink-0"
                        >
                          <Edit size={12} />
                          {isEditing ? "Xong" : "Sửa"}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              <button
                type="button"
                disabled={savingProfile}
                onClick={async () => {
                  if (!companyId) return;
                  setSavingProfile(true);
                  try {
                    const company_name = profileDraft.company_name.trim();
                    const company_phone = profileDraft.company_phone.trim();
                    if (!company_name) {
                      window.alert("Vui lòng nhập tên công ty");
                      return;
                    }
                    if (!company_phone) {
                      window.alert("Vui lòng nhập số điện thoại");
                      return;
                    }

                    const latRaw = profileDraft.lat.trim();
                    const lngRaw = profileDraft.lng.trim();
                    const lat = latRaw ? Number.parseFloat(latRaw) : null;
                    const lng = lngRaw ? Number.parseFloat(lngRaw) : null;
                    const hasGeo = latRaw.length > 0 || lngRaw.length > 0;
                    if (hasGeo && (!Number.isFinite(lat) || !Number.isFinite(lng))) {
                      window.alert("Tọa độ GPS không hợp lệ (lat/lng)");
                      return;
                    }

                    const updated = await updateCompany(companyId, {
                      company_name,
                      company_phone,
                      relative_address: profileDraft.relative_address.trim() || null,
                      rescue_area: profileDraft.rescue_area.trim() || null,
                      company_license: profileDraft.company_license.trim() || null,
                      absolute_address:
                        hasGeo && Number.isFinite(lat) && Number.isFinite(lng)
                          ? { lat, lng }
                          : null,
                    });

                    const point = parseGeoJsonPoint(updated.absolute_address);
                    setCompanyName(updated.company_name);
                    setCompanyProfile({
                      address: updated.relative_address ?? "",
                      phone: updated.company_phone,
                      rescueArea: updated.rescue_area ?? "",
                      license: updated.company_license ?? "",
                      verified: !!updated.is_verified,
                      lat: point.lat != null ? String(point.lat) : "",
                      lng: point.lng != null ? String(point.lng) : "",
                    });
                    setProfileDraft({
                      company_name: updated.company_name ?? "",
                      company_phone: updated.company_phone ?? "",
                      relative_address: updated.relative_address ?? "",
                      rescue_area: updated.rescue_area ?? "",
                      company_license: updated.company_license ?? "",
                      lat: point.lat != null ? String(point.lat) : "",
                      lng: point.lng != null ? String(point.lng) : "",
                    });
                    setEditingProfile({});

                    updateCurrentUser({ name: updated.company_name, phone: updated.company_phone });
                    window.alert("Đã lưu hồ sơ công ty");
                  } catch (e) {
                    console.error(e);
                    window.alert(e instanceof Error ? e.message : "Lưu hồ sơ thất bại");
                  } finally {
                    setSavingProfile(false);
                  }
                }}
                className="mt-6 w-full bg-linear-to-r from-blue-500 to-blue-400 text-white py-3 rounded-xl font-semibold hover:shadow-md hover:shadow-blue-200 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {savingProfile ? "Đang lưu..." : "Lưu thay đổi"}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
