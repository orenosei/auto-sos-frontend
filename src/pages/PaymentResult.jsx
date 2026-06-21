import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";

export default function PaymentResult() {
  const [params] = useSearchParams();
  const status = params.get("status") || "error";
  const requestId = params.get("requestId");
  const paid = status === "paid";
  const pending = status === "pending";

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-xl items-center px-4 py-10">
      <div className="w-full rounded-3xl border border-pink-100 bg-white p-8 text-center shadow-xl">
        <div
          className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ${
            paid
              ? "bg-green-100 text-green-600"
              : pending
                ? "bg-yellow-100 text-yellow-600"
                : "bg-red-100 text-red-600"
          }`}
        >
          {paid ? (
            <CheckCircle2 size={34} />
          ) : pending ? (
            <Loader2 size={34} className="animate-spin" />
          ) : (
            <XCircle size={34} />
          )}
        </div>
        <h1 className="mt-5 text-2xl font-bold text-gray-900">
          {paid
            ? "Thanh toán thành công"
            : pending
              ? "Giao dịch đang được xử lý"
              : "Thanh toán chưa thành công"}
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          {paid
            ? `VNPay đã xác nhận thanh toán${requestId ? ` cho yêu cầu #${requestId}` : ""}.`
            : "Bạn có thể quay lại yêu cầu và thực hiện thanh toán lại."}
        </p>
        <Link
          to="/dashboard"
          state={requestId ? { requestId } : undefined}
          className="mt-6 inline-flex rounded-xl bg-pink-500 px-6 py-3 text-sm font-semibold text-white hover:bg-pink-600"
        >
          Quay lại yêu cầu
        </Link>
      </div>
    </div>
  );
}
