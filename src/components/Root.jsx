import { useEffect, useRef, useState } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import {
  Car,
  Bell,
  Menu,
  X,
  LogOut,
  User,
  Building2,
  ShieldCheck,
  Home,
  Search,
  Users,
  LayoutDashboard,
  AlertTriangle,
} from "lucide-react";
import { useApp } from "../context/useApp";
import { EmergencySOS } from "../pages/Emergency";

const EMERGENCY_DISMISS_STORAGE_KEY = "rescuesos.dismissed-emergency-notifications";
const emergencyPriorities = new Set(["emergency", "critical", "urgent", "high"]);

const loadDismissedEmergencyMap = () => {
  try {
    const raw = window.sessionStorage.getItem(EMERGENCY_DISMISS_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
};

function EmergencyNotificationToast({ notification, onClose, onOpen }) {
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const timer = window.setTimeout(() => onCloseRef.current(), 3000);
    return () => window.clearTimeout(timer);
  }, [notification.id]);

  return (
    <div
      role="alert"
      className="pointer-events-auto w-full max-w-sm overflow-hidden rounded-2xl border border-red-200 bg-white shadow-xl shadow-red-950/15"
    >
      <div className="flex items-start gap-3 p-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
          <AlertTriangle size={21} />
        </div>
        <button
          type="button"
          onClick={onOpen}
          className="min-w-0 flex-1 text-left"
        >
          <p className="text-[11px] font-bold uppercase tracking-wider text-red-600">
            Ưu tiên khẩn cấp
          </p>
          <p className="mt-0.5 text-sm font-bold text-gray-900">
            {notification.title}
          </p>
          <p className="mt-1 line-clamp-2 whitespace-pre-line text-xs leading-5 text-gray-600">
            {notification.message}
          </p>
          {notification.requestId && (
            <p className="mt-1.5 text-xs font-semibold text-red-600">
              Xem yêu cầu #{notification.requestId}
            </p>
          )}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          aria-label="Đóng thông báo khẩn cấp"
        >
          <X size={16} />
        </button>
      </div>
      <div className="h-1 animate-[emergency-toast-progress_3s_linear_forwards] bg-red-500" />
    </div>
  );
}

