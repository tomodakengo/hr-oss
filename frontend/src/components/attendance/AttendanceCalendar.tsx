import React, { useState, useEffect } from 'react';
import { attendanceService } from '../../services/attendanceService';
import { Attendance, AttendanceStatus } from '../../types/employee';

interface AttendanceCalendarProps {
  employeeId: string;
  year?: number;
  month?: number;
  onDateSelect?: (date: Date, attendance?: Attendance) => void;
}

export const AttendanceCalendar: React.FC<AttendanceCalendarProps> = ({
  employeeId,
  year = new Date().getFullYear(),
  month = new Date().getMonth() + 1,
  onDateSelect
}) => {
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date(year, month - 1, 1));

  useEffect(() => {
    fetchAttendances();
  }, [employeeId, year, month]);

  const fetchAttendances = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await attendanceService.getEmployeeAttendances(employeeId, { year, month });
      setAttendances(data.attendances);
      setStats(data.stats);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch attendance data');
    } finally {
      setLoading(false);
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const getAttendanceForDate = (date: Date): Attendance | undefined => {
    const dateStr = date.toISOString().split('T')[0];
    return attendances.find(att => att.date.startsWith(dateStr));
  };

  const getStatusColor = (status?: AttendanceStatus): string => {
    if (!status) return 'bg-gray-100 text-gray-400';
    
    const colors = {
      [AttendanceStatus.PRESENT]: 'bg-green-100 text-green-800',
      [AttendanceStatus.ABSENT]: 'bg-red-100 text-red-800',
      [AttendanceStatus.LATE]: 'bg-yellow-100 text-yellow-800',
      [AttendanceStatus.EARLY_LEAVE]: 'bg-orange-100 text-orange-800',
      [AttendanceStatus.VACATION]: 'bg-blue-100 text-blue-800',
      [AttendanceStatus.SICK_LEAVE]: 'bg-purple-100 text-purple-800',
      [AttendanceStatus.BUSINESS_TRIP]: 'bg-indigo-100 text-indigo-800',
    };
    
    return colors[status] || 'bg-gray-100 text-gray-600';
  };

  const getDaysInMonth = (date: Date): Date[] => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    
    const days: Date[] = [];
    
    // 前月の日付（週の開始を月曜日に合わせる）
    const startDay = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
    for (let i = startDay - 1; i >= 0; i--) {
      days.push(new Date(year, month, -i));
    }
    
    // 当月の日付
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    
    // 次月の日付（42日間のグリッドにする）
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      days.push(new Date(year, month + 1, i));
    }
    
    return days;
  };

  const isToday = (date: Date): boolean => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isCurrentMonth = (date: Date): boolean => {
    return date.getMonth() === currentDate.getMonth();
  };

  const formatMonthYear = (date: Date): string => {
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long'
    });
  };

  const days = getDaysInMonth(currentDate);
  const weekdays = ['月', '火', '水', '木', '金', '土', '日'];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
        エラーが発生しました: {error}
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigateMonth('prev')}
          className="p-2 hover:bg-gray-100 rounded-md"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        <h2 className="text-xl font-semibold text-gray-900">
          {formatMonthYear(currentDate)}
        </h2>
        
        <button
          onClick={() => navigateMonth('next')}
          className="p-2 hover:bg-gray-100 rounded-md"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* 統計表示 */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-green-50 p-3 rounded-lg">
            <div className="text-sm text-green-600">出勤日数</div>
            <div className="text-2xl font-bold text-green-900">{stats.totalWorkDays}日</div>
          </div>
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="text-sm text-blue-600">労働時間</div>
            <div className="text-2xl font-bold text-blue-900">
              {attendanceService.formatHours(stats.totalWorkHours)}
            </div>
          </div>
          <div className="bg-orange-50 p-3 rounded-lg">
            <div className="text-sm text-orange-600">残業時間</div>
            <div className="text-2xl font-bold text-orange-900">
              {attendanceService.formatHours(stats.totalOvertimeHours)}
            </div>
          </div>
          <div className="bg-red-50 p-3 rounded-lg">
            <div className="text-sm text-red-600">欠勤日数</div>
            <div className="text-2xl font-bold text-red-900">{stats.absentDays}日</div>
          </div>
        </div>
      )}

      {/* カレンダーグリッド */}
      <div className="grid grid-cols-7 gap-1">
        {/* 曜日ヘッダー */}
        {weekdays.map(day => (
          <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
            {day}
          </div>
        ))}

        {/* 日付セル */}
        {days.map((date, index) => {
          const attendance = getAttendanceForDate(date);
          const isCurrentMonthDate = isCurrentMonth(date);
          const isTodayDate = isToday(date);
          
          return (
            <button
              key={index}
              onClick={() => onDateSelect?.(date, attendance)}
              className={`
                p-2 min-h-[80px] border border-gray-200 hover:bg-gray-50 transition-colors
                ${!isCurrentMonthDate ? 'text-gray-300 bg-gray-50' : ''}
                ${isTodayDate ? 'ring-2 ring-indigo-500' : ''}
              `}
            >
              <div className="flex flex-col items-center space-y-1">
                <span className={`text-sm ${isTodayDate ? 'font-bold text-indigo-600' : ''}`}>
                  {date.getDate()}
                </span>
                
                {attendance && isCurrentMonthDate && (
                  <>
                    <div className={`
                      px-1 py-0.5 rounded text-xs font-medium
                      ${getStatusColor(attendance.status)}
                    `}>
                      {attendanceService.getStatusLabel(attendance.status)}
                    </div>
                    
                    {attendance.clockIn && (
                      <div className="text-xs text-gray-600">
                        {attendanceService.formatTime(attendance.clockIn)}
                      </div>
                    )}
                    
                    {attendance.workHours && attendance.workHours > 0 && (
                      <div className="text-xs text-blue-600 font-medium">
                        {attendanceService.formatHours(attendance.workHours)}
                      </div>
                    )}
                  </>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* 凡例 */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <h3 className="text-sm font-medium text-gray-700 mb-3">ステータス</h3>
        <div className="flex flex-wrap gap-3 text-xs">
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-green-100 border border-green-200 rounded"></div>
            <span>出勤</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-red-100 border border-red-200 rounded"></div>
            <span>欠勤</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-yellow-100 border border-yellow-200 rounded"></div>
            <span>遅刻</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-orange-100 border border-orange-200 rounded"></div>
            <span>早退</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-blue-100 border border-blue-200 rounded"></div>
            <span>有給</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-purple-100 border border-purple-200 rounded"></div>
            <span>病欠</span>
          </div>
        </div>
      </div>
    </div>
  );
};