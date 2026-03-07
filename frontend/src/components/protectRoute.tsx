// components/ProtectedRoute.tsx
import React from 'react';
import { Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  // Check if the isLoggedIn cookie exists and is set to true
  const isAuthenticated = document.cookie.includes('isLoggedIn=true');

  if (!isAuthenticated) return <Navigate to="/login" />;


  return <>{children}</>;
};

export default ProtectedRoute;