export default function Root() {
  const { currentRole, notifications, markAllRead, markRead, unreadCount, isLoggedIn, logout, currentUser } = useApp();
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [dismissedEmergencyMap, setDismissedEmergencyMap] = useState(
    loadDismissedEmergencyMap
  );
  const location = useLocation();
  const navigate = useNavigate();
  const isAdminShell = location.pathname.startsWith("/admin");
  const avatarSource =
    currentUser?.avatarUrl ||
    (typeof currentUser?.avatar === "string" &&
    /^(https?:\/\/|data:image\/|blob:)/i.test(currentUser.avatar)
      ? currentUser.avatar
      : "");
  const avatarInitial =
    !avatarSource && typeof currentUser?.avatar === "string" && currentUser.avatar.length <= 3
      ? currentUser.avatar
      : currentUser?.name?.slice(0, 1)?.toUpperCase() || "U";

  const navLinks = [
    { to: "/", label: "Trang chủ", icon: <Home size={16} /> },
    ...(currentRole === "company"
      ? []
      : [
          { to: "/find-services", label: "Tìm dịch vụ", icon: <Search size={16} /> },
          { to: "/community", label: "Cộng đồng", icon: <Users size={16} /> },
        ]),
    ...(currentRole === "user"
      ? [
          { to: "/dashboard", label: "Dashboard", icon: <LayoutDashboard size={16} /> },
          { to: "/profile", label: "Profile", icon: <User size={16} /> },
        ]
      : currentRole === "company"
      ? [{ to: "/company", label: "Cổng công ty", icon: <Building2 size={16} /> }]
      : [{ to: "/admin", label: "Quản trị", icon: <ShieldCheck size={16} /> }]),
  ];

  const isActive = (to) =>
    to === "/" ? location.pathname === "/" : location.pathname.startsWith(to);

  const emergencyAccountKey = `${currentRole}:${currentUser?.id ?? "guest"}`;
  const dismissedEmergencyIds = new Set(
    dismissedEmergencyMap[emergencyAccountKey] ?? []
  );

  const dismissEmergencyIds = (ids) => {
    if (ids.length === 0) return;
    setDismissedEmergencyMap((prev) => {
      const nextIds = new Set(prev[emergencyAccountKey] ?? []);
      ids.forEach((id) => nextIds.add(String(id)));
      const next = {
        ...prev,
        [emergencyAccountKey]: Array.from(nextIds).slice(-100),
      };
      try {
        window.sessionStorage.setItem(
          EMERGENCY_DISMISS_STORAGE_KEY,
          JSON.stringify(next)
        );
      } catch {
        // Session storage may be unavailable in private browsing modes.
      }
      return next;
    });
  };

  const openNotification = (notification) => {
    markRead(notification.id);
    setNotifOpen(false);
    dismissEmergencyIds([notification.id]);

    if (!notification.requestId) return;

    const requestState = { requestId: String(notification.requestId) };
    if (currentRole === "company") {
      navigate("/company", { state: requestState });
    } else if (currentRole === "user") {
      navigate("/dashboard", { state: requestState });
    }
  };

  const activeEmergencyNotifications = notifications.filter(
    (notification) =>
      !notification.read &&
      emergencyPriorities.has(notification.requestPriority) &&
      !dismissedEmergencyIds.has(notification.id)
  );
  return (
    <div className="min-h-screen bg-linear-to-br from-pink-50 via-white to-pink-50">
      {activeEmergencyNotifications.length > 0 && (
        <div className="pointer-events-none fixed right-4 top-20 z-[100] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-3">
          {activeEmergencyNotifications.slice(0, 3).map((notification) => (
            <EmergencyNotificationToast
              key={notification.id}
              notification={notification}
              onClose={() => dismissEmergencyIds([notification.id])}
              onOpen={() => openNotification(notification)}
            />
          ))}
        </div>
      )}

      {/* Navbar */}
      {!isAdminShell && <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-pink-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-9 h-9 rounded-xl bg-linear-to-br from-pink-400 to-pink-400 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                <Car size={20} className="text-white" />
              </div>
              <div className="hidden sm:block">
                <span className="font-bold text-pink-600 text-lg leading-none">Rescue</span>
                <span className="font-bold text-pink-500 text-lg leading-none">S</span>
                <span className="font-bold text-blue-500 text-lg leading-none">O</span>
                <span className="font-bold text-pink-500 text-lg leading-none">S</span>
                <div className="text-[10px] text-gray-400 leading-none">Hệ thống cứu hộ xe</div>
              </div>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    isActive(link.to)
                      ? "bg-linear-to-r from-pink-100 to-pink-100 text-pink-700"
                      : "text-gray-600 hover:bg-pink-50 hover:text-pink-600"
                  }`}
                >
                  {link.icon}
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Right side */}
            <div className="flex items-center gap-2">
              {/* Notifications */}
              <div className="relative">
                <button
                  onClick={() => setNotifOpen(!notifOpen)}
                  className="relative p-2 rounded-full hover:bg-pink-50 transition-colors"
                >
                  <Bell size={20} className="text-gray-600" />
                  {unreadCount > 0 && (
                    <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-pink-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                      {unreadCount}
                    </span>
                  )}
                </button>
                {notifOpen && (
                  <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-xl border border-pink-100 overflow-hidden z-50">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-pink-50">
                      <span className="font-semibold text-gray-800">Thông báo</span>
                      <button onClick={markAllRead} className="text-xs text-pink-500 hover:text-pink-700">
                        Đọc tất cả
                      </button>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <p className="text-center text-gray-400 py-6 text-sm">Không có thông báo</p>
                      ) : (
                        notifications.map((n) => (
                          <button
                            type="button"
                            key={n.id}
                            onClick={() => openNotification(n)}
                            className={`w-full text-left px-4 py-3 border-b transition-colors ${
                              emergencyPriorities.has(n.requestPriority)
                                ? "border-red-100 bg-red-50/80 hover:bg-red-100/70"
                                : `border-gray-50 hover:bg-pink-50 ${!n.read ? "bg-pink-50/50" : ""}`
                            }`}
                          >
                            <div className="flex items-start gap-2">
                              <div
                                className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                                  emergencyPriorities.has(n.requestPriority)
                                    ? "bg-red-500 animate-pulse"
                                    : n.type === "success"
                                    ? "bg-green-400"
                                    : n.type === "error"
                                    ? "bg-red-400"
                                    : n.type === "warning"
                                    ? "bg-yellow-400"
                                    : "bg-pink-400"
                                }`}
                              />
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-gray-800">{n.title}</p>
                                <p className="text-xs text-gray-500 mt-0.5 whitespace-pre-line leading-relaxed">
                                  {n.message}
                                </p>
                                {n.requestId && (
                                  <p className="text-[11px] font-medium text-pink-600 mt-1">
                                    Xem yêu cầu #{n.requestId}
                                  </p>
                                )}
                                <p className="text-[10px] text-gray-400 mt-1">
                                  {new Date(n.createdAt).toLocaleString("vi-VN")}
                                </p>
                              </div>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* User avatar / Login button */}
              <div className="flex items-center gap-2">
                {isLoggedIn ? (
                  <>
                    <Link
                      to={currentRole === "user" ? "/profile" : currentRole === "company" ? "/company" : "/admin"}
                      className="block"
                      title="Hồ sơ"
                    >
                      {avatarSource ? (
                        <img
                          src={avatarSource}
                          alt={currentUser?.name || "Avatar"}
                          className="h-8 w-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-linear-to-br from-pink-400 to-pink-400 flex items-center justify-center text-white text-sm font-bold">
                          {avatarInitial}
                        </div>
                      )}
                    </Link>
                    <button
                      onClick={() => { logout(); navigate("/login"); }}
                      className="hidden sm:flex items-center gap-1 text-sm text-gray-500 hover:text-red-500 transition-colors"
                      title="Đăng xuất"
                    >
                      <LogOut size={16} />
                    </button>
                  </>
                ) : (
                  <Link
                    to="/login"
                    className="flex items-center gap-1.5 bg-linear-to-r from-pink-500 to-pink-400 text-white px-4 py-2 rounded-xl text-sm font-medium hover:shadow-md hover:shadow-pink-200 transition-all"
                  >
                    <User size={15} />
                    Đăng nhập
                  </Link>
                )}
              </div>

              {/* Mobile menu */}
              <button
                className="md:hidden p-2 rounded-full hover:bg-pink-50"
                onClick={() => setMenuOpen(!menuOpen)}
              >
                {menuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden bg-white border-t border-pink-100 px-4 py-3 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMenuOpen(false)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive(link.to)
                    ? "bg-linear-to-r from-pink-100 to-pink-100 text-pink-700"
                    : "text-gray-600 hover:bg-pink-50"
                }`}
              >
                {link.icon}
                {link.label}
              </Link>
            ))}
            <div className="pt-2 border-t border-pink-50">
              {isLoggedIn ? (
                <>
                  {currentRole === "user" && (
                    <Link
                      to="/profile"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-gray-600 hover:bg-pink-50 transition-colors"
                    >
                      <User size={16} />
                      Hồ sơ cá nhân
                    </Link>
                  )}
                  <button
                    onClick={() => { logout(); setMenuOpen(false); navigate("/login"); }}
                    className="w-full flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-red-500 hover:bg-red-50 transition-colors mt-1"
                  >
                    <LogOut size={16} />
                    Đăng xuất
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-pink-600 font-medium hover:bg-pink-50 transition-colors"
                >
                  <User size={16} />
                  Đăng nhập
                </Link>
              )}
            </div>
          </div>
        )}
      </header>}

      {/* Main content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Emergency SOS floating button */}
      {currentRole === "user" && !isAdminShell && <EmergencySOS />}

      {/* Footer */}
      {!isAdminShell && <footer className="bg-white border-t border-pink-100 mt-16">
        <div className="max-w-7xl mx-auto px-4 py-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-xl bg-linear-to-br from-pink-400 to-pink-400 flex items-center justify-center">
                  <Car size={16} className="text-white" />
                </div>
                <span className="font-bold text-pink-600">RescueS</span>
                <span className="font-bold text-blue-500">O</span>
                <span className="font-bold text-pink-600">S</span>
              </div>
              <p className="text-sm text-gray-500">
                Nền tảng kết nối cứu hộ giao thông nhanh chóng, tin cậy và chuyên nghiệp.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-700 mb-3">Dịch vụ</h4>
              <ul className="space-y-1.5 text-sm text-gray-500">
                <li className="hover:text-pink-500 cursor-pointer transition-colors">Vá lốp / Thay lốp</li>
                <li className="hover:text-pink-500 cursor-pointer transition-colors">Kéo xe / Cẩu xe</li>
                <li className="hover:text-pink-500 cursor-pointer transition-colors">Thay ắc quy</li>
                <li className="hover:text-pink-500 cursor-pointer transition-colors">Nạp nhiên liệu</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-700 mb-3">Hỗ trợ</h4>
              <ul className="space-y-1.5 text-sm text-gray-500">
                <li className="hover:text-pink-500 cursor-pointer transition-colors">Câu hỏi thường gặp</li>
                <li className="hover:text-pink-500 cursor-pointer transition-colors">Liên hệ</li>
                <li className="hover:text-pink-500 cursor-pointer transition-colors">Điều khoản dịch vụ</li>
                <li className="hover:text-pink-500 cursor-pointer transition-colors">Chính sách bảo mật</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-700 mb-3">Liên hệ</h4>
              <ul className="space-y-1.5 text-sm text-gray-500">
                <li>📞 1800 6789 (Miễn phí)</li>
                <li>✉️ support@rescuesos.vn</li>
                <li>📍 Hà Nội, Việt Nam</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-pink-50 mt-8 pt-6 text-center text-xs text-gray-400">
            © 2026 RescueSOS. Hệ thống hỗ trợ sự cố xe trên đường.
          </div>
        </div>
      </footer>}
    </div>
  );
}
