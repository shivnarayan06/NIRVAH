import React, { useState, useEffect } from 'react';

interface TicketDetailModalProps {
  ticket: any;
  onClose: () => void;
  onTicketUpdated?: () => void;
}

export default function TicketDetailModal({ ticket, onClose, onTicketUpdated }: TicketDetailModalProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [officers, setOfficers] = useState<any[]>([]);
  const [showReassign, setShowReassign] = useState(false);
  const [selectedOfficer, setSelectedOfficer] = useState('');

  useEffect(() => {
    fetch('http://localhost:5001/api/officers')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data && data.officers) {
          setOfficers(data.officers);
        }
      })
      .catch(err => console.error('Error fetching officers:', err));
  }, []);

  if (!ticket) return null;

  const currentOfficerObj = officers.find(o => 
    ticket.officer_name && ticket.officer_name.includes(o.name)
  );
  const isOfficerOnLeave = currentOfficerObj && currentOfficerObj.status === 'On Leave';

  const updateStatus = async (newStatus: string) => {
    setIsUpdating(true);
    try {
      const res = await fetch(`http://localhost:5001/api/tickets/${ticket.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        ticket.status = newStatus;
        if (onTicketUpdated) onTicketUpdated();
      } else {
        alert('Failed to update status');
      }
    } catch (e) {
      console.error(e);
      alert('Error updating status');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleReassignOfficer = async () => {
    if (!selectedOfficer) return;
    setIsUpdating(true);
    try {
      const res = await fetch(`http://localhost:5001/api/tickets/${ticket.id}/officer`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ officer_name: selectedOfficer })
      });
      if (res.ok) {
        ticket.officer_name = selectedOfficer;
        ticket.assigned_officer = selectedOfficer;
        setShowReassign(false);
        if (onTicketUpdated) onTicketUpdated();
      } else {
        alert('Failed to reassign officer');
      }
    } catch (e) {
      console.error(e);
      alert('Error reassigning officer');
    } finally {
      setIsUpdating(false);
    }
  };

  const isAssigned = ticket.status === 'IN_PROGRESS';
  const isResolved = ticket.status === 'RESOLVED';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content glass-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Ticket Details: {ticket.id}</h2>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-body">
          {/* On Leave Warning Alert */}
          {isOfficerOnLeave && (
            <div className="alert-leave-warning">
              <span style={{ fontSize: '1.25rem' }}>⚠️</span>
              <div>
                <strong>Assigned Officer On Leave</strong>
                <p style={{ margin: '2px 0 0 0', fontSize: '0.75rem', opacity: 0.9 }}>
                  {currentOfficerObj.name} is currently marked On Leave. Click <em>Change</em> to reassign to an available crew member.
                </p>
              </div>
            </div>
          )}

          <div className="detail-row">
            <strong>Type:</strong> <span>{ticket.type}</span>
          </div>
          <div className="detail-row">
            <strong>Ward:</strong> <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>🏛️ {ticket.ward_name || 'Central Command Zone'}</span>
          </div>

          {/* Officer Assignment with Reassign Option */}
          <div className="detail-row" style={{ alignItems: 'flex-start' }}>
            <strong style={{ paddingTop: '4px' }}>Officer:</strong> 
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 600, color: isOfficerOnLeave ? 'var(--accent-warning)' : 'var(--accent-primary)' }}>
                  👮 {ticket.officer_name || 'General Duty Officer'}
                  {isOfficerOnLeave && (
                    <span className="badge warning" style={{ marginLeft: 6, fontSize: '0.65rem' }}>
                      On Leave
                    </span>
                  )}
                </span>
                {!showReassign && (
                  <button 
                    className="text-btn" 
                    style={{ fontSize: '0.75rem', textDecoration: 'underline', padding: '2px 6px' }}
                    onClick={() => {
                      setSelectedOfficer(ticket.officer_name || '');
                      setShowReassign(true);
                    }}
                  >
                    Change Officer
                  </button>
                )}
              </div>

              {/* Inline Reassign Select Box */}
              {showReassign && (
                <div style={{ marginTop: '8px', background: 'rgba(255,255,255,0.03)', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                  <select 
                    className="officer-select"
                    value={selectedOfficer}
                    onChange={(e) => setSelectedOfficer(e.target.value)}
                  >
                    <option value="">-- Choose Replacement Officer --</option>
                    {officers.map(o => (
                      <option key={o.id} value={`${o.name} (${o.role})`}>
                        {o.name} — {o.role} ({o.status === 'On Leave' ? '⚠️ On Leave' : '✅ ' + o.status})
                      </option>
                    ))}
                  </select>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                    <button 
                      className="btn primary" 
                      style={{ padding: '6px 10px', fontSize: '0.75rem' }}
                      onClick={handleReassignOfficer}
                      disabled={!selectedOfficer || isUpdating}
                    >
                      {isUpdating ? 'Saving...' : 'Save Reassignment'}
                    </button>
                    <button 
                      className="btn secondary" 
                      style={{ padding: '6px 10px', fontSize: '0.75rem' }}
                      onClick={() => setShowReassign(false)}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="detail-row">
            <strong>Location:</strong> <span>{ticket.loc} ({ticket.lat?.toFixed(4)}, {ticket.lng?.toFixed(4)})</span>
          </div>
          <div className="detail-row">
            <strong>Reported:</strong> <span>{ticket.time}</span>
          </div>
          <div className="detail-row">
            <strong>Severity:</strong> 
            <div className="severity-bar-large">
              <div 
                className={`severity-fill ${ticket.severity >= 80 ? 'danger' : 'warning'}`} 
                style={{width: `${ticket.severity}%`}}
              ></div>
            </div>
            <span style={{marginLeft: '8px'}}>{ticket.severity}/100</span>
          </div>
          <div className="detail-row status-row">
            <strong>Status:</strong> <span className={`status-badge ${ticket.status || 'OPEN'}`}>{ticket.status || 'OPEN'}</span>
          </div>
          
          {ticket.description && (
            <div className="detail-row">
              <strong>AI Analysis:</strong> 
              <span style={{ fontStyle: 'italic', color: 'var(--accent-warning)', display: 'block', marginTop: '4px' }}>
                {ticket.description}
              </span>
            </div>
          )}
          
          {ticket.image_url && (
            <div className="ticket-image-container">
              <img 
                src={ticket.image_url.startsWith('/uploads') ? `http://localhost:5001${ticket.image_url}` : ticket.image_url} 
                alt="Issue" 
                className="ticket-image" 
              />
            </div>
          )}

          <div className="action-buttons">
            {!isResolved && (
              <button 
                className={`btn primary ${isAssigned ? 'disabled' : ''}`}
                onClick={() => updateStatus('IN_PROGRESS')}
                disabled={isAssigned || isUpdating}
              >
                {isAssigned ? 'Crew Dispatched' : (isUpdating ? 'Assigning...' : 'Dispatch Crew')}
              </button>
            )}
            {!isResolved && (
              <button 
                className="btn secondary"
                onClick={() => updateStatus('RESOLVED')}
                disabled={isUpdating}
              >
                {isUpdating ? 'Updating...' : 'Mark as Resolved'}
              </button>
            )}
            {isResolved && (
              <button className="btn success disabled" disabled>
                Issue Resolved ✅
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}