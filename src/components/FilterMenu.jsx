import { useState, useRef, useEffect } from 'react';
import { useTodos } from '../context/TodoContext';
import PriorityIcon from './PriorityIcon';
import '../styles/FilterMenu.css';

const FilterMenu = () => {
  const {
    activeFilter,
    setActiveFilter,
    sortBy,
    setSortBy,
  } = useTodos();

  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const toggleOpen = () => setIsOpen((prev) => !prev);

  return (
    <div className="filter-menu-container" ref={containerRef}>
      <button 
        className="filter-menu-trigger" 
        onClick={toggleOpen}
        aria-expanded={isOpen}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
        </svg>
        Filter
      </button>

      {isOpen && (
        <div className="filter-menu-popover">
          <div className="filter-menu-header">
            <h3>Filter</h3>
            <button className="filter-menu-close" onClick={() => setIsOpen(false)}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          <div className="filter-menu-content">
            {/* Sort Section */}
            <div className="filter-section">
              <div className="filter-section-header-row">
                <h4>Sort By</h4>
                {sortBy !== 'latest' && (
                  <button className="filter-reset-btn" onClick={() => setSortBy('latest')}>
                    Reset
                  </button>
                )}
              </div>
              <div className="filter-section-chips">
                {[
                  { value: 'latest', label: 'Latest Created' },
                  { value: 'dueDate', label: 'Due Date' },
                  { value: 'alphabetical', label: 'Alphabetical' }
                ].map((opt) => (
                  <button
                    key={opt.value}
                    className={`filter-section-chip ${sortBy === opt.value ? 'active' : ''}`}
                    onClick={() => setSortBy(opt.value)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Status Section */}
            <div className="filter-section">
              <div className="filter-section-header-row">
                <h4>Filter by Status</h4>
                {['pending', 'completed'].includes(activeFilter) && (
                  <button className="filter-reset-btn" onClick={() => setActiveFilter('all')}>
                    Reset
                  </button>
                )}
              </div>
              <div className="filter-section-chips">
                {[
                  { value: 'all', label: 'All' },
                  { value: 'pending', label: 'Pending' },
                  { value: 'completed', label: 'Completed' }
                ].map((opt) => (
                  <button
                    key={opt.value}
                    className={`filter-section-chip ${activeFilter === opt.value ? 'active' : ''}`}
                    onClick={() => setActiveFilter(opt.value)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Priority Section */}
            <div className="filter-section">
              <div className="filter-section-header-row">
                <h4>Filter by Priority</h4>
                {['high', 'medium', 'low'].includes(activeFilter) && (
                  <button className="filter-reset-btn" onClick={() => setActiveFilter('all')}>
                    Reset
                  </button>
                )}
              </div>
              <div className="filter-section-chips">
                {[
                  { value: 'high', label: 'High' },
                  { value: 'medium', label: 'Medium' },
                  { value: 'low', label: 'Low' }
                ].map((opt) => (
                  <button
                    key={opt.value}
                    className={`filter-section-chip ${activeFilter === opt.value ? 'active' : ''}`}
                    onClick={() => setActiveFilter(opt.value)}
                  >
                    <PriorityIcon priority={opt.value} size={14} style={{ marginRight: 5 }} />
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterMenu;
