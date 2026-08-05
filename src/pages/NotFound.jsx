import { Link } from 'react-router-dom';
import '../styles/dashboard.css';

/**
 * NotFound (404) Page - Displayed when a route doesn't match.
 * Shows a stylish 404 with a link back to home.
 */
const NotFound = () => {
  return (
    <div className="not-found page-enter" id="not-found-page">
      <div className="not-found-code">404</div>
      <h2>Page Not Found</h2>
      <p>The page you're looking for doesn't exist or has been moved.</p>
      <Link to="/" className="btn btn-primary" id="back-home-btn">
        🏠 Go Back Home
      </Link>
    </div>
  );
};

export default NotFound;
