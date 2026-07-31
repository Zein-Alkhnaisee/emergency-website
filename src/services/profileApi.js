// const API_URL = import.meta.env.VITE_API_URL || '/api';

// const profileRequest = async (endpoint, method = 'GET', body = null, token = null, isFormData = false) => {
//     const headers = { Accept: 'application/json' };
//     if (!isFormData) headers['Content-Type'] = 'application/json';
//     if (token) headers['Authorization'] = `Bearer ${token}`;

//     const options = { method, headers };
//     if (body) options.body = isFormData ? body : JSON.stringify(body);

//     const res = await fetch(`${API_URL}${endpoint}`, options);
//     const data = await res.json();
//     if (!res.ok) throw new Error(data.message || data.error || `Error ${res.status}`);
//     return data;
// };

// export const getMyProfile = (token) =>
//     profileRequest('/profile', 'GET', null, token);

// export const createProfile = (token, profileData, avatarFile = null) => {
//     // Always use FormData for POST — avoids Content-Type issues
//     const formData = new FormData();
//     Object.entries(profileData).forEach(([k, v]) => {
//         if (v !== null && v !== undefined) {
//             formData.append(k, v);
//         }
//     });
//     if (avatarFile) formData.append('avatar', avatarFile);
//     return profileRequest('/profile', 'POST', formData, token, true);
// };

// export const updateProfile = (token, updates, avatarFile = null) => {
//     // Must use FormData when uploading a file (multipart/form-data)
//     // Laravel requires _method: PATCH as the FIRST field for method spoofing to work
//     const formData = new FormData();
//     // ⚠️ _method MUST be first so Laravel reads it before processing other fields
//     formData.append('_method', 'PATCH');
//     Object.entries(updates).forEach(([k, v]) => {
//         // Append all non-null values; convert booleans to "1"/"0" for PHP
//         if (v !== null && v !== undefined) {
//             if (typeof v === 'boolean') {
//                 formData.append(k, v ? '1' : '0');
//             } else {
//                 formData.append(k, v);
//             }
//         }
//     });
//     if (avatarFile) formData.append('avatar', avatarFile);
//     return profileRequest('/profile', 'POST', formData, token, true);
// };

// export const deleteProfile = (token) =>
//     profileRequest('/profile', 'DELETE', null, token);

// export const getMyLocation = (token) =>
//     profileRequest('/profile/location', 'GET', null, token);

// export const addLocation = (token, latitude, longitude, country, state, city) =>
//     profileRequest('/profile/location', 'PUT', { latitude, longitude, country, state, city }, token);

// export const updateLocation = (token, updates) =>
//     profileRequest('/profile/location', 'PATCH', updates, token);

// export const deleteLocation = (token) =>
//     profileRequest('/profile/location', 'DELETE', null, token);

// export const updateLocationVisibility = (token, isPublic) =>
//     profileRequest('/profile/location/visibility', 'PATCH', { is_location_public: isPublic }, token);


const API_URL = import.meta.env.VITE_API_URL || '/api';

const profileRequest = async (endpoint, method = 'GET', body = null, token = null, isFormData = false) => {
    const headers = { Accept: 'application/json' };
    if (!isFormData) headers['Content-Type'] = 'application/json';
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const options = { method, headers };
    if (body) options.body = isFormData ? body : JSON.stringify(body);

    try {
        const res = await fetch(`${API_URL}${endpoint}`, options);
        const data = await res.json();
        if (!res.ok) {
            if (res.status === 422 && data.errors) {
                console.error('🔴 Validation errors:', data.errors);
                const errorMessages = Object.values(data.errors).flat().join(', ');
                throw new Error(errorMessages);
            }
            throw new Error(data.message || data.error || `Error ${res.status}`);
        }
        return data;
    } catch (err) {
        console.error('❌ API request failed:', err);
        throw err;
    }
};

export const getMyProfile = (token) =>
    profileRequest('/profile', 'GET', null, token);

export const createProfile = (token, profileData, avatarFile = null) => {
    const formData = new FormData();
    Object.entries(profileData).forEach(([k, v]) => {
        if (v !== null && v !== undefined) {
            if (typeof v === 'boolean') {
                formData.append(k, v ? '1' : '0');
            } else {
                formData.append(k, v);
            }
        }
    });
    if (avatarFile) formData.append('avatar', avatarFile);
    return profileRequest('/profile', 'POST', formData, token, true);
};

export const updateProfile = (token, updates, avatarFile = null) => {
    const formData = new FormData();
    formData.append('_method', 'PATCH');
    Object.entries(updates).forEach(([k, v]) => {
        if (v !== null && v !== undefined) {
            if (typeof v === 'boolean') {
                formData.append(k, v ? '1' : '0');
            } else {
                formData.append(k, v);
            }
        }
    });
    if (avatarFile) formData.append('avatar', avatarFile);
    return profileRequest('/profile', 'POST', formData, token, true);
};

export const deleteProfile = (token) =>
    profileRequest('/profile', 'DELETE', null, token);

export const getMyLocation = (token) =>
    profileRequest('/profile/location', 'GET', null, token);

export const addLocation = (token, latitude, longitude, country, state, city) =>
    profileRequest('/profile/location', 'PUT', { latitude, longitude, country, state, city }, token);

export const updateLocation = (token, updates) =>
    profileRequest('/profile/location', 'PATCH', updates, token);

export const deleteLocation = (token) =>
    profileRequest('/profile/location', 'DELETE', null, token);

export const updateLocationVisibility = (token, isPublic) =>
    profileRequest('/profile/location/visibility', 'PATCH', { is_location_public: isPublic }, token);