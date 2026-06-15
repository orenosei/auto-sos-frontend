/**
 * GPS Utilities - Xử lý vị trí địa lý
 */

/**
 * Tính khoảng cách giữa 2 điểm dùng công thức Haversine
 * @param {number} lat1 - Latitude điểm 1
 * @param {number} lon1 - Longitude điểm 1
 * @param {number} lat2 - Latitude điểm 2
 * @param {number} lon2 - Longitude điểm 2
 * @returns {number} - Khoảng cách tính bằng km
 */
export function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Bán kính Trái Đất (km)
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Chuyển độ sang radian
 */
function toRad(deg) {
  return (deg * Math.PI) / 180;
}

/**
 * Lấy vị trí hiện tại sử dụng Geolocation API
 * @returns {Promise<{latitude: number, longitude: number, accuracy: number}>}
 */
export function getCurrentLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Trình duyệt không hỗ trợ Geolocation"));
      return;
    }

    const options = {
      enableHighAccuracy: true, // Yêu cầu độ chính xác cao
      timeout: 10000, // Timeout 10 giây
      maximumAge: 0, // Không dùng cached position
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        resolve({
          latitude,
          longitude,
          accuracy, // Độ chính xác tính bằng mét
        });
      },
      (error) => {
        let errorMsg = "Lỗi xác định vị trí";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMsg = "Bạn đã từ chối quyền truy cập vị trí";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMsg = "Thông tin vị trí không khả dụng";
            break;
          case error.TIMEOUT:
            errorMsg = "Yêu cầu xác định vị trí đã hết thời gian chờ";
            break;
        }
        reject(new Error(errorMsg));
      },
      options
    );
  });
}

/**
 * Theo dõi vị trí liên tục
 * @param {Function} callback - Hàm gọi với vị trí mới: {latitude, longitude, accuracy}
 * @param {Function} onError - Hàm gọi khi có lỗi
 * @returns {number} - ID theo dõi để có thể dừng lại bằng clearWatch
 */
export function watchLocation(callback, onError) {
  if (!navigator.geolocation) {
    onError?.(new Error("Trình duyệt không hỗ trợ Geolocation"));
    return null;
  }

  const options = {
    enableHighAccuracy: true,
    timeout: 5000,
    maximumAge: 0,
  };

  const watchId = navigator.geolocation.watchPosition(
    (position) => {
      const { latitude, longitude, accuracy } = position.coords;
      callback({
        latitude,
        longitude,
        accuracy,
      });
    },
    (error) => {
      let errorMsg = "Lỗi theo dõi vị trí";
      switch (error.code) {
        case error.PERMISSION_DENIED:
          errorMsg = "Bạn đã từ chối quyền truy cập vị trí";
          break;
        case error.POSITION_UNAVAILABLE:
          errorMsg = "Thông tin vị trí không khả dụng";
          break;
        case error.TIMEOUT:
          errorMsg = "Yêu cầu xác định vị trí đã hết thời gian chờ";
          break;
      }
      onError?.(new Error(errorMsg));
    },
    options
  );

  return watchId;
}

/**
 * Dừng theo dõi vị trí
 */
export function stopWatchLocation(watchId) {
  if (watchId !== null && navigator.geolocation) {
    navigator.geolocation.clearWatch(watchId);
  }
}

/**
 * Chuyển đổi tọa độ sang địa chỉ (Reverse Geocoding)
 * Sử dụng Nominatim OpenStreetMap (miễn phí, không cần API key)
 */
