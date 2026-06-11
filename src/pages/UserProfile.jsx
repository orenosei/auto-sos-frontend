import { useEffect, useState } from "react";
import { Camera, Loader2, Save } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/useApp";
import { getUser, updateUser } from "../api/users";
import { uploadFileToCloudinary } from "../api/uploads";

export default function UserProfile() {
  const { currentUser, currentRole, isLoggedIn, updateCurrentUser } = useApp();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    user_name: "",
    full_name: "",
    user_phone: "",
    user_email: "",
    avatar_url: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const userId = currentRole === "user" && currentUser?.id ? Number(currentUser.id) : null;
  const avatarFallback = (form.full_name || form.user_name || currentUser?.name || "U")
    .slice(0, 1)
    .toUpperCase();

  useEffect(() => {
    if (!isLoggedIn) {
      navigate("/login");
      return;
    }

    if (currentRole !== "user" || !Number.isFinite(userId)) {
      navigate("/");
      return;
    }

    let cancelled = false;
    setLoading(true);
    getUser(userId)
      .then((user) => {
        if (cancelled) return;
        setForm({
          user_name: user.user_name ?? "",
          full_name: user.full_name ?? "",
          user_phone: user.user_phone ?? "",
          user_email: user.user_email ?? "",
          avatar_url: user.avatar_url ?? "",
        });
      })
      .catch((err) => {
        console.error(err);
        if (!cancelled) setError(err instanceof Error ? err.message : "Không thể tải hồ sơ");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [currentRole, isLoggedIn, navigate, userId]);

  const handleAvatarUpload = async (file) => {
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const uploaded = await uploadFileToCloudinary(file, "rescuesos/avatars");
      setForm((prev) => ({ ...prev, avatar_url: uploaded.secureUrl }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể tải avatar");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!Number.isFinite(userId)) return;

    const fullName = form.full_name.trim();
    const phone = form.user_phone.trim();
    const email = form.user_email.trim();

    if (!phone) {
      setError("Vui lòng nhập số điện thoại");
      return;
    }

    setSaving(true);
    setError("");
    try {
      const updated = await updateUser(userId, {
        full_name: fullName || null,
        user_phone: phone,
        user_email: email || null,
        avatar_url: form.avatar_url || null,
      });

      const displayName = updated.full_name || updated.user_name || currentUser?.name || "";
      updateCurrentUser({
        name: displayName,
        phone: updated.user_phone,
        email: updated.user_email ?? "",
        avatar: displayName.slice(0, 1).toUpperCase() || "U",
        avatarUrl: updated.avatar_url ?? "",
      });
      window.alert("Đã lưu hồ sơ");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lưu hồ sơ thất bại");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto flex max-w-3xl items-center justify-center px-4 py-16 text-sm text-gray-500">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Đang tải hồ sơ...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Hồ sơ cá nhân</h1>
        <p className="mt-1 text-sm text-gray-500">Cập nhật thông tin liên hệ và ảnh đại diện.</p>
      </div>

      <form onSubmit={handleSubmit} className="rounded-2xl border border-pink-100 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center gap-4">
          <label className="relative block h-20 w-20 shrink-0 cursor-pointer overflow-hidden rounded-full border border-pink-100 bg-pink-50">
            {form.avatar_url ? (
              <img src={form.avatar_url} alt="Avatar" className="h-full w-full object-cover" />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-2xl font-bold text-pink-600">
                {avatarFallback}
              </span>
            )}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleAvatarUpload(e.target.files?.[0])}
            />
          </label>
          <div>
            <p className="font-semibold text-gray-900">Ảnh đại diện</p>
            <label className="mt-2 inline-flex cursor-pointer items-center gap-2 rounded-xl border border-pink-200 px-3 py-2 text-sm font-medium text-pink-600 hover:bg-pink-50">
              {uploading ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />}
              {uploading ? "Đang tải..." : "Tải ảnh mới"}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleAvatarUpload(e.target.files?.[0])}
              />
            </label>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Tên đăng nhập</label>
            <input
              type="text"
              value={form.user_name}
              disabled
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-500"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Họ và tên</label>
            <input
              type="text"
              value={form.full_name}
              onChange={(e) => setForm((prev) => ({ ...prev, full_name: e.target.value }))}
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-pink-400 focus:outline-none focus:ring-2 focus:ring-pink-100"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Số điện thoại *</label>
            <input
              type="text"
              value={form.user_phone}
              onChange={(e) => setForm((prev) => ({ ...prev, user_phone: e.target.value }))}
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-pink-400 focus:outline-none focus:ring-2 focus:ring-pink-100"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              value={form.user_email}
              onChange={(e) => setForm((prev) => ({ ...prev, user_email: e.target.value }))}
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-pink-400 focus:outline-none focus:ring-2 focus:ring-pink-100"
            />
          </div>
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={saving || uploading}
          className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-linear-to-r from-pink-500 to-pink-400 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-pink-100 transition-all hover:from-pink-600 hover:to-pink-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          {saving ? "Đang lưu..." : "Lưu hồ sơ"}
        </button>
      </form>
    </div>
  );
}
