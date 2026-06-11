import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet";
import { MapPin } from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix for default markers in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const SEARCH_RADIUS_M = 10000;

const userSvg = `
  <svg viewBox="0 0 24 24" width="12" height="12" aria-hidden="true">
    <circle cx="12" cy="8" r="4" fill="white" />
    <path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" fill="white" />
  </svg>
`;

const rescueSvg = `
  <svg viewBox="0 0 24 24" width="12" height="12" aria-hidden="true">
    <rect x="3" y="10" width="13" height="7" rx="1.5" fill="white" />
    <rect x="16" y="12" width="5" height="5" rx="1" fill="white" />
    <circle cx="8" cy="18" r="2" fill="white" />
    <circle cx="18" cy="18" r="2" fill="white" />
  </svg>
`;

// Custom pin icons
const createIcon = (color, innerSvg) => {
  return L.divIcon({
    html: `<div style="
      position: relative;
      width: 30px;
      height: 42px;
      display: flex;
      align-items: flex-start;
      justify-content: center;
    ">
      <div style="
      background-color: ${color};
      width: 28px;
      height: 28px;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      border: 2px solid white;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      font-weight: bold;
      color: white;
      font-size: 11px;
    "><span style="transform: rotate(45deg); line-height: 1; display: inline-flex;">${innerSvg}</span></div>
    </div>`,
    iconSize: [30, 42],
    iconAnchor: [15, 40],
    popupAnchor: [0, -34],
    className: "custom-icon",
  });
};

const userIcon = createIcon("#ef4444", userSvg);
const companyIcon = createIcon("#ec4899", rescueSvg);

/**
 * Map component hiển thị vị trí người dùng và các công ty gần nhất
 */
export default function ServiceMap({ userLocation, companies = [], onCompanyClick }) {
  const mapRef = useRef(null);
  const lastFitKeyRef = useRef("");

  // Tâm bản đồ - ưu tiên vị trí người dùng, nếu không thì HCM
  const center = userLocation
    ? [userLocation.latitude, userLocation.longitude]
    : [10.8231, 106.6797]; // Ho Chi Minh City

  const distanceKm = (lat1, lon1, lat2, lon2) => {
    const toRad = (v) => (v * Math.PI) / 180;
    const R = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  useEffect(() => {
    // Auto-fit bounds nếu có dữ liệu, ưu tiên khoanh vùng quanh user
    if (mapRef.current && (userLocation || companies.length > 0)) {
      const map = mapRef.current;
      const bounds = L.latLngBounds();
      const nearbyPoints = [];

      if (userLocation) {
        bounds.extend([userLocation.latitude, userLocation.longitude]);
      }

      companies.forEach((company) => {
        if (company.absolute_address?.coordinates) {
          const [lon, lat] = company.absolute_address.coordinates;
          if (userLocation) {
            const d = distanceKm(userLocation.latitude, userLocation.longitude, lat, lon);
            if (d <= 12) {
              nearbyPoints.push([lat, lon]);
            }
          } else {
            nearbyPoints.push([lat, lon]);
          }
        }
      });

      nearbyPoints.forEach((point) => bounds.extend(point));

      if (bounds.isValid()) {
        const fitKey = `${userLocation?.latitude?.toFixed(4) ?? "na"}:${userLocation?.longitude?.toFixed(4) ?? "na"}:${nearbyPoints.length}`;
        if (lastFitKeyRef.current === fitKey) return;
        lastFitKeyRef.current = fitKey;

        setTimeout(() => {
          if (nearbyPoints.length > 0) {
            map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
          } else if (userLocation) {
            map.setView([userLocation.latitude, userLocation.longitude], 14, { animate: true });
          } else {
            map.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 });
          }
        }, 100);
      }
    }
  }, [userLocation, companies]);

  return (
    <div className="service-map-shell relative h-96 rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
      <MapContainer
        center={center}
        zoom={13}
        scrollWheelZoom={true}
        className="h-full w-full"
        ref={mapRef}
      >
        {/* OpenStreetMap Tile Layer */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* User Location */}
        {userLocation && (
          <>
            {/* Search radius circle */}
            <Circle
              center={[userLocation.latitude, userLocation.longitude]}
              radius={SEARCH_RADIUS_M}
              pathOptions={{
                color: "#ec4899",
                fillColor: "#f472b6",
                fillOpacity: 0.08,
                weight: 1.5,
                dashArray: "8 8",
              }}
            />
            {/* Accuracy circle */}
            <Circle
              center={[userLocation.latitude, userLocation.longitude]}
              radius={Math.max(25, userLocation.accuracy || 50)}
              pathOptions={{
                color: "#ef4444",
                fillColor: "#fecaca",
                fillOpacity: 0.2,
                weight: 1,
              }}
            />
            {/* User marker */}
            <Marker
              position={[userLocation.latitude, userLocation.longitude]}
              icon={userIcon}
            >
              <Popup>
                <div className="text-sm">
                  <p className="font-semibold text-gray-900">Vị trí của bạn</p>
                  <p className="text-xs text-gray-600 mt-1">
                    Lat: {userLocation.latitude.toFixed(4)}<br />
                    Lon: {userLocation.longitude.toFixed(4)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    ±{Math.round(userLocation.accuracy)}m
                  </p>
                </div>
              </Popup>
            </Marker>
          </>
        )}

        {/* Company Markers */}
        {companies.map((company) => {
          if (!company.absolute_address?.coordinates) return null;

          const [lon, lat] = company.absolute_address.coordinates;

          return (
            <Marker
              key={company.company_id}
              position={[lat, lon]}
              icon={companyIcon}
              eventHandlers={{
                click: () => {
                  onCompanyClick?.(company);
                },
              }}
            >
              <Popup>
                <div className="text-sm max-w-xs">
                  <p className="font-semibold text-gray-900">{company.company_name || company.name}</p>
                  
                  {typeof company.distance === "number" || typeof company.distance_km === "number" ? (
                    <p className="text-xs text-pink-600 font-medium mt-1">
                      📍 {(company.distance_km ?? company.distance).toFixed(1)} km
                    </p>
                  ) : null}

                  <p className="text-xs text-gray-600 mt-2">
                    {company.relative_address || company.absolute_address}
                  </p>

                  {company.company_phone && (
                    <p className="text-xs text-gray-600 mt-2">
                      ☎️ {company.company_phone}
                    </p>
                  )}

                  <button
                    onClick={() => onCompanyClick?.(company)}
                    className="mt-2 w-full bg-pink-500 text-white text-xs font-medium py-1.5 rounded hover:bg-pink-600 transition-colors"
                  >
                    Chọn công ty này
                  </button>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-md p-3 text-xs z-10">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: "#ef4444" }}
            />
            <span className="text-gray-700">Vị trí của bạn</span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: "#ec4899" }}
            />
            <span className="text-gray-700">Công ty cứu hộ</span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="w-4 h-2 rounded-full"
              style={{ backgroundColor: "#f472b6", opacity: 0.35 }}
            />
            <span className="text-gray-700">Bán kính quây 10km</span>
          </div>
        </div>
      </div>

      {/* No location message */}
      {!userLocation && companies.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-sm z-5">
          <div className="text-center">
            <MapPin size={32} className="mx-auto text-gray-400 mb-2" />
            <p className="text-sm font-medium text-gray-600">Không có dữ liệu vị trí</p>
            <p className="text-xs text-gray-400">Hệ thống đang thử tự động lấy GPS...</p>
          </div>
        </div>
      )}
    </div>
  );
}
