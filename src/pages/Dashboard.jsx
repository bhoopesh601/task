import { useState } from 'react';
import { useTodos } from '../context/TodoContext';
import Navbar from '../components/Navbar';
import Stats from '../components/Stats';
import SearchBar from '../components/SearchBar';
import TodoCard from '../components/TodoCard';
import TodoForm from '../components/TodoForm';
import Modal, { ConfirmModal } from '../components/Modal';
import '../styles/dashboard.css';

/**
 * Dashboard Page - Main todo management view.
 * Displays stats, search/filter/sort controls, and todo cards grid.
 * Handles add, edit, delete, and status toggle operations.
 */
const Dashboard = () => {
  const {
    processedTodos,
    addTodo,
    updateTodo,
    deleteTodo,
    toggleStatus,
    toast,
  } = useTodos();

  // Modal states
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingTodo, setEditingTodo] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [todoToDelete, setTodoToDelete] = useState(null);

  // Open add form
  const handleAddClick = () => {
    setEditingTodo(null);
    setShowFormModal(true);
  };

  // Open edit form
  const handleEditClick = (todo) => {
    setEditingTodo(todo);
    setShowFormModal(true);
  };

  // Handle form submission (add or update)
  const handleFormSubmit = (formData) => {
    if (editingTodo) {
      updateTodo(editingTodo.id, formData);
    } else {
      addTodo(formData);
    }
    setShowFormModal(false);
    setEditingTodo(null);
  };

  // Open delete confirmation
  const handleDeleteClick = (todo) => {
    setTodoToDelete(todo);
    setShowConfirmModal(true);
  };

  // Confirm deletion
  const handleConfirmDelete = () => {
    if (todoToDelete) {
      deleteTodo(todoToDelete.id);
    }
    setShowConfirmModal(false);
    setTodoToDelete(null);
  };

  return (
    <div className="app-container page-enter" id="dashboard-page">
      {/* Navbar */}
      <Navbar />

      {/* Main content */}
      <main className="dashboard container">
        {/* Page header */}
        <div className="dashboard-header">
          <h1>📋 My Todos</h1>
          <p>Manage your tasks efficiently and stay productive</p>
        </div>

        {/* Statistics */}
        <Stats />

        {/* Controls: Search, Filters, Sort, Add */}
        <SearchBar onAddClick={handleAddClick} />

        {/* Todo Cards Grid */}
        <div className="todo-grid" id="todo-grid">
          {processedTodos.length > 0 ? (
            processedTodos.map((todo) => (
              <TodoCard
                key={todo.id}
                todo={todo}
                onEdit={handleEditClick}
                onDelete={handleDeleteClick}
                onToggleStatus={toggleStatus}
              />
            ))
          ) : (
            /* Empty State */
            <div className="empty-state" id="empty-state">
              <div className="empty-state-icon">📝</div>
              <h3>No todos found</h3>
              <p>
                {processedTodos.length === 0
                  ? 'Create your first todo to get started, or adjust your filters.'
                  : 'Try adjusting your search or filter criteria.'}
              </p>
              <button
                className="btn btn-primary"
                onClick={handleAddClick}
                style={{ marginTop: '16px' }}
              >
                ➕ Add Your First Todo
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Add/Edit Todo Modal */}
      <Modal
        isOpen={showFormModal}
        onClose={() => {
          setShowFormModal(false);
          setEditingTodo(null);
        }}
        title={editingTodo ? '✏️ Edit Todo' : '➕ New Todo'}
      >
        <TodoForm
          editingTodo={editingTodo}
          onSubmit={handleFormSubmit}
          onCancel={() => {
            setShowFormModal(false);
            setEditingTodo(null);
          }}
        />
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={() => {
          setShowConfirmModal(false);
          setTodoToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Delete Todo?"
        message={`Are you sure you want to delete "${todoToDelete?.title}"? This action cannot be undone.`}
      />

      {/* Toast Notifications */}
      {toast && (
        <div className="toast-container">
          <div className={`toast toast-${toast.type}`} key={toast.id} id="toast-notification">
            {toast.message}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
