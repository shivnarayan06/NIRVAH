"use client";

import React, { useEffect, useState } from 'react';
import LiveMap from './components/LiveMap';
import TicketDetailModal from './components/TicketDetailModal';
import './page.css';

export default function DashboardPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);

  useEffect(() => {
    // Fetch tickets from backend
    const fetchTickets = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/tickets');
        if (response.ok) {
          const data = await response.json();
          // Backend returns: { id, type, severity, status, reported_at, image_url, lng, lat }
          // Add dummy loc string for display
          const formatted = data.tickets.map((t: any) => ({
            ...t,
            loc: `Loc: ${t.lat.toFixed(3)}, ${t.lng.toFixed(3)}`,
            time: 'Just now' // In a real app we parse reported_at
          }));
          setTickets(formatted);
        }
      } catch (err) {
        console.error('Failed to fetch tickets', err);
        // Fallback mock data if backend isn't running
        setTickets([
          { id: "T-8931", type: "Pothole", severity: 92, lat: 23.2599, lng: 77.4126, loc: "Ward 4", time: "2m ago" },
          { id: "T-8932", type: "Pipe Burst", severity: 85, lat: 23.2510, lng: 77.4100, loc: "Ward 2", time: "5m ago" },
          { id: "T-8933", type: "Streetlight", severity: 40, lat: 23.2650, lng: 77.4200, loc: "Ward 7", time: "12m ago" }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchTickets();
    
    // Poll every 5 seconds
    const interval = setInterval(fetchTickets, 5000);
    return () => clearInterval(interval);
  }, []);
  return (
    <div className="app-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="logo-container">
            <div className="logo-icon"></div>
            <h1 className="logo-text text-gradient">NIRVAH</h1>
          </div>
          <p className="subtitle">Civic Control Room</p>
        </div>
        
        <nav className="sidebar-nav">
          <a href="#" className="nav-item active">
            <span className="nav-icon">🗺️</span>
            Live Map
          </a>
          <a href="#" className="nav-item">
            <span className="nav-icon">📋</span>
            Triage Queue
            <span className="badge warning">12</span>
          </a>
          <a href="#" className="nav-item">
            <span className="nav-icon">📊</span>
            Analytics
          </a>
          <a href="#" className="nav-item">
            <span className="nav-icon">⚙️</span>
            Settings
          </a>
        </nav>
        
        <div className="sidebar-footer">
          <div className="system-status">
            <div className="status-dot healthy"></div>
            <span>System Operational</span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        <header className="header">
          <div className="search-bar">
            <span className="search-icon">🔍</span>
            <input type="text" placeholder="Search ticket ID, ward, or reporter..." />
          </div>
          
          <div className="header-actions">
            <button className="action-btn">
              <span className="icon">🔔</span>
              <span className="notification-dot"></span>
            </button>
            <div className="admin-profile">
              <div className="avatar">AO</div>
              <div className="profile-info">
                <span className="name">Admin Officer</span>
                <span className="role">Central Command</span>
              </div>
            </div>
          </div>
        </header>

        <div className="dashboard-content">
          {/* Map Area */}
          <div className="map-container glass-panel">
            <div className="panel-header">
              <h2>Live City Overview</h2>
              <div className="filter-pills">
                <span className="pill active">All</span>
                <span className="pill danger">High Priority</span>
                <span className="pill">Recent</span>
              </div>
            </div>
            <div style={{ flex: 1, padding: '16px', paddingBottom: '24px' }}>
              <LiveMap tickets={tickets} onTicketClick={setSelectedTicket} />
            </div>
          </div>

          {/* Triage Queue Area */}
          <div className="triage-sidebar glass-panel">
            <div className="panel-header">
              <h2>Auto-Triage Queue</h2>
              <button className="text-btn">View All</button>
            </div>
            <div className="ticket-list">
              {loading ? (
                <div style={{ padding: 20, color: 'var(--text-secondary)' }}>Loading live tickets...</div>
              ) : tickets.length === 0 ? (
                <div style={{ padding: 20, color: 'var(--text-secondary)' }}>No active tickets.</div>
              ) : tickets.map(ticket => (
                <div 
                  key={ticket.id} 
                  className="ticket-card glass-card"
                  onClick={() => setSelectedTicket(ticket)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="ticket-header">
                    <span className="ticket-id">{ticket.id}</span>
                    <span className="ticket-time">{ticket.time}</span>
                  </div>
                  <div className="ticket-body">
                    <h3>{ticket.type}</h3>
                    <div className="ticket-meta">
                      <span className="location">📍 {ticket.loc}</span>
                    </div>
                  </div>
                  <div className="ticket-footer">
                    <div className="severity-bar">
                      <div 
                        className={`severity-fill ${ticket.severity >= 80 ? 'danger' : 'warning'}`} 
                        style={{width: `${ticket.severity}%`}}
                      ></div>
                    </div>
                    <span className="severity-score">{ticket.severity}/100</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
      
      <TicketDetailModal 
        ticket={selectedTicket} 
        onClose={() => setSelectedTicket(null)} 
      />
    </div>
  );
}
