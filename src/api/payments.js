import { apiRequest } from "./http";

export async function getRequestPayment(requestId) {
  const res = await apiRequest(`/api/payments/requests/${requestId}`);
  return res.data;
}

export async function selectCashPayment(requestId, userId) {
  const res = await apiRequest(`/api/payments/requests/${requestId}/cash`, {
    method: "POST",
    body: { user_id: userId },
  });
  return res.data;
}

export async function confirmCashPayment(requestId, companyId) {
  const res = await apiRequest(`/api/payments/requests/${requestId}/cash/confirm`, {
    method: "POST",
    body: { company_id: companyId },
  });
  return res.data;
}

export async function createVnPayPayment(requestId, userId) {
  const res = await apiRequest(`/api/payments/requests/${requestId}/vnpay`, {
    method: "POST",
    body: { user_id: userId, locale: "vn" },
  });
  return res.data;
}
