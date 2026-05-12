import { useState } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import {
  Car,
  Bell,
  Menu,
  X,
  ChevronDown,
  LogOut,
  User,
  Building2,
  ShieldCheck,
  Home,
  Search,
  Users,
  LayoutDashboard,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { EmergencySOS } from "./EmergencySOS";

const roleLabels = {
  user: "Người dùng",
  company: "Công ty cứu hộ",
  admin: "Quản trị viên",
};

const roleIcons = {
  user: <User size={16} />,
  company: <Building2 size={16} />,
  admin: <ShieldCheck size={16} />,
};

const roleBadgeColors = {
  user: "bg-pink-100 text-pink-700",
  company: "bg-blue-100 text-blue-700",
  admin: "bg-purple-100 text-purple-700",
};

export default function Root() {
  const { currentRole, setCurrentRole, notifications, markAllRead, unreadCount, isLoggedIn, logout, currentUser } = useApp();
  const [menuOpen, setMenuOpen] = useState(false);
  const [roleDropdown, setRoleDropdown] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const navLinks = [
    { to: "/", label: "Trang chủ", icon: <Home size={16} /> },
    { to: "/find-services", label: "Tìm dịch vụ", icon: <Search size={16} /> },
    { to: "/community", label: "Cộng đồng", icon: <Users size={16} /> },
    ...(currentRole === "user"
      ? [{ to: "/dashboard", label: "Dashboard", icon: <LayoutDashboard size={16} /> }]
      : currentRole === "company"
      ? [{ to: "/company", label: "Cổng công ty", icon: <Building2 size={16} /> }]
      : [{ to: "/admin", label: "Quản trị", icon: <ShieldCheck size={16} /> }]),
  ];

  const isActive = (to) =>
    to === "/" ? location.pathname === "/" : location.pathname.startsWith(to);

  return (
    <div className="min-h-screen bg-linear-to-br from-pink-50 via-white to-blue-50">
      {/* Navbar */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-pink-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-9 h-9 rounded-xl bg-linear-to-br from-pink-400 to-blue-400 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                <Car size={20} className="text-white" />
              </div>
              <div className="hidden sm:block">
                <span className="font-bold text-pink-600 text-lg leading-none">Rescue</span>
                <span className="font-bold text-blue-500 text-lg leading-none">Go</span>
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
                      ? "bg-linear-to-r from-pink-100 to-blue-100 text-pink-700"
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
              {/* Role switcher */}
              <div className="relative hidden sm:block">
                <button
                  onClick={() => { setRoleDropdown(!roleDropdown); setNotifOpen(false); }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${roleBadgeColors[currentRole]} border-current/20`}
                >
                  {roleIcons[currentRole]}
                  {roleLabels[currentRole]}
                  <ChevronDown size={12} />
                </button>
                {roleDropdown && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl shadow-xl border border-pink-100 overflow-hidden z-50">
                    {["user", "company", "admin"].map((role) => (
                      <button
                        key={role}
                        onClick={() => {
                          setCurrentRole(role);
                          setRoleDropdown(false);
                          navigate(role === "user" ? "/dashboard" : role === "company" ? "/company" : "/admin");
                        }}
                        className={`w-full flex items-center gap-2 px-4 py-3 text-sm hover:bg-pink-50 transition-colors ${
                          currentRole === role ? "text-pink-600 font-semibold bg-pink-50" : "text-gray-700"
                        }`}
                      >
                        {roleIcons[role]}
                        {roleLabels[role]}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Notifications */}
              <div className="relative">
                <button
                  onClick={() => { setNotifOpen(!notifOpen); setRoleDropdown(false); }}
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
                          <div
                            key={n.id}
                            className={`px-4 py-3 border-b border-gray-50 ${!n.read ? "bg-pink-50/50" : ""}`}
                          >
                            <div className="flex items-start gap-2">
                              <div
                                className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                                  n.type === "success"
                                    ? "bg-green-400"
                                    : n.type === "error"
                                    ? "bg-red-400"
                                    : n.type === "warning"
                                    ? "bg-yellow-400"
                                    : "bg-blue-400"
                                }`}
                              />
                              <div>
                                <p className="text-sm font-medium text-gray-800">{n.title}</p>
                                <p className="text-xs text-gray-500 mt-0.5">{n.message}</p>
                                <p className="text-[10px] text-gray-400 mt-1">
                                  {new Date(n.createdAt).toLocaleString("vi-VN")}
                                </p>
                              </div>
                            </div>
                          </div>
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
                    <div className="w-8 h-8 rounded-full bg-linear-to-br from-pink-400 to-blue-400 flex items-center justify-center text-white text-sm font-bold">
                      {currentUser?.avatar ?? "U"}
                    </div>
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
                    ? "bg-linear-to-r from-pink-100 to-blue-100 text-pink-700"
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
                  <p className="text-xs text-gray-400 px-4 mb-1">Chế độ xem:</p>
                  {["user", "company", "admin"].map((role) => (
                    <button
                      key={role}
                      onClick={() => {
                        setCurrentRole(role);
                        setMenuOpen(false);
                        navigate(role === "user" ? "/dashboard" : role === "company" ? "/company" : "/admin");
                      }}
                      className={`w-full flex items-center gap-2 px-4 py-2 rounded-xl text-sm ${
                        currentRole === role ? "text-pink-600 font-semibold" : "text-gray-600"
                      }`}
                    >
                      {roleIcons[role]}
                      {roleLabels[role]}
                    </button>
                  ))}
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
      </header>

      {/* Main content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Emergency SOS floating button */}
      <EmergencySOS />

      {/* Footer */}
      <footer className="bg-white border-t border-pink-100 mt-16">
        <div className="max-w-7xl mx-auto px-4 py-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-xl bg-linear-to-br from-pink-400 to-blue-400 flex items-center justify-center">
                  <Car size={16} className="text-white" />
                </div>
                <span className="font-bold text-gray-800">RescueGo</span>
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
                <li>✉️ support@rescuego.vn</li>
                <li>📍 TP. Hồ Chí Minh, Việt Nam</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-pink-50 mt-8 pt-6 text-center text-xs text-gray-400">
            © 2026 RescueGo. Hệ thống hỗ trợ sự cố xe trên đường.
          </div>
        </div>
      </footer>
    </div>
  );
}