import { apiRequest } from "./http";

export async function addReview(requestId, payload) {
  const res = await apiRequest(`/api/requests/${requestId}/review`, {
    method: "POST",
    body: payload,
  });
  return res.data;
}

export async function getCompanyRating(companyId) {
  const res = await apiRequest(`/api/companies/${companyId}/rating`);
  return res.data;
}
