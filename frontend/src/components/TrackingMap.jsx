import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import io from 'socket.io-client';
import { MapPin, Navigation, Compass, AlertCircle, CheckCircle2 } from '../utils/icons';
import { getSocketUrl } from '../utils/urls';

/**
 * TrackingMap - Production-grade real-time location tracking component.
 * 
 * Works like Uber/Ola: when a client books a ride and a driver accepts,
 * both parties can see each other's live location on the map.
 * 
 * Features:
 * - Stable role-based markers (client=blue, driver=gold) — no flicker on reconnect
 * - Auto-fits map bounds to show both participants
 * - Smooth marker movement with CSS transitions
 * - High-accuracy GPS with low-accuracy fallback
 * - Connection status indicator with reconnection handling
 * - Production-ready error handling and cleanup
 * 
 * @param {string} role - 'client' or 'driver'
 * @param {string|null} rideId - The ride ID to track (null = map-only mode)
 * @param {string|null} userId - The authenticated user's ID for self-identification
 */
const TrackingMap = ({ role = 'client', rideId = null, userId = null }) => {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef({});
  const socketRef = useRef(null);
  const watchIdRef = useRef(null);
  const hasInitialCentered = useRef(false);
  const selfCoordsRef = useRef(null);

  const [coords, setCoords] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [otherUserOnline, setOtherUserOnline] = useState(false);

  // The counterpart role label
  const otherRoleLabel = role === 'driver' ? 'Client' : 'Chauffeur';

  /**
   * Create a premium pulsing marker icon.
   * @param {'self'|'other'} type - self (blue) or other (gold)
   * @param {string} label - display label
   */
  const createMarkerIcon = useCallback((type, label) => {
    const color = type === 'self' ? '#3b82f6' : '#d4af37';
    const pulseColor = type === 'self' ? 'rgba(59,130,246,0.35)' : 'rgba(212,175,55,0.35)';
    const borderColor = type === 'self' ? '#2563eb' : '#b8962e';

    return L.divIcon({
      html: `
        <div style="position:relative;display:flex;align-items:center;justify-content:center;width:44px;height:44px;">
          <div style="
            position:absolute;
            width:36px;height:36px;
            border-radius:50%;
            background:${pulseColor};
            animation:trackingPulse 2s ease-out infinite;
          "></div>
          <div style="
            position:relative;
            width:16px;height:16px;
            border-radius:50%;
            background:${color};
            border:3px solid #fff;
            box-shadow:0 2px 8px rgba(0,0,0,0.3),0 0 0 1px ${borderColor};
          "></div>
          <div style="
            position:absolute;
            bottom:-18px;
            left:50%;
            transform:translateX(-50%);
            background:rgba(0,0,0,0.75);
            color:#fff;
            font-size:9px;
            font-weight:700;
            padding:1px 6px;
            border-radius:4px;
            white-space:nowrap;
            letter-spacing:0.5px;
            font-family:system-ui,sans-serif;
          ">${label}</div>
        </div>
      `,
      className: `tracking-marker-${type}`,
      iconSize: [44, 44],
      iconAnchor: [22, 22],
    });
  }, []);

  /**
   * Fit the map to show all active markers with padding.
   */
  const fitMapBounds = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;

    const markerPositions = Object.values(markersRef.current)
      .map(m => m.getLatLng());

    if (markerPositions.length >= 2) {
      const bounds = L.latLngBounds(markerPositions);
      map.fitBounds(bounds, {
        padding: [60, 60],
        maxZoom: 17,
        animate: true,
        duration: 0.5
      });
    }
  }, []);

  /**
   * Update or create a marker on the map.
   * @param {string} key - Stable key for the marker (e.g., 'self', 'driver', 'client')
   * @param {number} lat 
   * @param {number} lng 
   * @param {L.DivIcon} icon 
   * @param {string} popupText
   */
  const upsertMarker = useCallback((key, lat, lng, icon, popupText) => {
    const map = mapRef.current;
    if (!map) return;

    if (markersRef.current[key]) {
      // Smoothly move existing marker
      markersRef.current[key].setLatLng([lat, lng]);
    } else {
      const marker = L.marker([lat, lng], { icon }).addTo(map);
      marker.bindPopup(`
        <div style="padding:4px 2px;font-family:system-ui,sans-serif;">
          <p style="font-weight:700;font-size:12px;color:#1e293b;margin:0;">${popupText}</p>
        </div>
      `);
      markersRef.current[key] = marker;
    }
  }, []);

  useEffect(() => {
    // ─── 1. Initialize Leaflet Map ───
    if (!mapRef.current && mapContainerRef.current) {
      const map = L.map(mapContainerRef.current, {
        zoomControl: false,
      }).setView([22.5726, 88.3639], 15);

      // Use a clean, modern tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© DMS Cab Service',
        maxZoom: 19,
      }).addTo(map);

      L.control.zoom({ position: 'bottomright' }).addTo(map);
      mapRef.current = map;

      // Fix initial render size
      setTimeout(() => {
        if (mapRef.current) mapRef.current.invalidateSize();
      }, 300);
    }

    // ─── 2. Initialize Socket.IO (only when tracking a ride) ───
    let socket = null;
    if (rideId) {
      socket = io(getSocketUrl(), {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
      });
      socketRef.current = socket;

      socket.on('connect', () => {
        setIsConnected(true);
        console.log(`[TrackingMap] Socket connected: ${socket.id} | Role: ${role}`);
        socket.emit('join-ride', { rideId });
      });

      socket.on('disconnect', () => {
        setIsConnected(false);
        console.log('[TrackingMap] Socket disconnected');
      });

      socket.on('reconnect', () => {
        console.log('[TrackingMap] Socket reconnected');
        socket.emit('join-ride', { rideId });
      });

      // ─── 3. Handle incoming location from the other participant ───
      socket.on('receive-location', (data) => {
        const { latitude, longitude, role: senderRole, userId: senderUserId } = data;

        // Skip our own location echoed back
        if (senderUserId && userId && senderUserId === userId) return;
        if (!senderUserId && data.id === socket.id) return;

        // Use the sender's role as a stable marker key
        const markerKey = senderRole || 'other';
        const isOther = markerKey !== role;

        if (isOther) {
          setOtherUserOnline(true);

          const icon = createMarkerIcon('other', otherRoleLabel);
          upsertMarker(markerKey, latitude, longitude, icon, `${otherRoleLabel} Location`);

          // Auto-fit to show both markers after receiving the other's location
          fitMapBounds();
        }
      });

      // ─── 4. Handle user disconnect ───
      socket.on('user-disconnected', (disconnectedId) => {
        // Remove markers not belonging to self
        Object.keys(markersRef.current).forEach(key => {
          if (key !== 'self') {
            const map = mapRef.current;
            if (map && markersRef.current[key]) {
              map.removeLayer(markersRef.current[key]);
              delete markersRef.current[key];
            }
          }
        });
        setOtherUserOnline(false);
      });
    }

    // ─── 5. Geolocation Tracking ───
    const startTracking = (highAccuracy = true) => {
      if (!navigator.geolocation) {
        setErrorMsg('Geolocation is not supported by this browser.');
        return;
      }

      const geoOptions = {
        enableHighAccuracy: highAccuracy,
        timeout: highAccuracy ? 8000 : 15000,
        maximumAge: 0,
      };

      watchIdRef.current = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setErrorMsg(null);
          setCoords({ latitude, longitude });
          selfCoordsRef.current = { latitude, longitude };

          // Update self marker
          const selfIcon = createMarkerIcon('self', 'You');
          upsertMarker('self', latitude, longitude, selfIcon, 'Your Location');

          // Center only on first GPS fix, then let user pan freely
          if (!hasInitialCentered.current && mapRef.current) {
            mapRef.current.setView([latitude, longitude], 16);
            hasInitialCentered.current = true;
          }

          // Emit location to the ride room
          if (rideId && socket && socket.connected) {
            socket.emit('send-location', {
              rideId,
              latitude,
              longitude,
              role,
              userId
            });
          }
        },
        (error) => {
          console.error(`[TrackingMap] Geolocation Error (highAccuracy=${highAccuracy}):`, error);

          // Fallback to low accuracy if high fails
          if (highAccuracy && (error.code === error.TIMEOUT || error.code === error.POSITION_UNAVAILABLE)) {
            console.log('[TrackingMap] Retrying with standard accuracy...');
            if (watchIdRef.current !== null) {
              navigator.geolocation.clearWatch(watchIdRef.current);
            }
            startTracking(false);
          } else {
            setErrorMsg(`Location access denied or unavailable: ${error.message}`);
          }
        },
        geoOptions
      );
    };

    startTracking(true);

    // ─── 6. Cleanup ───
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      if (socketRef.current) {
        if (rideId) socketRef.current.emit('leave-ride', { rideId });
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      // Remove all markers
      Object.keys(markersRef.current).forEach(id => {
        if (mapRef.current && markersRef.current[id]) {
          mapRef.current.removeLayer(markersRef.current[id]);
        }
      });
      markersRef.current = {};
      hasInitialCentered.current = false;

      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [rideId, role, userId, createMarkerIcon, upsertMarker, fitMapBounds, otherRoleLabel]);

  // Handler to center map to user's own location
  const handleRecenter = () => {
    if (coords && mapRef.current) {
      mapRef.current.setView([coords.latitude, coords.longitude], 16);
    }
  };

  // Handler to fit both markers
  const handleFitBoth = () => {
    fitMapBounds();
  };

  return (
    <div className="relative z-10 w-full h-full rounded-2xl overflow-hidden border border-white/10 bg-[#0c1017] shadow-xl">
      {/* Inject pulse animation keyframes */}
      <style>{`
        @keyframes trackingPulse {
          0% { transform: scale(0.8); opacity: 0.8; }
          70% { transform: scale(2.2); opacity: 0; }
          100% { transform: scale(2.2); opacity: 0; }
        }
      `}</style>

      {/* Map Header Status Bar */}
      <div className="absolute top-4 left-4 right-4 z-[1000] flex flex-wrap gap-2 items-center justify-between pointer-events-none">
        {/* Connection Status */}
        <div className="pointer-events-auto flex items-center space-x-2 bg-[#0e131f]/95 border border-white/10 px-4 py-2 rounded-xl backdrop-blur-md shadow-lg">
          <span className={`w-2.5 h-2.5 rounded-full ${
            !rideId ? 'bg-blue-500' 
            : isConnected ? 'bg-emerald-500 animate-pulse' 
            : 'bg-amber-500'
          }`}></span>
          <span className="text-xs font-semibold text-gray-200">
            {!rideId ? 'Map Active' : isConnected ? 'Live Tracking' : 'Connecting...'}
          </span>
        </div>

        {/* Tracking Info Panel */}
        <div className="pointer-events-auto flex items-center space-x-3 bg-[#0e131f]/95 border border-white/10 px-4 py-2 rounded-xl backdrop-blur-md shadow-lg">
          {rideId && (
            <>
              <span className={`w-2 h-2 rounded-full ${otherUserOnline ? 'bg-[#d4af37] animate-pulse' : 'bg-gray-500'}`}></span>
              <span className="text-xs text-gray-400">
                {otherRoleLabel}: <strong className="text-white font-semibold">{otherUserOnline ? 'Online' : 'Waiting...'}</strong>
              </span>
              <div className="w-[1px] h-3 bg-white/20"></div>
            </>
          )}
          <span className="text-[10px] uppercase tracking-wider text-[#d4af37] font-semibold">
            {role === 'driver' ? 'Driver Mode' : 'Client Mode'}
          </span>
        </div>
      </div>

      {/* Geolocation Error Alert */}
      {errorMsg && (
        <div className="absolute top-18 left-4 right-4 z-[1000] flex items-center space-x-2 bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl backdrop-blur-md shadow-lg text-xs">
          <AlertCircle size={16} className="shrink-0" />
          <span className="truncate">{errorMsg}</span>
        </div>
      )}

      {/* Actual Map */}
      <div ref={mapContainerRef} className="w-full h-full relative overflow-hidden" style={{ zIndex: 1 }} />

      {/* Bottom Controls */}
      <div className="absolute bottom-4 left-4 z-[1000] flex flex-col gap-2">
        {coords && (
          <div className="bg-[#0e131f]/95 border border-white/10 p-3 rounded-xl backdrop-blur-md shadow-lg text-[11px] text-gray-300 font-mono space-y-1">
            <div className="flex items-center space-x-1.5 text-gray-400 mb-1 font-sans font-semibold uppercase tracking-wider text-[9px]">
              <Compass size={11} className="text-[#d4af37] animate-spin" style={{ animationDuration: '6s' }} />
              <span>GPS Fix</span>
            </div>
            <p>LAT: {coords.latitude.toFixed(6)}</p>
            <p>LNG: {coords.longitude.toFixed(6)}</p>
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={handleRecenter}
            disabled={!coords}
            className="flex items-center justify-center space-x-2 bg-[#d4af37] text-[#060a11] hover:bg-[#aa8c2c] disabled:opacity-40 disabled:hover:bg-[#d4af37] px-4 py-2.5 rounded-xl font-bold text-xs transition-colors shadow-lg shadow-[#d4af37]/20 pointer-events-auto"
          >
            <Navigation size={13} className="fill-[#060a11]" />
            <span>Center</span>
          </button>

          {rideId && otherUserOnline && (
            <button
              onClick={handleFitBoth}
              className="flex items-center justify-center space-x-2 bg-white/10 text-white hover:bg-white/20 border border-white/20 px-4 py-2.5 rounded-xl font-bold text-xs transition-colors shadow-lg pointer-events-auto"
            >
              <MapPin size={13} />
              <span>Fit Both</span>
            </button>
          )}
        </div>
      </div>

      {/* Map border accent */}
      <div className="absolute inset-0 border border-[#d4af37]/10 pointer-events-none rounded-2xl" />
    </div>
  );
};

export default TrackingMap;
