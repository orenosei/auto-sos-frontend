import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Car,
  Bell,
  Menu,
  X,
  LogOut,
  User,
  Building2,
  ShieldCheck,
  ChevronDown,
} from "lucide-react";
import { useApp } from "../context/useApp";

export function Layout({ children }) {
  const { currentUser, isLoggedIn, logout, currentRole } = useApp();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
    setProfileOpen(false);
  };

  const getDashboardLink = () => {
    if (!currentUser) return "/";
    if (currentRole === "user") return "/dashboard";
    if (currentRole === "company") return "/company";
    return "/admin";
  };

  const roleIcon = () => {
    if (!currentUser) return null;
    if (currentRole === "user") return <User className="w-4 h-4" />;
    if (currentRole === "company") return <Building2 className="w-4 h-4" />;
    return <ShieldCheck className="w-4 h-4" />;
  };

  const roleLabel = () => {
    if (!currentUser) return "";
    if (currentRole === "user") return "Người dùng";
    if (currentRole === "company") return "Công ty cứu hộ";
    return "Quản trị viên";
  };

  const navLinks = [
    { label: "Trang chủ", href: "/" },
    { label: "Dịch vụ", href: "/find-services" },
    { label: "Cộng đồng", href: "/community" },
  ];

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

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Top Alert Bar */}
      <div className="bg-pink-500 text-white text-center py-1.5 text-sm font-medium">
        🚨 Khẩn cấp? Gọi ngay: <strong>1800 6789</strong> (Miễn phí 24/7)
      </div>

      {/* Navbar */}
      <nav className="bg-white shadow-sm sticky top-0 z-50 border-b border-pink-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2">
              <div className="w-9 h-9 bg-linear-to-br from-pink-500 to-pink-400 rounded-xl flex items-center justify-center shadow-md">
                <Car className="w-5 h-5 text-white" />
              </div>
              <div className="hidden sm:block">
                <span className="text-pink-600 font-bold text-lg">RescueS</span>
                <span className="text-blue-500 font-bold text-lg">O</span>
                <span className="text-pink-600 font-bold text-lg">S</span>
                <span className="block text-gray-400 text-xs leading-none">Cứu hộ tận nơi</span>
              </div>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-6">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className={`text-sm font-medium transition-colors ${
                    location.pathname === link.href
                      ? "text-pink-600"
                      : "text-gray-600 hover:text-pink-500"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Right side */}
            <div className="flex items-center gap-3">
              {isLoggedIn ? (
                <>
                  {/* Notification */}
                  <button className="relative p-2 text-gray-500 hover:text-pink-500 transition-colors">
                    <Bell className="w-5 h-5" />
                    <span className="absolute top-1 right-1 w-2 h-2 bg-pink-500 rounded-full"></span>
                  </button>

                  {/* Dashboard link */}
                  <Link
                    to={getDashboardLink()}
                    className="hidden md:block text-sm font-medium text-pink-600 hover:text-pink-700 bg-pink-50 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    Dashboard
                  </Link>

                  {/* Profile Dropdown */}
                  <div className="relative">
                    <button
                      onClick={() => setProfileOpen(!profileOpen)}
                      className="flex items-center gap-2 bg-gray-100 rounded-full pl-1 pr-3 py-1 hover:bg-gray-200 transition-colors"
                    >
                      {avatarSource ? (
                        <img
                          src={avatarSource}
                          alt={currentUser?.name || "Avatar"}
                          className="h-8 w-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 bg-linear-to-br from-pink-400 to-pink-400 rounded-full flex items-center justify-center text-white text-xs font-bold">
                          {avatarInitial}
                        </div>
                      )}
                      <span className="hidden sm:block text-sm font-medium text-gray-700 max-w-30 truncate">
                        {currentUser?.name}
                      </span>
                      <ChevronDown className="w-4 h-4 text-gray-500" />
                    </button>

                    {profileOpen && (
                      <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50">
                        <div className="px-4 py-2 border-b border-gray-100">
                          <p className="text-sm font-semibold text-gray-800">{currentUser?.name}</p>
                          <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                            {roleIcon()}
                            <span>{roleLabel()}</span>
                          </div>
                        </div>
                        <Link
                          to={getDashboardLink()}
                          onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-pink-50 hover:text-pink-600 transition-colors"
                        >
                          <User className="w-4 h-4" />
                          Dashboard của tôi
                        </Link>
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          Đăng xuất
                        </button>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    to="/login"
                    className="hidden sm:block text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    Đăng nhập
                  </Link>
                  <Link
                    to="/login"
                    className="bg-linear-to-r from-pink-500 to-pink-400 text-white text-sm font-medium px-4 py-2 rounded-lg hover:from-pink-600 hover:to-pink-500 transition-all shadow-sm"
                  >
                    Bắt đầu
                  </Link>
                </div>
              )}

              {/* Mobile menu toggle */}
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="md:hidden p-2 text-gray-500 hover:text-gray-700"
              >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden bg-white border-t border-gray-100 px-4 py-3 space-y-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                onClick={() => setMobileOpen(false)}
                className="block py-2 text-gray-600 hover:text-pink-500 text-sm font-medium"
              >
                {link.label}
              </Link>
            ))}
            {isLoggedIn && (
              <Link
                to={getDashboardLink()}
                onClick={() => setMobileOpen(false)}
                className="block py-2 text-pink-600 font-medium text-sm"
              >
                Dashboard
              </Link>
            )}
          </div>
        )}
      </nav>

      {/* Page Content */}
      <main className="flex-1">{children}</main>

      {/* Click outside to close dropdown */}
      {profileOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />
      )}
    </div>
  );
}
