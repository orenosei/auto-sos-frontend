import { apiRequest } from "./http";

export async function getRequestMessages(requestId) {
  const res = await apiRequest(`/api/requests/${requestId}/messages`);
  return res.data;
}

export async function addRequestMessage(requestId, payload) {
  const res = await apiRequest(`/api/requests/${requestId}/messages`, {
    method: "POST",
    body: payload,
  });
  return res.data;
}

export async function markMessageSeen(requestId, messageId) {
  const res = await apiRequest(`/api/requests/${requestId}/messages/${messageId}/seen`, {
    method: "PUT",
    body: { is_seen: true },
  });
  return res.data;
}
