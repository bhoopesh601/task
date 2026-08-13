import { useTodos } from '../context/TodoContext';

/**
 * Stats - Displays statistics cards showing total, completed, pending, and high-priority counts.
 * Each card has a distinct gradient color and icon.
 */
const Stats = () => {
  const { stats } = useTodos();

  const getPercentage = (value, total) => {
    if (total === 0) return 0;
    return Math.round((value / total) * 100);
  };

  const statCards = [
    { label: 'Total', subtitle: '(all tasks)', value: stats.total, percentage: stats.total === 0 ? 0 : 100, color: '#7c76d9' },
    { label: 'Completed', subtitle: '(tasks)', value: stats.completed, percentage: getPercentage(stats.completed, stats.total), color: 'var(--status-completed)' },
    { label: 'Pending', subtitle: '(tasks)', value: stats.pending, percentage: getPercentage(stats.pending, stats.total), color: '#d6d8db' },
    { label: 'High Priority', subtitle: '(tasks)', value: stats.highPriority, percentage: getPercentage(stats.highPriority, stats.total), color: 'var(--priority-high)' },
  ];

  const radius = 18;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="stats-grid" id="stats-section">
      {statCards.map((card) => {
        const offset = circumference - (card.percentage / 100) * circumference;
        return (
          <div key={card.label} className="stat-card modern-stat-card">
            <div className="modern-stat-left">
              <div className="modern-stat-value">{card.value}</div>
              <div className="modern-stat-text">
                <div className="modern-stat-label">{card.label}</div>
                <div className="modern-stat-subtitle">{card.subtitle}</div>
              </div>
            </div>
            <div className="modern-stat-right">
              <div className="circular-progress">
                <svg width="50" height="50" viewBox="0 0 50 50">
                  <circle
                    cx="25"
                    cy="25"
                    r={radius}
                    fill="none"
                    stroke="#f0f0f0"
                    strokeWidth="4"
                  />
                  <circle
                    cx="25"
                    cy="25"
                    r={radius}
                    fill="none"
                    stroke={card.color}
                    strokeWidth="4"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    transform="rotate(-90 25 25)"
                  />
                </svg>
                <div className="circular-progress-text" style={{ color: card.color }}>
                  {card.percentage}%
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default Stats;
