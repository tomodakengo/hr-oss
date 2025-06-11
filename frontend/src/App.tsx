import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
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
import { OrganizationChart } from './components/organization/OrganizationChart';
import { AttendanceManagement } from './components/attendance/AttendanceManagement';
import { PayrollManagement } from './components/payroll/PayrollManagement';
import { DashboardOverview } from './components/dashboard/DashboardOverview';

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
                <Link to="/dashboard" className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium">
                  ダッシュボード
                </Link>
                <Link to="/employees" className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium">
                  従業員管理
                </Link>
                <Link to="/departments" className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium">
                  部署管理
                </Link>
                <Link to="/positions" className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium">
                  役職管理
                </Link>
                <Link to="/organization" className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium">
                  組織図
                </Link>
                <Link to="/attendance" className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium">
                  勤怠管理
                </Link>
                <Link to="/payroll" className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium">
                  給与管理
                </Link>
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

// Dashboard component
const Dashboard: React.FC = () => {
  const { user } = useAuth();
  
  return (
    <Layout>
      <div className="space-y-6">
        {/* Welcome Header */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center">
                <span className="text-lg font-medium text-indigo-700">
                  {user?.lastName?.charAt(0)}{user?.firstName?.charAt(0)}
                </span>
              </div>
            </div>
            <div className="ml-4">
              <h1 className="text-2xl font-bold text-gray-900">
                おかえりなさい、{user?.lastName} {user?.firstName}さん
              </h1>
              <p className="text-sm text-gray-500">
                {user?.company.name} のHR管理システムへようこそ
              </p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">クイックアクション</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Link
              to="/employees/new"
              className="relative group bg-gray-50 p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-indigo-500 rounded-lg hover:bg-gray-100"
            >
              <div>
                <span className="rounded-lg inline-flex p-3 bg-indigo-50 text-indigo-700 ring-4 ring-white">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </span>
              </div>
              <div className="mt-8">
                <h3 className="text-lg font-medium">
                  新規従業員登録
                </h3>
                <p className="mt-2 text-sm text-gray-500">
                  新しい従業員を システムに追加
                </p>
              </div>
            </Link>

            <Link
              to="/departments/new"
              className="relative group bg-gray-50 p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-indigo-500 rounded-lg hover:bg-gray-100"
            >
              <div>
                <span className="rounded-lg inline-flex p-3 bg-blue-50 text-blue-700 ring-4 ring-white">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </span>
              </div>
              <div className="mt-8">
                <h3 className="text-lg font-medium">
                  部署作成
                </h3>
                <p className="mt-2 text-sm text-gray-500">
                  新しい部署を 組織に追加
                </p>
              </div>
            </Link>

            <Link
              to="/positions/new"
              className="relative group bg-gray-50 p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-indigo-500 rounded-lg hover:bg-gray-100"
            >
              <div>
                <span className="rounded-lg inline-flex p-3 bg-green-50 text-green-700 ring-4 ring-white">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </span>
              </div>
              <div className="mt-8">
                <h3 className="text-lg font-medium">
                  役職作成
                </h3>
                <p className="mt-2 text-sm text-gray-500">
                  新しい役職を システムに追加
                </p>
              </div>
            </Link>

            <Link
              to="/organization"
              className="relative group bg-gray-50 p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-indigo-500 rounded-lg hover:bg-gray-100"
            >
              <div>
                <span className="rounded-lg inline-flex p-3 bg-purple-50 text-purple-700 ring-4 ring-white">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                </span>
              </div>
              <div className="mt-8">
                <h3 className="text-lg font-medium">
                  組織図表示
                </h3>
                <p className="mt-2 text-sm text-gray-500">
                  組織構造を 視覚的に確認
                </p>
              </div>
            </Link>
          </div>
        </div>

        {/* Navigation Cards */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">人事管理</h2>
            <div className="space-y-3">
              <Link to="/employees" className="flex items-center p-3 text-sm text-gray-600 rounded-lg hover:bg-gray-50">
                <svg className="flex-shrink-0 h-5 w-5 text-gray-400 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                従業員管理 - 社員情報の管理・検索・編集
              </Link>
              <Link to="/departments" className="flex items-center p-3 text-sm text-gray-600 rounded-lg hover:bg-gray-50">
                <svg className="flex-shrink-0 h-5 w-5 text-gray-400 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                部署管理 - 組織階層の設定・管理
              </Link>
              <Link to="/positions" className="flex items-center p-3 text-sm text-gray-600 rounded-lg hover:bg-gray-50">
                <svg className="flex-shrink-0 h-5 w-5 text-gray-400 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                役職管理 - 職位・給与体系の設定
              </Link>
              <Link to="/organization" className="flex items-center p-3 text-sm text-gray-600 rounded-lg hover:bg-gray-50">
                <svg className="flex-shrink-0 h-5 w-5 text-gray-400 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
                組織図 - 組織構造の可視化
              </Link>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">人事システム機能</h2>
            <div className="space-y-3">
              <Link to="/attendance" className="flex items-center p-3 text-sm text-gray-600 rounded-lg hover:bg-gray-50">
                <svg className="flex-shrink-0 h-5 w-5 text-gray-400 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                勤怠管理 - 出退勤・残業時間の管理
              </Link>
              <Link to="/payroll" className="flex items-center p-3 text-sm text-gray-600 rounded-lg hover:bg-gray-50">
                <svg className="flex-shrink-0 h-5 w-5 text-gray-400 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                給与管理 - 給与計算・明細作成
              </Link>
              <div className="flex items-center p-3 text-sm text-gray-400 rounded-lg bg-gray-50">
                <svg className="flex-shrink-0 h-5 w-5 text-gray-300 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                レポート - 分析・統計データの表示
              </div>
              <div className="flex items-center p-3 text-sm text-gray-400 rounded-lg bg-gray-50">
                <svg className="flex-shrink-0 h-5 w-5 text-gray-300 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                設定 - システム設定・権限管理
              </div>
            </div>
          </div>
        </div>

        {/* System Status */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">システム状況</h2>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            <div className="bg-green-50 overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">従業員管理</dt>
                      <dd className="text-sm text-green-900">実装完了</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-green-50 overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">組織管理</dt>
                      <dd className="text-sm text-green-900">実装完了</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-green-50 overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">勤怠管理</dt>
                      <dd className="text-sm text-green-900">実装完了</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
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
                  <Layout>
                    <DashboardOverview />
                  </Layout>
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
            {/* Organization Chart Route */}
            <Route
              path="/organization"
              element={
                <ProtectedRoute>
                  <Layout>
                    <OrganizationChart />
                  </Layout>
                </ProtectedRoute>
              }
            />
            {/* Attendance Routes */}
            <Route
              path="/attendance"
              element={
                <ProtectedRoute>
                  <Layout>
                    <AttendanceManagement />
                  </Layout>
                </ProtectedRoute>
              }
            />
            {/* Payroll Routes */}
            <Route
              path="/payroll"
              element={
                <ProtectedRoute>
                  <Layout>
                    <PayrollManagement />
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
