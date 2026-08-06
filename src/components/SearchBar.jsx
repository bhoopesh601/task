import { useTodos } from '../context/TodoContext';

/**
 * SearchBar - Provides instant search over todo titles and descriptions.
 * Also includes filter chips and sort dropdown.
 */
const SearchBar = ({ onAddClick }) => {
  const {
    searchQuery,
    setSearchQuery,
    activeFilter,
    setActiveFilter,
    sortBy,
    setSortBy,
  } = useTodos();

  const filters = [
    { key: 'all', label: 'All' },
    { key: 'pending', label: 'Pending' },
    { key: 'completed', label: 'Completed' },
    { key: 'high', label: 'High' },
    { key: 'medium', label: 'Medium' },
    { key: 'low', label: 'Low' },
  ];

  return (
    <div className="controls-bar" id="controls-bar">
      {/* Search */}
      <div className="search-wrapper">
        <span className="search-icon" aria-hidden="true">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </span>
        <input
          type="text"
          className="search-input"
          placeholder="Search by title or description..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          id="search-input"
        />
        {searchQuery && (
          <button
            className="search-clear"
            onClick={() => setSearchQuery('')}
            aria-label="Clear search"
            id="search-clear-btn"
          >
            ✕
          </button>
        )}
      </div>

      <div className="controls-right">
        {/* Filter chips */}
        <div className="filter-chips" id="filter-chips">
          {filters.map((filter) => (
            <button
              key={filter.key}
              className={`filter-chip ${activeFilter === filter.key ? 'active' : ''}`}
              onClick={() => setActiveFilter(filter.key)}
              id={`filter-${filter.key}`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* Sort dropdown */}
        <select
          className="select-field"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          id="sort-select"
        >
          <option value="latest">Latest Created</option>
          <option value="dueDate">Due Date</option>
          <option value="priority">Priority</option>
          <option value="alphabetical">Alphabetical</option>
        </select>

        {/* Add Todo button */}
        <button className="add-todo-btn" onClick={onAddClick} id="add-todo-btn">
          Add task
        </button>
      </div>
    </div>
  );
};

export default SearchBar;
