import React, { useState, useEffect } from 'react';

interface CrewRosterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRosterUpdated?: () => void;
}

export default function CrewRosterModal({ isOpen, onClose, onRosterUpdated }: CrewRosterModalProps) {
  const [officers, setOfficers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const fetchRoster = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5001/api/officers');
      if (res.ok) {
        const data = await res.json();
        setOfficers(data.officers || []);
      }
    } catch (e) {
      console.error('Error fetching roster:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchRoster();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const toggleStatus = async (officer: any) => {
    const newStatus = officer.status === 'On Leave' ? 'Available' : 'On Leave';
    setTogglingId(officer.id);
    try {
      const res = await fetch(`http://localhost:5001/api/officers/${officer.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        setOfficers(prev => prev.map(o => o.id === officer.id ? { ...o, status: newStatus } : o));
        if (onRosterUpdated) onRosterUpdated();
      } else {
        alert('Failed to update officer status');
      }
    } catch (e) {
      console.error(e);
      alert('Error updating status');
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content glass-panel roster-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2>Municipal Crew & Officer Roster</h2>
            <p style={{ margin: '2px 0 0 0', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              Manage duty status and availability across city wards
            </p>
          </div>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>

        <div className="modal-body">
          {loading ? (
            <div style={{ padding: 30, textAlign: 'center', color: 'var(--text-secondary)' }}>
              Loading crew roster...
            </div>
          ) : (
            <div className="crew-list">
              {officers.map(officer => {
                const isOnLeave = officer.status === 'On Leave';
                const initials = officer.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2);

                return (
                  <div key={officer.id} className="crew-card">
                    <div className="crew-left">
                      <div className="crew-avatar">
                        {initials}
                      </div>
                      <div className="crew-details">
                        <h4>{officer.name}</h4>
                        <p>{officer.role} • <strong>{officer.department}</strong></p>
                        <p style={{ color: 'var(--text-tertiary)', fontSize: '0.72rem' }}>
                          🏛️ {officer.ward_name} | 📞 {officer.phone}
                        </p>
                      </div>
                    </div>

                    <div className="crew-meta">
                      <span className={`officer-status-badge ${isOnLeave ? 'on-leave' : 'available'}`}>
                        {isOnLeave ? '⚠️ On Leave' : '✅ Active'}
                      </span>
                      <button
                        className="toggle-status-btn"
                        onClick={() => toggleStatus(officer)}
                        disabled={togglingId === officer.id}
                      >
                        {togglingId === officer.id 
                          ? 'Updating...' 
                          : isOnLeave 
                            ? 'Mark Available' 
                            : 'Mark On Leave'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
