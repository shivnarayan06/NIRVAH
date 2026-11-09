"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Map, { Marker, Popup, NavigationControl, FullscreenControl, Source, Layer } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';

interface LiveMapProps {
  tickets: Array<{
    id: string;
    type: string;
    severity: number;
    lat: number;
    lng: number;
    loc?: string;
    ward_name?: string;
    officer_name?: string;
  }>;
  onTicketClick?: (ticket: any) => void;
}

export default function LiveMap({ tickets, onTicketClick }: LiveMapProps) {
  const [popupInfo, setPopupInfo] = useState<any>(null);
  const [wardsData, setWardsData] = useState<any>(null);

  useEffect(() => {
    fetch('http://localhost:5001/api/wards')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) setWardsData(data);
      })
      .catch(err => console.error('Failed to load wards GeoJSON', err));
  }, []);

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Pothole': return '#f97316'; // Orange
      case 'Water Leak': return '#3b82f6'; // Blue
      case 'Streetlight': return '#eab308'; // Yellow
      case 'Garbage': return '#8b5cf6'; // Purple
      case 'Fallen Tree': return '#22c55e'; // Green
      default: return '#ef4444'; // Red
    }
  };

  const pins = useMemo(
    () =>
      tickets.map((ticket, index) => (
        <Marker
          key={`marker-${ticket.id || index}`}
          longitude={ticket.lng}
          latitude={ticket.lat}
          anchor="bottom"
          onClick={e => {
            e.originalEvent.stopPropagation();
            setPopupInfo(ticket);
            if (onTicketClick) onTicketClick(ticket);
          }}
        >
          <div style={{
            width: '18px',
            height: '18px',
            backgroundColor: getTypeColor(ticket.type),
            borderRadius: '50%',
            cursor: 'pointer',
            border: '2px solid white',
            boxShadow: ticket.severity >= 80 ? '0 0 15px rgba(239,68,68,0.8)' : '0 0 5px rgba(0,0,0,0.5)',
            animation: ticket.severity >= 80 ? 'pulse 1.5s infinite' : 'none'
          }} />
        </Marker>
      )),
    [tickets, onTicketClick]
  );

  // Map ref state for camera manipulation
  const [mapRef, setMapRef] = useState<any>(null);

  React.useEffect(() => {
    if (mapRef && tickets.length > 0) {
      // Auto-center on the most recent ticket (first in the array)
      const latest = tickets[0];
      mapRef.flyTo({
        center: [latest.lng, latest.lat],
        zoom: 13,
        duration: 1800
      });
    }
  }, [tickets, mapRef]);

  return (
    <div style={{ flex: 1, position: 'relative', width: '100%', height: '100%', borderRadius: 'var(--radius-xl)', overflow: 'hidden' }}>
      <Map
        ref={setMapRef}
        style={{ width: '100%', height: '100%' }}
        initialViewState={{
          longitude: 77.4126, // Bhopal longitude
          latitude: 23.2599,  // Bhopal latitude
          zoom: 12
        }}
        mapStyle={{
          version: 8,
          sources: {
            street: {
              type: 'raster',
              tiles: ['https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}'],
              tileSize: 256,
              attribution: '&copy; Google Maps'
            }
          },
          layers: [
            {
              id: 'street',
              type: 'raster',
              source: 'street'
            }
          ]
        }}
      >
        <NavigationControl position="top-right" />
        <FullscreenControl position="top-right" />

        {/* PostGIS Ward Boundaries Layer */}
        {wardsData && (
          <Source id="wards-source" type="geojson" data={wardsData}>
            <Layer
              id="wards-fill"
              type="fill"
              paint={{
                'fill-color': '#3b82f6',
                'fill-opacity': 0.08
              }}
            />
            <Layer
              id="wards-outline"
              type="line"
              paint={{
                'line-color': '#60a5fa',
                'line-width': 2,
                'line-dasharray': [3, 2]
              }}
            />
          </Source>
        )}
        
        {pins}

        {popupInfo && (
          <Popup
            anchor="top"
            longitude={Number(popupInfo.lng)}
            latitude={Number(popupInfo.lat)}
            onClose={() => setPopupInfo(null)}
            closeButton={false}
          >
            <div style={{ color: '#000', padding: '6px', minWidth: '140px' }}>
              <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '4px', color: '#0f172a' }}>
                {popupInfo.type} ({popupInfo.severity}/100)
              </div>
              <div style={{ fontSize: '12px', color: '#334155', marginBottom: '2px' }}>
                🏛️ {popupInfo.ward_name || popupInfo.loc}
              </div>
              {popupInfo.officer_name && (
                <div style={{ fontSize: '11px', color: '#2563eb', fontWeight: 600 }}>
                  👮 {popupInfo.officer_name}
                </div>
              )}
            </div>
          </Popup>
        )}
      </Map>
    </div>
  );
}
