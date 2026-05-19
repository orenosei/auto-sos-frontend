import { apiRequest } from "./http";

export async function loginUser(identifier, password) {
  return apiRequest("/api/auth/users/login", {
    method: "POST",
    body: { identifier, password },
  });
}

export async function loginCompany(identifier, password) {
  return apiRequest("/api/auth/companies/login", {
    method: "POST",
    body: { identifier, password },
  });
}

export async function registerUser(payload) {
  return apiRequest("/api/auth/users/register", {
    method: "POST",
    body: payload,
  });
}

export async function registerCompany(payload) {
  return apiRequest("/api/auth/companies/register", {
    method: "POST",
    body: payload,
  });
}
