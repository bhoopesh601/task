import { useState, useEffect } from 'react';
import { getTodayDate } from '../utils/helpers';
import PrioritySelect from './PrioritySelect';

/**
 * TodoForm - Form for creating or editing a todo.
 * Validates required fields before submission.
 *
 * @param {Object} editingTodo - If provided, the form is in edit mode
 * @param {Function} onSubmit - Callback with form data
 * @param {Function} onCancel - Callback to close the form
 */
const TodoForm = ({ editingTodo, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'Medium',
    dueDate: '',
  });

  const [errors, setErrors] = useState({});

  // Populate form when editing
  useEffect(() => {
    if (editingTodo) {
      setFormData({
        title: editingTodo.title || '',
        description: editingTodo.description || '',
        priority: editingTodo.priority || 'Medium',
        dueDate: editingTodo.dueDate || '',
      });
    }
  }, [editingTodo]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error on change
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  // Validate all required fields
  const validate = () => {
    const newErrors = {};
    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.dueDate) newErrors.dueDate = 'Due date is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(formData);
    }
  };

  return (
    <form className="todo-form" onSubmit={handleSubmit} id="todo-form">
      {/* Title */}
      <div className="input-group">
        <label htmlFor="todo-title">Title *</label>
        <input
          type="text"
          id="todo-title"
          name="title"
          className={`input-field ${errors.title ? 'input-error' : ''}`}
          placeholder="Enter todo title..."
          value={formData.title}
          onChange={handleChange}
        />
        {errors.title && <span className="error-text">⚠ {errors.title}</span>}
      </div>

      {/* Description */}
      <div className="input-group">
        <label htmlFor="todo-description">Description *</label>
        <textarea
          id="todo-description"
          name="description"
          className={`input-field ${errors.description ? 'input-error' : ''}`}
          placeholder="Enter description..."
          value={formData.description}
          onChange={handleChange}
          rows={3}
        />
        {errors.description && <span className="error-text">⚠ {errors.description}</span>}
      </div>

      {/* Priority & Due Date row */}
      <div className="form-row">
        <div className="input-group">
          <label htmlFor="todo-priority">Priority</label>
          <PrioritySelect
            id="todo-priority"
            name="priority"
            value={formData.priority}
            onChange={handleChange}
          />
        </div>

        <div className="input-group">
          <label htmlFor="todo-dueDate">Due Date *</label>
          <input
            type="date"
            id="todo-dueDate"
            name="dueDate"
            className={`input-field ${errors.dueDate ? 'input-error' : ''}`}
            value={formData.dueDate}
            onChange={handleChange}
            min={getTodayDate()}
          />
          {errors.dueDate && <span className="error-text">⚠ {errors.dueDate}</span>}
        </div>
      </div>

      {/* Actions */}
      <div className="form-actions">
        <button type="button" className="btn btn-secondary" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" id="todo-submit-btn">
          {editingTodo ? '✏️ Update Todo' : '➕ Add Todo'}
        </button>
      </div>
    </form>
  );
};

export default TodoForm;
