"use client";

import React, { useEffect, useState, useMemo } from 'react';
import LiveMap from './components/LiveMap';
import TicketDetailModal from './components/TicketDetailModal';
import CrewRosterModal from './components/CrewRosterModal';
import './page.css';

export default function DashboardPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [isRosterOpen, setIsRosterOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'CRITICAL' | 'IN_PROGRESS' | 'RESOLVED'>('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  const formatTimeAgo = (dateStr: string) => {
    if (!dateStr) return 'Just now';
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  const getCategoryIcon = (type: string) => {
    switch (type) {
      case 'Pothole': return '🕳️';
      case 'Water Leak': return '💧';
      case 'Streetlight': return '💡';
      case 'Garbage': return '🗑️';
      case 'Fallen Tree': return '🌳';
      default: return '📍';
    }
  };

  const fetchTickets = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/tickets');
      if (response.ok) {
        const data = await response.json();
        const formatted = data.tickets.map((t: any) => ({
          ...t,
          loc: t.ward_name || `Loc: ${t.lat.toFixed(3)}, ${t.lng.toFixed(3)}`,
          ward_name: t.ward_name,
          officer_name: t.officer_name,
          time: formatTimeAgo(t.reported_at)
        }));
        setTickets(formatted);
      }
    } catch (err) {
      console.error('Failed to fetch tickets', err);
      if (tickets.length === 0) {
        setTickets([
          { id: "T-8931", type: "Pothole", severity: 92, lat: 23.2599, lng: 77.4126, loc: "Ward 4", time: "2m ago", status: "Submitted" }
        ]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
    const intervalId = setInterval(fetchTickets, 5000);
    return () => clearInterval(intervalId);
  }, []);

  // Live Metrics
  const stats = useMemo(() => {
    const total = tickets.length;
    const critical = tickets.filter(t => t.severity >= 80).length;
    const inProgress = tickets.filter(t => t.status === 'IN_PROGRESS').length;
    const resolved = tickets.filter(t => t.status === 'RESOLVED').length;
    return { total, critical, inProgress, resolved };
  }, [tickets]);

  // Filtered Tickets
  const filteredTickets = useMemo(() => {
    return tickets.filter(t => {
      // 1. Status Filter
      if (statusFilter === 'CRITICAL' && t.severity < 80) return false;
      if (statusFilter === 'IN_PROGRESS' && t.status !== 'IN_PROGRESS') return false;
      if (statusFilter === 'RESOLVED' && t.status !== 'RESOLVED') return false;

      // 2. Category Filter
      if (categoryFilter !== 'ALL' && t.type?.toLowerCase() !== categoryFilter.toLowerCase()) return false;

      // 3. Search Query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchId = t.id?.toLowerCase().includes(query);
        const matchType = t.type?.toLowerCase().includes(query);
        const matchDesc = t.description?.toLowerCase().includes(query);
        const matchLoc = t.loc?.toLowerCase().includes(query);
        const matchReporter = t.reporter_id?.toLowerCase().includes(query);
        const matchWard = t.ward_name?.toLowerCase().includes(query);
        const matchOfficer = t.officer_name?.toLowerCase().includes(query);
        if (!matchId && !matchType && !matchDesc && !matchLoc && !matchReporter && !matchWard && !matchOfficer) {
          return false;
        }
      }

      return true;
    });
  }, [tickets, statusFilter, categoryFilter, searchQuery]);

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
          <a 
            href="#" 
            className={`nav-item ${statusFilter === 'ALL' ? 'active' : ''}`} 
            onClick={(e) => { e.preventDefault(); setStatusFilter('ALL'); }}
          >
            <span className="nav-icon">📋</span>
            Triage Queue
            <span className="badge warning">
              {tickets.filter(t => t.status !== 'RESOLVED').length}
            </span>
          </a>
          <a 
            href="#" 
            className={`nav-item ${statusFilter === 'CRITICAL' ? 'active' : ''}`} 
            onClick={(e) => { e.preventDefault(); setStatusFilter('CRITICAL'); }}
          >
            <span className="nav-icon">🚨</span>
            Critical Alerts
            {stats.critical > 0 && <span className="badge warning">{stats.critical}</span>}
          </a>
          <a 
            href="#" 
            className={`nav-item ${statusFilter === 'RESOLVED' ? 'active' : ''}`} 
            onClick={(e) => { e.preventDefault(); setStatusFilter('RESOLVED'); }}
          >
            <span className="nav-icon">✅</span>
            Resolved Issues
            <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.2)', color: 'var(--accent-success)' }}>
              {stats.resolved}
            </span>
          </a>
          <a 
            href="#" 
            className="nav-item" 
            onClick={(e) => { e.preventDefault(); setIsRosterOpen(true); }}
            style={{ marginTop: 'auto', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}
          >
            <span className="nav-icon">👥</span>
            Crew Roster
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
            <input 
              type="text" 
              placeholder="Search by ID, issue type, description, or location..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button 
                className="clear-search-btn" 
                onClick={() => setSearchQuery('')}
                title="Clear search"
              >
                ✕
              </button>
            )}
          </div>
          
          <div className="header-actions">
            <button className="action-btn" title="Critical notifications">
              <span className="icon">🔔</span>
              {stats.critical > 0 && <span className="notification-dot"></span>}
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
          {/* Quick Metrics Bar */}
          <div className="stats-row">
            <div className="stat-card glass-panel" onClick={() => setStatusFilter('ALL')} style={{ cursor: 'pointer' }}>
              <div className="stat-icon total">📊</div>
              <div className="stat-info">
                <span className="stat-label">Total Reports</span>
                <span className="stat-value">{stats.total}</span>
              </div>
            </div>
            <div className="stat-card glass-panel" onClick={() => setStatusFilter('CRITICAL')} style={{ cursor: 'pointer' }}>
              <div className="stat-icon critical">🚨</div>
              <div className="stat-info">
                <span className="stat-label">Critical (≥80)</span>
                <span className="stat-value">{stats.critical}</span>
              </div>
            </div>
            <div className="stat-card glass-panel" onClick={() => setStatusFilter('IN_PROGRESS')} style={{ cursor: 'pointer' }}>
              <div className="stat-icon progress">⚡</div>
              <div className="stat-info">
                <span className="stat-label">In Progress</span>
                <span className="stat-value">{stats.inProgress}</span>
              </div>
            </div>
            <div className="stat-card glass-panel" onClick={() => setStatusFilter('RESOLVED')} style={{ cursor: 'pointer' }}>
              <div className="stat-icon resolved">✅</div>
              <div className="stat-info">
                <span className="stat-label">Resolved</span>
                <span className="stat-value">{stats.resolved}</span>
              </div>
            </div>
          </div>

          {/* Workspace (Map + Triage) */}
          <div className="workspace-grid">
            {/* Map Area */}
            <div className="map-container glass-panel">
              <div className="panel-header">
                <div className="panel-title-group">
                  <h2>Live City Overview</h2>
                  <span className="panel-count">
                    ({filteredTickets.length} of {tickets.length} showing)
                  </span>
                </div>
                <div className="filter-pills">
                  <button 
                    className={`pill ${statusFilter === 'ALL' ? 'active' : ''}`}
                    onClick={() => setStatusFilter('ALL')}
                  >
                    All
                  </button>
                  <button 
                    className={`pill danger ${statusFilter === 'CRITICAL' ? 'active' : ''}`}
                    onClick={() => setStatusFilter('CRITICAL')}
                  >
                    🔥 Critical
                  </button>
                  <button 
                    className={`pill warning ${statusFilter === 'IN_PROGRESS' ? 'active' : ''}`}
                    onClick={() => setStatusFilter('IN_PROGRESS')}
                  >
                    ⚡ In Progress
                  </button>
                  <button 
                    className={`pill success ${statusFilter === 'RESOLVED' ? 'active' : ''}`}
                    onClick={() => setStatusFilter('RESOLVED')}
                  >
                    ✅ Resolved
                  </button>
                </div>
              </div>
              <div style={{ flex: 1, padding: '16px', paddingBottom: '24px' }}>
                <LiveMap tickets={filteredTickets} onTicketClick={setSelectedTicket} />
              </div>
            </div>

            {/* Triage Queue Area */}
            <div className="triage-sidebar glass-panel">
              <div className="panel-header">
                <div>
                  <h2>Auto-Triage Queue</h2>
                  <span className="panel-subtitle">Sorted by Severity</span>
                </div>
                <select 
                  className="category-select"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                >
                  <option value="ALL">All Types</option>
                  <option value="Pothole">🕳️ Potholes</option>
                  <option value="Water Leak">💧 Water Leaks</option>
                  <option value="Streetlight">💡 Streetlights</option>
                  <option value="Garbage">🗑️ Garbage</option>
                  <option value="Fallen Tree">🌳 Fallen Trees</option>
                </select>
              </div>
              <div className="ticket-list">
                {loading ? (
                  <div style={{ padding: 20, color: 'var(--text-secondary)' }}>Loading live tickets...</div>
                ) : filteredTickets.length === 0 ? (
                  <div style={{ padding: 20, color: 'var(--text-secondary)', textAlign: 'center' }}>
                    <div style={{ fontSize: '2rem', marginBottom: 8 }}>🔍</div>
                    <p>No tickets match your filters.</p>
                    {(searchQuery || statusFilter !== 'ALL' || categoryFilter !== 'ALL') && (
                      <button 
                        className="text-btn" 
                        style={{ marginTop: 8 }}
                        onClick={() => {
                          setSearchQuery('');
                          setStatusFilter('ALL');
                          setCategoryFilter('ALL');
                        }}
                      >
                        Reset Filters
                      </button>
                    )}
                  </div>
                ) : filteredTickets.map(ticket => (
                  <div 
                    key={ticket.id} 
                    className="ticket-card glass-card"
                    onClick={() => setSelectedTicket(ticket)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="ticket-header">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span className="ticket-id">{ticket.id}</span>
                        <span className={`status-badge ${ticket.status || 'Submitted'}`}>
                          {ticket.status === 'IN_PROGRESS' ? 'In Progress' : (ticket.status || 'Submitted')}
                        </span>
                      </div>
                      <span className="ticket-time">{ticket.time}</span>
                    </div>
                    <div className="ticket-body">
                      <h3>{getCategoryIcon(ticket.type)} {ticket.type}</h3>
                      {ticket.description && (
                        <p className="ticket-desc-snippet">{ticket.description}</p>
                      )}
                      <div className="ticket-meta" style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '4px' }}>
                        <span className="location">🏛️ {ticket.ward_name || ticket.loc}</span>
                        {ticket.officer_name && (
                          <span style={{ fontSize: '0.75rem', color: 'var(--accent-primary)', fontWeight: 500 }}>
                            👮 {ticket.officer_name}
                          </span>
                        )}
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
        </div>
      </main>
      
      <TicketDetailModal 
        ticket={selectedTicket} 
        onClose={() => setSelectedTicket(null)}
        onTicketUpdated={() => {
          fetchTickets();
          setSelectedTicket(null);
        }}
      />

      <CrewRosterModal
        isOpen={isRosterOpen}
        onClose={() => setIsRosterOpen(false)}
        onRosterUpdated={fetchTickets}
      />
    </div>
  );
}