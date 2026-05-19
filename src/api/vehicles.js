import { apiRequest } from "./http";

export async function getVehicles(companyId) {
  const params = new URLSearchParams({ company_id: String(companyId) });
  const res = await apiRequest(`/api/vehicles?${params.toString()}`);
  return res.data;
}

export async function createVehicle(payload) {
  const res = await apiRequest("/api/vehicles", {
    method: "POST",
    body: payload,
  });
  return res.data;
}

export async function updateVehicle(vehicleId, payload) {
  const res = await apiRequest(`/api/vehicles/${vehicleId}`, {
    method: "PUT",
    body: payload,
  });
  return res.data;
}

export async function deleteVehicle(vehicleId) {
  const res = await apiRequest(`/api/vehicles/${vehicleId}`, {
    method: "DELETE",
  });
  return res.data;
}
