import * as React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand"></div>
      </div>
    );
  }

  if (!user) {
    // ログインしていない場合はログイン画面へリダイレクト
    // 現在の場所を保持しておき、ログイン後に戻ってこれるようにする
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
