export function toUiUser(role, data) {
  if (role === "company") {
    const c = data;
    return {
      id: String(c.company_id),
      name: c.company_name,
      email: "",
      phone: c.company_phone,
      role,
      avatar: c.company_name?.slice(0, 1)?.toUpperCase() || "C",
      avatarUrl: c.avatar_url ?? "",
      createdAt: c.registered_at,
    };
  }

  const u = data;
  return {
    id: String(u.user_id),
    name: u.full_name || u.user_name,
    email: u.user_email ?? "",
    phone: u.user_phone,
    role,
    userRole: u.user_role ?? role,
    isActive: u.is_active !== false,
    avatar: (u.full_name || u.user_name)?.slice(0, 1)?.toUpperCase() || "U",
    avatarUrl: u.avatar_url ?? "",
    createdAt: u.registered_at,
  };
}

export function toUiService(s) {
  return {
    id: String(s.service_id),
    name: s.service_name,
    description: s.service_description ?? "",
    icon: "🛠️",
    price: "Liên hệ",
    duration: "",
  };
}

function pickNumeric(obj, keys) {
  if (!obj) return null;
  for (const k of keys) {
    const v = obj[k];
    if (v == null || v === "") continue;
    const n = Number(v);
    if (!Number.isNaN(n)) return n;
  }
  return null;
}

export function toUiCompany(c, companyServices) {
  const services = (companyServices ?? []).map((x) => x.service_name);
  const serviceDetails = (companyServices ?? []).map((x) => ({
    id: String(x.service_id),
    service_id: x.service_id,
    name: x.service_name,
    service_name: x.service_name,
    price: Number(x.service_price),
    service_price: Number(x.service_price),
  }));
  const geoLocation = parseGeoJsonPoint(c.absolute_address);
  const rawRating = pickNumeric(c, [
    "rating",
    "average_rating",
    "avg_rating",
    "avgRating",
    "averageRating",
  ]);
  const rawReviewCount = pickNumeric(c, ["total_reviews", "review_count", "reviewCount", "totalReviews"]);
  const rawResponseTime = pickNumeric(c, [
    "response_time_minutes",
    "avg_response_minutes",
    "avgResponseMinutes",
    "responseTime",
  ]);
  
  return {
    id: String(c.company_id),
    company_id: c.company_id, // Keep original ID for API
    name: c.company_name,
    company_name: c.company_name, // Keep for map
    address: c.relative_address ?? "",
    relative_address: c.relative_address ?? "",
    phone: c.company_phone,
    company_phone: c.company_phone,
    avatarUrl: c.avatar_url ?? "",
    avatar_url: c.avatar_url ?? "",
    email: "",
    rating: Number.isFinite(rawRating) ? rawRating : null,
    totalReviews: Number.isFinite(rawReviewCount) ? rawReviewCount : null,
    distance: 99,
    operatingArea: c.rescue_area ?? "",
    license: c.company_license ?? "",
    verificationDocumentUrls: Array.isArray(c.verification_document_urls)
      ? c.verification_document_urls
      : [],
    verification_document_urls: Array.isArray(c.verification_document_urls)
      ? c.verification_document_urls
      : [],
    verified: !!c.is_verified,
    services,
    serviceDetails,
    description: c.rescue_area ? `Khu vực hoạt động: ${c.rescue_area}` : "",
    responseTime: Number.isFinite(rawResponseTime) ? rawResponseTime : null,
    // Add GPS data for map
    absolute_address: typeof c.absolute_address === 'string' 
      ? parseGeoJsonFromString(c.absolute_address)
      : c.absolute_address,
    lat: geoLocation.lat,
    lng: geoLocation.lng,
  };
}

function parseGeoJsonPoint(geoJson) {
  if (!geoJson) return {};
  try {
    const obj = typeof geoJson === "string" ? JSON.parse(geoJson) : geoJson;
    if (obj && obj.type === "Point" && Array.isArray(obj.coordinates) && obj.coordinates.length >= 2) {
      const [lng, lat] = obj.coordinates;
      if (typeof lat === "number" && typeof lng === "number") return { lat, lng };
    }
  } catch {
    // ignore
  }
  return {};
}

function parseGeoJsonFromString(geoJsonString) {
  if (!geoJsonString) return null;
  try {
    const obj = typeof geoJsonString === 'string' ? JSON.parse(geoJsonString) : geoJsonString;
    if (obj && obj.type === "Point" && Array.isArray(obj.coordinates)) {
      return obj;
    }
  } catch {
    // ignore
  }
  return null;
}

export function toUiRequest(r, lookup) {
  const point = parseGeoJsonPoint(r.absolute_location);
  const priceNumber = Number(lookup?.servicePrice ?? r.final_price);
  const estimatedArrival = r.estimated_arrival ? new Date(r.estimated_arrival) : null;
  const etaMinutes =
    estimatedArrival && Number.isFinite(estimatedArrival.getTime())
      ? Math.max(0, Math.round((estimatedArrival.getTime() - Date.now()) / 60000))
      : null;

  return {
    id: String(r.request_id),
    userId: r.user_id != null ? String(r.user_id) : "",
    userName: lookup?.userName ?? "",
    userPhone: lookup?.userPhone ?? "",
    userAvatarUrl: lookup?.userAvatarUrl ?? "",
    serviceType: lookup?.serviceType ?? "",
    servicePrice: Number.isFinite(priceNumber) ? priceNumber : null,
    price: Number.isFinite(priceNumber) ? `${priceNumber.toLocaleString("vi-VN")}đ` : "",
    description: r.request_description ?? "",
    issueType: r.issue_type ?? "",
    contactName: r.contact_name ?? "",
    contactPhone: r.contact_phone ?? "",
    contactBackNow: !!r.contact_back_now,
    priority: r.priority ?? "normal",
    location: r.relative_location ?? "",
    latitude: point.lat,
    longitude: point.lng,
    status: r.request_status,
    companyId: r.company_id != null ? String(r.company_id) : undefined,
    vehicleId: r.vehicle_id != null ? String(r.vehicle_id) : "",
    companyName: lookup?.companyName,
    estimatedArrival: r.estimated_arrival,
    estimatedTime: etaMinutes,
    acceptedAt: r.accepted_at,
    headingAt: r.heading_at,
    arrivedAt: r.arrived_at,
    actualArrival: r.actual_arrival,
    completedAt: r.completed_at,
    cancelledAt: r.cancelled_at,
    cancelledBy: r.cancelled_by,
    cancelReason: r.cancel_reason,
    finalPrice: r.final_price,
    createdAt: r.created_at,
    updatedAt:
      r.completed_at ??
      r.cancelled_at ??
      r.arrived_at ??
      r.heading_at ??
      r.accepted_at ??
      r.actual_arrival ??
      r.created_at,
  };
}
