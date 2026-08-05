/**
 * Modal - Reusable modal component with overlay, header, and close button.
 * Handles click-outside-to-close and escape key.
 */
import { useEffect, useRef } from 'react';

const Modal = ({ isOpen, onClose, title, children }) => {
  const overlayRef = useRef(null);

  // Close on escape key
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  // Close on overlay click
  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay"
      ref={overlayRef}
      onClick={handleOverlayClick}
      id="modal-overlay"
    >
      <div className="modal-content" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        {title && (
          <div className="modal-header">
            <h2 id="modal-title">{title}</h2>
            <button
              className="modal-close"
              onClick={onClose}
              aria-label="Close modal"
              id="modal-close-btn"
            >
              ✕
            </button>
          </div>
        )}
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
};

/**
 * ConfirmModal - Specialized modal for delete confirmations.
 * Shows a warning icon, message, and confirm/cancel buttons.
 */
export const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message }) => {
  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="confirm-modal">
        <div className="confirm-icon">⚠️</div>
        <h3>{title || 'Are you sure?'}</h3>
        <p>{message || 'This action cannot be undone.'}</p>
        <div className="confirm-actions">
          <button className="btn btn-secondary" onClick={onClose} id="confirm-cancel-btn">
            Cancel
          </button>
          <button className="btn btn-danger" onClick={onConfirm} id="confirm-delete-btn">
            🗑️ Delete
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default Modal;
