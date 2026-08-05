import { useTodos } from '../context/TodoContext';

/**
 * Stats - Displays statistics cards showing total, completed, pending, and high-priority counts.
 * Each card has a distinct gradient color and icon.
 */
const Stats = () => {
  const { stats } = useTodos();

  const statCards = [
    {
      label: 'Total Todos',
      value: stats.total,
      icon: '📋',
      className: 'stat-card-1',
    },
    {
      label: 'Completed',
      value: stats.completed,
      icon: '✅',
      className: 'stat-card-2',
    },
    {
      label: 'Pending',
      value: stats.pending,
      icon: '⏳',
      className: 'stat-card-3',
    },
    {
      label: 'High Priority',
      value: stats.highPriority,
      icon: '🔥',
      className: 'stat-card-4',
    },
  ];

  return (
    <div className="stats-grid" id="stats-section">
      {statCards.map((card) => (
        <div key={card.label} className={`stat-card ${card.className}`}>
          <div className="stat-card-icon">{card.icon}</div>
          <div className="stat-card-value">{card.value}</div>
          <div className="stat-card-label">{card.label}</div>
        </div>
      ))}
    </div>
  );
};

export default Stats;
