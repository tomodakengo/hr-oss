import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LoginForm } from './components/auth/LoginForm';
import { RegisterForm } from './components/auth/RegisterForm';
import { EmployeeList } from './components/employees/EmployeeList';
import { EmployeeDetail } from './components/employees/EmployeeDetail';
import { EmployeeForm } from './components/employees/EmployeeForm';
import { DepartmentList } from './components/departments/DepartmentList';
import { DepartmentDetail } from './components/departments/DepartmentDetail';
import { DepartmentForm } from './components/departments/DepartmentForm';
import { PositionList } from './components/positions/PositionList';
import { PositionDetail } from './components/positions/PositionDetail';
import { PositionForm } from './components/positions/PositionForm';

// Protected Route component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

// Layout component with navigation
const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-8">
              <h1 className="text-xl font-semibold text-gray-900">HR-OSS</h1>
              <div className="hidden md:flex space-x-8">
                <a href="/dashboard" className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium">
                  ダッシュボード
                </a>
                <a href="/employees" className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium">
                  従業員管理
                </a>
                <a href="/departments" className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium">
                  部署管理
                </a>
                <a href="/positions" className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium">
                  役職管理
                </a>
                <a href="/attendance" className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium">
                  勤怠管理
                </a>
                <a href="/payroll" className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium">
                  給与管理
                </a>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">
                {user?.lastName} {user?.firstName} さん ({user?.company.name})
              </span>
              <button
                onClick={logout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                ログアウト
              </button>
            </div>
          </div>
        </div>
      </nav>
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
};

// Dashboard component (placeholder)
const Dashboard: React.FC = () => {
  return (
    <Layout>
      <div className="px-4 py-6 sm:px-0">
        <div className="border-4 border-dashed border-gray-200 rounded-lg h-96 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              ダッシュボード
            </h2>
            <p className="text-gray-600">
              従業員管理機能が実装されました！<br />
              左のナビゲーションから「従業員管理」をクリックしてください。
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/login" element={<LoginForm />} />
            <Route path="/register" element={<RegisterForm />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/employees"
              element={
                <ProtectedRoute>
                  <Layout>
                    <EmployeeList />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/employees/new"
              element={
                <ProtectedRoute>
                  <Layout>
                    <EmployeeForm />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/employees/:id"
              element={
                <ProtectedRoute>
                  <Layout>
                    <EmployeeDetail />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/employees/:id/edit"
              element={
                <ProtectedRoute>
                  <Layout>
                    <EmployeeForm isEdit={true} />
                  </Layout>
                </ProtectedRoute>
              }
            />
            {/* Department Routes */}
            <Route
              path="/departments"
              element={
                <ProtectedRoute>
                  <Layout>
                    <DepartmentList />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/departments/new"
              element={
                <ProtectedRoute>
                  <Layout>
                    <DepartmentForm />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/departments/:id"
              element={
                <ProtectedRoute>
                  <Layout>
                    <DepartmentDetail />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/departments/:id/edit"
              element={
                <ProtectedRoute>
                  <Layout>
                    <DepartmentForm isEdit={true} />
                  </Layout>
                </ProtectedRoute>
              }
            />
            {/* Position Routes */}
            <Route
              path="/positions"
              element={
                <ProtectedRoute>
                  <Layout>
                    <PositionList />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/positions/new"
              element={
                <ProtectedRoute>
                  <Layout>
                    <PositionForm />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/positions/:id"
              element={
                <ProtectedRoute>
                  <Layout>
                    <PositionDetail />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/positions/:id/edit"
              element={
                <ProtectedRoute>
                  <Layout>
                    <PositionForm isEdit={true} />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route path="/" element={<Navigate to="/dashboard" />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
