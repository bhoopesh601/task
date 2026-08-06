import { BrowserRouter, useRoutes } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
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
 * Providers: ThemeProvider → AuthProvider → TodoProvider → BrowserRouter
 */
const App = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <TodoProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </TodoProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
