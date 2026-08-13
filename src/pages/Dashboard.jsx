import { useState } from 'react';
import { useTodos } from '../context/TodoContext';
import Navbar from '../components/Navbar';
import Stats from '../components/Stats';
import SearchBar from '../components/SearchBar';
import TodoCard from '../components/TodoCard';
import TodoForm from '../components/TodoForm';
import Modal, { ConfirmModal } from '../components/Modal';
import DashboardOverview from '../components/DashboardOverview';
import SettingsView from '../components/SettingsView';
import '../styles/dashboard.css';

/**
 * Dashboard Page - Central hub supporting:
 * 1. Dashboard Overview (Calendar & Progress Charts)
 * 2. My Todos (Task management list)
 * 3. Settings (Organization & Customization)
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

  const [activeNav, setActiveNav] = useState('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

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
    <div className={`app-layout page-enter ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`} id="dashboard-page">
      <Navbar
        activeNav={activeNav}
        onSelectNav={setActiveNav}
        isCollapsed={isSidebarCollapsed}
        onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      <div className="app-main">
        <main className="dashboard">
          {activeNav === 'dashboard' && (
            <>
              <div className="dashboard-header">
                <h1>Dashboard Overview</h1>
              </div>
              <Stats />
              <DashboardOverview
                onNavigateToTodos={() => setActiveNav('todos')}
                onEditTodo={handleEditClick}
              />
            </>
          )}

          {activeNav === 'todos' && (
            <>
              <div className="dashboard-header">
                <h1>My Todos</h1>
              </div>

              <Stats />

              <SearchBar onAddClick={handleAddClick} />

              <div className="todo-list" id="todo-grid">
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
                  <div className="empty-state" id="empty-state">
                    <div className="empty-state-icon" aria-hidden="true">
                      <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                        <rect x="12" y="20" width="40" height="32" rx="6" fill="#FDF0ED" stroke="#EAEAEA" />
                        <path d="M20 32h24M20 40h16" stroke="#E44332" strokeWidth="2" strokeLinecap="round" opacity="0.4" />
                      </svg>
                    </div>
                    <h3>No todos found</h3>
                    <p>
                      Create your first todo to get started, or adjust your filters.
                    </p>
                    <button className="btn btn-primary" onClick={handleAddClick}>
                      Add task
                    </button>
                  </div>
                )}
              </div>
            </>
          )}

          {activeNav === 'settings' && <SettingsView />}
        </main>
      </div>

      {/* Add/Edit Todo Modal */}
      <Modal
        isOpen={showFormModal}
        onClose={() => {
          setShowFormModal(false);
          setEditingTodo(null);
        }}
        title={editingTodo ? 'Edit task' : 'New task'}
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
