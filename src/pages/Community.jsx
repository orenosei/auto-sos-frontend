import { useState } from "react";
import {
  Heart,
  MessageCircle,
  Share2,
  Search,
  Plus,
  Tag,
  Clock,
  ThumbsUp,
  X,
  Send,
  Bookmark,
  TrendingUp,
  Users,
  BookOpen,
  Lightbulb,
  Star,
} from "lucide-react";
import { mockCommunityPosts } from "../data/mockData";

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

export default function Community() {
  const [selectedCategory, setSelectedCategory] = useState("Tất cả");
  const [searchText, setSearchText] = useState("");
  const [likedPosts, setLikedPosts] = useState([]);
  const [showNewPost, setShowNewPost] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [newPost, setNewPost] = useState({ title: "", content: "", category: "Kinh nghiệm" });
  const [comment, setComment] = useState("");

  const filtered = mockCommunityPosts.filter((p) => {
    const matchCategory = selectedCategory === "Tất cả" || p.category === selectedCategory;
    const matchSearch =
      p.title.toLowerCase().includes(searchText.toLowerCase()) ||
      p.content.toLowerCase().includes(searchText.toLowerCase());
    return matchCategory && matchSearch;
  });

  const toggleLike = (id) => {
    setLikedPosts((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Cộng đồng</h1>
          <p className="text-gray-500">Chia sẻ kinh nghiệm và hỗ trợ lẫn nhau khi gặp sự cố xe</p>
        </div>
        <button
          onClick={() => setShowNewPost(true)}
          className="flex items-center gap-2 bg-linear-to-r from-pink-500 to-pink-400 text-white px-5 py-2.5 rounded-xl font-medium shadow-md shadow-pink-200 hover:scale-105 transition-all"
        >
          <Plus size={18} />
          Đăng bài
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main feed */}
        <div className="lg:col-span-2 space-y-5">
          {/* Search */}
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

          {/* Category filter */}
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

          {/* Posts */}
          {filtered.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-pink-100">
              <MessageCircle size={48} className="text-pink-200 mx-auto mb-3" />
              <p className="text-gray-400">Không tìm thấy bài viết nào</p>
            </div>
          ) : (
            filtered.map((post) => (
              <div
                key={post.id}
                className="bg-white rounded-2xl border border-pink-100 p-5 hover:shadow-md hover:shadow-pink-50 transition-all"
              >
                {/* Post header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-full bg-linear-to-br from-pink-300 to-blue-300 flex items-center justify-center text-white text-sm font-bold">
                      {post.userName[0]}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{post.userName}</p>
                      <p className="text-xs text-gray-400">
                        {new Date(post.createdAt).toLocaleDateString("vi-VN")}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${
                      categoryColors[post.category] || "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {categoryIcons[post.category]}
                    {post.category}
                  </span>
                </div>

                {/* Content */}
                <h3
                  className="font-bold text-gray-900 mb-2 cursor-pointer hover:text-pink-600 transition-colors"
                  onClick={() => setSelectedPost(post)}
                >
                  {post.title}
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed line-clamp-3">{post.content}</p>

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {post.tags.map((tag) => (
                    <span
                      key={tag}
                      className="flex items-center gap-1 text-xs bg-pink-50 text-pink-500 px-2 py-0.5 rounded-full"
                    >
                      <Tag size={10} />
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-50">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => toggleLike(post.id)}
                      className={`flex items-center gap-1.5 text-sm transition-colors ${
                        likedPosts.includes(post.id)
                          ? "text-pink-600"
                          : "text-gray-500 hover:text-pink-600"
                      }`}
                    >
                      <Heart
                        size={16}
                        className={likedPosts.includes(post.id) ? "fill-pink-500" : ""}
                      />
                      {post.likes + (likedPosts.includes(post.id) ? 1 : 0)}
                    </button>
                    <button
                      onClick={() => setSelectedPost(post)}
                      className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-blue-600 transition-colors"
                    >
                      <MessageCircle size={16} />
                      {post.comments}
                    </button>
                    <button className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-green-600 transition-colors">
                      <Share2 size={16} />
                      Chia sẻ
                    </button>
                  </div>
                  <button className="text-gray-400 hover:text-pink-500 transition-colors">
                    <Bookmark size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          {/* Stats */}
          <div className="bg-linear-to-br from-pink-50 to-blue-50 rounded-2xl border border-pink-100 p-5">
            <h3 className="font-bold text-gray-800 mb-3">Cộng đồng RescueGo</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white rounded-xl p-3 text-center shadow-sm">
                <Users size={18} className="text-pink-500 mx-auto mb-1" />
                <p className="font-bold text-gray-800">2.400+</p>
                <p className="text-xs text-gray-400">Thành viên</p>
              </div>
              <div className="bg-white rounded-xl p-3 text-center shadow-sm">
                <MessageCircle size={18} className="text-blue-500 mx-auto mb-1" />
                <p className="font-bold text-gray-800">1.200+</p>
                <p className="text-xs text-gray-400">Bài viết</p>
              </div>
            </div>
          </div>

          {/* Safety tips */}
          <div className="bg-white rounded-2xl border border-pink-100 p-5">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Lightbulb size={18} className="text-yellow-500" />
              Mẹo an toàn giao thông
            </h3>
            <div className="space-y-3">
              {tips.map((tip, i) => (
                <div key={i} className="flex gap-3 p-3 rounded-xl hover:bg-pink-50 transition-colors cursor-pointer">
                  <span className="text-xl shrink-0">{tip.icon}</span>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{tip.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{tip.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Trending tags */}
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
        </div>
      </div>

      {/* New post modal */}
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
                  {["Kinh nghiệm", "Kiến thức", "Cần tư vấn", "Đánh giá dịch vụ"].map((cat) => (
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
            </div>
            <div className="flex gap-3 px-6 py-4 border-t border-pink-50">
              <button
                onClick={() => setShowNewPost(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                onClick={() => setShowNewPost(false)}
                disabled={!newPost.title || !newPost.content}
                className="flex-1 flex items-center justify-center gap-2 bg-linear-to-r from-pink-500 to-pink-400 text-white py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50 hover:shadow-md hover:shadow-pink-200 transition-all"
              >
                <Send size={16} />
                Đăng bài
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Post detail modal */}
      {selectedPost && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
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
              <div className="flex items-center gap-2 mb-4">
                <div className="w-9 h-9 rounded-full bg-linear-to-br from-pink-300 to-blue-300 flex items-center justify-center text-white text-sm font-bold">
                  {selectedPost.userName[0]}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">{selectedPost.userName}</p>
                  <p className="text-xs text-gray-400">{new Date(selectedPost.createdAt).toLocaleString("vi-VN")}</p>
                </div>
              </div>
              <h2 className="font-bold text-gray-900 text-lg mb-3">{selectedPost.title}</h2>
              <p className="text-gray-700 leading-relaxed">{selectedPost.content}</p>
              <div className="flex flex-wrap gap-1.5 mt-4">
                {selectedPost.tags.map((tag) => (
                  <span key={tag} className="text-xs bg-pink-50 text-pink-500 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Tag size={10} />
                    {tag}
                  </span>
                ))}
              </div>
              <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-50">
                <button
                  onClick={() => toggleLike(selectedPost.id)}
                  className={`flex items-center gap-1.5 text-sm ${likedPosts.includes(selectedPost.id) ? "text-pink-600" : "text-gray-500"}`}
                >
                  <Heart size={16} className={likedPosts.includes(selectedPost.id) ? "fill-pink-500" : ""} />
                  {selectedPost.likes}
                </button>
                <span className="flex items-center gap-1.5 text-sm text-gray-500">
                  <MessageCircle size={16} />
                  {selectedPost.comments} bình luận
                </span>
              </div>

              {/* Comments */}
              <div className="mt-5">
                <h4 className="font-semibold text-gray-800 mb-3">Bình luận</h4>
                <div className="space-y-3 mb-4">
                  {[
                    { name: "Trần B", comment: "Rất hữu ích, cảm ơn bạn đã chia sẻ kinh nghiệm!" },
                    { name: "Lê C", comment: "Tôi cũng từng gặp tình huống tương tự, may mà xử lý được." },
                  ].map((c, i) => (
                    <div key={i} className="flex gap-2">
                      <div className="w-7 h-7 rounded-full bg-linear-to-br from-blue-200 to-pink-200 flex items-center justify-center text-white text-xs font-bold shrink-0">
                        {c.name[0]}
                      </div>
                      <div className="bg-gray-50 rounded-xl px-3 py-2 flex-1">
                        <p className="text-xs font-semibold text-gray-700">{c.name}</p>
                        <p className="text-xs text-gray-600 mt-0.5">{c.comment}</p>
                      </div>
                    </div>
                  ))}
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
                    onClick={() => setComment("")}
                    className="w-9 h-9 rounded-xl bg-pink-500 flex items-center justify-center text-white hover:bg-pink-600 transition-colors"
                  >
                    <Send size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
