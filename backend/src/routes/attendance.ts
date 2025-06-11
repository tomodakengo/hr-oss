import { Router } from 'express';
import { AttendanceController } from '../controllers/attendanceController';
import { LeaveController } from '../controllers/leaveController';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();
const attendanceController = new AttendanceController();
const leaveController = new LeaveController();

// 認証が必要な全てのルートに適用
router.use(authenticateToken);

// 出退勤打刻
router.post('/:employeeId/clock-in', attendanceController.clockIn.bind(attendanceController));
router.post('/:employeeId/clock-out', attendanceController.clockOut.bind(attendanceController));
router.post('/:employeeId/break-start', attendanceController.startBreak.bind(attendanceController));
router.post('/:employeeId/break-end', attendanceController.endBreak.bind(attendanceController));

// 勤怠記録取得
router.get('/', attendanceController.getAttendances.bind(attendanceController));
router.get('/:employeeId', attendanceController.getEmployeeAttendances.bind(attendanceController));
router.get('/:employeeId/today', attendanceController.getTodayStatus.bind(attendanceController));

// 勤怠記録更新（管理者権限）
router.put('/:id', requireRole('ADMIN', 'HR_STAFF', 'MANAGER'), attendanceController.updateAttendance.bind(attendanceController));

// 月次サマリー
router.get('/summary/monthly', attendanceController.getMonthlySummary.bind(attendanceController));

// 有給休暇申請
router.post('/leave-requests', leaveController.createLeaveRequest.bind(leaveController));
router.get('/leave-requests', leaveController.getLeaveRequests.bind(leaveController));
router.put('/leave-requests/:id/review', requireRole('ADMIN', 'HR_STAFF', 'MANAGER'), leaveController.reviewLeaveRequest.bind(leaveController));

// 有給残高管理
router.get('/leave-balance/:employeeId', leaveController.getEmployeeLeaveBalance.bind(leaveController));
router.post('/leave-balance/initialize', requireRole('ADMIN', 'HR_STAFF'), leaveController.initializeLeaveBalance.bind(leaveController));

// 有給統計
router.get('/leave-statistics', requireRole('ADMIN', 'HR_STAFF', 'MANAGER'), leaveController.getLeaveStatistics.bind(leaveController));

export { router as attendanceRoutes };