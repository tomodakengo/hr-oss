import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { dashboardService, DashboardData } from '../../services/dashboardService';
import { useAuth } from '../../contexts/AuthContext';

export const DashboardOverview: React.FC = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
    
    // 5分ごとにデータを更新
    const interval = setInterval(fetchDashboardData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      setError(null);
      const data = await dashboardService.getDashboardData();
      setDashboardData(data);
    } catch (err: any) {
      setError(err.message || 'ダッシュボードデータの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-200"></div>
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-600 border-t-transparent absolute top-0 left-0"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200/50 text-red-700 px-6 py-4 rounded-xl shadow-lg">
        <div className="flex items-center">
          <svg className="w-6 h-6 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="font-medium">{error}</span>
        </div>
      </div>
    );
  }

  if (!dashboardData) return null;

  const { overview, attendance, payroll, departments, activities, alerts } = dashboardData;

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="bg-white/80 backdrop-blur-lg shadow-xl rounded-2xl p-8 border border-white/20">
        <div className="sm:flex sm:items-center sm:justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
              {overview.currentPeriod.year}年{overview.currentPeriod.month}月 ダッシュボード
            </h1>
            <p className="mt-2 text-gray-600">
              HR管理システムの総合状況
            </p>
          </div>
          <div className="mt-4 sm:mt-0">
            <div className="bg-gradient-to-r from-indigo-50 to-blue-50 px-4 py-2 rounded-xl border border-indigo-200/50">
              <span className="text-sm text-gray-600">最終更新:</span>
              <span className="text-sm font-medium text-indigo-700 ml-1">{new Date().toLocaleTimeString('ja-JP')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* アラート */}
      {alerts.length > 0 && (
        <div className="space-y-3">
          {alerts.map((alert, index) => (
            <div
              key={index}
              className={`p-4 rounded-md border ${dashboardService.getAlertColor(alert.severity)}`}
            >
              <div className="flex items-center">
                <span className="text-lg mr-2">{dashboardService.getAlertIcon(alert.type)}</span>
                <div className="flex-1">
                  <h3 className="font-medium">{alert.title}</h3>
                  <p className="text-sm mt-1">{alert.message}</p>
                </div>
                <span className="text-sm font-medium">{alert.count}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* KPI サマリー */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* 総従業員数 */}
        <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-200/50 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
          <div className="flex items-center">
            <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-r from-indigo-500 to-blue-600 rounded-xl flex items-center justify-center">
              <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5 0a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <div className="text-sm font-semibold text-gray-700">総従業員数</div>
              <div className="text-3xl font-bold text-gray-900">{overview.totalEmployees}</div>
            </div>
          </div>
        </div>

        {/* 今日の出勤率 */}
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200/50 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
          <div className="flex items-center">
            <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
              <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <div className="text-sm font-semibold text-gray-700">今日の出勤率</div>
              <div className={`text-3xl font-bold ${dashboardService.getAttendanceRateColor(attendance.today.attendanceRate)}`}>
                {dashboardService.formatPercentage(attendance.today.attendanceRate)}
              </div>
            </div>
          </div>
        </div>

        {/* 月間総労働時間 */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">月間総労働時間</dt>
                  <dd className="text-3xl font-bold text-gray-900">
                    {dashboardService.formatHours(attendance.monthly.totalWorkHours)}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* 平均給与 */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">平均総支給額</dt>
                  <dd className="text-2xl font-bold text-gray-900">
                    {dashboardService.formatCurrency(payroll.averageGrossSalary)}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* メインコンテンツエリア */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 今日の出勤状況 */}
        <div className="lg:col-span-2">
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <h3 className="text-lg leading-6 font-medium text-gray-900">今日の出勤状況</h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{attendance.today.present}</div>
                  <div className="text-sm text-gray-500">出勤</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">{attendance.today.late}</div>
                  <div className="text-sm text-gray-500">遅刻</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{attendance.today.absent}</div>
                  <div className="text-sm text-gray-500">欠勤</div>
                </div>
              </div>

              {/* 最近の出勤記録 */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">最近の出勤</h4>
                <div className="space-y-3">
                  {attendance.today.recentClockIns.map((record, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-green-400 rounded-full mr-3"></div>
                        <span className="font-medium">{record.employeeName}</span>
                        <span className="text-gray-500 ml-2">({record.department})</span>
                      </div>
                      <span className="text-gray-500">
                        {dashboardService.formatTime(record.clockIn)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6">
                <Link
                  to="/attendance"
                  className="text-indigo-600 hover:text-indigo-500 text-sm font-medium"
                >
                  勤怠管理へ →
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* アクティビティフィード */}
        <div>
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <h3 className="text-lg leading-6 font-medium text-gray-900">最近のアクティビティ</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {activities.map((activity, index) => (
                  <div key={index} className="flex">
                    <div className="flex-shrink-0">
                      <div className="w-2 h-2 bg-indigo-400 rounded-full mt-2"></div>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm text-gray-900">{activity.message}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {dashboardService.formatRelativeTime(activity.timestamp)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 部署別統計 */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 className="text-lg leading-6 font-medium text-gray-900">部署別出勤状況</h3>
        </div>
        <div className="overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  部署名
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  総従業員数
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  本日出勤
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  出勤率
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  状況
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {dashboardService.sortDepartmentsByAttendanceRate(departments).map((dept) => (
                <tr key={dept.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {dept.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {dept.totalEmployees}名
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {dept.presentToday}名
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <span className={dashboardService.getAttendanceRateColor(dept.attendanceRate)}>
                      {dashboardService.formatPercentage(dept.attendanceRate)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            dept.attendanceRate >= 95 ? 'bg-green-500' :
                            dept.attendanceRate >= 90 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${Math.min(dept.attendanceRate, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* クイックアクション */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">クイックアクション</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            to="/attendance"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <svg className="h-6 w-6 text-indigo-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm font-medium">勤怠管理</span>
          </Link>
          
          <Link
            to="/payroll"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <svg className="h-6 w-6 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm font-medium">給与管理</span>
          </Link>
          
          <Link
            to="/employees"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <svg className="h-6 w-6 text-blue-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5 0a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <span className="text-sm font-medium">従業員管理</span>
          </Link>
          
          <Link
            to="/organization"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <svg className="h-6 w-6 text-purple-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <span className="text-sm font-medium">組織図</span>
          </Link>
        </div>
      </div>
    </div>
  );
};