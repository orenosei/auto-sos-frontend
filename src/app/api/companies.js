import { apiRequest } from "./http";

export async function getCompanies() {
  const res = await apiRequest("/api/companies");
  return res.data;
}

export async function getCompany(companyId) {
  const res = await apiRequest(`/api/companies/${companyId}`);
  return res.data;
}

/**
 * Lấy danh sách công ty gần nhất dựa trên vị trí GPS
 * @param {number} latitude - Vĩ độ
 * @param {number} longitude - Kinh độ
 * @param {number} radiusKm - Bán kính tìm kiếm (km)
 */
export async function getNearbyCompanies(latitude, longitude, radiusKm = 10) {
  const params = new URLSearchParams({
    latitude,
    longitude,
    radiusKm,
  });
  const res = await apiRequest(`/api/companies/nearby?${params.toString()}`);
  return res.data;
}

export async function getCompanyServices(companyId) {
  const res = await apiRequest(`/api/companies/${companyId}/services`);
  return res.data;
}

export async function getCompanyReviews(companyId) {
  const res = await apiRequest(`/api/companies/${companyId}/reviews`);
  return res.data;
}

export async function getCompanyRating(companyId) {
  const res = await apiRequest(`/api/companies/${companyId}/rating`);
  return res.data;
}

export async function addCompanyService(companyId, payload) {
  const res = await apiRequest(`/api/companies/${companyId}/services`, {
    method: "POST",
    body: payload,
  });
  return res.data;
}

export async function updateCompanyService(companyId, serviceId, payload) {
  const res = await apiRequest(`/api/companies/${companyId}/services/${serviceId}`, {
    method: "PUT",
    body: payload,
  });
  return res.data;
}

export async function deleteCompanyService(companyId, serviceId) {
  const res = await apiRequest(`/api/companies/${companyId}/services/${serviceId}`, {
    method: "DELETE",
  });
  return res.data;
}

export async function updateCompany(companyId, payload) {
  const res = await apiRequest(`/api/companies/${companyId}`, {
    method: "PUT",
    body: payload,
  });
  return res.data;
}
