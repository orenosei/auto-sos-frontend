import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Car,
  MapPin,
  Star,
  Clock,
  Shield,
  Phone,
  ChevronRight,
  Wrench,
  Zap,
  Fuel,
  AlertTriangle,
  Users,
  CheckCircle2,
  ArrowRight,
  Building2,
} from "lucide-react";
import { getCompanies, getCompanyServices } from "../api/companies";
import { getServices } from "../api/services";
import { toUiCompany, toUiService } from "../api/mappers";

const heroImg = "https://images.unsplash.com/photo-1773408285431-cfd94cc861be?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyb2Fkc2lkZSUyMGNhciUyMGFzc2lzdGFuY2UlMjBoaWdod2F5fGVufDF8fHx8MTc3NDUwNjI5MHww&ixlib=rb-4.1.0&q=80&w=1080";
const towImg = "https://images.unsplash.com/photo-1709330181144-c7e6f518cb88?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0b3clMjB0cnVjayUyMHJlc2N1ZSUyMHZlaGljbGUlMjByb2FkfGVufDF8fHx8MTc3NDUwNjI5MHww&ixlib=rb-4.1.0&q=80&w=1080";

const serviceIconMap = {
  "Vá lốp / Thay lốp": <Wrench size={24} />,
  "Kéo xe / Cẩu xe": <Car size={24} />,
  "Thay / Nạp ắc quy": <Zap size={24} />,
  "Nạp nhiên liệu": <Fuel size={24} />,
  "Sửa chữa tại chỗ": <Wrench size={24} />,
  "Hỗ trợ tai nạn": <AlertTriangle size={24} />,
};

const serviceColors = [
  "from-pink-400 to-pink-300",
  "from-pink-400 to-pink-300",
  "from-purple-400 to-purple-300",
  "from-orange-400 to-orange-300",
  "from-pink-400 to-pink-300",
  "from-red-400 to-red-300",
];

const stats = [
  { label: "Yêu cầu cứu hộ", value: "12.800+", icon: <Car size={20} /> },
  { label: "Công ty đối tác", value: "47+", icon: <Building2 size={20} /> },
  { label: "Người dùng tin tưởng", value: "34.200+", icon: <Users size={20} /> },
  { label: "Đánh giá trung bình", value: "4.8 ⭐", icon: <Star size={20} /> },
];

const howItWorks = [
  {
    step: "01",
    title: "Đăng nhập & Chọn dịch vụ",
    desc: "Đăng nhập tài khoản và chọn loại sự cố bạn đang gặp phải.",
    color: "bg-pink-100 text-pink-600",
  },
  {
    step: "02",
    title: "Nhập thông tin & Vị trí",
    desc: "Mô tả tình trạng xe và chia sẻ vị trí GPS của bạn.",
    color: "bg-pink-100 text-pink-600",
  },
  {
    step: "03",
    title: "Chọn đơn vị cứu hộ",
    desc: "Hệ thống gợi ý các công ty cứu hộ gần nhất với giá cả minh bạch.",
    color: "bg-purple-100 text-purple-600",
  },
  {
    step: "04",
    title: "Theo dõi & Hoàn tất",
    desc: "Theo dõi trạng thái theo thời gian thực và đánh giá dịch vụ sau khi hoàn tất.",
    color: "bg-pink-100 text-pink-600",
  },
];

