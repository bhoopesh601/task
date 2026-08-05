import { BrowserRouter, useRoutes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { TodoProvider } from './context/TodoContext';
import { routeConfig } from './routes';
import './styles/global.css';

/**
 * AppRoutes - Renders the route configuration using useRoutes hook.
 */
const AppRoutes = () => {
  const routes = useRoutes(routeConfig);
  return routes;
};

/**
 * App - Root component wrapping the application with providers and router.
 * Providers: AuthProvider → TodoProvider → BrowserRouter
 */
const App = () => {
  return (
    <AuthProvider>
      <TodoProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </TodoProvider>
    </AuthProvider>
  );
};

export default App;
