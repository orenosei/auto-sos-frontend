import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Car, User, Building2, ShieldCheck, ArrowRight, Eye, EyeOff } from "lucide-react";
import { useApp } from "../context/useApp";

export default function Login() {
  const { login, register, loginDemo } = useApp();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("login");
  const [selectedRole, setSelectedRole] = useState("user");
  const [showPassword, setShowPassword] = useState(false);
  const [loginForm, setLoginForm] = useState({ identifier: "", password: "" });
  const [userRegisterForm, setUserRegisterForm] = useState({
    user_name: "",
    full_name: "",
    user_phone: "",
    user_email: "",
    password: "",
  });
  const [companyRegisterForm, setCompanyRegisterForm] = useState({
    company_name: "",
    company_phone: "",
    password: "",
    relative_address: "",
    rescue_area: "",
    company_license: "",
    lat: "",
    lng: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const roles = [
    {
      role: "user",
      label: "Người dùng",
      desc: "Tôi cần hỗ trợ khi xe gặp sự cố",
      icon: <User className="w-5 h-5" />,
      color: "pink",
    },
    {
      role: "company",
      label: "Công ty cứu hộ",
      desc: "Tôi cung cấp dịch vụ cứu hộ",
      icon: <Building2 className="w-5 h-5" />,
      color: "blue",
    },
    {
      role: "admin",
      label: "Quản trị viên",
      desc: "Quản lý hệ thống",
      icon: <ShieldCheck className="w-5 h-5" />,
      color: "purple",
    },
  ];

  const roleOptions =
    activeTab === "register" ? roles.filter((r) => r.role !== "admin") : roles;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      if (activeTab === "register") {
        if (selectedRole === "admin") {
          throw new Error("Hiện chưa hỗ trợ đăng ký tài khoản admin");
        }

        if (selectedRole === "company") {
          const lat = Number.parseFloat(companyRegisterForm.lat);
          const lng = Number.parseFloat(companyRegisterForm.lng);
          if (!companyRegisterForm.company_name.trim()) {
            throw new Error("Vui lòng nhập tên công ty");
          }
          if (!companyRegisterForm.company_phone.trim()) {
            throw new Error("Vui lòng nhập số điện thoại");
          }
          if (!companyRegisterForm.password) {
            throw new Error("Vui lòng nhập mật khẩu");
          }
          if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
            throw new Error("Vui lòng nhập tọa độ GPS hợp lệ (lat/lng)");
          }

          await register("company", {
            company_name: companyRegisterForm.company_name.trim(),
            password: companyRegisterForm.password,
            relative_address: companyRegisterForm.relative_address.trim() || null,
            absolute_address: { lat, lng },
            company_phone: companyRegisterForm.company_phone.trim(),
            rescue_area: companyRegisterForm.rescue_area.trim() || null,
            company_license: companyRegisterForm.company_license.trim() || null,
          });
          navigate("/");
          return;
        }

        if (!userRegisterForm.user_name.trim()) {
          throw new Error("Vui lòng nhập tên đăng nhập");
        }
        if (!userRegisterForm.user_phone.trim()) {
          throw new Error("Vui lòng nhập số điện thoại");
        }
        if (!userRegisterForm.password) {
          throw new Error("Vui lòng nhập mật khẩu");
        }

        await register("user", {
          user_name: userRegisterForm.user_name.trim(),
          password: userRegisterForm.password,
          full_name: userRegisterForm.full_name.trim() || null,
          user_phone: userRegisterForm.user_phone.trim(),
          user_email: userRegisterForm.user_email.trim() || null,
          avatar_url: null,
        });
        navigate("/");
        return;
      }

      // backend dùng field "identifier" (user_name / phone / email)
      await login(selectedRole, loginForm.identifier.trim(), loginForm.password);
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đăng nhập thất bại");
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickDemo = (role) => {
    loginDemo(role);
    navigate("/");
  };

  const colorClass = {
    pink: {
      border: "border-pink-500 bg-pink-50",
      icon: "bg-pink-100 text-pink-600",
    },
    blue: {
      border: "border-blue-500 bg-blue-50",
      icon: "bg-blue-100 text-blue-600",
    },
    purple: {
      border: "border-purple-500 bg-purple-50",
      icon: "bg-purple-100 text-purple-600",
    },
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center bg-linear-to-br from-pink-50 to-blue-50 py-12 px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-linear-to-br from-pink-500 to-blue-400 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Car className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Chào mừng đến RescueGo</h1>
          <p className="text-gray-500 mt-1.5 text-sm">Hệ thống hỗ trợ sự cố xe trên đường</p>
        </div>

        {/* Tabs */}
        <div className="bg-white/80 p-1 rounded-xl flex gap-1 mb-6 border border-pink-100">
          {["login", "register"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab
                  ? "bg-linear-to-r from-pink-500 to-pink-400 text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab === "login" ? "Đăng nhập" : "Đăng ký"}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-pink-100 p-6">
          {/* Role Selection */}
          <div className="mb-5">
            <label className="text-sm font-medium text-gray-700 mb-2.5 block">Tôi là</label>
            <div className="space-y-2">
              {roleOptions.map((r) => {
                const colors = colorClass[r.color] ?? colorClass.pink;
                const isSelected = selectedRole === r.role;
                return (
                  <button
                    key={r.role}
                    onClick={() => setSelectedRole(r.role)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                      isSelected
                        ? `${colors.border} border-2`
                        : "border-gray-100 hover:border-pink-200 bg-gray-50"
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${colors.icon}`}>
                      {r.icon}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-gray-900">{r.label}</div>
                      <div className="text-xs text-gray-500">{r.desc}</div>
                    </div>
                    {isSelected && (
                      <div className="ml-auto">
                        <div className="w-5 h-5 rounded-full bg-pink-500 flex items-center justify-center">
                          <div className="w-2 h-2 rounded-full bg-white" />
                        </div>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {activeTab === "login" ? (
              <>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                    {selectedRole === "company"
                      ? "Tên công ty / SĐT"
                      : "Email / SĐT / Tên đăng nhập"}
                  </label>
                  <input
                    type="text"
                    placeholder={
                      selectedRole === "user"
                        ? "email / số điện thoại / username"
                        : selectedRole === "company"
                        ? "tên công ty / số điện thoại"
                        : "email / số điện thoại / username"
                    }
                    value={loginForm.identifier}
                    onChange={(e) =>
                      setLoginForm((f) => ({ ...f, identifier: e.target.value }))
                    }
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100 transition-all"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1.5 block">Mật khẩu</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={loginForm.password}
                      onChange={(e) =>
                        setLoginForm((f) => ({ ...f, password: e.target.value }))
                      }
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 pr-10 text-sm focus:outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </>
            ) : selectedRole === "company" ? (
              <>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1.5 block">Tên công ty *</label>
                  <input
                    type="text"
                    value={companyRegisterForm.company_name}
                    onChange={(e) =>
                      setCompanyRegisterForm((f) => ({
                        ...f,
                        company_name: e.target.value,
                      }))
                    }
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100 transition-all"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1.5 block">Số điện thoại *</label>
                  <input
                    type="text"
                    value={companyRegisterForm.company_phone}
                    onChange={(e) =>
                      setCompanyRegisterForm((f) => ({
                        ...f,
                        company_phone: e.target.value,
                      }))
                    }
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100 transition-all"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1.5 block">Địa chỉ (mô tả)</label>
                  <input
                    type="text"
                    value={companyRegisterForm.relative_address}
                    onChange={(e) =>
                      setCompanyRegisterForm((f) => ({
                        ...f,
                        relative_address: e.target.value,
                      }))
                    }
                    placeholder="VD: 12 Nguyễn Trãi, Q.1"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100 transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1.5 block">Vĩ độ (lat) *</label>
                    <input
                      type="text"
                      value={companyRegisterForm.lat}
                      onChange={(e) =>
                        setCompanyRegisterForm((f) => ({ ...f, lat: e.target.value }))
                      }
                      placeholder="21.0278"
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100 transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1.5 block">Kinh độ (lng) *</label>
                    <input
                      type="text"
                      value={companyRegisterForm.lng}
                      onChange={(e) =>
                        setCompanyRegisterForm((f) => ({ ...f, lng: e.target.value }))
                      }
                      placeholder="105.8342"
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1.5 block">Khu vực cứu hộ</label>
                  <input
                    type="text"
                    value={companyRegisterForm.rescue_area}
                    onChange={(e) =>
                      setCompanyRegisterForm((f) => ({
                        ...f,
                        rescue_area: e.target.value,
                      }))
                    }
                    placeholder="VD: Q.1, Q.3, Bình Thạnh"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100 transition-all"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1.5 block">Giấy phép</label>
                  <input
                    type="text"
                    value={companyRegisterForm.company_license}
                    onChange={(e) =>
                      setCompanyRegisterForm((f) => ({
                        ...f,
                        company_license: e.target.value,
                      }))
                    }
                    placeholder="Số giấy phép hoặc link"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100 transition-all"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1.5 block">Mật khẩu *</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={companyRegisterForm.password}
                      onChange={(e) =>
                        setCompanyRegisterForm((f) => ({
                          ...f,
                          password: e.target.value,
                        }))
                      }
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 pr-10 text-sm focus:outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1.5 block">Tên đăng nhập *</label>
                  <input
                    type="text"
                    value={userRegisterForm.user_name}
                    onChange={(e) =>
                      setUserRegisterForm((f) => ({ ...f, user_name: e.target.value }))
                    }
                    placeholder="VD: nguyenvana"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100 transition-all"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1.5 block">Họ và tên</label>
                  <input
                    type="text"
                    value={userRegisterForm.full_name}
                    onChange={(e) =>
                      setUserRegisterForm((f) => ({ ...f, full_name: e.target.value }))
                    }
                    placeholder="Nguyễn Văn A"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100 transition-all"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1.5 block">Số điện thoại *</label>
                  <input
                    type="text"
                    value={userRegisterForm.user_phone}
                    onChange={(e) =>
                      setUserRegisterForm((f) => ({ ...f, user_phone: e.target.value }))
                    }
                    placeholder="0901xxxxxx"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100 transition-all"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1.5 block">Email</label>
                  <input
                    type="email"
                    value={userRegisterForm.user_email}
                    onChange={(e) =>
                      setUserRegisterForm((f) => ({ ...f, user_email: e.target.value }))
                    }
                    placeholder="nguyenvanan@email.com"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100 transition-all"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1.5 block">Mật khẩu *</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={userRegisterForm.password}
                      onChange={(e) =>
                        setUserRegisterForm((f) => ({ ...f, password: e.target.value }))
                      }
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 pr-10 text-sm focus:outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </>
            )}

            {error && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-linear-to-r from-pink-500 to-pink-400 hover:from-pink-600 hover:to-pink-500 text-white font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-md shadow-pink-200 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {activeTab === "login" ? "Đăng nhập" : "Tạo tài khoản"}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-gray-100" />
            <span className="text-xs text-gray-400">HOẶC THỬ DEMO</span>
            <div className="flex-1 h-px bg-gray-100" />
          </div>

          {/* Quick Demo */}
          <div className="space-y-2">
            <p className="text-xs text-gray-500 text-center mb-2">Truy cập nhanh (Demo)</p>
            {roles.map((r) => (
              <button
                key={r.role}
                onClick={() => handleQuickDemo(r.role)}
                className="w-full flex items-center gap-2 py-2.5 px-4 rounded-xl border border-dashed border-gray-200 hover:border-pink-300 hover:bg-pink-50 transition-all text-sm text-gray-600 hover:text-pink-600"
              >
                {r.icon}
                <span>
                  Vào với vai trò <strong>{r.label}</strong>
                </span>
                <ArrowRight className="w-4 h-4 ml-auto" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}