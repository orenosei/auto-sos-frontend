import { apiRequest } from "./http";

export async function getUsers() {
  const res = await apiRequest("/api/users");
  return res.data;
}

export async function getUser(userId) {
  const res = await apiRequest(`/api/users/${userId}`);
  return res.data;
}

export async function updateUser(userId, payload) {
  const res = await apiRequest(`/api/users/${userId}`, {
    method: "PUT",
    body: payload,
  });
  return res.data;
}

export async function deleteUser(userId) {
  const res = await apiRequest(`/api/users/${userId}`, {
    method: "DELETE",
  });
  return res.data;
}
