const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

function joinUrl(base, path) {
  if (!base) return path;
  if (base.endsWith("/") && path.startsWith("/")) return base.slice(0, -1) + path;
  if (!base.endsWith("/") && !path.startsWith("/")) return base + "/" + path;
  return base + path;
}

export async function apiRequest(path, options) {
  const url = joinUrl(API_BASE_URL, path);
  const method = options?.method ?? "GET";

  const isFormData = typeof FormData !== "undefined" && options?.body instanceof FormData;

  const headers = {
    ...(options?.headers ?? {}),
  };

  let body = undefined;
  if (options?.body !== undefined) {
    if (isFormData) {
      body = options.body;
    } else {
      headers["Content-Type"] = headers["Content-Type"] ?? "application/json";
      body = JSON.stringify(options.body);
    }
  }

  const res = await fetch(url, {
    method,
    headers,
    body,
    signal: options?.signal,
  });

  const text = await res.text();
  const parsed = text ? JSON.parse(text) : null;

  if (!res.ok) {
    const message =
      (parsed && typeof parsed === "object" && "error" in parsed && typeof parsed.error === "string"
        ? parsed.error
        : res.statusText) || "Request failed";
    throw new Error(message);
  }

  return parsed;
}