export async function reverseGeocode(latitude, longitude) {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1&accept-language=vi`
    );
    const data = await response.json();
    return {
      address: data.address?.road || data.display_name || "Địa chỉ không xác định",
      fullAddress: data.display_name,
      address_components: data.address,
    };
  } catch (error) {
    console.error("Lỗi Reverse Geocoding:", error);
    return {
      address: "Không thể lấy địa chỉ",
      fullAddress: `${latitude}, ${longitude}`,
    };
  }
}

function normalizeVietnameseAddressPart(value) {
  if (!value || typeof value !== "string") return "";
  let text = value.trim().replace(/\s+/g, " ");

  const suffixToPrefix = [
    [/^(.+?)\s+Street$/i, "Đường $1"],
    [/^(.+?)\s+Road$/i, "Đường $1"],
    [/^(.+?)\s+Avenue$/i, "Đại lộ $1"],
    [/^(.+?)\s+Boulevard$/i, "Đại lộ $1"],
    [/^(.+?)\s+Lane$/i, "Ngõ $1"],
    [/^(.+?)\s+Alley$/i, "Ngõ $1"],
    [/^(.+?)\s+Ward$/i, "Phường $1"],
    [/^(.+?)\s+Commune$/i, "Xã $1"],
    [/^(.+?)\s+District$/i, "Quận $1"],
    [/^(.+?)\s+County$/i, "Huyện $1"],
    [/^(.+?)\s+City$/i, "Thành phố $1"],
    [/^(.+?)\s+Province$/i, "Tỉnh $1"],
  ];

  for (const [pattern, replacement] of suffixToPrefix) {
    if (pattern.test(text)) {
      text = text.replace(pattern, replacement);
      break;
    }
  }

  return text
    .replace(/\bStreet\b/gi, "Đường")
    .replace(/\bRoad\b/gi, "Đường")
    .replace(/\bAvenue\b/gi, "Đại lộ")
    .replace(/\bBoulevard\b/gi, "Đại lộ")
    .replace(/\bLane\b/gi, "Ngõ")
    .replace(/\bAlley\b/gi, "Ngõ")
    .replace(/\bWard\b/gi, "Phường")
    .replace(/\bCommune\b/gi, "Xã")
    .replace(/\bDistrict\b/gi, "Quận")
    .replace(/\bCounty\b/gi, "Huyện")
    .replace(/\bCity\b/gi, "Thành phố")
    .replace(/\bProvince\b/gi, "Tỉnh")
    .replace(/\bHamlet\b/gi, "Ấp")
    .replace(/\bVillage\b/gi, "Làng")
    .replace(/\bQuarter\b/gi, "Khu phố")
    .replace(/\bProject\b/gi, "Dự án")
    .replace(/\bBus Company\b/gi, "Công ty xe buýt")
    .replace(/\bbus\b/gi, "buýt")
    .replace(/\bwith\b/gi, "với")
    .replace(/\bvớI\b/g, "với")
    .replace(/\bAp\b/gi, "Ấp")
    .replace(/\bHamlet\b/gi, "Ấp")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\bNguyen Van Tuyet\b/gi, "Nguyễn Văn Tuyết")
    .replace(/\bThai Ha\b/gi, "Thái Hà")
    .replace(/\bPhuong Mai\b/gi, "Phương Mai")
    .replace(/\bKim Lien\b/gi, "Kim Liên")
    .replace(/\bVinh Tuy\b/gi, "Vĩnh Tuy")
    .replace(/\bMinh Khai\b/gi, "Minh Khai")
    .replace(/\bHa Noi\b/gi, "Hà Nội")
    .replace(/\bHanoi\b/gi, "Hà Nội")
    .replace(/\bHo Chi Minh\b/gi, "Hồ Chí Minh")
    .replace(/^(.+?)\s+Ấp$/i, "Ấp $1");
}

export function formatAdministrativeAddress(fullAddress, addressComponents) {
  const seen = new Set();
  const parts = [];
  const push = (value) => {
    if (!value || typeof value !== "string") return;
    const normalized = normalizeVietnameseAddressPart(value);
    if (!normalized || seen.has(normalized.toLowerCase())) return;
    seen.add(normalized.toLowerCase());
    parts.push(normalized);
  };

  if (addressComponents) {
    push(addressComponents.road || addressComponents.pedestrian || addressComponents.footway);
    push(addressComponents.neighbourhood || addressComponents.suburb || addressComponents.ward || addressComponents.village || addressComponents.town);
    push(addressComponents.city_district || addressComponents.district || addressComponents.county);
    push(addressComponents.city || addressComponents.state || addressComponents.province);
  }

  if (parts.length >= 2) return parts.join(", ");

  if (typeof fullAddress === "string") {
    fullAddress
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean)
      .filter((part) => !/^\d+$/.test(part) && !["Vietnam", "Việt Nam"].includes(part))
      .slice(0, 4)
      .forEach(push);
  }

  return parts.length > 0 ? parts.join(", ") : "Không thể lấy địa chỉ hành chính";
}

/**
 * Chuyển đổi địa chỉ sang tọa độ (Geocoding)
 */
export async function geocode(address) {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`
    );
    const data = await response.json();
    if (data.length > 0) {
      const first = data[0];
      return {
        latitude: parseFloat(first.lat),
        longitude: parseFloat(first.lon),
        displayName: first.display_name,
      };
    }
    throw new Error("Không tìm thấy địa chỉ");
  } catch (error) {
    console.error("Lỗi Geocoding:", error);
    throw error;
  }
}

