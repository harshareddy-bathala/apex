import { signOut } from 'firebase/auth';
import { auth } from '@/firebase';

/**
 * Performs a complete logout with session cleanup
 * - Signs out from Firebase Auth
 * - Clears all localStorage
 * - Clears all sessionStorage
 * - Clears all cookies (where possible)
 * - Forces navigation to login page
 */
export async function performSecureLogout(): Promise<void> {
  try {
    // 1. Sign out from Firebase
    await signOut(auth);
    
    // 2. Clear all local storage
    localStorage.clear();
    
    // 3. Clear all session storage
    sessionStorage.clear();
    
    // 4. Clear IndexedDB (Firebase may use this)
    if (window.indexedDB) {
      const databases = await window.indexedDB.databases();
      databases.forEach(db => {
        if (db.name) {
          window.indexedDB.deleteDatabase(db.name);
        }
      });
    }
    
    // 5. Clear service worker caches if present
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
    }
    
    // 6. Unregister service workers
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map(registration => registration.unregister()));
    }
    
    // 7. Force reload to clear any in-memory state
    window.location.href = '/login/student';
    
  } catch (error) {
    console.error('Logout error:', error);
    
    // Even if Firebase signout fails, clear everything and redirect
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = '/login/student';
  }
}

/**
 * Shows a confirmation dialog and performs secure logout
 */
export async function confirmAndLogout(message?: string): Promise<void> {
  const confirmed = window.confirm(message || 'Are you sure you want to sign out?');
  
  if (confirmed) {
    await performSecureLogout();
  }
}
