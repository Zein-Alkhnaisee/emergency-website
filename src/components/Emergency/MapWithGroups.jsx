import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// إصلاح الأيقونات (نفس ما سبق)
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconUrl: markerIcon,
    iconRetinaUrl: markerIcon2x,
    shadowUrl: markerShadow,
});

const MapWithGroups = ({ userLocation, groups, waitingList }) => {
    const center = userLocation || [23.8859, 45.0792]; // وسط السعودية تقريباً

    return (
        <MapContainer center={center} zoom={8} style={{ height: '400px', width: '100%' }} className="rounded-xl z-0">
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

            {/* عرض الغروبات الرسمية */}
            {groups.map(group => (
                <React.Fragment key={group.id}>
                    <Circle center={group.center} radius={5000} color="blue" fillColor="blue" fillOpacity={0.2} />
                    <Marker position={group.center}>
                        <Popup>غروب #{group.id} - {group.members?.length || 0} عضو</Popup>
                    </Marker>
                </React.Fragment>
            ))}

            {/* عرض مراكز انتظار جديدة */}
            {waitingList.map(wait => (
                <Marker key={wait.id} position={wait.centroid} icon={L.divIcon({ html: '⏳', className: 'bg-yellow-500 rounded-full p-1 text-white' })}>
                    <Popup>قائمة انتظار - {wait.count} مستخدمين قريبين</Popup>
                </Marker>
            ))}

            {/* موقع المستخدم الحالي */}
            {userLocation && (
                <Marker position={userLocation}>
                    <Popup>موقعك الحالي</Popup>
                </Marker>
            )}
        </MapContainer>
    );
};

export default MapWithGroups;