import { useEffect, useMemo, useState } from "react";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

function MapClickHandler({ onPick }) {
  useMapEvents({
    click(event) {
      onPick?.({ lat: event.latlng.lat, lng: event.latlng.lng });
    },
  });
  return null;
}

function Recenter({ position }) {
  const map = useMap();

  useEffect(() => {
    const refresh = window.setTimeout(() => {
      map.invalidateSize();
    }, 150);

    if (position) {
      map.setView([position.lat, position.lng], Math.max(map.getZoom(), 14), {
        animate: true,
      });
    }

    return () => window.clearTimeout(refresh);
  }, [map, position]);

  return null;
}

function MapSizeFixer() {
  const map = useMap();

  useEffect(() => {
    const timers = [0, 200, 500].map((delay) =>
      window.setTimeout(() => {
        map.invalidateSize();
      }, delay)
    );

    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [map]);

  return null;
}

export default function LocationPickerMap({ lat, lng, onPick }) {
  const [locating, setLocating] = useState(false);
  const position = useMemo(() => {
    const parsedLat = Number(lat);
    const parsedLng = Number(lng);
    if (Number.isFinite(parsedLat) && Number.isFinite(parsedLng)) {
      return { lat: parsedLat, lng: parsedLng };
    }
    return null;
  }, [lat, lng]);

  const center = position ? [position.lat, position.lng] : [21.0278, 105.8342];

  const pickCurrentLocation = () => {
    if (!navigator.geolocation) {
      window.alert("Trình duyệt không hỗ trợ lấy vị trí hiện tại.");
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onPick?.({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
      },
      () => {
        setLocating(false);
        window.alert("Không lấy được vị trí hiện tại. Vui lòng cấp quyền vị trí hoặc nhấp trực tiếp trên bản đồ.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div className="location-picker-map-shell relative h-64 overflow-hidden rounded-xl border border-gray-200 bg-slate-100">
      <MapContainer
        center={center}
        zoom={13}
        className="h-full w-full"
        style={{ height: "100%", width: "100%", minHeight: 256 }}
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapClickHandler onPick={onPick} />
        <MapSizeFixer />
        <Recenter position={position} />
        {position && <Marker position={[position.lat, position.lng]} />}
      </MapContainer>
      <div className="pointer-events-none absolute left-3 top-3 z-10 rounded-lg bg-white/95 px-3 py-2 text-xs font-medium text-gray-700 shadow-sm">
        Nhấp vào bản đồ để chọn vị trí
      </div>
      <button
        type="button"
        onClick={pickCurrentLocation}
        disabled={locating}
        className="absolute bottom-3 right-3 z-10 rounded-lg bg-white px-3 py-2 text-xs font-semibold text-pink-600 shadow-sm hover:bg-pink-50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {locating ? "Đang lấy vị trí..." : "Dùng vị trí hiện tại"}
      </button>
    </div>
  );
}
