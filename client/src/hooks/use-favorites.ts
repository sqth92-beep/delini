import { useState, useEffect, useCallback, useSyncExternalStore } from "react";

const FAVORITES_KEY = "delini_favorites";

function getFavoritesFromStorage(): number[] {
  try {
    const stored = localStorage.getItem(FAVORITES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveFavoritesToStorage(favorites: number[]) {
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  window.dispatchEvent(new CustomEvent('favorites-updated'));
}

let currentFavorites = getFavoritesFromStorage();
const listeners = new Set<() => void>();

function subscribe(callback: () => void) {
  listeners.add(callback);
  
  const handleStorageChange = (e: StorageEvent) => {
    if (e.key === FAVORITES_KEY) {
      currentFavorites = getFavoritesFromStorage();
      callback();
    }
  };
  
  const handleFavoritesUpdate = () => {
    currentFavorites = getFavoritesFromStorage();
    callback();
  };
  
  window.addEventListener('storage', handleStorageChange);
  window.addEventListener('favorites-updated', handleFavoritesUpdate);
  
  return () => {
    listeners.delete(callback);
    window.removeEventListener('storage', handleStorageChange);
    window.removeEventListener('favorites-updated', handleFavoritesUpdate);
  };
}

function getSnapshot() {
  return currentFavorites;
}

export function useFavorites() {
  const favorites = useSyncExternalStore(subscribe, getSnapshot);

  const addFavorite = useCallback((businessId: number) => {
    const newFavorites = [...favorites, businessId];
    currentFavorites = newFavorites;
    saveFavoritesToStorage(newFavorites);
  }, [favorites]);

  const removeFavorite = useCallback((businessId: number) => {
    const newFavorites = favorites.filter(id => id !== businessId);
    currentFavorites = newFavorites;
    saveFavoritesToStorage(newFavorites);
  }, [favorites]);

  const toggleFavorite = useCallback((businessId: number) => {
    if (favorites.includes(businessId)) {
      removeFavorite(businessId);
    } else {
      addFavorite(businessId);
    }
  }, [favorites, addFavorite, removeFavorite]);

  const isFavorite = useCallback((businessId: number) => {
    return favorites.includes(businessId);
  }, [favorites]);

  return {
    favorites,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    isFavorite,
  };
}
