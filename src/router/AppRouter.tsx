import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import { useAuth } from '@/common/hooks/useAuth';
import StudentLoginPage from '@/features/auth/StudentLoginPage';
import TeacherLoginPage from '@/features/auth/TeacherLoginPage';
import AuthGuard from '@/router/AuthGuard';
import FullScreenLoader from '@/router/components/FullScreenLoader';

const ProtectedRoutes: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <FullScreenLoader message="Checking your session..." />;
  }

  if (!user) {
    return <Navigate to="/login/student" replace />;
  }

  return <AuthGuard />;
};

const AppRouter: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login/student" element={<StudentLoginPage />} />
        <Route path="/login/teacher" element={<TeacherLoginPage />} />
        <Route path="/*" element={<ProtectedRoutes />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRouter;
