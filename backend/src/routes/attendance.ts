import { Router } from 'express';
import { AttendanceController } from '../controllers/attendanceController';
import { LeaveController } from '../controllers/leaveController';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();
const attendanceController = new AttendanceController();
const leaveController = new LeaveController();

/**
 * @swagger
 * components:
 *   schemas:
 *     Attendance:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         employeeId:
 *           type: string
 *         date:
 *           type: string
 *           format: date
 *         clockIn:
 *           type: string
 *           format: date-time
 *           description: 出勤時刻
 *         clockOut:
 *           type: string
 *           format: date-time
 *           description: 退勤時刻
 *         breakStart:
 *           type: string
 *           format: date-time
 *           description: 休憩開始時刻
 *         breakEnd:
 *           type: string
 *           format: date-time
 *           description: 休憩終了時刻
 *         workHours:
 *           type: number
 *           description: 労働時間
 *         overtimeHours:
 *           type: number
 *           description: 残業時間
 *         breakDuration:
 *           type: number
 *           description: 休憩時間（分）
 *         status:
 *           type: string
 *           enum: [PRESENT, ABSENT, LATE, HALF_DAY]
 *           description: 出勤状態
 *         notes:
 *           type: string
 *           description: 備考
 *         employee:
 *           type: object
 *           properties:
 *             firstName:
 *               type: string
 *             lastName:
 *               type: string
 *             department:
 *               type: object
 *               properties:
 *                 name:
 *                   type: string
 *     
 *     AttendanceSummary:
 *       type: object
 *       properties:
 *         employee:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *             firstName:
 *               type: string
 *             lastName:
 *               type: string
 *         period:
 *           type: object
 *           properties:
 *             year:
 *               type: integer
 *             month:
 *               type: integer
 *         totalWorkDays:
 *           type: integer
 *           description: 出勤予定日数
 *         actualWorkDays:
 *           type: integer
 *           description: 実際の出勤日数
 *         totalWorkHours:
 *           type: number
 *           description: 総労働時間
 *         totalOvertimeHours:
 *           type: number
 *           description: 総残業時間
 *         attendanceRate:
 *           type: number
 *           description: 出勤率（%）
 *         lateDays:
 *           type: integer
 *           description: 遅刻日数
 *         absentDays:
 *           type: integer
 *           description: 欠勤日数
 *     
 *     LeaveRequest:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         employeeId:
 *           type: string
 *         startDate:
 *           type: string
 *           format: date
 *         endDate:
 *           type: string
 *           format: date
 *         leaveType:
 *           type: string
 *           enum: [ANNUAL, SICK, SPECIAL, MATERNITY, PATERNITY]
 *         days:
 *           type: number
 *           description: 取得日数
 *         reason:
 *           type: string
 *           description: 申請理由
 *         status:
 *           type: string
 *           enum: [PENDING, APPROVED, REJECTED]
 *         reviewedBy:
 *           type: string
 *           description: 承認者ID
 *         reviewedAt:
 *           type: string
 *           format: date-time
 *         reviewComment:
 *           type: string
 *           description: 承認・却下コメント
 *         submittedAt:
 *           type: string
 *           format: date-time
 *         employee:
 *           type: object
 *           properties:
 *             firstName:
 *               type: string
 *             lastName:
 *               type: string
 *             department:
 *               type: object
 *               properties:
 *                 name:
 *                   type: string
 *     
 *     LeaveBalance:
 *       type: object
 *       properties:
 *         employeeId:
 *           type: string
 *         year:
 *           type: integer
 *         annualLeaveDays:
 *           type: number
 *           description: 年次有給休暇日数
 *         usedAnnualDays:
 *           type: number
 *           description: 使用済み年次有給
 *         remainingAnnualDays:
 *           type: number
 *           description: 残り年次有給
 *         sickLeaveDays:
 *           type: number
 *           description: 病気休暇日数
 *         usedSickDays:
 *           type: number
 *           description: 使用済み病気休暇
 *         specialLeaveDays:
 *           type: number
 *           description: 特別休暇日数
 *         usedSpecialDays:
 *           type: number
 *           description: 使用済み特別休暇
 */

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