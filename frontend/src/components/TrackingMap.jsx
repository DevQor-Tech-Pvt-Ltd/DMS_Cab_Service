import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import io from 'socket.io-client';
import { MapPin, Navigation, Compass, AlertCircle, CheckCircle2 } from '../utils/icons';

const TrackingMap = ({ role = 'client' }) => {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef({});
  const socketRef = useRef(null);
  const watchIdRef = useRef(null);

  const [coords, setCoords] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [activeUsersCount, setActiveUsersCount] = useState(1);

  useEffect(() => {
    // 1. Initialize Socket.io connection
    const socketUrl = import.meta.env.VITE_API_URL
      ? import.meta.env.VITE_API_URL.replace('/api/v1', '')
      : 'http://localhost:5000';

    const socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      console.log('Socket connected:', socket.id);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    // 2. Initialize Leaflet Map centered at Kolkata with Zoom 15
    if (!mapRef.current && mapContainerRef.current) {
      const map = L.map(mapContainerRef.current, {
        zoomControl: false, // Custom placed for luxury styling
      }).setView([22.5726, 88.3639], 15);

      // Add OpenStreetMap tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© DMS Cab Service',
      }).addTo(map);

      // Add zoom control in a better looking position
      L.control.zoom({ position: 'bottomright' }).addTo(map);

      mapRef.current = map;

      // Force recalculation of container size after initial render/mount
      setTimeout(() => {
        if (mapRef.current) {
          mapRef.current.invalidateSize();
        }
      }, 250);
    }

    const map = mapRef.current;

    // Define custom marker icons
    // Self marker (Cyan pulsing indicator)
    const selfIcon = L.divIcon({
      html: `<div class="relative flex items-center justify-center">
               <span class="animate-ping absolute inline-flex h-8 w-8 rounded-full bg-blue-500 opacity-40"></span>
               <span class="relative inline-flex rounded-full h-4 w-4 bg-blue-400 border-2 border-white shadow-md shadow-black/50"></span>
             </div>`,
      className: 'custom-self-marker',
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });

    // Chauffeur/Client markers (Premium Gold pulsing indicator)
    const otherIcon = L.divIcon({
      html: `<div class="relative flex items-center justify-center">
               <span class="animate-ping absolute inline-flex h-8 w-8 rounded-full bg-[#d4af37] opacity-40"></span>
               <span class="relative inline-flex rounded-full h-4 w-4 bg-[#d4af37] border-2 border-white shadow-md shadow-black/50"></span>
             </div>`,
      className: 'custom-other-marker',
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });

    // 3. Setup Socket Receivers
    // When receiving location data via the socket, extract id, latitude, and longitude
    socket.on('receive-location', (data) => {
      const { id, latitude, longitude } = data;

      // Self location is already tracked and rendered locally
      if (id === socket.id) {
        return;
      }

      // If a marker for the id exists, update its position, otherwise create a new marker
      if (markersRef.current[id]) {
        markersRef.current[id].setLatLng([latitude, longitude]);
      } else {
        const marker = L.marker([latitude, longitude], {
          icon: otherIcon,
        }).addTo(map);

        // Bind a custom premium tooltip/popup
        marker.bindPopup(`
          <div class="p-1 text-black font-sans text-xs">
            <p class="font-bold text-[#aa8c2c]">Active Partner</p>
            <p class="text-[10px] text-gray-500 font-mono">ID: ${id.substring(0, 8)}...</p>
          </div>
        `);

        markersRef.current[id] = marker;
      }

      // Calculate total active tracked users
      setActiveUsersCount(Object.keys(markersRef.current).length);
    });

    // When a user disconnects, remove their marker from the map and delete it from markers
    socket.on('user-disconnected', (id) => {
      if (markersRef.current[id]) {
        map.removeLayer(markersRef.current[id]);
        delete markersRef.current[id];
      }
      setActiveUsersCount(Object.keys(markersRef.current).length);
    });

    // 4. Geolocation continuous watching with High-Accuracy fallback
    const startTracking = (highAccuracy = true) => {
      if (!navigator.geolocation) {
        const errMsg = 'Geolocation is not supported by this browser.';
        console.error(errMsg);
        setErrorMsg(errMsg);
        return;
      }

      const geoOptions = {
        enableHighAccuracy: highAccuracy,
        timeout: highAccuracy ? 6000 : 12000,
        maximumAge: 0,
      };

      // Use watchPosition to track the users location continuously
      watchIdRef.current = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          
          setErrorMsg(null); // Clear any errors when location is acquired
          setCoords({ latitude, longitude });

          if (mapRef.current) {
            mapRef.current.setView([latitude, longitude]);
            mapRef.current.invalidateSize();

            // Draw/update self marker locally immediately
            const selfId = 'self';
            if (markersRef.current[selfId]) {
              markersRef.current[selfId].setLatLng([latitude, longitude]);
            } else {
              const marker = L.marker([latitude, longitude], {
                icon: selfIcon,
              }).addTo(mapRef.current);

              marker.bindPopup(`
                <div class="p-1 text-black font-sans text-xs">
                  <p class="font-bold text-blue-500">Your Location</p>
                </div>
              `);
              markersRef.current[selfId] = marker;
            }
          }

          // Emit location to other active participants
          socket.emit('send-location', { latitude, longitude });
        },
        (error) => {
          console.error(`Geolocation Error (highAccuracy=${highAccuracy}):`, error);
          
          // Fallback to low accuracy if high accuracy fails or times out
          if (highAccuracy && (error.code === error.TIMEOUT || error.code === error.POSITION_UNAVAILABLE)) {
            console.log('Retrying location tracking with standard accuracy...');
            if (watchIdRef.current !== null) {
              navigator.geolocation.clearWatch(watchIdRef.current);
            }
            startTracking(false);
          } else {
            setErrorMsg(`Failed to track location: ${error.message}`);
          }
        },
        geoOptions
      );
    };

    startTracking(true);

    // Cleanup on component unmount
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      // Remove markers
      Object.keys(markersRef.current).forEach((id) => {
        if (mapRef.current && markersRef.current[id]) {
          mapRef.current.removeLayer(markersRef.current[id]);
        }
      });
      markersRef.current = {};

      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Handler to center map to user's own location
  const handleRecenter = () => {
    if (coords && mapRef.current) {
      mapRef.current.setView([coords.latitude, coords.longitude], 16);
      mapRef.current.invalidateSize();
    }
  };

  return (
    <div className="relative z-10 w-full h-full rounded-2xl overflow-hidden border border-white/10 bg-[#0c1017] shadow-xl">
      {/* Map Header Status Bar */}
      <div className="absolute top-4 left-4 right-4 z-[1000] flex flex-wrap gap-2 items-center justify-between pointer-events-none">
        {/* Status Indicator */}
        <div className="pointer-events-auto flex items-center space-x-2 bg-[#0e131f]/95 border border-white/10 px-4 py-2 rounded-xl backdrop-blur-md shadow-lg">
          <span className={`w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></span>
          <span className="text-xs font-semibold text-gray-200">
            {isConnected ? 'Real-time Connected' : 'Connecting...'}
          </span>
        </div>

        {/* Info panel */}
        <div className="pointer-events-auto flex items-center space-x-3 bg-[#0e131f]/95 border border-white/10 px-4 py-2 rounded-xl backdrop-blur-md shadow-lg">
          <span className="text-xs text-gray-400">
            Active: <strong className="text-white font-semibold">{activeUsersCount}</strong>
          </span>
          <div className="w-[1px] h-3 bg-white/20"></div>
          <span className="text-[10px] uppercase tracking-wider text-[#d4af37] font-semibold">
            {role === 'driver' ? 'Driver Transmit' : 'Client Mode'}
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

      {/* Actual Map element */}
      <div ref={mapContainerRef} className="w-full h-full relative overflow-hidden" style={{ zIndex: 1 }} />

      {/* Coordinates / Map Controls overlay */}
      <div className="absolute bottom-4 left-4 z-[1000] flex flex-col gap-2">
        {coords && (
          <div className="bg-[#0e131f]/95 border border-white/10 p-3 rounded-xl backdrop-blur-md shadow-lg text-[11px] text-gray-300 font-mono space-y-1">
            <div className="flex items-center space-x-1.5 text-gray-400 mb-1 font-sans font-semibold uppercase tracking-wider text-[9px]">
              <Compass size={11} className="text-[#d4af37] animate-spin" style={{ animationDuration: '6s' }} />
              <span>Current GPS Fix</span>
            </div>
            <p>LAT: {coords.latitude.toFixed(6)}</p>
            <p>LNG: {coords.longitude.toFixed(6)}</p>
          </div>
        )}

        <button
          onClick={handleRecenter}
          disabled={!coords}
          className="flex items-center justify-center space-x-2 bg-[#d4af37] text-[#060a11] hover:bg-[#aa8c2c] disabled:opacity-40 disabled:hover:bg-[#d4af37] px-4 py-2.5 rounded-xl font-bold text-xs transition-colors shadow-lg shadow-[#d4af37]/20 pointer-events-auto"
        >
          <Navigation size={13} className="fill-[#060a11]" />
          <span>Center to Me</span>
        </button>
      </div>

      {/* Map background glow accent */}
      <div className="absolute inset-0 border border-[#d4af37]/10 pointer-events-none rounded-2xl" />
    </div>
  );
};

export default TrackingMap;
