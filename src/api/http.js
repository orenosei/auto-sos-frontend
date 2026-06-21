import { normalizeUtcTimestamp } from "../utils/dateTime";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";
const SQL_TIMESTAMP_PATTERN =
  /^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}:\d{2}(?:\.\d+)?$/;
const DATE_FIELD_PATTERN =
  /(?:^|_)(?:created|updated|registered|reviewed|sent|changed|liked|accepted|heading|arrived|completed|cancelled|confirmed|paid)_at$|^(?:estimated_arrival|actual_arrival)$|^(?:createdAt|updatedAt|registeredAt|reviewedAt|sentAt|changedAt|likedAt|acceptedAt|headingAt|arrivedAt|actualArrival|completedAt|cancelledAt|estimatedArrival|confirmedAt|paidAt)$/;

function normalizeApiDates(value, key = "") {
  if (Array.isArray(value)) {
    return value.map((item) => normalizeApiDates(item));
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([childKey, childValue]) => [
        childKey,
        normalizeApiDates(childValue, childKey),
      ])
    );
  }
  if (
    typeof value === "string" &&
    DATE_FIELD_PATTERN.test(key) &&
    SQL_TIMESTAMP_PATTERN.test(value)
  ) {
    return normalizeUtcTimestamp(value);
  }
  return value;
}

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
  const parsed = text ? normalizeApiDates(JSON.parse(text)) : null;

  if (!res.ok) {
    const message =
      (parsed && typeof parsed === "object" && "error" in parsed && typeof parsed.error === "string"
        ? parsed.error
        : res.statusText) || "Request failed";
    throw new Error(message);
  }

  return parsed;
}
