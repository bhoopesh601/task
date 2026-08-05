import { formatDate } from '../utils/helpers';

/**
 * TodoCard - Displays a single todo item as a card.
 * Shows title, description, priority badge, status badge, due date, and created date.
 * Actions: toggle status, edit, delete.
 */
const TodoCard = ({ todo, onEdit, onDelete, onToggleStatus }) => {
  const priorityClass = `priority-${todo.priority.toLowerCase()}`;
  const badgePriorityClass = `badge-priority-${todo.priority.toLowerCase()}`;
  const badgeStatusClass = `badge-status-${todo.status.toLowerCase()}`;

  return (
    <div className={`todo-card ${priorityClass}`} id={`todo-card-${todo.id}`}>
      <div className="todo-card-header">
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', flex: 1 }}>
          {/* Status checkbox */}
          <input
            type="checkbox"
            className="todo-status-toggle"
            checked={todo.status === 'Completed'}
            onChange={() => onToggleStatus(todo.id)}
            aria-label={`Mark ${todo.title} as ${todo.status === 'Completed' ? 'pending' : 'completed'}`}
            id={`todo-toggle-${todo.id}`}
          />
          <h3 className={`todo-card-title ${todo.status === 'Completed' ? 'completed' : ''}`}>
            {todo.title}
          </h3>
        </div>

        {/* Action buttons */}
        <div className="todo-card-actions">
          <button
            className="edit-btn"
            onClick={() => onEdit(todo)}
            aria-label="Edit todo"
            title="Edit"
            id={`todo-edit-${todo.id}`}
          >
            ✏️
          </button>
          <button
            className="delete-btn"
            onClick={() => onDelete(todo)}
            aria-label="Delete todo"
            title="Delete"
            id={`todo-delete-${todo.id}`}
          >
            🗑️
          </button>
        </div>
      </div>

      {/* Description */}
      <p className="todo-card-desc">{todo.description}</p>

      <div className="todo-card-meta">
        <span className={`todo-badge ${badgePriorityClass}`}>
          {todo.priority}
        </span>
        <span className={`todo-badge ${badgeStatusClass}`}>
          {todo.status}
        </span>
      </div>

      {/* Footer with dates */}
      <div className="todo-card-footer">
        <span>Due {formatDate(todo.dueDate)}</span>
        <span>Created {formatDate(todo.createdDate)}</span>
      </div>
    </div>
  );
};

export default TodoCard;
