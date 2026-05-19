import React from 'react';
import { CheckCircle2, XCircle, AlertTriangle } from "lucide-react";

export default function ContentTab() {
  return (
    <div>
          <div className="mb-4">
            <h2 className="font-bold text-gray-900 mb-1">Kiểm duyệt nội dung</h2>
            <p className="text-sm text-gray-500">Xem xét và phê duyệt các đánh giá và bình luận trên hệ thống</p>
          </div>
          <div className="space-y-4">
            {[
              { user: "Nguyễn Văn An", content: "Dịch vụ rất tệ, nhân viên không chuyên nghiệp, trễ 30 phút so với hẹn!", type: "Đánh giá", target: "Cứu Hộ Đông Nam", flag: "Cần xem xét", time: "5 phút trước" },
              { user: "Phạm Thị C", content: "Vá lốp nhanh chóng, nhân viên nhiệt tình. Sẽ giới thiệu bạn bè!", type: "Đánh giá", target: "Cứu Hộ Sao Mai", flag: null, time: "15 phút trước" },
              { user: "Lê Văn D", content: "Xe tôi bị hỏng máy. Ai có kinh nghiệm với xe Honda Civic cho tôi hỏi?", type: "Bài đăng cộng đồng", target: null, flag: null, time: "32 phút trước" },
            ].map((item, i) => (
              <div key={i} className="bg-white rounded-2xl border border-pink-100 p-5">
                <div className="flex items-start justify-between flex-wrap gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-linear-to-br from-pink-300 to-blue-300 flex items-center justify-center text-white text-xs font-bold shrink-0">
                      {item.user[0]}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-gray-800 text-sm">{item.user}</span>
                        <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">{item.type}</span>
                        {item.flag && (
                          <span className="text-xs bg-red-50 text-red-500 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <AlertTriangle size={10} />
                            {item.flag}
                          </span>
                        )}
                      </div>
                      {item.target && (
                        <p className="text-xs text-gray-400 mt-0.5">→ {item.target}</p>
                      )}
                      <p className="text-sm text-gray-700 mt-2 leading-relaxed">"{item.content}"</p>
                      <p className="text-xs text-gray-400 mt-1">{item.time}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="flex items-center gap-1 px-3 py-1.5 bg-green-500 text-white rounded-xl text-xs font-medium hover:bg-green-600 transition-colors">
                      <CheckCircle2 size={13} />
                      Duyệt
                    </button>
                    <button className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-500 border border-red-200 rounded-xl text-xs font-medium hover:bg-red-100 transition-colors">
                      <XCircle size={13} />
                      Xóa
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
  );
}
