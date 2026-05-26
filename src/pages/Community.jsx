import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  BookOpen,
  Flag,
  Heart,
  Image as ImageIcon,
  Lightbulb,
  Loader2,
  MessageCircle,
  Plus,
  Search,
  Send,
  Star,
  Tag,
  TrendingUp,
  Users,
  X,
} from "lucide-react";
import {
  createCommunityComment,
  createCommunityPost,
  getCommunityPost,
  getCommunityPosts,
  reportCommunityContent,
  toggleCommunityCommentLike,
  toggleCommunityPostLike,
} from "../api/community";
import { uploadFileToCloudinary } from "../api/uploads";
import { useApp } from "../context/useApp";

const categories = ["Tất cả", "Kinh nghiệm", "Kiến thức", "Cần tư vấn", "Đánh giá dịch vụ"];

const categoryColors = {
  "Kinh nghiệm": "bg-blue-100 text-blue-700",
  "Kiến thức": "bg-purple-100 text-purple-700",
  "Cần tư vấn": "bg-orange-100 text-orange-700",
  "Đánh giá dịch vụ": "bg-green-100 text-green-700",
};

const categoryIcons = {
  "Kinh nghiệm": <TrendingUp size={14} />,
  "Kiến thức": <BookOpen size={14} />,
  "Cần tư vấn": <Lightbulb size={14} />,
  "Đánh giá dịch vụ": <Star size={14} />,
};

const tips = [
  { icon: "🔧", title: "Luôn mang theo bánh dự phòng", desc: "Đảm bảo áp suất lốp dự phòng đầy đủ trước mỗi chuyến đi dài." },
  { icon: "🔋", title: "Kiểm tra bình ắc quy định kỳ", desc: "Thay bình ắc quy sau 2-3 năm sử dụng để tránh hết điện đột ngột." },
  { icon: "⛽", title: "Không để xăng dưới 1/4 bình", desc: "Luôn đổ thêm xăng khi còn 1/4 để tránh trường hợp hết xăng giữa đường." },
  { icon: "📱", title: "Lưu số hotline cứu hộ", desc: "Lưu sẵn ít nhất 2-3 số điện thoại cứu hộ trong danh bạ trước khi ra đường." },
];

const emptyPost = { title: "", content: "", category: "Kinh nghiệm", tags: "", images: [] };

function Avatar({ src, name, size = "md" }) {
  const sizeClass = size === "sm" ? "w-7 h-7 text-xs" : "w-9 h-9 text-sm";
  const initial = name?.trim()?.[0]?.toUpperCase() ?? "U";

  if (src) {
    return (
      <img
        src={src}
        alt={name ? `Avatar của ${name}` : "Avatar người dùng"}
        className={`${sizeClass} rounded-full object-cover shrink-0 border border-pink-100 bg-white`}
      />
    );
  }

  return (
    <div
      className={`${sizeClass} rounded-full bg-linear-to-br from-pink-300 to-blue-300 flex items-center justify-center text-white font-bold shrink-0`}
    >
      {initial}
    </div>
  );
}

