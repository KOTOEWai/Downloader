import { Routes, Route } from 'react-router-dom';
import Login from './pages/login';
import Register from './pages/register';
import Home from './pages/Home'
import Profile from './pages/Profile';
import Dashboard from './pages/Dashboard';
import Landing from './pages/Landing';
import ProtectedRoute from './components/protectRoute';
import Navbar from './components/Navbar';
import ErrorBoundary from './components/ErrorBoundary';

function App() {

  return (
    <ErrorBoundary>
      <div className="min-h-screen pt-32 pb-12 px-4 sm:px-6 lg:px-8">
        <Navbar />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/home" element={<ProtectedRoute><Home /> </ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /> </ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /> </ProtectedRoute>} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Routes>
      </div>
    </ErrorBoundary>
  );
}

export default App;
