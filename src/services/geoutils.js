import { getDistance } from 'geolib';

// نصف قطر الغروب بالكيلومترات (5 كم)
export const GROUP_RADIUS_KM = 5;

/**
 * حساب المسافة بين نقطتين بالكيلومترات
 * @param {[number, number]} point1 [lat, lng]
 * @param {[number, number]} point2 [lat, lng]
 * @returns {number} المسافة بالكيلومترات
 */
export const distanceInKm = (point1, point2) => {
    const distanceMeters = getDistance(
        { latitude: point1[0], longitude: point1[1] },
        { latitude: point2[0], longitude: point2[1] }
    );
    return distanceMeters / 1000;
};

/**
 * هل النقطة داخل دائرة نصف قطرها center بنصف قطر معين؟
 * @param {[number, number]} point 
 * @param {[number, number]} center 
 * @param {number} radiusKm 
 * @returns {boolean}
 */
export const isWithinRadius = (point, center, radiusKm = GROUP_RADIUS_KM) => {
    return distanceInKm(point, center) <= radiusKm;
};

/**
 * إيجاد أقرب غروب من قائمة الغروبات
 * @param {[number, number]} userLocation 
 * @param {Array} groups قائمة الغروبات (كل غروب له center: [lat,lng])
 * @returns {{group: object, distance: number} | null}
 */
export const findNearestGroup = (userLocation, groups) => {
    if (!groups.length) return null;
    let nearest = null;
    let minDistance = Infinity;
    for (const group of groups) {
        const dist = distanceInKm(userLocation, group.center);
        if (dist <= GROUP_RADIUS_KM && dist < minDistance) {
            minDistance = dist;
            nearest = group;
        }
    }
    return nearest ? { group: nearest, distance: minDistance } : null;
};

/**
 * حساب متوسط المركز (centroid) لمجموعة من النقاط
 * @param {Array<[number, number]>} points 
 * @returns {[number, number]}
 */
export const calculateCentroid = (points) => {
    const sumLat = points.reduce((sum, p) => sum + p[0], 0);
    const sumLng = points.reduce((sum, p) => sum + p[1], 0);
    return [sumLat / points.length, sumLng / points.length];
};

/**
 * تجميع النقاط المتقاربة ضمن نصف قطر معين
 * @param {Array<{id: string, location: [number, number]}>} users 
 * @returns {Array<{center: [number, number], users: Array}>}
 */
export const clusterUsers = (users, radiusKm = GROUP_RADIUS_KM) => {
    const clusters = [];
    const used = new Set();
    for (let i = 0; i < users.length; i++) {
        if (used.has(users[i].id)) continue;
        const cluster = { points: [users[i].location], users: [users[i]] };
        for (let j = i + 1; j < users.length; j++) {
            if (used.has(users[j].id)) continue;
            const dist = distanceInKm(users[i].location, users[j].location);
            if (dist <= radiusKm) {
                cluster.points.push(users[j].location);
                cluster.users.push(users[j]);
                used.add(users[j].id);
            }
        }
        used.add(users[i].id);
        if (cluster.users.length > 0) {
            clusters.push({
                center: calculateCentroid(cluster.points),
                users: cluster.users,
                count: cluster.users.length
            });
        }
    }
    return clusters;
};