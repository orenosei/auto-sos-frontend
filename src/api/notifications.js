import { apiRequest } from "./http";

export async function getNotifications(recipientType, recipientId, limit = 50) {
  const params = new URLSearchParams();
  params.set("recipient_type", recipientType);
  params.set("recipient_id", String(recipientId));
  params.set("limit", String(limit));
  const res = await apiRequest(`/api/notifications?${params.toString()}`);
  return res.data;
}

export async function markNotificationRead(notificationId) {
  const res = await apiRequest(`/api/notifications/${notificationId}/read`, {
    method: "PUT",
  });
  return res.data;
}
