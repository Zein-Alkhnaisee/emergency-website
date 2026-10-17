// src/components/Profile/LocationPickerMap.jsx
import React, { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
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

  if (!position || !Array.isArray(position) || position.length !== 2) return null;

  return (
    <Marker
      draggable={true}
      eventHandlers={eventHandlers}
      position={position}
      ref={markerRef}
    >
      <Popup className="rounded-xl shadow-lg">📍 موقع مختار (يمكنك سحبه)</Popup>
    </Marker>
  );
};

const MapClickHandler = ({ onLocationSelect }) => {
  useMapEvents({
    click(e) {
      onLocationSelect([e.latlng.lat, e.latlng.lng]);
    },
  });
  return null;
};

const LocationPickerMap = ({ initialLocation, onLocationSelect, height = '300px' }) => {
  // ✅ لا نستخدم قيمة افتراضية لدمشق
  const center = useMemo(() => {
    if (initialLocation && Array.isArray(initialLocation) && initialLocation.length === 2) {
      return initialLocation;
    }
    return null;
  }, [initialLocation]);

  const [markerPosition, setMarkerPosition] = useState(initialLocation || null);

  useEffect(() => {
    setMarkerPosition(initialLocation || null);
  }, [initialLocation]);

  const handleLocationSelect = (coords) => {
    setMarkerPosition(coords);
    onLocationSelect(coords);
  };

  // ✅ إذا لم يكن هناك مركز، نعرض رسالة ونسمح للمستخدم بالنقر لتحديد موقع
  if (!center) {
    return (
      <div 
        className="rounded-xl bg-gray-100 dark:bg-gray-700 flex flex-col items-center justify-center border border-gray-200 dark:border-gray-600"
        style={{ height, width: '100%' }}
        onClick={() => {
          // إذا كان المستخدم ينقر على الخريطة، نطلب منه تحديد موقع عبر GPS أو نفتح محدد موقع
          if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
              (pos) => {
                const coords = [pos.coords.latitude, pos.coords.longitude];
                handleLocationSelect(coords);
              },
              () => {
                alert('تعذر الحصول على الموقع. يرجى تحديد موقع يدوياً على الخريطة.');
              }
            );
          } else {
            alert('متصفحك لا يدعم تحديد الموقع. يرجى تحديد موقع يدوياً على الخريطة.');
          }
        }}
      >
        <p className="text-gray-500 dark:text-gray-400 text-sm">الموقع غير متوفر. اضغط هنا لتحديد موقعك.</p>
      </div>
    );
  }

  // ✅ مفتاح لإعادة إنشاء الخريطة عند تغير المركز
  const mapKey = `locpicker-${center[0].toFixed(4)}-${center[1].toFixed(4)}`;

  return (
    <MapContainer
      key={mapKey}
      center={center}
      zoom={10}
      style={{ height: height, width: '100%' }}
      className="rounded-xl z-0 shadow-inner border border-gray-200 dark:border-gray-700"
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      />
      <MapClickHandler onLocationSelect={handleLocationSelect} />
      {markerPosition && (
        <DraggableMarker position={markerPosition} onDragEnd={handleLocationSelect} />
      )}
    </MapContainer>
  );
};

export default LocationPickerMap;