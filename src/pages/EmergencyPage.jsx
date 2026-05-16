// src/pages/EmergencyPage.jsx
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useGeoGroup } from '../hooks/useGeoGroup';
import { useEmergencyNotifications } from '../hooks/useEmergencyNotifications';
import Button from '../components/Shared/Button';
import Heading from '../components/Shared/Heading';

// إصلاح أيقونات Leaflet
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

// مكون تحديد الموقع
function LocationMarker({ setPosition }) {
  const map = useMapEvents({
    locationfound(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
      map.flyTo(e.latlng, 13);
    },
  });
  useEffect(() => {
    map.locate();
  }, [map]);
  return null;
}

const EmergencyPage = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();

  // حالة المستخدم (مؤقت، سيأتي من Redux لاحقاً)
  const [userId] = useState('user_123');
  const [position, setPosition] = useState(null);
  const [geoError, setGeoError] = useState(null);
  const [sosOpen, setSosOpen] = useState(false);
  const [emergencyType, setEmergencyType] = useState('');
  const [severity, setSeverity] = useState('severe');
  const [message, setMessage] = useState('');

  // جلب بيانات الغروبات والإشعارات من Redux
  const { groups, waitingList, userGroupMap } = useSelector(state => state.geoGroups);
  const { currentUser } = useSelector(state => state.user);
  const { activeEmergencies } = useSelector(state => state.emergency);

  // استخدام الـ hooks المخصصة
  const { assignedGroupId, isInWaiting, loading: groupLoading } = useGeoGroup(position, userId);
  const { sendEmergency } = useEmergencyNotifications();

  // طلب الموقع الجغرافي
  useEffect(() => {
    if (!navigator.geolocation) {
      setGeoError(t('emergency.geoNotSupported'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => setPosition([pos.coords.latitude, pos.coords.longitude]),
      (err) => {
        console.error(err);
        if (err.code === 1) setGeoError(t('emergency.geoDenied'));
        else setGeoError(t('emergency.geoError'));
      }
    );
  }, [t]);

  // دالة إرسال حالة الطوارئ
  const handleSendSOS = async () => {
    if (!emergencyType) {
      alert(t('emergency.selectTypeFirst'));
      return;
    }

    const emergencyId = await sendEmergency({
      type: emergencyType,
      severity: severity,
      message: message,
      location: position,
    });

    if (emergencyId) {
      alert(t('emergency.sent'));
      setSosOpen(false);
      // إعادة تعيين الحقول
      setEmergencyType('');
      setSeverity('severe');
      setMessage('');
    }
  };

  // عرض حالات الطوارئ النشطة للمستخدم الحالي
  const userEmergencies = activeEmergencies.filter(e => e.userId === (currentUser?.id || userId));

  // عرض الخريطة مع الغروبات ومراكز الانتظار
  const renderMap = () => {
    const center = position || [23.8859, 45.0792];
    return (
      <MapContainer center={center} zoom={8} style={{ height: '100%', width: '100%' }} className="rounded-xl z-0">
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <LocationMarker setPosition={setPosition} />

        {/* الغروبات الرسمية */}
        {groups.map(group => (
          <React.Fragment key={group.id}>
            <Circle center={group.center} radius={5000} color="blue" fillColor="blue" fillOpacity={0.2} />
            <Marker position={group.center}>
              <Popup>
                {t('emergency.group')} #{group.id}<br />
                {group.members?.length || 0} {t('emergency.members')}
              </Popup>
            </Marker>
          </React.Fragment>
        ))}

        {/* مراكز الانتظار */}
        {waitingList.map(wait => (
          <Marker
            key={wait.id}
            position={wait.centroid}
            icon={L.divIcon({
              html: '⏳',
              className: 'bg-yellow-500 rounded-full p-1 text-white text-xs font-bold w-6 h-6 flex items-center justify-center'
            })}
          >
            <Popup>{t('emergency.waitingGroup')} - {wait.count} {t('emergency.usersNearby')}</Popup>
          </Marker>
        ))}

        {/* موقع المستخدم الحالي */}
        {position && (
          <Marker position={position}>
            <Popup>{t('emergency.yourLocation')}</Popup>
          </Marker>
        )}
      </MapContainer>
    );
  };

  return (
    <div className="container my-10">
      <Heading title={t('emergency.title')} subtitle={t('emergency.subtitle')} />

      {/* حالة الانضمام للغروب */}
      {!groupLoading && (
        <div className="mb-4 p-3 rounded-lg bg-gray-100 dark:bg-gray-800 text-center">
          {isInWaiting ? (
            <p className="text-yellow-600 dark:text-yellow-400">{t('emergency.inWaitingQueue')}</p>
          ) : assignedGroupId ? (
            <p className="text-green-600 dark:text-green-400">{t('emergency.assignedToGroup')} #{assignedGroupId}</p>
          ) : (
            <p className="text-gray-600">{t('emergency.noGroupYet')}</p>
          )}
        </div>
      )}

      {/* عرض حالات الطوارئ النشطة للمستخدم */}
      {userEmergencies.length > 0 && (
        <div className="mb-4 p-3 rounded-lg bg-red-100 dark:bg-red-900/30 text-center">
          <p className="text-red-600 dark:text-red-400 font-bold">
            🚨 لديك {userEmergencies.length} حالة طوارئ نشطة
          </p>
        </div>
      )}

      {/* الخريطة */}
      <div className="h-96 w-full rounded-xl overflow-hidden mb-8 shadow-lg relative z-0">
        {!position && !geoError && <div className="h-full flex items-center justify-center bg-gray-200 dark:bg-gray-700">{t('emergency.locating')}</div>}
        {geoError && (
          <div className="h-full flex flex-col items-center justify-center bg-gray-200 dark:bg-gray-700 text-red-600">
            <p>{geoError}</p>
            <button onClick={() => window.location.reload()} className="mt-2 underline text-primary">{t('emergency.retry')}</button>
          </div>
        )}
        {position && renderMap()}
      </div>

      {/* زر SOS */}
      <div className="flex justify-center">
        <Button
          text={t('emergency.sos')}
          bgColor="bg-red-600"
          textColor="text-white"
          handler={() => setSosOpen(true)}
        />
      </div>

      {/* نافذة SOS المنبثقة */}
      {sosOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setSosOpen(false)}>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold mb-4">{t('emergency.report')}</h3>

            <select
              value={emergencyType}
              onChange={(e) => setEmergencyType(e.target.value)}
              className="w-full p-2 border rounded mb-3 dark:bg-gray-700"
            >
              <option value="">{t('emergency.selectType')}</option>
              <option value="fire">🔥 {t('emergency.fire')}</option>
              <option value="accident">🚗 {t('emergency.accident')}</option>
              <option value="medical">🏥 {t('emergency.medical')}</option>
              <option value="other">📢 {t('emergency.other')}</option>
            </select>

            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value)}
              className="w-full p-2 border rounded mb-3 dark:bg-gray-700"
            >
              <option value="mild">{t('emergency.mild')}</option>
              <option value="moderate">{t('emergency.moderate')}</option>
              <option value="severe">{t('emergency.severe')}</option>
            </select>

            <textarea
              placeholder={t('emergency.extra')}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full p-2 border rounded mb-4 dark:bg-gray-700"
              rows="3"
            />

            <div className="flex gap-3 justify-end">
              <Button
                text={t('common.cancel')}
                bgColor="bg-gray-500"
                textColor="text-white"
                handler={() => setSosOpen(false)}
              />
              <Button
                text={t('emergency.send')}
                bgColor="bg-primary"
                textColor="text-white"
                handler={handleSendSOS}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmergencyPage;