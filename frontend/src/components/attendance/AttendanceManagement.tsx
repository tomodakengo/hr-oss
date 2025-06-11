import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { TimeClockWidget } from './TimeClockWidget';
import { AttendanceCalendar } from './AttendanceCalendar';
import { attendanceService } from '../../services/attendanceService';
import { useAuth } from '../../contexts/AuthContext';
import { Attendance } from '../../types/employee';

export const AttendanceManagement: React.FC = () => {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedAttendance, setSelectedAttendance] = useState<Attendance | null>(null);
  const [recentAttendances, setRecentAttendances] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRecentAttendances();
  }, []);

  const fetchRecentAttendances = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // 過去7日間の勤怠記録を取得
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);
      
      const data = await attendanceService.getAttendances({
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        limit: 10
      });
      
      setRecentAttendances(data.attendances);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch recent attendances');
    } finally {
      setLoading(false);
    }
  };

  const handleDateSelect = (date: Date, attendance?: Attendance) => {
    setSelectedDate(date);
    setSelectedAttendance(attendance || null);
  };

  const handleAttendanceUpdate = (attendance: Attendance) => {
    fetchRecentAttendances();
  };

  const isManager = ['ADMIN', 'HR_STAFF', 'MANAGER'].includes(user?.role || '');

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">勤怠管理</h1>
          <p className="mt-1 text-sm text-gray-500">
            出退勤の打刻と勤怠記録の管理を行います
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none space-x-3">
          {isManager && (
            <>
              <Link
                to="/attendance/reports"
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                勤怠レポート
              </Link>
              <Link
                to="/attendance/leave-requests"
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a1 1 0 011-1h6a1 1 0 011 1v4h3a1 1 0 110 2h-1v9a2 2 0 01-2 2H7a2 2 0 01-2-2V9H4a1 1 0 110-2h4z" />
                </svg>
                有給申請管理
              </Link>
            </>
          )}
          <Link
            to="/attendance/leave-request"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
          >
            <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            有給申請
          </Link>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {/* メインコンテンツ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 打刻ウィジェット */}
        <div className="lg:col-span-1">
          <TimeClockWidget
            employeeId={user?.id || ''}
            onUpdate={handleAttendanceUpdate}
          />
        </div>

        {/* カレンダー */}
        <div className="lg:col-span-2">
          <AttendanceCalendar
            employeeId={user?.id || ''}
            onDateSelect={handleDateSelect}
          />
        </div>
      </div>

      {/* 詳細情報モーダル */}
      {selectedDate && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {attendanceService.formatDate(selectedDate)}
                </h3>
                <button
                  onClick={() => setSelectedDate(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {selectedAttendance ? (
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">ステータス:</span>
                    <span className={`px-2 py-1 rounded text-sm font-medium ${
                      selectedAttendance.status === 'PRESENT' ? 'bg-green-100 text-green-800' :
                      selectedAttendance.status === 'ABSENT' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {attendanceService.getStatusLabel(selectedAttendance.status)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">出勤時刻:</span>
                    <span>{attendanceService.formatTime(selectedAttendance.clockIn)}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">退勤時刻:</span>
                    <span>{attendanceService.formatTime(selectedAttendance.clockOut)}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">労働時間:</span>
                    <span className="font-medium">
                      {attendanceService.formatHours(selectedAttendance.workHours)}
                    </span>
                  </div>
                  
                  {selectedAttendance.overtimeHours && selectedAttendance.overtimeHours > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">残業時間:</span>
                      <span className="text-orange-600 font-medium">
                        {attendanceService.formatHours(selectedAttendance.overtimeHours)}
                      </span>
                    </div>
                  )}
                  
                  {selectedAttendance.remarks && (
                    <div>
                      <span className="text-gray-600 block mb-1">備考:</span>
                      <p className="text-sm bg-gray-50 p-2 rounded">{selectedAttendance.remarks}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  この日の勤怠記録はありません
                </div>
              )}

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setSelectedDate(null)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  閉じる
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 最近の勤怠記録 */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 className="text-lg leading-6 font-medium text-gray-900">最近の勤怠記録</h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">過去7日間の勤怠状況</p>
        </div>
        
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          <div className="overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    日付
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ステータス
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    出勤時刻
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    退勤時刻
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    労働時間
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    残業時間
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentAttendances.map((attendance) => (
                  <tr key={attendance.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {attendanceService.formatDate(attendance.date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        attendance.status === 'PRESENT' ? 'bg-green-100 text-green-800' :
                        attendance.status === 'ABSENT' ? 'bg-red-100 text-red-800' :
                        attendance.status === 'LATE' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {attendanceService.getStatusLabel(attendance.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {attendanceService.formatTime(attendance.clockIn)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {attendanceService.formatTime(attendance.clockOut)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                      {attendanceService.formatHours(attendance.workHours)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-orange-600 font-medium">
                      {attendanceService.formatHours(attendance.overtimeHours)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {recentAttendances.length === 0 && (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">勤怠記録がありません</h3>
                <p className="mt-1 text-sm text-gray-500">
                  勤怠記録が作成されると、ここに表示されます。
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};