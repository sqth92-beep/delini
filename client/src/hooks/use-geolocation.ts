import { useState, useEffect } from "react";

interface GeolocationState {
  latitude: number | null;
  longitude: number | null;
  error: string | null;
  loading: boolean;
  permissionDenied: boolean;
}

export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({
    latitude: null,
    longitude: null,
    error: null,
    loading: true,
    permissionDenied: false,
  });

  useEffect(() => {
    if (!navigator.geolocation) {
      setState(prev => ({
        ...prev,
        error: "Geolocation is not supported",
        loading: false,
      }));
      return;
    }

    const successHandler = (position: GeolocationPosition) => {
      setState({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        error: null,
        loading: false,
        permissionDenied: false,
      });
    };

    const errorHandler = (error: GeolocationPositionError) => {
      setState(prev => ({
        ...prev,
        error: error.message,
        loading: false,
        permissionDenied: error.code === error.PERMISSION_DENIED,
      }));
    };

    navigator.geolocation.getCurrentPosition(successHandler, errorHandler, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 300000,
    });
  }, []);

  const requestLocation = () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setState({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          error: null,
          loading: false,
          permissionDenied: false,
        });
      },
      (error) => {
        setState(prev => ({
          ...prev,
          error: error.message,
          loading: false,
          permissionDenied: error.code === error.PERMISSION_DENIED,
        }));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  return { ...state, requestLocation };
}

export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

export function formatDistance(km: number, language: string = "ar"): string {
  if (km < 1) {
    const meters = Math.round(km * 1000);
    return language === "ar" ? `${meters} متر` : `${meters}m`;
  }
  return language === "ar" ? `${km.toFixed(1)} كم` : `${km.toFixed(1)}km`;
}
