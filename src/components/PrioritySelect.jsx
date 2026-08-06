import { useState, useRef, useEffect } from 'react';
import PriorityIcon from './PriorityIcon';

const OPTIONS = [
  { value: 'Low', label: 'Low' },
  { value: 'Medium', label: 'Medium' },
  { value: 'High', label: 'High' },
];

/**
 * Custom PrioritySelect dropdown component rendering exclamation mark speech bubble icons.
 */
const PrioritySelect = ({ value = 'Medium', onChange, id = 'todo-priority', name = 'priority' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleSelect = (val) => {
    if (onChange) {
      onChange({ target: { name, value: val } });
    }
    setIsOpen(false);
  };

  const selectedOption = OPTIONS.find((o) => o.value === value) || OPTIONS[1];

  return (
    <div className="priority-select-custom" ref={containerRef}>
      {/* Hidden native select for accessibility and automated test compatibility */}
      <select
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        tabIndex={-1}
        aria-hidden="true"
        style={{
          position: 'absolute',
          width: '1px',
          height: '1px',
          padding: 0,
          margin: '-1px',
          overflow: 'hidden',
          clip: 'rect(0, 0, 0, 0)',
          whiteSpace: 'nowrap',
          border: 0,
        }}
      >
        {OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {/* Custom Dropdown Trigger Button */}
      <button
        type="button"
        className={`priority-select-trigger ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="priority-select-value">
          <PriorityIcon priority={selectedOption.value} size={16} />
          <span>{selectedOption.label}</span>
        </span>
        <span className={`priority-select-arrow ${isOpen ? 'open' : ''}`}>▼</span>
      </button>

      {/* Options Dropdown Menu */}
      {isOpen && (
        <div className="priority-select-dropdown" role="listbox">
          {OPTIONS.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                className={`priority-select-option ${isSelected ? 'selected' : ''}`}
                onClick={() => handleSelect(opt.value)}
                role="option"
                aria-selected={isSelected}
              >
                <PriorityIcon
                  priority={opt.value}
                  size={16}
                  style={isSelected ? { filter: 'brightness(1.2)' } : {}}
                />
                <span>{opt.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PrioritySelect;
