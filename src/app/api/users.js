import { apiRequest } from "./http";

export async function getUsers() {
  const res = await apiRequest("/api/users");
  return res.data;
}

export async function getUser(userId) {
  const res = await apiRequest(`/api/users/${userId}`);
  return res.data;
}