/**
 * Tính ETA (thời gian ước tính) từ khoảng cách
 * @param {number} distanceKm - Khoảng cách tính bằng km
 * @returns {number|null} - Thời gian ước tính tính bằng phút, hoặc null nếu không hợp lệ
 */
export function calculateETA(distanceKm) {
  if (!Number.isFinite(distanceKm) || distanceKm < 0) return null;
  
  // Giả sử tốc độ trung bình 35 km/h cho xe cứu hộ
  const averageSpeed = 35; // km/h
  const etaMinutes = (distanceKm / averageSpeed) * 60;
  
  return Math.round(etaMinutes);
}

/**
 * Định dạng địa chỉ từ Nominatim để hiển thị đẹp hơn
 * Input: "Bach Mai Ward, Hà Nội, 11618, Vietnam"
 * Output: "Bach Mai, Hà Nội"
 * @param {string} fullAddress - Địa chỉ đầy đủ từ Nominatim
 * @param {object} addressComponents - Thành phần địa chỉ từ Nominatim address_details
 * @returns {string} - Địa chỉ định dạng gọn gàng
 */
export function formatAddress(fullAddress, addressComponents) {
  const administrativeAddress = formatAdministrativeAddress(fullAddress, addressComponents);
  if (administrativeAddress && administrativeAddress !== "Không thể lấy địa chỉ hành chính") {
    return administrativeAddress;
  }

  // Nếu có address_components từ Nominatim, sử dụng nó để trích xuất
  if (addressComponents) {
    const village = addressComponents.village || addressComponents.neighbourhood;
    const ward = addressComponents.suburb || addressComponents.ward;
    const district = addressComponents.county;
    const city = addressComponents.city || addressComponents.state;
    
    // Ưu tiên thứ tự: village/neighbourhood -> ward/suburb -> city
    const location = village || ward || district;
    if (location && city && location !== city) {
      return `${location}, ${city}`;
    }
    if (city) return city;
  }
  
  // Fallback: phân tích chuỗi địa chỉ bằng cách tách dấu phẩy
  if (typeof fullAddress === 'string') {
    const parts = fullAddress.split(',').map(p => p.trim()).filter(Boolean);
    
    // Lọc ra các phần không phải là postal code hay quốc gia
    const filtered = parts.filter(p => {
      // Bỏ qua postal code (toàn số)
      if (/^\d+$/.test(p)) return false;
      // Bỏ qua quốc gia
      if (p === 'Vietnam' || p === 'Việt Nam') return false;
      return true;
    });
    
    if (filtered.length >= 2) {
      // Lấy 2 phần cuối (thường là ward + city)
      return filtered.slice(-2).join(', ');
    } else if (filtered.length > 0) {
      return filtered[0];
    }
  }
  
  return fullAddress || 'Không xác định';
}

/**
 * Format khoảng cách để hiển thị
 */
export function formatDistance(km) {
  if (km < 1) {
    return `${Math.round(km * 1000)} m`;
  }
  return `${km.toFixed(1)} km`;
}

/**
 * Tạo Google Maps URL
 */
export function getGoogleMapsUrl(latitude, longitude) {
  return `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
}

/**
 * Tạo OpenStreetMap URL
 */
export function getOpenStreetMapUrl(latitude, longitude) {
  return `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}&zoom=15&layers=M`;
}

/**
 * Kiểm tra xem vị trí 1 có nằm trong vòng tròn của vị trí 2 không
 * @param {number} userLat - Latitude người dùng
 * @param {number} userLon - Longitude người dùng
 * @param {number} centerLat - Latitude tâm vòng tròn
 * @param {number} centerLon - Longitude tâm vòng tròn
 * @param {number} radiusKm - Bán kính tính bằng km
 */
export function isWithinRadius(userLat, userLon, centerLat, centerLon, radiusKm) {
  const distance = calculateDistance(userLat, userLon, centerLat, centerLon);
  return distance <= radiusKm;
}
