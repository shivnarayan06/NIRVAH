import React from 'react';

interface TicketDetailModalProps {
  ticket: any;
  onClose: () => void;
}

export default function TicketDetailModal({ ticket, onClose }: TicketDetailModalProps) {
  if (!ticket) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content glass-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Ticket Details: {ticket.id}</h2>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-body">
          <div className="detail-row">
            <strong>Type:</strong> <span>{ticket.type}</span>
          </div>
          <div className="detail-row">
            <strong>Location:</strong> <span>{ticket.loc} ({ticket.lat.toFixed(4)}, {ticket.lng.toFixed(4)})</span>
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
            <strong>Status:</strong> <span className={`status-badge ${ticket.status || 'open'}`}>{ticket.status || 'OPEN'}</span>
          </div>
          
          {ticket.image_url && (
            <div className="ticket-image-container">
              <img src={ticket.image_url} alt="Issue" className="ticket-image" />
            </div>
          )}

          <div className="action-buttons">
            <button className="btn primary">Assign Crew</button>
            <button className="btn secondary">Mark as Resolved</button>
          </div>
        </div>
      </div>
    </div>
  );
}
