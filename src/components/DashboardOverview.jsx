import { useState, useMemo } from 'react';
import { useTodos } from '../context/TodoContext';
import { formatDate } from '../utils/helpers';

/**
 * DashboardOverview — Analytics view containing:
 * 1. Interactive task calendar mapping due dates to tasks
 * 2. Visual Task Status Doughnut Chart
 * 3. Priority Level Distribution Bar Chart
 * 4. Upcoming task deadlines summary
 * All derived in real time from TodoContext.
 */
const DashboardOverview = ({ onNavigateToTodos, onEditTodo }) => {
  const { todos, toggleStatus } = useTodos();

  // Calendar State: Current year and month view
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedDateStr, setSelectedDateStr] = useState(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Month navigation helpers
  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Map todos by ISO date string (YYYY-MM-DD)
  const todosByDueDate = useMemo(() => {
    const map = {};
    todos.forEach((todo) => {
      if (todo.dueDate) {
        if (!map[todo.dueDate]) {
          map[todo.dueDate] = [];
        }
        map[todo.dueDate].push(todo);
      }
    });
    return map;
  }, [todos]);

  // Calendar generation for current month view
  const calendarDays = useMemo(() => {
    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const days = [];

    // Empty padding cells before 1st of month
    for (let i = 0; i < firstDayIndex; i++) {
      days.push(null);
    }

    // Days 1..totalDays
    for (let day = 1; day <= totalDays; day++) {
      const monthStr = String(month + 1).padStart(2, '0');
      const dayStr = String(day).padStart(2, '0');
      const dateKey = `${year}-${monthStr}-${dayStr}`;
      const dayTodos = todosByDueDate[dateKey] || [];
      days.push({
        day,
        dateKey,
        todos: dayTodos,
      });
    }

    return days;
  }, [year, month, todosByDueDate]);

  // Tasks due on selected calendar date
  const selectedDateTasks = useMemo(() => {
    if (!selectedDateStr) return [];
    return todosByDueDate[selectedDateStr] || [];
  }, [selectedDateStr, todosByDueDate]);

  // Chart 1 Metrics: Status Distribution
  const totalCount = todos.length;
  const completedCount = todos.filter((t) => t.status === 'Completed').length;
  const pendingCount = todos.filter((t) => t.status === 'Pending').length;
  const completionPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Chart 2 Metrics: Priority Distribution
  const highCount = todos.filter((t) => t.priority === 'High').length;
  const mediumCount = todos.filter((t) => t.priority === 'Medium').length;
  const lowCount = todos.filter((t) => t.priority === 'Low').length;

  const maxPriorityCount = Math.max(highCount, mediumCount, lowCount, 1);

  // SVG Doughnut geometry calculation
  const doughnutRadius = 54;
  const doughnutCircumference = 2 * Math.PI * doughnutRadius;
  const completedStrokeOffset = doughnutCircumference - (completionPercentage / 100) * doughnutCircumference;

  return (
    <div className="dashboard-overview">
      {/* Metrics Row */}
      <div className="analytics-grid">
        {/* Doughnut Chart: Completed vs Pending */}
        <div className="analytics-card">
          <div className="card-header">
            <h3>Task Status Breakdown</h3>
            <span className="card-subtitle">Real-time completion progress</span>
          </div>
          <div className="doughnut-container">
            <svg width="150" height="150" viewBox="0 0 140 140" className="doughnut-svg">
              <circle
                cx="70"
                cy="70"
                r={doughnutRadius}
                fill="none"
                stroke="var(--border-color)"
                strokeWidth="16"
              />
              <circle
                cx="70"
                cy="70"
                r={doughnutRadius}
                fill="none"
                stroke="var(--accent-primary)"
                strokeWidth="16"
                strokeDasharray={doughnutCircumference}
                strokeDashoffset={completedStrokeOffset}
                strokeLinecap="round"
                transform="rotate(-90 70 70)"
                style={{ transition: 'stroke-dashoffset 0.5s ease' }}
              />
            </svg>
            <div className="doughnut-label">
              <span className="doughnut-value">{completionPercentage}%</span>
              <span className="doughnut-subtext">Completed</span>
            </div>
          </div>
          <div className="chart-legend">
            <div className="legend-item">
              <span className="legend-dot dot-completed" />
              <span>Completed ({completedCount})</span>
            </div>
            <div className="legend-item">
              <span className="legend-dot dot-pending" />
              <span>Pending ({pendingCount})</span>
            </div>
          </div>
        </div>

        {/* Bar Chart: Priority Distribution */}
        <div className="analytics-card">
          <div className="card-header">
            <h3>Tasks by Priority Level</h3>
            <span className="card-subtitle">Distribution across priorities</span>
          </div>
          <div className="bar-chart-container">
            {/* High Priority Bar */}
            <div className="bar-group">
              <div className="bar-label-row">
                <span className="bar-name">High Priority</span>
                <span className="bar-count">{highCount}</span>
              </div>
              <div className="bar-track">
                <div
                  className="bar-fill bar-high"
                  style={{ width: `${(highCount / maxPriorityCount) * 100}%` }}
                />
              </div>
            </div>

            {/* Medium Priority Bar */}
            <div className="bar-group">
              <div className="bar-label-row">
                <span className="bar-name">Medium Priority</span>
                <span className="bar-count">{mediumCount}</span>
              </div>
              <div className="bar-track">
                <div
                  className="bar-fill bar-medium"
                  style={{ width: `${(mediumCount / maxPriorityCount) * 100}%` }}
                />
              </div>
            </div>

            {/* Low Priority Bar */}
            <div className="bar-group">
              <div className="bar-label-row">
                <span className="bar-name">Low Priority</span>
                <span className="bar-count">{lowCount}</span>
              </div>
              <div className="bar-track">
                <div
                  className="bar-fill bar-low"
                  style={{ width: `${(lowCount / maxPriorityCount) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Calendar Section */}
      <div className="calendar-section">
        <div className="calendar-card">
          <div className="calendar-header">
            <div className="calendar-title-group">
              <h3>Task Due Date Calendar</h3>
              <span className="card-subtitle">Select a date to view scheduled tasks</span>
            </div>
            <div className="calendar-controls">
              <button type="button" className="cal-nav-btn" onClick={handlePrevMonth} title="Previous Month">
                ‹
              </button>
              <span className="current-month-label">{monthNames[month]} {year}</span>
              <button type="button" className="cal-nav-btn" onClick={handleNextMonth} title="Next Month">
                ›
              </button>
            </div>
          </div>

          <div className="calendar-grid">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((dayName) => (
              <div key={dayName} className="cal-day-header">{dayName}</div>
            ))}

            {calendarDays.map((cell, idx) => {
              if (!cell) {
                return <div key={`empty-${idx}`} className="cal-cell empty" />;
              }

              const isSelected = selectedDateStr === cell.dateKey;
              const hasTasks = cell.todos.length > 0;

              return (
                <div
                  key={cell.dateKey}
                  className={`cal-cell ${hasTasks ? 'has-tasks' : ''} ${isSelected ? 'selected' : ''}`}
                  onClick={() => setSelectedDateStr(cell.dateKey)}
                  title={hasTasks ? `${cell.todos.length} task(s) due` : 'No tasks scheduled'}
                >
                  <span className="cal-day-number">{cell.day}</span>
                  {hasTasks && (
                    <div className="cal-task-indicators">
                      {cell.todos.slice(0, 3).map((t) => (
                        <span
                          key={t.id}
                          className={`cal-task-dot ${t.priority ? `dot-${t.priority.toLowerCase()}` : ''}`}
                        />
                      ))}
                      {cell.todos.length > 3 && (
                        <span className="cal-more-count">+{cell.todos.length - 3}</span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Tasks due on selected date drawer */}
          {selectedDateStr && (
            <div className="cal-selected-panel">
              <div className="cal-selected-header">
                <h4>Tasks due on {formatDate(selectedDateStr)}</h4>
                <button
                  type="button"
                  className="cal-close-btn"
                  onClick={() => setSelectedDateStr(null)}
                >
                  ✕
                </button>
              </div>
              <div className="cal-selected-list">
                {selectedDateTasks.length > 0 ? (
                  selectedDateTasks.map((todo) => (
                    <div key={todo.id} className="cal-todo-item">
                      <input
                        type="checkbox"
                        checked={todo.status === 'Completed'}
                        onChange={() => toggleStatus(todo.id)}
                        className="todo-checkbox"
                      />
                      <div className="cal-todo-info">
                        <span className={`cal-todo-title ${todo.status === 'Completed' ? 'completed' : ''}`}>
                          {todo.title}
                        </span>
                        <span className="cal-todo-meta">
                          Priority: {todo.priority} | Status: {todo.status}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="cal-no-tasks">No tasks due on this date.</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardOverview;
