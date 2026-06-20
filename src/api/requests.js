import { apiRequest } from "./http";

export async function getRequests(params = {}) {
  const search = new URLSearchParams();
  if (params.all === true) search.set("all", "true");
  if (params.user_id != null) search.set("user_id", String(params.user_id));
  if (params.company_id != null) search.set("company_id", String(params.company_id));
  if (params.request_status != null) search.set("request_status", String(params.request_status));

  const qs = search.toString();
  const res = await apiRequest(`/api/requests${qs ? `?${qs}` : ""}`);
  return res.data;
}

export async function createRequest(input) {
  const body = {
    user_id: input.user_id ?? null,
    company_id: input.company_id ?? null,
    vehicle_id: input.vehicle_id ?? null,
    absolute_location: { lat: input.absolute_location.lat, lng: input.absolute_location.lng },
    relative_location: input.relative_location ?? null,
    request_description: input.request_description ?? null,
    request_note: input.request_note ?? null,
    assignment_mode: input.assignment_mode ?? "manual",
    issue_type: input.issue_type ?? null,
    contact_name: input.contact_name ?? null,
    contact_phone: input.contact_phone ?? null,
    contact_back_now: input.contact_back_now ?? false,
    priority: input.priority ?? null,
    service_id: input.service_id ?? null,
    service_quantity: input.service_quantity ?? 1,
    service_price: input.service_price ?? null,
  };

  const res = await apiRequest("/api/requests", {
    method: "POST",
    body,
  });
  return res.data;
}

export async function updateRequest(requestId, payload) {
  const res = await apiRequest(`/api/requests/${requestId}`, {
    method: "PUT",
    body: payload,
  });
  return res.data;
}

export async function updateRequestStatus(requestId, status, payload = {}) {
  return updateRequest(requestId, { ...payload, request_status: status });
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