export default function Community() {
  const { currentUser, isLoggedIn, currentRole } = useApp();
  const userId = currentRole === "user" || currentRole === "admin" ? currentUser?.id : null;
  const canInteract = isLoggedIn && !!userId;

  const [selectedCategory, setSelectedCategory] = useState("Tất cả");
  const [searchText, setSearchText] = useState("");
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [showNewPost, setShowNewPost] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [newPost, setNewPost] = useState(emptyPost);
  const [comment, setComment] = useState("");

  const loadPosts = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getCommunityPosts({
        category: selectedCategory,
        q: searchText.trim(),
        userId,
      });
      setPosts(data ?? []);
    } catch (err) {
      setError(err.message || "Không thể tải bài viết cộng đồng");
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, searchText, userId]);

  useEffect(() => {
    const timer = setTimeout(loadPosts, 250);
    return () => clearTimeout(timer);
  }, [loadPosts]);

  const stats = useMemo(
    () => ({
      posts: posts.length,
      comments: posts.reduce((sum, post) => sum + Number(post.comments ?? 0), 0),
    }),
    [posts]
  );

  const requireUser = () => {
    if (canInteract) return true;
    setError("Vui lòng đăng nhập tài khoản người dùng để thao tác trong cộng đồng.");
    return false;
  };

  const openPost = async (post) => {
    setSelectedPost({ ...post, loading: true, commentItems: [] });
    try {
      const detail = await getCommunityPost(post.id, userId);
      setSelectedPost(detail);
    } catch (err) {
      setError(err.message || "Không thể tải chi tiết bài viết");
      setSelectedPost(null);
    }
  };

  const updatePostLikeState = (postId, data) => {
    setPosts((prev) =>
      prev.map((post) =>
        post.id === String(postId) ? { ...post, liked: data.liked, likes: data.likes } : post
      )
    );
    setSelectedPost((prev) =>
      prev && prev.id === String(postId) ? { ...prev, liked: data.liked, likes: data.likes } : prev
    );
  };

  const toggleLike = async (postId) => {
    if (!requireUser()) return;
    try {
      const data = await toggleCommunityPostLike(postId, userId);
      updatePostLikeState(postId, data);
    } catch (err) {
      setError(err.message || "Không thể cập nhật lượt thích");
    }
  };

  const toggleCommentLike = async (commentId) => {
    if (!requireUser()) return;
    try {
      const data = await toggleCommunityCommentLike(commentId, userId);
      setSelectedPost((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          commentItems: (prev.commentItems ?? []).map((item) =>
            item.id === String(commentId) ? { ...item, liked: data.liked, likes: data.likes } : item
          ),
        };
      });
    } catch (err) {
      setError(err.message || "Không thể cập nhật lượt thích bình luận");
    }
  };

  const submitPost = async () => {
    if (!requireUser() || !newPost.title.trim() || !newPost.content.trim()) return;

    setSubmitting(true);
    setError("");
    try {
      const uploaded = [];
      for (const file of newPost.images) {
        const result = await uploadFileToCloudinary(file, "auto-sos/community");
        uploaded.push(result.secureUrl);
      }

      const created = await createCommunityPost({
        user_id: userId,
        title: newPost.title.trim(),
        content: newPost.content.trim(),
        category: newPost.category,
        tags: newPost.tags,
        image_urls: uploaded,
      });

      setPosts((prev) => [created, ...prev]);
      setNewPost(emptyPost);
      setShowNewPost(false);
    } catch (err) {
      setError(err.message || "Không thể đăng bài");
    } finally {
      setSubmitting(false);
    }
  };

  const submitComment = async () => {
    if (!requireUser() || !selectedPost || !comment.trim()) return;

    setSubmitting(true);
    setError("");
    try {
      const created = await createCommunityComment(selectedPost.id, {
        user_id: userId,
        content: comment.trim(),
      });
      setSelectedPost((prev) => ({
        ...prev,
        commentItems: [...(prev.commentItems ?? []), created],
        comments: Number(prev.comments ?? 0) + 1,
      }));
      setPosts((prev) =>
        prev.map((post) =>
          post.id === selectedPost.id ? { ...post, comments: Number(post.comments ?? 0) + 1 } : post
        )
      );
      setComment("");
    } catch (err) {
      setError(err.message || "Không thể gửi bình luận");
    } finally {
      setSubmitting(false);
    }
  };

  const reportContent = async (targetType, targetId) => {
    if (!requireUser()) return;
    const reason = window.prompt("Nhập lý do báo cáo vi phạm:");
    if (!reason?.trim()) return;

    try {
      await reportCommunityContent({
        reporter_user_id: userId,
        target_type: targetType,
        target_id: targetId,
        reason: reason.trim(),
      });
      setError("Đã gửi báo cáo cho quản trị viên.");
    } catch (err) {
      setError(err.message || "Không thể gửi báo cáo");
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Cộng đồng</h1>
          <p className="text-gray-500">Chia sẻ kinh nghiệm và hỗ trợ lẫn nhau khi gặp sự cố xe</p>
        </div>
        <button
          onClick={() => (requireUser() ? setShowNewPost(true) : null)}
          className="flex items-center gap-2 bg-linear-to-r from-pink-500 to-pink-400 text-white px-5 py-2.5 rounded-xl font-medium shadow-md shadow-pink-200 hover:scale-105 transition-all"
        >
          <Plus size={18} />
          Đăng bài
        </button>
      </div>

      {error && (
        <div className="mb-4 flex items-start gap-2 rounded-xl border border-pink-100 bg-pink-50 px-4 py-3 text-sm text-pink-700">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm bài viết..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100 bg-white"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  selectedCategory === cat
                    ? "bg-pink-500 text-white shadow-sm shadow-pink-200"
                    : "bg-white text-gray-600 border border-gray-200 hover:border-pink-300 hover:text-pink-600"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16 bg-white rounded-2xl border border-pink-100">
              <Loader2 size={28} className="animate-spin text-pink-500" />
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-pink-100">
              <MessageCircle size={48} className="text-pink-200 mx-auto mb-3" />
              <p className="text-gray-400">Không tìm thấy bài viết nào</p>
            </div>
          ) : (
            posts.map((post) => (
              <article
                key={post.id}
                className="bg-white rounded-2xl border border-pink-100 p-5 hover:shadow-md hover:shadow-pink-50 transition-all"
              >
                <div className="flex items-start justify-between mb-3 gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <Avatar src={post.userAvatarUrl} name={post.userName} />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{post.userName}</p>
                      <p className="text-xs text-gray-400">
                        {new Date(post.createdAt).toLocaleDateString("vi-VN")}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full shrink-0 ${
                      categoryColors[post.category] || "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {categoryIcons[post.category]}
                    {post.category}
                  </span>
                </div>

                <h3
                  className="font-bold text-gray-900 mb-2 cursor-pointer hover:text-pink-600 transition-colors"
                  onClick={() => openPost(post)}
                >
                  {post.title}
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed line-clamp-3">{post.content}</p>

                {post.images?.length > 0 && (
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    {post.images.slice(0, 2).map((src) => (
                      <img key={src} src={src} alt="" className="h-40 w-full rounded-xl object-cover" />
                    ))}
                  </div>
                )}

                <div className="flex flex-wrap gap-1.5 mt-3">
                  {(post.tags ?? []).map((tag) => (
                    <span
                      key={tag}
                      className="flex items-center gap-1 text-xs bg-pink-50 text-pink-500 px-2 py-0.5 rounded-full"
                    >
                      <Tag size={10} />
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-50">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => toggleLike(post.id)}
                      className={`flex items-center gap-1.5 text-sm transition-colors ${
                        post.liked ? "text-pink-600" : "text-gray-500 hover:text-pink-600"
                      }`}
                    >
                      <Heart size={16} className={post.liked ? "fill-pink-500" : ""} />
                      {post.likes}
                    </button>
                    <button
                      onClick={() => openPost(post)}
                      className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-blue-600 transition-colors"
                    >
                      <MessageCircle size={16} />
                      {post.comments}
                    </button>
                    <button
                      onClick={() => reportContent("post", post.id)}
                      className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-500 transition-colors"
                    >
                      <Flag size={16} />
                      Báo cáo
                    </button>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>

        <aside className="space-y-5">
          <div className="bg-linear-to-br from-pink-50 to-blue-50 rounded-2xl border border-pink-100 p-5">
            <h3 className="font-bold text-gray-800 mb-3">Cộng đồng RescueGo</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white rounded-xl p-3 text-center shadow-sm">
                <Users size={18} className="text-pink-500 mx-auto mb-1" />
                <p className="font-bold text-gray-800">{stats.posts}</p>
                <p className="text-xs text-gray-400">Bài viết</p>
              </div>
              <div className="bg-white rounded-xl p-3 text-center shadow-sm">
                <MessageCircle size={18} className="text-blue-500 mx-auto mb-1" />
                <p className="font-bold text-gray-800">{stats.comments}</p>
                <p className="text-xs text-gray-400">Bình luận</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-pink-100 p-5">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Lightbulb size={18} className="text-yellow-500" />
              Mẹo an toàn giao thông
            </h3>
            <div className="space-y-3">
              {tips.map((tip) => (
                <div key={tip.title} className="flex gap-3 p-3 rounded-xl hover:bg-pink-50 transition-colors">
                  <span className="text-xl shrink-0">{tip.icon}</span>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{tip.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{tip.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-pink-100 p-5">
            <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
              <TrendingUp size={18} className="text-pink-500" />
              Chủ đề phổ biến
            </h3>
            <div className="flex flex-wrap gap-2">
              {["nổ lốp", "ắc quy", "hết xăng", "kéo xe", "sửa xe", "an toàn", "kinh nghiệm", "review"].map((tag) => (
                <button
                  key={tag}
                  onClick={() => setSearchText(tag)}
                  className="flex items-center gap-1 text-xs bg-pink-50 text-pink-600 px-2.5 py-1.5 rounded-full hover:bg-pink-100 transition-colors"
                >
                  <Tag size={10} />
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </aside>
      </div>

      {showNewPost && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-pink-50">
              <h3 className="font-bold text-gray-900">Đăng bài viết mới</h3>
              <button onClick={() => setShowNewPost(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Danh mục</label>
                <div className="flex gap-2 flex-wrap">
                  {categories.slice(1).map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setNewPost({ ...newPost, category: cat })}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                        newPost.category === cat
                          ? "bg-pink-500 text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-pink-100 hover:text-pink-600"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Tiêu đề</label>
                <input
                  type="text"
                  placeholder="Nhập tiêu đề bài viết..."
                  value={newPost.title}
                  onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Nội dung</label>
                <textarea
                  placeholder="Chia sẻ kinh nghiệm, hỏi đáp hoặc đánh giá dịch vụ của bạn..."
                  value={newPost.content}
                  onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100 resize-none"
                  rows={4}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Thẻ</label>
                <input
                  type="text"
                  placeholder="Ví dụ: nổ lốp, an toàn, kinh nghiệm"
                  value={newPost.tags}
                  onChange={(e) => setNewPost({ ...newPost, tags: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100"
                />
              </div>
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5">
                  <ImageIcon size={16} />
                  Ảnh bài viết
                </label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => setNewPost({ ...newPost, images: Array.from(e.target.files ?? []).slice(0, 6) })}
                  className="w-full text-sm text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-pink-50 file:px-3 file:py-2 file:text-pink-600"
                />
                {newPost.images.length > 0 && (
                  <p className="mt-1 text-xs text-gray-400">{newPost.images.length} ảnh đã chọn</p>
                )}
              </div>
            </div>
            <div className="flex gap-3 px-6 py-4 border-t border-pink-50">
              <button
                onClick={() => setShowNewPost(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                onClick={submitPost}
                disabled={submitting || !newPost.title.trim() || !newPost.content.trim()}
                className="flex-1 flex items-center justify-center gap-2 bg-linear-to-r from-pink-500 to-pink-400 text-white py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50 hover:shadow-md hover:shadow-pink-200 transition-all"
              >
                {submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                Đăng bài
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedPost && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-pink-50 sticky top-0 bg-white">
              <span
                className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                  categoryColors[selectedPost.category] || "bg-gray-100 text-gray-600"
                }`}
              >
                {selectedPost.category}
              </span>
              <button onClick={() => setSelectedPost(null)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <div className="p-6">
              {selectedPost.loading ? (
                <div className="flex justify-center py-12">
                  <Loader2 size={28} className="animate-spin text-pink-500" />
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <div className="flex items-center gap-2 min-w-0">
                      <Avatar src={selectedPost.userAvatarUrl} name={selectedPost.userName} />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">{selectedPost.userName}</p>
                        <p className="text-xs text-gray-400">{new Date(selectedPost.createdAt).toLocaleString("vi-VN")}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => reportContent("post", selectedPost.id)}
                      className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-red-500"
                    >
                      <Flag size={14} />
                      Báo cáo
                    </button>
                  </div>
                  <h2 className="font-bold text-gray-900 text-lg mb-3">{selectedPost.title}</h2>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{selectedPost.content}</p>

                  {selectedPost.images?.length > 0 && (
                    <div className="mt-4 grid sm:grid-cols-2 gap-2">
                      {selectedPost.images.map((src) => (
                        <img key={src} src={src} alt="" className="h-48 w-full rounded-xl object-cover" />
                      ))}
                    </div>
                  )}

                  <div className="flex flex-wrap gap-1.5 mt-4">
                    {(selectedPost.tags ?? []).map((tag) => (
                      <span key={tag} className="text-xs bg-pink-50 text-pink-500 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Tag size={10} />
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-50">
                    <button
                      onClick={() => toggleLike(selectedPost.id)}
                      className={`flex items-center gap-1.5 text-sm ${selectedPost.liked ? "text-pink-600" : "text-gray-500"}`}
                    >
                      <Heart size={16} className={selectedPost.liked ? "fill-pink-500" : ""} />
                      {selectedPost.likes}
                    </button>
                    <span className="flex items-center gap-1.5 text-sm text-gray-500">
                      <MessageCircle size={16} />
                      {selectedPost.comments} bình luận
                    </span>
                  </div>

                  <div className="mt-5">
                    <h4 className="font-semibold text-gray-800 mb-3">Bình luận</h4>
                    <div className="space-y-3 mb-4">
                      {(selectedPost.commentItems ?? []).length === 0 ? (
                        <p className="text-sm text-gray-400">Chưa có bình luận nào</p>
                      ) : (
                        selectedPost.commentItems.map((item) => (
                          <div key={item.id} className="flex gap-2">
                            <Avatar src={item.userAvatarUrl} name={item.userName} size="sm" />
                            <div className="bg-gray-50 rounded-xl px-3 py-2 flex-1">
                              <div className="flex items-center justify-between gap-2">
                                <p className="text-xs font-semibold text-gray-700">{item.userName}</p>
                                <button
                                  onClick={() => reportContent("comment", item.id)}
                                  className="text-gray-400 hover:text-red-500"
                                  title="Báo cáo bình luận"
                                >
                                  <Flag size={12} />
                                </button>
                              </div>
                              <p className="text-xs text-gray-600 mt-0.5">{item.content}</p>
                              <button
                                onClick={() => toggleCommentLike(item.id)}
                                className={`mt-2 flex items-center gap-1 text-xs ${item.liked ? "text-pink-600" : "text-gray-400 hover:text-pink-600"}`}
                              >
                                <Heart size={12} className={item.liked ? "fill-pink-500" : ""} />
                                {item.likes}
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Viết bình luận..."
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        className="flex-1 px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-pink-400"
                      />
                      <button
                        onClick={submitComment}
                        disabled={submitting || !comment.trim()}
                        className="w-9 h-9 rounded-xl bg-pink-500 flex items-center justify-center text-white hover:bg-pink-600 transition-colors disabled:opacity-50"
                      >
                        {submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
