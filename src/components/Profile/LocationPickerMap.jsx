// import React, { useMemo, useState, useCallback, useRef, useEffect } from 'react';
// import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
// import L from 'leaflet';
// import 'leaflet/dist/leaflet.css';
// import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
// import markerIcon from 'leaflet/dist/images/marker-icon.png';
// import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// delete L.Icon.Default.prototype._getIconUrl;
// L.Icon.Default.mergeOptions({
//   iconUrl: markerIcon,
//   iconRetinaUrl: markerIcon2x,
//   shadowUrl: markerShadow,
// });

// // علامة قابلة للسحب
// const DraggableMarker = ({ position, onDragEnd }) => {
//   const markerRef = useRef(null);
//   const eventHandlers = useMemo(
//     () => ({
//       dragend() {
//         const marker = markerRef.current;
//         if (marker) {
//           const latlng = marker.getLatLng();
//           onDragEnd([latlng.lat, latlng.lng]);
//         }
//       },
//     }),
//     [onDragEnd]
//   );

//   if (!position) return null;

//   return (
//     <Marker
//       draggable={true}
//       eventHandlers={eventHandlers}
//       position={position}
//       ref={markerRef}
//     >
//       <Popup>موقع مختار (يمكنك سحبه)</Popup>
//     </Marker>
//   );
// };

// // معالج النقر على الخريطة
// const MapClickHandler = ({ onLocationSelect }) => {
//   useMapEvents({
//     click(e) {
//       onLocationSelect([e.latlng.lat, e.latlng.lng]);
//     },
//   });
//   return null;
// };

// const LocationPickerMap = ({ initialLocation, onLocationSelect, height = '300px' }) => {
//   const center = useMemo(() => {
//     if (initialLocation) return initialLocation;
//     return [33.5138, 36.2765]; // دمشق افتراضياً
//   }, [initialLocation]);

//   const [markerPosition, setMarkerPosition] = useState(initialLocation || null);

//   // تحديث العلامة عند تغيير initialLocation
//   useEffect(() => {
//     setMarkerPosition(initialLocation || null);
//   }, [initialLocation]);

//   const handleLocationSelect = (coords) => {
//     setMarkerPosition(coords);
//     onLocationSelect(coords);
//   };

//   return (
//     <MapContainer
//       center={center}
//       zoom={10}
//       style={{ height: height, width: '100%' }}
//       className="rounded-xl z-0"
//     >
//       <TileLayer
//         url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
//         attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
//       />
//       <MapClickHandler onLocationSelect={handleLocationSelect} />
//       {markerPosition && (
//         <DraggableMarker position={markerPosition} onDragEnd={handleLocationSelect} />
//       )}
//     </MapContainer>
//   );
// };

// export default LocationPickerMap;

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

// معالج النقر على الخريطة
const MapClickHandler = ({ onLocationSelect }) => {
  useMapEvents({
    click(e) {
      onLocationSelect([e.latlng.lat, e.latlng.lng]);
    },
  });
  return null;
};

const LocationPickerMap = ({ initialLocation, onLocationSelect, height = '300px' }) => {
  const center = useMemo(() => {
    if (initialLocation) return initialLocation;
    return [33.5138, 36.2765]; // دمشق افتراضياً
  }, [initialLocation]);

  const [markerPosition, setMarkerPosition] = useState(initialLocation || null);

  // تحديث العلامة عند تغيير initialLocation
  useEffect(() => {
    setMarkerPosition(initialLocation || null);
  }, [initialLocation]);

  const handleLocationSelect = (coords) => {
    setMarkerPosition(coords);
    onLocationSelect(coords);
  };

  return (
    <MapContainer
      center={center}
      zoom={10}
      style={{ height: height, width: '100%' }}
      className="rounded-xl z-0"
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