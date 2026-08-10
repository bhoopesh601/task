import { useTodos } from '../context/TodoContext';

/**
 * Stats - Displays statistics cards showing total, completed, pending, and high-priority counts.
 * Each card has a distinct gradient color and icon.
 */
const Stats = () => {
  const { stats } = useTodos();

  const statCards = [
    { label: 'Total', value: stats.total, className: 'stat-card-total stat-card-1' },
    { label: 'Completed', value: stats.completed, className: 'stat-card-completed stat-card-2' },
    { label: 'Pending', value: stats.pending, className: 'stat-card-pending stat-card-3' },
    { label: 'High Priority', value: stats.highPriority, className: 'stat-card-high-priority stat-card-4' },
  ];

  return (
    <div className="stats-grid" id="stats-section">
      {statCards.map((card) => (
        <div key={card.label} className={`stat-card ${card.className}`}>
          <div className="stat-card-value">{card.value}</div>
          <div className="stat-card-label">{card.label}</div>
        </div>
      ))}
    </div>
  );
};

export default Stats;