export default function Home() {
  const [services, setServices] = useState([]);
  const [companies, setCompanies] = useState([]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const [svc, comps] = await Promise.all([getServices(), getCompanies()]);
        if (cancelled) return;

        setServices(svc.map(toUiService));

        // Load services per company (for the "services" chips)
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

        if (!cancelled) setCompanies(withServices);
      } catch (e) {
        // keep UI functional even if backend is down
        console.error(e);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const topServices = useMemo(() => services.slice(0, 6), [services]);
  const topCompanies = useMemo(() => companies.slice(0, 4), [companies]);

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-br from-pink-100 via-pink-50 to-pink-100 opacity-70" />
        <div
          className="absolute inset-0 bg-cover bg-center opacity-10"
          style={{ backgroundImage: `url(${heroImg})` }}
        />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-pink-100 text-pink-700 px-4 py-1.5 rounded-full text-sm font-medium mb-6">
                <span className="w-2 h-2 rounded-full bg-pink-500 animate-pulse" />
                Hệ thống cứu hộ 24/7
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight mb-4">
                Gặp sự cố xe?{" "}
                <span className="bg-linear-to-r from-pink-500 to-pink-500 bg-clip-text text-transparent">
                  Chúng tôi đến ngay!
                </span>
              </h1>
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                Nền tảng kết nối bạn với các đơn vị cứu hộ xe chuyên nghiệp gần nhất.
                Nhanh chóng, tin cậy và minh bạch chi phí.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  to="/dashboard"
                  className="flex items-center justify-center gap-2 bg-linear-to-r from-pink-500 to-pink-400 text-white px-8 py-3.5 rounded-2xl font-semibold shadow-lg shadow-pink-200 hover:shadow-pink-300 hover:scale-105 transition-all"
                >
                  <Phone size={18} />
                  Gửi yêu cầu cứu hộ
                </Link>
                <Link
                  to="/find-services"
                  className="flex items-center justify-center gap-2 bg-white text-pink-600 border border-pink-200 px-8 py-3.5 rounded-2xl font-semibold hover:bg-pink-50 transition-all"
                >
                  <MapPin size={18} />
                  Tìm dịch vụ gần nhất
                </Link>
              </div>
              <div className="flex items-center gap-4 mt-8">
                <div className="flex -space-x-2">
                  {["A", "B", "C", "D"].map((l, i) => (
                    <div
                      key={i}
                      className="w-8 h-8 rounded-full border-2 border-white bg-linear-to-br from-pink-300 to-pink-300 flex items-center justify-center text-white text-xs font-bold"
                    >
                      {l}
                    </div>
                  ))}
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} size={14} className="fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-sm text-gray-500">34.200+ người đã tin dùng</p>
                </div>
              </div>
            </div>
            <div className="hidden md:block">
              <div className="relative">
                <div className="absolute -top-6 -left-6 w-72 h-72 bg-pink-200 rounded-full opacity-30 blur-3xl" />
                <div className="absolute -bottom-6 -right-6 w-72 h-72 bg-pink-200 rounded-full opacity-30 blur-3xl" />
                <img
                  src={towImg}
                  alt="Tow truck"
                  className="relative rounded-3xl shadow-2xl object-cover w-full h-80"
                />
                {/* Floating card */}
                <div className="absolute -bottom-4 -left-4 bg-white rounded-2xl shadow-xl p-4 flex items-center gap-3 border border-pink-100">
                  <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                    <CheckCircle2 size={20} className="text-green-500" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Cứu hộ hoàn tất</p>
                    <p className="text-sm font-semibold text-gray-800">Vá lốp thành công</p>
                  </div>
                </div>
                <div className="absolute -top-4 -right-4 bg-white rounded-2xl shadow-xl p-3 flex items-center gap-2 border border-pink-100">
                  <Clock size={16} className="text-pink-500" />
                  <div>
                    <p className="text-xs text-gray-500">Thời gian đến</p>
                    <p className="text-sm font-semibold text-pink-600">~15 phút</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-10 bg-white border-y border-pink-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((s, i) => (
              <div key={i} className="text-center">
                <div className="flex justify-center mb-2">
                  <div className="w-10 h-10 rounded-xl bg-linear-to-br from-pink-100 to-pink-100 flex items-center justify-center text-pink-600">
                    {s.icon}
                  </div>
                </div>
                <p className="text-2xl font-bold text-gray-800">{s.value}</p>
                <p className="text-sm text-gray-500">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">
            Dịch vụ cứu hộ đa dạng
          </h2>
          <p className="text-gray-500 max-w-xl mx-auto">
            Từ vá lốp, thay ắc quy đến kéo xe — chúng tôi hỗ trợ mọi tình huống sự cố trên đường
          </p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {topServices.map((service, i) => (
            <Link
              key={service.id}
              to="/find-services"
              className="group flex flex-col items-center p-4 bg-white rounded-2xl border border-pink-100 hover:border-pink-300 hover:shadow-lg hover:shadow-pink-100 transition-all text-center"
            >
              <div
                className={`w-14 h-14 rounded-2xl bg-linear-to-br ${serviceColors[i]} flex items-center justify-center text-white mb-3 group-hover:scale-110 transition-transform shadow-md`}
              >
                {serviceIconMap[service.name] || <Wrench size={24} />}
              </div>
              <p className="text-sm font-medium text-gray-700 leading-tight">{service.name}</p>

            </Link>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 bg-linear-to-br from-pink-50 to-pink-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Cách thức hoạt động</h2>
            <p className="text-gray-500">Chỉ vài bước đơn giản để nhận được hỗ trợ</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {howItWorks.map((step, i) => (
              <div key={i} className="relative">
                {i < howItWorks.length - 1 && (
                  <div className="hidden lg:block absolute top-8 left-full w-full h-0.5 bg-linear-to-r from-pink-200 to-pink-200 z-0" />
                )}
                <div className="relative bg-white rounded-2xl p-6 border border-pink-100 shadow-sm hover:shadow-md transition-shadow">
                  <div className={`w-12 h-12 rounded-2xl ${step.color} flex items-center justify-center font-bold text-lg mb-4`}>
                    {step.step}
                  </div>
                  <h3 className="font-semibold text-gray-800 mb-2">{step.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 bg-linear-to-r from-pink-500 to-pink-400 text-white px-8 py-3.5 rounded-2xl font-semibold shadow-lg shadow-pink-200 hover:scale-105 transition-all"
            >
              Bắt đầu ngay
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* Top Companies */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-1">Đơn vị cứu hộ hàng đầu</h2>
            <p className="text-gray-500">Được đánh giá cao bởi hàng ngàn khách hàng</p>
          </div>
          <Link
            to="/find-services"
            className="hidden sm:flex items-center gap-1 text-pink-600 font-medium hover:text-pink-700 transition-colors"
          >
            Xem tất cả <ChevronRight size={18} />
          </Link>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {topCompanies.map((company) => (
            <Link
              key={company.id}
              to="/find-services"
              className="group bg-white rounded-2xl border border-pink-100 p-5 hover:border-pink-300 hover:shadow-lg hover:shadow-pink-100 transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-12 h-12 rounded-xl bg-linear-to-br from-pink-100 to-pink-100 flex items-center justify-center text-2xl">
                  🚑
                </div>
                {company.verified && (
                  <span className="flex items-center gap-1 text-[10px] font-medium text-pink-600 bg-pink-50 px-2 py-0.5 rounded-full">
                    <Shield size={10} />
                    Đã xác minh
                  </span>
                )}
              </div>
              <h3 className="font-semibold text-gray-800 mb-1 group-hover:text-pink-600 transition-colors">
                {company.name}
              </h3>
              <div className="flex items-center gap-1 mb-2">
                <Star size={13} className="fill-yellow-400 text-yellow-400" />
                <span className="text-sm font-medium text-gray-700">{company.rating}</span>
                <span className="text-xs text-gray-400">({company.totalReviews})</span>
              </div>
              <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
                <MapPin size={12} className="text-pink-400" />
                {company.operatingArea}
              </div>
              <div className="flex items-center gap-1 text-xs text-pink-600">
                <Clock size={12} />
                Đến nơi trong ~{company.responseTime} phút
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-linear-to-br from-pink-50 to-pink-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <img
                src="https://images.unsplash.com/photo-1770656505709-fd97236989b9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYXIlMjBtZWNoYW5pYyUyMHJlcGFpciUyMHNlcnZpY2V8ZW58MXx8fHwxNzc0NTA2MjkwfDA&ixlib=rb-4.1.0&q=80&w=1080"
                alt="Mechanic"
                className="rounded-3xl shadow-2xl object-cover w-full h-72"
              />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Tại sao chọn{" "}
                <span className="bg-linear-to-r from-pink-500 to-pink-500 bg-clip-text text-transparent">
                  RescueSOS?
                </span>
              </h2>
              <div className="space-y-4">
                {[
                  { icon: <Clock size={20} className="text-pink-500" />, title: "Phản hồi nhanh 24/7", desc: "Đội ngũ cứu hộ sẵn sàng phục vụ mọi lúc, mọi nơi." },
                  { icon: <Shield size={20} className="text-pink-500" />, title: "Đơn vị uy tín, được xác minh", desc: "Tất cả công ty cứu hộ đều được kiểm tra giấy phép và xác minh danh tính." },
                  { icon: <Star size={20} className="text-yellow-500" />, title: "Đánh giá minh bạch", desc: "Xem đánh giá thực từ người dùng trước để chọn dịch vụ phù hợp." },
                  { icon: <MapPin size={20} className="text-green-500" />, title: "Theo dõi thời gian thực", desc: "Biết chính xác khi nào kỹ thuật viên đến nơi bạn đang chờ." },
                ].map((f, i) => (
                  <div key={i} className="flex items-start gap-4 bg-white p-4 rounded-2xl border border-pink-50 shadow-sm">
                    <div className="w-10 h-10 rounded-xl bg-pink-50 flex items-center justify-center shrink-0">
                      {f.icon}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800">{f.title}</h4>
                      <p className="text-sm text-gray-500 mt-0.5">{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}