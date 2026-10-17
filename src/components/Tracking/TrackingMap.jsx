// src/components/Tracking/TrackingMap.jsx
import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
    fetchTrackingSnapshot,
    fetchRescuerTrail,
    updateRescuerLocation,
    markRescuerStale,
    clearTracking
} from '../../redux/slices/trackingSlice';
import { getEcho, initEcho } from '../../services/echo';
import { formatRelativeTime } from '../../utils/dateHelpers';
import {
    fetchPlannedRoute,
    PLANNED_ROUTE_MAP_STYLE,
    resolveEmergencyDestination,
    shouldRecalculatePlannedRoute,
} from '../../utils/emergency-planned-route.web.js';

// ── دالة تحديد حجم الأيقونة حسب الشاشة ──────────────────────────
const getIconSize = () => {
    const width = window.innerWidth;
    if (width < 768) {
        return { size: [54, 70], anchor: [27, 70] };
    }
    if (width < 1024) {
        return { size: [44, 58], anchor: [22, 58] };
    }
    return { size: [38, 50], anchor: [19, 50] };
};

// ── إنشاء أيقونة SVG مع حجم ديناميكي ──────────────────────────
const createPinIcon = (color, label = '', iconSize, iconAnchor) => {
    const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 38 50" width="100%" height="100%">
            <defs>
                <filter id="shadow-${color}" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="2" stdDeviation="3" flood-opacity="0.3"/>
                </filter>
            </defs>
            <path d="M19 2C10.7 2 4 8.7 4 17c0 10 15 31 15 31s15-21 15-31c0-8.3-6.7-15-15-15z" 
                  fill="${color}" 
                  stroke="#ffffff" 
                  stroke-width="2.5"
                  filter="url(#shadow-${color})"/>
            <circle cx="19" cy="17" r="5" fill="#ffffff" stroke="${color}" stroke-width="2"/>
            ${label ? `<text x="19" y="44" font-size="7" text-anchor="middle" fill="${color}" font-weight="bold">${label}</text>` : ''}
        </svg>
    `;
    return L.divIcon({
        html: svg,
        className: 'custom-pin-marker',
        iconSize: iconSize,
        iconAnchor: iconAnchor,
        popupAnchor: [0, -iconAnchor[1] + 4],
    });
};

// ── المكوّن الرئيسي ──────────────────────────────────────────────
const TrackingMap = React.memo(({
    emergencyId,
    reporterId,
    isParticipant = false,
    emergencyLocation = null,
    userGpsLocation = null,
}) => {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const { rescuers, trails, emergency, myOrigin } = useSelector(state => state.tracking);
    const { currentUser } = useSelector(state => state.user);

    const [selectedRescuerId, setSelectedRescuerId] = useState(null);
    const [mapCenter, setMapCenter] = useState(null);
    const [plannedRoutes, setPlannedRoutes] = useState({});
    const lastSourceRef = useRef({});

    const echoSubscribedRef = useRef(false);
    const pollingIntervalRef = useRef(null);
    const mapRef = useRef(null);

    const userId = currentUser?.id ? Number(currentUser.id) : null;
    const numericReporterId = reporterId ? Number(reporterId) : null;
    const isReporter = numericReporterId && userId && numericReporterId === userId;
    const canViewTracking = isReporter || isParticipant;

    const [iconSize, setIconSize] = useState(getIconSize());

    useEffect(() => {
        const handleResize = () => {
            setIconSize(getIconSize());
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const currentUserIcon = useMemo(
        () => createPinIcon('#3b82f6', '', iconSize.size, iconSize.anchor),
        [iconSize]
    );
    const originIcon = useMemo(
        () => createPinIcon('#8b5cf6', 'OR', iconSize.size, iconSize.anchor),
        [iconSize]
    );
    const destinationIcon = useMemo(
        () => createPinIcon('#ef4444', 'DEST', iconSize.size, iconSize.anchor),
        [iconSize]
    );
    const rescuerOnlineIcon = useMemo(
        () => createPinIcon('#22c55e', '', iconSize.size, iconSize.anchor),
        [iconSize]
    );
    const rescuerOfflineIcon = useMemo(
        () => createPinIcon('#9ca3af', '⚠', iconSize.size, iconSize.anchor),
        [iconSize]
    );

    const getMapCenter = useCallback(() => {
        if (userGpsLocation && Array.isArray(userGpsLocation) && userGpsLocation.length === 2) {
            return userGpsLocation;
        }
        if (emergencyLocation?.lat && emergencyLocation?.lng) {
            return [emergencyLocation.lat, emergencyLocation.lng];
        }
        if (emergency?.location_lat && emergency?.location_lng) {
            return [Number(emergency.location_lat), Number(emergency.location_lng)];
        }
        return null;
    }, [userGpsLocation, emergencyLocation, emergency]);

    useEffect(() => {
        const center = getMapCenter();
        setMapCenter(center);
    }, [getMapCenter]);

    useEffect(() => {
        if (emergencyId) {
            dispatch(fetchTrackingSnapshot(emergencyId));
        }
        return () => {
            dispatch(clearTracking());
            if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
            if (echoSubscribedRef.current) {
                const echo = getEcho();
                if (echo) echo.leave(`private-emergency.${emergencyId}`);
                echoSubscribedRef.current = false;
            }
        };
    }, [emergencyId, dispatch]);

    useEffect(() => {
        if (!emergencyId || !currentUser || !canViewTracking) return;
        const token = currentUser.token || localStorage.getItem('token');
        if (!token) return;

        const echo = initEcho(token);
        if (!echo) return;

        const channelName = `emergency.${emergencyId}`;
        const channel = echo.private(channelName);

        channel.subscribed(() => {
            console.log('✅ Subscribed to tracking channel:', channelName);
            echoSubscribedRef.current = true;
        });

        channel.error((err) => {
            console.warn('⚠️ Tracking channel error:', err);
        });

        channel.listen('.rescuer.location.updated', (payload) => {
            dispatch(updateRescuerLocation(payload));
        });

        return () => {
            if (echoSubscribedRef.current) {
                echo.leave(`private-${channelName}`);
                echoSubscribedRef.current = false;
            }
        };
    }, [emergencyId, currentUser, canViewTracking, dispatch]);

    useEffect(() => {
        if (!emergencyId || !canViewTracking) return;
        const poll = () => {
            dispatch(fetchTrackingSnapshot(emergencyId));
        };
        poll();
        pollingIntervalRef.current = setInterval(poll, 10000);

        return () => {
            if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
        };
    }, [emergencyId, canViewTracking, dispatch]);

    useEffect(() => {
        if (selectedRescuerId && emergencyId && canViewTracking) {
            dispatch(fetchRescuerTrail({ emergencyId, userId: selectedRescuerId }));
        }
    }, [selectedRescuerId, emergencyId, canViewTracking, dispatch]);

    useEffect(() => {
        if (!canViewTracking) return;

        const dest = emergencyLocation
            ? { lat: emergencyLocation.lat, lng: emergencyLocation.lng }
            : resolveEmergencyDestination(emergency);

        if (!dest) {
            console.warn('⚠️ No destination found for planned route');
            return;
        }

        const sources = [];

        rescuers.forEach(rescuer => {
            let source = null;
            if (rescuer.origin) {
                source = { lat: rescuer.origin.latitude, lng: rescuer.origin.longitude, userId: rescuer.user_id };
            } else if (rescuer.current) {
                source = { lat: rescuer.current.latitude, lng: rescuer.current.longitude, userId: rescuer.user_id };
            }
            if (source) {
                sources.push(source);
            }
        });

        if (isParticipant && myOrigin) {
            if (!sources.some(s => s.userId === userId)) {
                sources.push({
                    lat: myOrigin.latitude,
                    lng: myOrigin.longitude,
                    userId: userId,
                    name: currentUser?.name || 'أنت',
                    isMyOrigin: true,
                });
            }
        }

        if (!sources.length) {
            console.warn('⚠️ No sources (rescuers or myOrigin) to calculate routes for');
            return;
        }

        let cancelled = false;

        const calculateRoutes = async () => {
            const newRoutes = { ...plannedRoutes };
            let anyChanged = false;

            for (const source of sources) {
                const uid = source.userId;
                const currentSource = lastSourceRef.current[uid];

                if (currentSource && !shouldRecalculatePlannedRoute(currentSource, source.lat, source.lng)) {
                    continue;
                }

                try {
                    const route = await fetchPlannedRoute(source, dest, { skipCache: false });
                    if (!cancelled) {
                        newRoutes[uid] = {
                            userId: uid,
                            source,
                            destination: dest,
                            ...route,
                            label: `${(route.distanceMeters / 1000).toFixed(1)} km · ${Math.round(route.durationSeconds / 60)} min`,
                        };
                        lastSourceRef.current[uid] = source;
                        anyChanged = true;
                    }
                } catch (err) {
                    console.warn(`Failed to fetch planned route for user ${uid}:`, err);
                }
            }

            if (!cancelled && anyChanged) {
                setPlannedRoutes(newRoutes);
            }
        };

        calculateRoutes();

        return () => {
            cancelled = true;
        };
    }, [rescuers, myOrigin, isParticipant, emergencyLocation, emergency, canViewTracking]);

    useEffect(() => {
        if (!canViewTracking) return;
        const staleInterval = setInterval(() => {
            rescuers.forEach(r => {
                if (r.last_ping_age_seconds > 60 && r.tracking_status !== 'stale') {
                    dispatch(markRescuerStale({ user_id: r.user_id }));
                }
            });
        }, 10000);
        return () => clearInterval(staleInterval);
    }, [rescuers, canViewTracking, dispatch]);

    const allRescuers = useMemo(() => {
        if (!rescuers || rescuers.length === 0) return [];
        return rescuers.map(r => ({
            ...r,
            origin: r.origin && typeof r.origin.latitude === 'number' && typeof r.origin.longitude === 'number' ? r.origin : null,
            current: r.current && typeof r.current.latitude === 'number' && typeof r.current.longitude === 'number' ? r.current : null,
        }));
    }, [rescuers]);

    const allRescuersWithMyOrigin = useMemo(() => {
        const list = [...allRescuers];
        if (isParticipant && myOrigin && !list.some(r => r.user_id === userId)) {
            list.push({
                user_id: userId,
                name: currentUser?.name || 'أنت',
                origin: myOrigin,
                current: null,
                tracking_status: 'live',
                is_stale: false,
                participation: { is_resolved_by_user: false },
            });
        }
        return list;
    }, [allRescuers, isParticipant, myOrigin, userId, currentUser]);

    const selectedTrail = useMemo(() => {
        let targetId = selectedRescuerId;
        if (!targetId && allRescuersWithMyOrigin.length > 0) {
            targetId = allRescuersWithMyOrigin[0].user_id;
        }
        if (targetId && trails[targetId]) {
            return trails[targetId].map(p => [p.latitude, p.longitude]);
        }
        return [];
    }, [selectedRescuerId, trails, allRescuersWithMyOrigin]);

    // ✅ التعديل الأساسي هنا: تحويل القيم إلى أرقام
    const destLocation = emergencyLocation
        ? [emergencyLocation.lat, emergencyLocation.lng]
        : (emergency?.location_lat && emergency?.location_lng
            ? [Number(emergency.location_lat), Number(emergency.location_lng)]
            : null);

    if (!mapCenter) {
        return (
            <div className="flex items-center justify-center h-96 bg-gray-100 dark:bg-gray-800 rounded-xl">
                <div className="text-center p-4">
                    <p className="text-gray-500 dark:text-gray-400 text-sm">
                        {t('emergency.locationUnavailable', 'الموقع غير متوفر')}
                    </p>
                </div>
            </div>
        );
    }

    if (!canViewTracking) {
        return (
            <div className="flex items-center justify-center h-96 bg-gray-100 dark:bg-gray-800 rounded-xl">
                <div className="text-center p-4">
                    <p className="text-gray-500 dark:text-gray-400 text-sm">
                        {t('emergency.cannotViewTracking', 'لا يمكنك مشاهدة التتبع')}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="relative w-full h-96 rounded-xl overflow-hidden shadow-lg border border-gray-200 dark:border-gray-700">
            <MapContainer
                key={`${emergencyId}-${mapCenter.join(',')}`}
                center={mapCenter}
                zoom={13}
                style={{ height: '100%', width: '100%' }}
                ref={mapRef}
            >
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                />

                {Object.values(plannedRoutes).map((route) => (
                    route.geometry && route.geometry.length > 1 && (
                        <Polyline
                            key={`planned-${route.userId}`}
                            positions={route.geometry.map(([lat, lng]) => [lat, lng])}
                            pathOptions={{
                                ...PLANNED_ROUTE_MAP_STYLE,
                                color: '#f97316',
                            }}
                        />
                    )
                ))}

                {selectedTrail.length > 1 && (
                    <Polyline
                        positions={selectedTrail}
                        color="#3b82f6"
                        weight={4}
                        opacity={0.8}
                    />
                )}

                {destLocation && (
                    <Marker position={destLocation} icon={destinationIcon}>
                        <Popup>
                            <strong>📍 موقع الحادث</strong><br />
                            <span className="text-xs text-gray-500">
                                {destLocation[0].toFixed(5)}, {destLocation[1].toFixed(5)}
                            </span>
                        </Popup>
                    </Marker>
                )}

                {allRescuersWithMyOrigin.map(rescuer => (
                    <React.Fragment key={rescuer.user_id}>
                        {rescuer.origin && (
                            <Marker
                                position={[rescuer.origin.latitude, rescuer.origin.longitude]}
                                icon={originIcon}
                                opacity={0.9}
                            >
                                <Popup>
                                    <strong>{rescuer.name || `منقذ #${rescuer.user_id}`}</strong><br />
                                    <span className="text-xs text-purple-600 font-semibold">📍 نقطة البداية (Origin)</span><br />
                                    <span className="text-xs text-gray-500">{formatRelativeTime(rescuer.origin.recorded_at)}</span>
                                    {rescuer.origin.accuracy_m && (
                                        <span className="text-xs block">الدقة: {rescuer.origin.accuracy_m} م</span>
                                    )}
                                </Popup>
                            </Marker>
                        )}
                        {rescuer.current && (
                            <Marker
                                position={[rescuer.current.latitude, rescuer.current.longitude]}
                                icon={rescuer.user_id === userId ? currentUserIcon : (rescuer.is_stale ? rescuerOfflineIcon : rescuerOnlineIcon)}
                            >
                                <Popup>
                                    <strong>{rescuer.name || `منقذ #${rescuer.user_id}`}</strong><br />
                                    <span className={`text-xs ${rescuer.is_stale ? 'text-red-500' : 'text-green-500'}`}>
                                        {rescuer.is_stale ? '⚠️ غير متصل' : '🟢 متصل'}
                                    </span><br />
                                    <span className="text-xs text-gray-500">{formatRelativeTime(rescuer.current.recorded_at)}</span>
                                    {rescuer.last_ping_age_seconds !== undefined && (
                                        <span className="text-xs block">آخر تحديث: {rescuer.last_ping_age_seconds} ثانية</span>
                                    )}
                                    <button
                                        onClick={() => setSelectedRescuerId(rescuer.user_id)}
                                        className="mt-1 text-primary text-xs hover:underline"
                                    >
                                        عرض المسار الفعلي
                                    </button>
                                </Popup>
                            </Marker>
                        )}
                    </React.Fragment>
                ))}

                {allRescuersWithMyOrigin.length === 0 && !destLocation && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-gray-900/50">
                        <p className="text-gray-500 text-sm">لا توجد بيانات تتبع متاحة</p>
                    </div>
                )}
            </MapContainer>

            <div className="absolute bottom-2 left-2 bg-white/90 dark:bg-gray-800/90 p-1.5 rounded-lg shadow-md text-[10px] space-y-0.5 z-[1000]">
                <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 bg-blue-500 rounded-full"></div>
                    <span>الموقع الحالي (أنت)</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 bg-purple-500 rounded-full"></div>
                    <span>نقطة البداية (Origin)</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 bg-red-500 rounded-full"></div>
                    <span>موقع الحادث</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 bg-green-500 rounded-full"></div>
                    <span>منقذ متصل</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 bg-gray-400 rounded-full"></div>
                    <span>منقذ غير متصل</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-3 h-0.5 bg-blue-500 border-t border-blue-500"></div>
                    <span>المسار الفعلي</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-3 h-0.5 bg-orange-400 border-t border-dashed border-orange-400"></div>
                    <span>المسار المقترح</span>
                </div>
            </div>
        </div>
    );
}, (prevProps, nextProps) => {
    return (
        prevProps.emergencyId === nextProps.emergencyId &&
        prevProps.reporterId === nextProps.reporterId &&
        prevProps.isParticipant === nextProps.isParticipant &&
        prevProps.emergencyLocation?.lat === nextProps.emergencyLocation?.lat &&
        prevProps.emergencyLocation?.lng === nextProps.emergencyLocation?.lng &&
        prevProps.userGpsLocation === nextProps.userGpsLocation
    );
});

export default TrackingMap;