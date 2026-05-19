import { useEffect, useState, useCallback, useRef } from "react";
import {
  getCurrentLocation,
  watchLocation,
  stopWatchLocation,
  reverseGeocode,
  calculateDistance,
} from "../utils/gpsUtils";

/**
 * Hook để quản lý vị trí GPS
 */
export function useGPS(shouldWatch = false) {
  const [location, setLocation] = useState(null); // {latitude, longitude, accuracy}
  const [address, setAddress] = useState(""); // Địa chỉ con người
  const [fullAddress, setFullAddress] = useState(""); // Địa chỉ đầy đủ từ Nominatim
  const [addressComponents, setAddressComponents] = useState(null); // Thành phần địa chỉ từ Nominatim
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const watchIdRef = useRef(null);

  // Lấy vị trí hiện tại
  const getCurrentLocationHandler = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const loc = await getCurrentLocation();
      setLocation(loc);

      // Lấy địa chỉ từ tọa độ
      const geocoded = await reverseGeocode(loc.latitude, loc.longitude);
      setAddress(geocoded.address);
      setFullAddress(geocoded.fullAddress);
      setAddressComponents(geocoded.address_components);
      return loc;
    } catch (err) {
      setError(err.message);
      console.error("GPS Error:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Theo dõi vị trí liên tục
  useEffect(() => {
    if (shouldWatch) {
      setLoading(true);
      watchIdRef.current = watchLocation(
        (loc) => {
          setLocation(loc);
          reverseGeocode(loc.latitude, loc.longitude).then((geocoded) => {
            setAddress(geocoded.address);
            setFullAddress(geocoded.fullAddress);
            setAddressComponents(geocoded.address_components);
          });
          setLoading(false);
        },
        (err) => {
          setError(err.message);
          setLoading(false);
        }
      );
    }

    return () => {
      if (watchIdRef.current !== null) {
        stopWatchLocation(watchIdRef.current);
      }
    };
  }, [shouldWatch]);

  // Tính khoảng cách tới một điểm khác
  const getDistanceTo = useCallback(
    (targetLat, targetLon) => {
      if (!location) return null;
      return calculateDistance(location.latitude, location.longitude, targetLat, targetLon);
    },
    [location]
  );

  // Dừng theo dõi
  const stopWatching = useCallback(() => {
    if (watchIdRef.current !== null) {
      stopWatchLocation(watchIdRef.current);
      watchIdRef.current = null;
    }
  }, []);

  return {
    location, // {latitude, longitude, accuracy}
    address,
    fullAddress,
    addressComponents,
    loading,
    error,
    getCurrentLocation: getCurrentLocationHandler,
    getDistanceTo,
    stopWatching,
    isAvailable: !!navigator?.geolocation,
  };
}

/**
 * Hook để lấy danh sách công ty gần nhất dựa trên vị trí
 */
export function useNearbyCompanies(userLocation, companies) {
  const [nearbyCompanies, setNearbyCompanies] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userLocation || !companies) return;

    setLoading(true);
    try {
      // Tính khoảng cách cho mỗi công ty
      const companiesWithDistance = companies.map((company) => {
        const distance = calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          company.latitude, // Giả sử company có latitude/longitude
          company.longitude
        );
        return {
          ...company,
          distance,
        };
      });

      // Sắp xếp theo khoảng cách
      const sorted = companiesWithDistance.sort((a, b) => a.distance - b.distance);

      setNearbyCompanies(sorted);
    } finally {
      setLoading(false);
    }
  }, [userLocation, companies]);

  return { nearbyCompanies, loading };
}
