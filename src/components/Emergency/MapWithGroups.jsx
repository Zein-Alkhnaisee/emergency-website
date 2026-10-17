// src/components/Emergency/MapWithGroups.jsx
import React, { useMemo, memo, useCallback, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

const pendingIcon = L.divIcon({
  html: '⏳',
  className: 'bg-yellow-500 rounded-full p-1 text-white flex items-center justify-center text-sm font-bold shadow-lg',
  iconSize: [28, 28],
});

// ── MapUpdater ──
const MapUpdater = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    if (center && map && Array.isArray(center) && center.length === 2) {
      setTimeout(() => {
        map.setView(center, 13);
        console.log('🗺️ Map setView to:', center);
      }, 50);
    }
  }, [center, map]);
  return null;
};

// ── MapClickHandler ──
const MapClickHandler = React.memo(({ onLocationSelect }) => {
  useMapEvents({
    click(e) {
      onLocationSelect([e.latlng.lat, e.latlng.lng]);
    },
  });
  return null;
});
MapClickHandler.displayName = 'MapClickHandler';

// ── DraggableMarker ──
const DraggableMarker = React.memo(({ position, onDragEnd }) => {
  const markerRef = useRef(null);
  const eventHandlers = useMemo(
    () => ({
      dragend() {
        const marker = markerRef.current;
        if (marker) {
          const latlng = marker.getLatLng();
          onDragEnd([latlng.lat, latlng.lng]);
        }
      },
    }),
    [onDragEnd]
  );
  if (!position || !Array.isArray(position) || position.length !== 2) return null;
  return (
    <Marker draggable={true} eventHandlers={eventHandlers} position={position} ref={markerRef}>
      <Popup>📍 موقع مختار (يمكنك سحبه)</Popup>
    </Marker>
  );
});
DraggableMarker.displayName = 'DraggableMarker';

// ── Main Map ── (تمت إزالة React.memo مؤقتاً)
const MapWithGroups = ({
  userLocation,
  selectedLocation,
  onLocationSelect,
  groups = [],
  waitingList = [],
  isLocating = false,
}) => {
  console.log('🔄 MapWithGroups rendered with userLocation:', userLocation);

  const activeCenter = useMemo(() => {
    if (selectedLocation && Array.isArray(selectedLocation) && selectedLocation.length === 2) {
      return selectedLocation;
    }
    if (userLocation && Array.isArray(userLocation) && userLocation.length === 2) {
      return userLocation;
    }
    return null;
  }, [selectedLocation, userLocation]);

  const activeLocation = useMemo(() => {
    return selectedLocation || userLocation || null;
  }, [selectedLocation, userLocation]);

  const handleDragEnd = useCallback((coords) => {
    onLocationSelect(coords);
  }, [onLocationSelect]);

  const handleClick = useCallback((coords) => {
    onLocationSelect(coords);
  }, [onLocationSelect]);

  if (!activeCenter) {
    return (
      <div className="h-[400px] w-full rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          {isLocating ? 'جارٍ تحديد الموقع...' : 'الموقع غير متوفر. يرجى تمكين GPS.'}
        </p>
      </div>
    );
  }

  const mapKey = `map-${activeCenter[0].toFixed(4)}-${activeCenter[1].toFixed(4)}`;

  return (
    <MapContainer
      key={mapKey}
      center={activeCenter}
      zoom={13}
      style={{ height: '400px', width: '100%' }}
      className="rounded-xl z-0 shadow-inner"
      whenReady={() => console.log('🗺️ Map ready with center:', activeCenter)}
    >
      <MapUpdater center={activeCenter} />
      
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; OpenStreetMap'
      />

      <MapClickHandler onLocationSelect={handleClick} />

      {groups.map(group => {
        const centerLat = group.center_lat || (group.center && group.center[0]);
        const centerLng = group.center_lng || (group.center && group.center[1]);
        const radius = (group.radius_km || 5) * 1000;
        if (!centerLat || !centerLng) return null;
        return (
          <React.Fragment key={group.id}>
            <Circle
              center={[centerLat, centerLng]}
              radius={radius}
              pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.15, weight: 2 }}
            />
            <Marker position={[centerLat, centerLng]}>
              <Popup>
                <strong className="text-primary">{group.name || `غروب #${group.id}`}</strong><br />
                <span className="text-xs text-gray-500">نصف القطر: {group.radius_km || 5} كم</span>
              </Popup>
            </Marker>
          </React.Fragment>
        );
      })}

      {waitingList.map(wait => {
        const centerLat = wait.center_lat || (wait.centroid && wait.centroid[0]);
        const centerLng = wait.center_lng || (wait.centroid && wait.centroid[1]);
        const radius = (wait.radius_km || 5) * 1000;
        if (!centerLat || !centerLng) return null;
        return (
          <React.Fragment key={wait.id}>
            <Circle
              center={[centerLat, centerLng]}
              radius={radius}
              pathOptions={{ color: '#eab308', fillColor: '#facc15', fillOpacity: 0.12, weight: 2, dashArray: '6,6' }}
            />
            <Marker position={[centerLat, centerLng]} icon={pendingIcon}>
              <Popup>
                <strong className="text-yellow-600">⏳ غروب قيد الانتظار</strong><br />
                <span className="text-xs text-gray-500">العدد: {wait.count || wait.members_count || wait.nearby_users_count || 0} مستخدم</span>
              </Popup>
            </Marker>
          </React.Fragment>
        );
      })}

      {activeLocation && <DraggableMarker position={activeLocation} onDragEnd={handleDragEnd} />}
      {userLocation && !selectedLocation && (
        <Marker position={userLocation}>
          <Popup>📍 موقعك الحقيقي (GPS)</Popup>
        </Marker>
      )}
    </MapContainer>
  );
};

export default MapWithGroups;