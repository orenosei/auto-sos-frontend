import { apiRequest } from "./http";

export async function getServices() {
  const res = await apiRequest("/api/services");
  return res.data;
}
