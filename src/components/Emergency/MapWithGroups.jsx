import React, { useMemo, memo, useState, useCallback, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMapEvents } from 'react-leaflet';
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

// أيقونة خاصة للغروبات المعلقة (نقطة صفراء مع علامة ساعة)
const pendingIcon = L.divIcon({
  html: '⏳',
  className: 'bg-yellow-500 rounded-full p-1 text-white flex items-center justify-center text-sm font-bold',
  iconSize: [28, 28],
});

// أيقونة موقع المستخدم (نقطة حمراء عادية، لا حاجة لتغيير)
const userIcon = L.divIcon({
  html: '📍',
  className: 'text-2xl',
});

// مكون داخلي للتعامل مع نقرات الخريطة
const MapClickHandler = ({ onLocationSelect }) => {
  useMapEvents({
    click(e) {
      onLocationSelect([e.latlng.lat, e.latlng.lng]);
    },
  });
  return null;
};

// علامة قابلة للسحب
const DraggableMarker = ({ position, onDragEnd }) => {
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

  if (!position) return null;

  return (
    <Marker
      draggable={true}
      eventHandlers={eventHandlers}
      position={position}
      ref={markerRef}
    >
      <Popup>موقع مختار (يمكنك سحبه)</Popup>
    </Marker>
  );
};

const MapWithGroups = memo(({ 
  userLocation,      // موقع GPS الفعلي
  selectedLocation,  // الموقع الذي اختاره المستخدم يدوياً (قد يكون null)
  onLocationSelect,  // دالة عند اختيار موقع جديد (نقرة أو سحب)
  groups = [],       // قائمة الغروبات الرسمية
  waitingList = []   // قائمة الغروبات المعلقة
}) => {
  // المركز: إذا كان هناك موقع مختار نستخدمه، وإلا نستخدم موقع GPS
  const center = useMemo(() => {
    if (selectedLocation) return selectedLocation;
    return userLocation || [23.8859, 45.0792];
  }, [selectedLocation, userLocation]);

  // علامة الموقع النشطة (التي سيتم استخدامها في البحث)
  const activeLocation = selectedLocation || userLocation;

  return (
    <MapContainer
      center={center}
      zoom={8}
      style={{ height: '400px', width: '100%' }}
      className="rounded-xl z-0"
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; OpenStreetMap'
      />

      <MapClickHandler onLocationSelect={onLocationSelect} />

      {/* ── الغروبات الرسمية (دوائر زرقاء) ── */}
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
              pathOptions={{ color: 'blue', fillColor: 'blue', fillOpacity: 0.15, weight: 1 }}
            />
            <Marker position={[centerLat, centerLng]}>
              <Popup>
                <strong>{group.name || `غروب #${group.id}`}</strong><br />
                نصف القطر: {group.radius_km || 5} كم
              </Popup>
            </Marker>
          </React.Fragment>
        );
      })}

      {/* ── الغروبات المعلقة (دوائر صفراء + نقطة صفراء) ── */}
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
              pathOptions={{ color: '#eab308', fillColor: '#facc15', fillOpacity: 0.15, weight: 1, dashArray: '5,5' }} // خط متقطع أصفر
            />
            <Marker position={[centerLat, centerLng]} icon={pendingIcon}>
              <Popup>
                <strong>⏳ غروب قيد الانتظار</strong><br />
                العدد: {wait.count || wait.members_count || wait.nearby_users_count || 0} مستخدم<br />
                نصف القطر: {wait.radius_km || 5} كم
              </Popup>
            </Marker>
          </React.Fragment>
        );
      })}

      {/* ── علامة الموقع النشط (قابلة للسحب إذا كانت مختارة) ── */}
      {activeLocation && (
        <DraggableMarker position={activeLocation} onDragEnd={onLocationSelect} />
      )}

      {/* ── موقع GPS الأصلي (للمقارنة) ── */}
      {userLocation && !selectedLocation && (
        <Marker position={userLocation}>
          <Popup>موقعك الحقيقي (GPS)</Popup>
        </Marker>
      )}
    </MapContainer>
  );
});

MapWithGroups.displayName = 'MapWithGroups';
export default MapWithGroups;