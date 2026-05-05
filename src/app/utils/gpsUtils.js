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
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`
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
