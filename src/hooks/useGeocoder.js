// src/hooks/useGeocoder.js
import { useState, useCallback } from 'react';

export const useGeocoder = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const geocode = useCallback(async (query) => {
    if (!query || query.trim().length < 2) {
      setError('الرجاء إدخال اسم منطقة صحيح');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&addressdetails=1&accept-language=ar`
      );

      if (!response.ok) {
        throw new Error('فشل البحث عن المنطقة');
      }

      const data = await response.json();

      if (!data || data.length === 0) {
        setError('لم يتم العثور على المنطقة المحددة');
        setLoading(false);
        return null;
      }

      const result = data[0];
      const coords = [parseFloat(result.lat), parseFloat(result.lon)];

      setLoading(false);
      return {
        coords,
        displayName: result.display_name,
        city: result.address?.city || result.address?.town || result.address?.village || '',
        country: result.address?.country || '',
      };
    } catch (err) {
      setError(err.message || 'حدث خطأ أثناء البحث');
      setLoading(false);
      return null;
    }
  }, []);

  return { geocode, loading, error };
};