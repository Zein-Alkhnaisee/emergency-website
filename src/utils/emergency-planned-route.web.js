// src/utils/emergency-planned-route.web.js
/**
 * Emergency Planned Route — Web / User Web (Reference)
 * =====================================================
 * يرسم المسار المقترح (OSRM) من موقع المنقذ → مركز الحادث.
 * مطابق منطق Dashboard
 */

export const OSRM_DEFAULT_BASE = 'https://router.project-osrm.org';
export const OSRM_PROFILE = 'driving';
export const SIGNIFICANT_MOVE_METERS = 75;
export const MAX_CACHE_ENTRIES = 50;

export const PLANNED_ROUTE_MAP_STYLE = {
    weight: 4,
    opacity: 0.55,
    dashArray: '8 8',
};

export const ACTUAL_TRAIL_MAP_STYLE = {
    weight: 3,
    opacity: 0.75,
};

export const ORIGIN_CIRCLE_STYLE = {
    radiusMeters: 40,
    fillOpacity: 0.35,
    weight: 2,
};

const EARTH_RADIUS_M = 6_371_000;

export function distanceMeters(a, b) {
    if (!a || !b) return Infinity;
    const lat1 = (a.lat * Math.PI) / 180;
    const lat2 = (b.lat * Math.PI) / 180;
    const dLat = lat2 - lat1;
    const dLng = ((b.lng - a.lng) * Math.PI) / 180;
    const x = Math.sin(dLat / 2) ** 2
        + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
    return 2 * EARTH_RADIUS_M * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

export function hasMovedSignificantly(prev, next, thresholdM = SIGNIFICANT_MOVE_METERS) {
    if (!prev || !next) return true;
    if (prev.lat == null || prev.lng == null || next.lat == null || next.lng == null) return true;
    return distanceMeters(prev, next) >= thresholdM;
}

export function roundCoord(value) {
    return Math.round(value * 1e4) / 1e4;
}

export function isValidCoord(lat, lng) {
    return Number.isFinite(lat) && Number.isFinite(lng)
        && lat >= -90 && lat <= 90
        && lng >= -180 && lng <= 180;
}

export function resolveRouteSourceFromTracking(rescuer) {
    const point = rescuer?.current ?? rescuer?.origin;
    if (!point) return null;
    const lat = parseFloat(point.latitude);
    const lng = parseFloat(point.longitude);
    if (!isValidCoord(lat, lng)) return null;
    // ✅ تجاهل الإحداثيات الصفرية
    if (lat === 0 && lng === 0) return null;
    return { lat, lng, userId: rescuer.user_id, name: rescuer.name };
}

export function resolveOriginAsSource(rescuer) {
    const point = rescuer?.origin ?? rescuer?.tracking?.origin;
    if (!point) return null;
    const lat = parseFloat(point.latitude);
    const lng = parseFloat(point.longitude);
    if (!isValidCoord(lat, lng)) return null;
    // ✅ تجاهل الإحداثيات الصفرية
    if (lat === 0 && lng === 0) return null;
    return { lat, lng, userId: rescuer.user_id, name: rescuer.name };
}

export function resolveEmergencyDestination(emergency) {
    if (!emergency) return null;
    const lat = parseFloat(emergency?.location_lat);
    const lng = parseFloat(emergency?.location_lng);
    if (!isValidCoord(lat, lng)) return null;
    // ✅ تجاهل الإحداثيات الصفرية (0,0) التي قد تكون افتراضية
    if (lat === 0 && lng === 0) return null;
    return { lat, lng };
}

const routeStore = new Map();
const tableStore = new Map();

function trimStore(store) {
    while (store.size >= MAX_CACHE_ENTRIES) {
        store.delete(store.keys().next().value);
    }
}

function buildRouteCacheKey(from, to) {
    return `${roundCoord(from.lat)},${roundCoord(from.lng)}->${roundCoord(to.lat)},${roundCoord(to.lng)}`;
}

function buildTableCacheKey(sources, dest) {
    const part = [...sources]
        .map((s) => `${s.userId}@${roundCoord(s.lat)},${roundCoord(s.lng)}`)
        .sort()
        .join(';');
    return `table:${part}->${roundCoord(dest.lat)},${roundCoord(dest.lng)}`;
}

export function clearPlannedRouteCache() {
    routeStore.clear();
    tableStore.clear();
}

export function formatDistanceKm(distanceMeters, locale) {
    const km = distanceMeters / 1000;
    return `${km.toLocaleString(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} km`;
}

export function formatDurationMinutes(durationSeconds, locale) {
    const minutes = Math.max(1, Math.round(durationSeconds / 60));
    return `${minutes.toLocaleString(locale)} min`;
}

function resolveOsrmBase(options = {}) {
    const fromEnv = typeof process !== 'undefined'
        ? (process.env.REACT_APP_OSRM_URL || process.env.VITE_OSRM_URL)
        : undefined;
    return (options.baseUrl ?? fromEnv ?? OSRM_DEFAULT_BASE).replace(/\/$/, '');
}

export async function fetchPlannedRoute(from, to, options = {}) {
    if (!isValidCoord(from?.lat, from?.lng) || !isValidCoord(to?.lat, to?.lng)) {
        throw new Error('Invalid coordinates for planned route');
    }

    const baseUrl = resolveOsrmBase(options);
    const cacheKey = buildRouteCacheKey(from, to);

    if (!options.skipCache) {
        const cached = routeStore.get(cacheKey);
        if (cached) return cached;
    }

    const coords = `${from.lng},${from.lat};${to.lng},${to.lat}`;
    const url = `${baseUrl}/route/v1/${OSRM_PROFILE}/${coords}?overview=full&geometries=geojson`;

    let res;
    try {
        res = await fetch(url, { signal: options.signal });
    } catch (err) {
        if (err?.name === 'AbortError') throw err;
        throw new Error(err?.message || 'OSRM route network error');
    }

    if (!res.ok) throw new Error(`OSRM HTTP ${res.status}`);

    const json = await res.json();
    if (json.code !== 'Ok' || !json.routes?.[0]) {
        throw new Error(json.message || 'OSRM route not found');
    }

    const route = json.routes[0];
    const result = {
        geometry: (route.geometry?.coordinates ?? []).map(([lng, lat]) => [lat, lng]),
        distanceMeters: route.distance ?? 0,
        durationSeconds: route.duration ?? 0,
    };

    if (!options.skipCache) {
        trimStore(routeStore);
        routeStore.set(cacheKey, result);
    }

    return result;
}

export async function fetchPlannedRouteStatsTable(sources, destination, options = {}) {
    const validSources = sources.filter((s) => isValidCoord(s.lat, s.lng));
    if (!validSources.length || !isValidCoord(destination.lat, destination.lng)) {
        return {};
    }

    const baseUrl = resolveOsrmBase(options);
    const cacheKey = buildTableCacheKey(validSources, destination);

    if (!options.skipCache) {
        const cached = tableStore.get(cacheKey);
        if (cached) return cached;
    }

    const coords = [
        ...validSources.map((s) => `${s.lng},${s.lat}`),
        `${destination.lng},${destination.lat}`,
    ].join(';');

    const destIndex = validSources.length;
    const sourceIndices = validSources.map((_, i) => i).join(';');
    const url = `${baseUrl}/table/v1/${OSRM_PROFILE}/${coords}?sources=${sourceIndices}&destinations=${destIndex}&annotations=duration,distance`;

    const res = await fetch(url, { signal: options.signal });
    if (!res.ok) throw new Error(`OSRM Table HTTP ${res.status}`);

    const json = await res.json();
    if (json.code !== 'Ok') throw new Error(json.message || 'OSRM table failed');

    const result = {};
    validSources.forEach((source, i) => {
        const distance = json.distances?.[i]?.[0];
        const duration = json.durations?.[i]?.[0];
        if (distance == null || duration == null) return;
        result[source.userId] = { distanceMeters: distance, durationSeconds: duration };
    });

    if (!options.skipCache) {
        trimStore(tableStore);
        tableStore.set(cacheKey, result);
    }

    return result;
}

export async function fetchPlannedRouteForRescuer(rescuer, emergency, opts = {}) {
    const destination = resolveEmergencyDestination(emergency);
    if (!destination) throw new Error('Emergency center coordinates missing');

    const source = opts.useOriginOnly
        ? resolveOriginAsSource(rescuer)
        : resolveRouteSourceFromTracking(rescuer);

    if (!source) throw new Error('Rescuer has no routable coordinates (need origin or current ping)');

    const route = await fetchPlannedRoute(source, destination, opts);

    return {
        userId: source.userId,
        source,
        destination,
        ...route,
        label: `${formatDistanceKm(route.distanceMeters)} · ${formatDurationMinutes(route.durationSeconds)}`,
    };
}

export function shouldRecalculatePlannedRoute(lastSource, nextLat, nextLng) {
    return hasMovedSignificantly(lastSource, { lat: nextLat, lng: nextLng });
}