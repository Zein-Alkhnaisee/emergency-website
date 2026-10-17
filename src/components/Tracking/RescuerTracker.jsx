// src/components/Tracking/RescuerTracker.jsx
import { useEffect, useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { v4 as uuidv4 } from 'uuid';
import {
    sendPingThunk,
    recordOriginThunk,
    setParticipationResolved,
} from '../../redux/slices/trackingSlice';
import { showError, showSuccess } from '../../utils/toastHelpers';

const PING_INTERVAL_MS = 12000;
const INITIAL_PING_DELAY_MS = 3000;

const RescuerTracker = ({ emergencyId, isActiveParticipant = false, onOriginRecorded, onPingSent }) => {
    const dispatch = useDispatch();
    const { myOrigin, clientPingId, myParticipation } = useSelector(state => state.tracking);

    const pingIntervalRef = useRef(null);
    const originRecordedRef = useRef(false);
    const isRecordingRef = useRef(false);
    const toastShownRef = useRef(false);
    const isRateLimitedRef = useRef(false);
    const isStartedRef = useRef(false);
    const isSendingRef = useRef(false);
    const originCheckAttempts = useRef(0);
    const pingTimeoutRef = useRef(null);

    const getCurrentPosition = useCallback(() => {
        return new Promise((resolve) => {
            if (!navigator.geolocation) {
                resolve(null);
                return;
            }

            const fetchWithRetry = (attempt = 0) => {
                navigator.geolocation.getCurrentPosition(
                    (pos) => {
                        const accuracy = pos.coords.accuracy || 0;
                        if (accuracy <= 100 || attempt >= 2) {
                            resolve({
                                latitude: pos.coords.latitude,
                                longitude: pos.coords.longitude,
                                accuracy_m: accuracy,
                                heading: pos.coords.heading || 0,
                                speed_mps: pos.coords.speed || 0,
                            });
                        } else {
                            console.warn(`⚠️ دقة منخفضة (${accuracy}m)، محاولة ${attempt + 1}...`);
                            setTimeout(() => fetchWithRetry(attempt + 1), 1500);
                        }
                    },
                    (err) => {
                        if (attempt < 3) {
                            console.warn(`⚠️ فشل GPS (${err.message})، محاولة ${attempt + 1}...`);
                            setTimeout(() => fetchWithRetry(attempt + 1), 2000);
                        } else {
                            resolve(null);
                        }
                    },
                    {
                        enableHighAccuracy: true,
                        timeout: 15000,
                        maximumAge: 0,
                    }
                );
            };

            fetchWithRetry();
        });
    }, []);

    const recordOrigin = useCallback(async () => {
        if (isRecordingRef.current) return;
        if (originRecordedRef.current) return;
        if (myOrigin) {
            originRecordedRef.current = true;
            if (onOriginRecorded) onOriginRecorded(myOrigin);
            return;
        }

        isRecordingRef.current = true;
        const pos = await getCurrentPosition();
        if (!pos) {
            showError('تعذر الحصول على الموقع لتسجيل نقطة البداية');
            isRecordingRef.current = false;
            return;
        }
        const originData = {
            latitude: pos.latitude,
            longitude: pos.longitude,
            accuracy_m: pos.accuracy_m,
            recorded_at: new Date().toISOString(),
        };
        try {
            const result = await dispatch(recordOriginThunk({ emergencyId, originData })).unwrap();
            originRecordedRef.current = true;
            if (!toastShownRef.current) {
                showSuccess('تم تسجيل نقطة البداية بنجاح');
                toastShownRef.current = true;
            }
            if (onOriginRecorded) onOriginRecorded(result);
        } catch (err) {
            showError('فشل تسجيل نقطة البداية: ' + err);
            originRecordedRef.current = false;
        } finally {
            isRecordingRef.current = false;
        }
    }, [dispatch, emergencyId, getCurrentPosition, onOriginRecorded, myOrigin]);

    const generatePingId = useCallback(() => {
        return uuidv4();
    }, []);

    const sendPing = useCallback(async () => {
        if (isSendingRef.current) return;
        if (isRateLimitedRef.current) {
            isRateLimitedRef.current = false;
            return;
        }

        if (!originRecordedRef.current && !myOrigin) {
            if (originCheckAttempts.current < 3) {
                originCheckAttempts.current += 1;
                await recordOrigin();
                if (!originRecordedRef.current && !myOrigin) {
                    return;
                }
            } else {
                console.warn('⚠️ Origin still missing after 3 attempts, skipping ping');
                return;
            }
        }

        const pos = await getCurrentPosition();
        if (!pos) {
            console.warn('No GPS position, skip ping');
            return;
        }

        const newPingId = generatePingId();

        const pingData = {
            latitude: pos.latitude,
            longitude: pos.longitude,
            accuracy_m: pos.accuracy_m,
            heading: pos.heading,
            speed_mps: pos.speed_mps,
            recorded_at: new Date().toISOString(),
            client_ping_id: newPingId,
        };

        isSendingRef.current = true;
        try {
            const result = await dispatch(sendPingThunk({ emergencyId, pingData })).unwrap();
            if (result?.rate_limited) {
                isRateLimitedRef.current = true;
                return;
            }
            if (onPingSent) onPingSent(result);
            isRateLimitedRef.current = false;
            originCheckAttempts.current = 0;
        } catch (err) {
            if (err === 'ORIGIN_REQUIRED') {
                originRecordedRef.current = false;
                await recordOrigin();
            } else {
                console.warn('Ping failed:', err);
            }
        } finally {
            isSendingRef.current = false;
        }
    }, [dispatch, emergencyId, getCurrentPosition, myOrigin, recordOrigin, onPingSent, generatePingId]);

    const startTracking = useCallback(() => {
        if (isStartedRef.current) return;
        if (!isActiveParticipant) return;
        if (myParticipation?.is_resolved_by_user) return;
        isStartedRef.current = true;
        originCheckAttempts.current = 0;

        if (!originRecordedRef.current && !myOrigin) {
            recordOrigin();
        }
        pingTimeoutRef.current = setTimeout(() => {
            sendPing();
        }, INITIAL_PING_DELAY_MS);
        if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
        pingIntervalRef.current = setInterval(() => {
            if (myParticipation?.is_resolved_by_user) {
                stopTracking();
                return;
            }
            sendPing();
        }, PING_INTERVAL_MS);
    }, [isActiveParticipant, myParticipation, myOrigin, recordOrigin, sendPing]);

    const stopTracking = useCallback(() => {
        if (pingTimeoutRef.current) {
            clearTimeout(pingTimeoutRef.current);
            pingTimeoutRef.current = null;
        }
        if (pingIntervalRef.current) {
            clearInterval(pingIntervalRef.current);
            pingIntervalRef.current = null;
        }
        isStartedRef.current = false;
        isRateLimitedRef.current = false;
    }, []);

    useEffect(() => {
        if (isActiveParticipant && !myParticipation?.is_resolved_by_user) {
            startTracking();
        } else {
            stopTracking();
        }
        return () => {
            stopTracking();
        };
    }, [isActiveParticipant, myParticipation, startTracking, stopTracking]);

    useEffect(() => {
        if (myOrigin && !originRecordedRef.current) {
            originRecordedRef.current = true;
            if (onOriginRecorded) onOriginRecorded(myOrigin);
        }
    }, [myOrigin, onOriginRecorded]);

    useEffect(() => {
        if (myParticipation?.is_resolved_by_user) {
            stopTracking();
            dispatch(setParticipationResolved());
        }
    }, [myParticipation, dispatch, stopTracking]);

    return null;
};

export default RescuerTracker;