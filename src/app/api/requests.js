import { apiRequest } from "./http";

export async function getRequests(params) {
  const search = new URLSearchParams();
  if (params.user_id != null) search.set("user_id", String(params.user_id));
  if (params.company_id != null) search.set("company_id", String(params.company_id));
  if (params.request_status != null) search.set("request_status", String(params.request_status));

  const res = await apiRequest(`/api/requests?${search.toString()}`);
  return res.data;
}

export async function createRequest(input) {
  const res = await apiRequest("/api/requests", {
    method: "POST",
    body: {
      user_id: input.user_id ?? null,
      company_id: input.company_id ?? null,
      vehicle_id: input.vehicle_id ?? null,
      absolute_location: { lat: input.absolute_location.lat, lng: input.absolute_location.lng },
      relative_location: input.relative_location ?? null,
      request_description: input.request_description ?? null,
    },
  });
  return res.data;
}

export async function updateRequestStatus(requestId, status) {
  const res = await apiRequest(`/api/requests/${requestId}`, {
    method: "PUT",
    body: { request_status: status },
  });
  return res.data;
}

export async function addRequestService(requestId, input) {
  return apiRequest(`/api/requests/${requestId}/services`, {
    method: "POST",
    body: input,
  });
}

export async function getRequestServices(requestId) {
  return apiRequest(`/api/requests/${requestId}/services`);
}
