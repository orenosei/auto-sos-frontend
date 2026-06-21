export const VIETNAM_TIME_ZONE = "Asia/Ho_Chi_Minh";

export const normalizeUtcTimestamp = (value) => {
  if (typeof value !== "string") return value;
  if (
    /^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}:\d{2}(?:\.\d+)?$/.test(value)
  ) {
    return `${value.replace(" ", "T")}Z`;
  }
  return value;
};

const toDate = (value) => {
  if (!value) return null;
  const date =
    value instanceof Date ? value : new Date(normalizeUtcTimestamp(value));
  return Number.isFinite(date.getTime()) ? date : null;
};

export const formatVietnamDateTime = (value, options = {}) => {
  const date = toDate(value);
  if (!date) return "";
  return date.toLocaleString("vi-VN", {
    timeZone: VIETNAM_TIME_ZONE,
    ...options,
  });
};

export const formatVietnamDate = (value, options = {}) => {
  const date = toDate(value);
  if (!date) return "";
  return date.toLocaleDateString("vi-VN", {
    timeZone: VIETNAM_TIME_ZONE,
    ...options,
  });
};

export const formatVietnamTime = (value, options = {}) => {
  const date = toDate(value);
  if (!date) return "";
  return date.toLocaleTimeString("vi-VN", {
    timeZone: VIETNAM_TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    ...options,
  });
};
