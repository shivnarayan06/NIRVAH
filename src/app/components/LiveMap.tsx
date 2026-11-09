"use client";

import React, { useState, useMemo } from 'react';
import Map, { Marker, Popup, NavigationControl, FullscreenControl } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';

interface LiveMapProps {
  tickets: Array<{
    id: string;
    type: string;
    severity: number;
    lat: number;
    lng: number;
    loc?: string;
  }>;
  onTicketClick?: (ticket: any) => void;
}

export default function LiveMap({ tickets, onTicketClick }: LiveMapProps) {
  const [popupInfo, setPopupInfo] = useState<any>(null);

  const pins = useMemo(
    () =>
      tickets.map((ticket, index) => (
        <Marker
          key={`marker-${index}`}
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
            width: '16px',
            height: '16px',
            backgroundColor: ticket.severity >= 80 ? 'var(--accent-danger)' : 'var(--accent-warning)',
            borderRadius: '50%',
            cursor: 'pointer',
            border: '2px solid white',
            boxShadow: '0 0 10px rgba(0,0,0,0.5)',
            animation: ticket.severity >= 80 ? 'pulse 2s infinite' : 'none'
          }} />
        </Marker>
      )),
    []
  );

  return (
    <div style={{ flex: 1, position: 'relative', width: '100%', height: '100%', borderRadius: 'var(--radius-xl)', overflow: 'hidden' }}>
      <Map
        style={{ width: '100%', height: '100%' }}
        initialViewState={{
          longitude: 77.4126, // Bhopal longitude
          latitude: 23.2599,  // Bhopal latitude
          zoom: 12
        }}
        mapStyle={{
          version: 8,
          sources: {
            osm: {
              type: 'raster',
              tiles: ['https://a.tile.openstreetmap.org/{z}/{x}/{y}.png'],
              tileSize: 256,
              attribution: '&copy; OpenStreetMap Contributors'
            }
          },
          layers: [
            {
              id: 'osm',
              type: 'raster',
              source: 'osm'
            }
          ]
        }}
      >
        <NavigationControl position="top-right" />
        <FullscreenControl position="top-right" />
        
        {pins}

        {popupInfo && (
          <Popup
            anchor="top"
            longitude={Number(popupInfo.lng)}
            latitude={Number(popupInfo.lat)}
            onClose={() => setPopupInfo(null)}
            closeButton={false}
          >
            <div style={{ color: '#000', padding: '4px' }}>
              <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '4px' }}>
                {popupInfo.type}
              </div>
              <div style={{ fontSize: '12px', color: '#666' }}>
                {popupInfo.loc} | ID: {popupInfo.id}
              </div>
            </div>
          </Popup>
        )}
      </Map>
    </div>
  );
}
