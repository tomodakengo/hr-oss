import React, { useState, useEffect } from 'react';
import { attendanceService } from '../../services/attendanceService';
import { Attendance } from '../../types/employee';

interface TimeClockWidgetProps {
  employeeId: string;
  onUpdate?: (attendance: Attendance) => void;
}

export const TimeClockWidget: React.FC<TimeClockWidgetProps> = ({ employeeId, onUpdate }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [attendance, setAttendance] = useState<Attendance | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [location, setLocation] = useState<string>('');

  useEffect(() => {
    // 現在時刻を1秒ごとに更新
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    // 今日の勤怠状況を取得
    fetchTodayStatus();

    // 位置情報を取得
    getCurrentLocation();

    return () => clearInterval(timer);
  }, [employeeId]);

  const fetchTodayStatus = async () => {
    try {
      const todayAttendance = await attendanceService.getTodayStatus(employeeId);
      setAttendance(todayAttendance);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch attendance status');
    }
  };

  const getCurrentLocation = async () => {
    try {
      const loc = await attendanceService.getCurrentLocation();
      setLocation(loc);
    } catch (err) {
      setLocation('位置情報取得不可');
    }
  };

  const handleClockIn = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await attendanceService.clockIn(employeeId, location);
      setAttendance(result);
      onUpdate?.(result);
    } catch (err: any) {
      setError(err.message || 'Failed to clock in');
    } finally {
      setLoading(false);
    }
  };

  const handleClockOut = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await attendanceService.clockOut(employeeId, location);
      setAttendance(result);
      onUpdate?.(result);
    } catch (err: any) {
      setError(err.message || 'Failed to clock out');
    } finally {
      setLoading(false);
    }
  };

  const handleStartBreak = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await attendanceService.startBreak(employeeId);
      setAttendance(result);
      onUpdate?.(result);
    } catch (err: any) {
      setError(err.message || 'Failed to start break');
    } finally {
      setLoading(false);
    }
  };

  const handleEndBreak = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await attendanceService.endBreak(employeeId);
      setAttendance(result);
      onUpdate?.(result);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (time: Date) => {
    return time.toLocaleTimeString('ja-JP', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatDate = (time: Date) => {
    return time.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    });
  };

  const getWorkingTime = () => {
    if (!attendance?.clockIn) return '00:00:00';
    
    const clockIn = new Date(attendance.clockIn);
    const now = attendance.clockOut ? new Date(attendance.clockOut) : currentTime;
    const diff = now.getTime() - clockIn.getTime();
    
    // 休憩時間を考慮
    let breakTime = 0;
    if (attendance.breakStart && attendance.breakEnd) {
      const breakStart = new Date(attendance.breakStart);
      const breakEnd = new Date(attendance.breakEnd);
      breakTime = breakEnd.getTime() - breakStart.getTime();
    } else if (attendance.breakStart && !attendance.breakEnd) {
      const breakStart = new Date(attendance.breakStart);
      breakTime = currentTime.getTime() - breakStart.getTime();
    }
    
    const workingTime = Math.max(0, diff - breakTime);
    const hours = Math.floor(workingTime / (1000 * 60 * 60));
    const minutes = Math.floor((workingTime % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((workingTime % (1000 * 60)) / 1000);
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const isOnBreak = !!(attendance?.breakStart && !attendance?.breakEnd);
  const hasClockIn = !!attendance?.clockIn;
  const hasClockOut = !!attendance?.clockOut;

  return (
    <div className="bg-white shadow-lg rounded-lg p-6 max-w-md mx-auto">
      {/* 現在時刻表示 */}
      <div className="text-center mb-6">
        <div className="text-3xl font-bold text-gray-900 mb-2">
          {formatTime(currentTime)}
        </div>
        <div className="text-sm text-gray-600">
          {formatDate(currentTime)}
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* 勤務状況表示 */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-sm font-medium text-gray-700 mb-3">今日の勤務状況</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>出勤時刻:</span>
            <span className={hasClockIn ? 'text-green-600' : 'text-gray-400'}>
              {attendance?.clockIn ? attendanceService.formatTime(attendance.clockIn) : '未打刻'}
            </span>
          </div>
          <div className="flex justify-between">
            <span>退勤時刻:</span>
            <span className={hasClockOut ? 'text-blue-600' : 'text-gray-400'}>
              {attendance?.clockOut ? attendanceService.formatTime(attendance.clockOut) : '未打刻'}
            </span>
          </div>
          <div className="flex justify-between">
            <span>休憩状況:</span>
            <span className={isOnBreak ? 'text-orange-600' : 'text-gray-400'}>
              {isOnBreak ? '休憩中' : '勤務中'}
            </span>
          </div>
          <div className="flex justify-between font-medium">
            <span>勤務時間:</span>
            <span className="text-indigo-600">{getWorkingTime()}</span>
          </div>
        </div>
      </div>

      {/* 打刻ボタン */}
      <div className="space-y-3">
        {!hasClockIn && (
          <button
            onClick={handleClockIn}
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-medium py-3 px-4 rounded-lg transition-colors"
          >
            {loading ? '処理中...' : '出勤'}
          </button>
        )}

        {hasClockIn && !hasClockOut && (
          <>
            {!isOnBreak ? (
              <button
                onClick={handleStartBreak}
                disabled={loading}
                className="w-full bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white font-medium py-3 px-4 rounded-lg transition-colors"
              >
                {loading ? '処理中...' : '休憩開始'}
              </button>
            ) : (
              <button
                onClick={handleEndBreak}
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium py-3 px-4 rounded-lg transition-colors"
              >
                {loading ? '処理中...' : '休憩終了'}
              </button>
            )}

            <button
              onClick={handleClockOut}
              disabled={loading || isOnBreak}
              className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-medium py-3 px-4 rounded-lg transition-colors"
            >
              {loading ? '処理中...' : '退勤'}
            </button>
          </>
        )}

        {hasClockOut && (
          <div className="w-full bg-gray-100 text-gray-600 font-medium py-3 px-4 rounded-lg text-center">
            本日の勤務終了
          </div>
        )}
      </div>

      {/* 位置情報表示 */}
      {location && (
        <div className="mt-4 text-xs text-gray-500 text-center">
          打刻位置: {location}
        </div>
      )}
    </div>
  );
};