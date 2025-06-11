import { Router } from 'express';
import { DashboardController } from '../controllers/dashboardController';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();
const dashboardController = new DashboardController();

/**
 * @swagger
 * components:
 *   schemas:
 *     DashboardData:
 *       type: object
 *       properties:
 *         overview:
 *           type: object
 *           properties:
 *             totalEmployees:
 *               type: integer
 *               description: 総従業員数
 *             currentPeriod:
 *               type: object
 *               properties:
 *                 year:
 *                   type: integer
 *                 month:
 *                   type: integer
 *         attendance:
 *           type: object
 *           properties:
 *             today:
 *               type: object
 *               properties:
 *                 total:
 *                   type: integer
 *                   description: 総従業員数
 *                 present:
 *                   type: integer
 *                   description: 出勤者数
 *                 late:
 *                   type: integer
 *                   description: 遅刻者数
 *                 absent:
 *                   type: integer
 *                   description: 欠勤者数
 *                 attendanceRate:
 *                   type: number
 *                   description: 出勤率（%）
 *                 recentClockIns:
 *                   type: array
 *                   description: 最近の出勤記録
 *                   items:
 *                     type: object
 *                     properties:
 *                       employeeName:
 *                         type: string
 *                       department:
 *                         type: string
 *                       clockIn:
 *                         type: string
 *                         format: date-time
 *                       status:
 *                         type: string
 *             monthly:
 *               type: object
 *               properties:
 *                 totalWorkHours:
 *                   type: number
 *                   description: 月間総労働時間
 *                 totalOvertimeHours:
 *                   type: number
 *                   description: 月間総残業時間
 *                 averageWorkHours:
 *                   type: number
 *                   description: 平均労働時間
 *                 overtimeRate:
 *                   type: number
 *                   description: 残業率（%）
 *                 weeklyTrend:
 *                   type: array
 *                   description: 週間出勤トレンド
 *                   items:
 *                     type: object
 *                     properties:
 *                       date:
 *                         type: string
 *                         format: date
 *                       attendanceCount:
 *                         type: integer
 *                       attendanceRate:
 *                         type: number
 *         payroll:
 *           type: object
 *           properties:
 *             totalGrossSalary:
 *               type: number
 *               description: 総支給額
 *             totalNetSalary:
 *               type: number
 *               description: 手取り合計
 *             averageGrossSalary:
 *               type: number
 *               description: 平均総支給額
 *             totalEmployees:
 *               type: integer
 *               description: 給与対象従業員数
 *             calculatedCount:
 *               type: integer
 *               description: 計算済み件数
 *             approvedCount:
 *               type: integer
 *               description: 承認済み件数
 *             paidCount:
 *               type: integer
 *               description: 支払い済み件数
 *         departments:
 *           type: array
 *           description: 部署別統計
 *           items:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *               name:
 *                 type: string
 *               totalEmployees:
 *                 type: integer
 *               presentToday:
 *                 type: integer
 *               attendanceRate:
 *                 type: number
 *         activities:
 *           type: array
 *           description: 最近のアクティビティ
 *           items:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *               message:
 *                 type: string
 *               department:
 *                 type: string
 *               status:
 *                 type: string
 *               timestamp:
 *                 type: string
 *                 format: date-time
 *         alerts:
 *           type: array
 *           description: システムアラート
 *           items:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [warning, info, success, error]
 *               title:
 *                 type: string
 *               message:
 *                 type: string
 *               severity:
 *                 type: string
 *                 enum: [high, medium, low]
 *               count:
 *                 type: integer
 *     
 *     AttendanceTrends:
 *       type: object
 *       properties:
 *         period:
 *           type: object
 *           properties:
 *             start:
 *               type: string
 *               format: date-time
 *             end:
 *               type: string
 *               format: date-time
 *         daily:
 *           type: array
 *           description: 日別勤怠統計
 *           items:
 *             type: object
 *             properties:
 *               date:
 *                 type: string
 *                 format: date
 *               totalAttendances:
 *                 type: integer
 *               presentCount:
 *                 type: integer
 *               absentCount:
 *                 type: integer
 *               lateCount:
 *                 type: integer
 *               averageWorkHours:
 *                 type: number
 *         departments:
 *           type: array
 *           description: 部署別勤怠統計
 *           items:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               totalAttendances:
 *                 type: integer
 *               presentCount:
 *                 type: integer
 *               totalWorkHours:
 *                 type: number
 *               totalOvertimeHours:
 *                 type: number
 *     
 *     PayrollReport:
 *       type: object
 *       properties:
 *         period:
 *           type: object
 *           properties:
 *             year:
 *               type: integer
 *             months:
 *               type: integer
 *         monthly:
 *           type: array
 *           description: 月別給与統計
 *           items:
 *             type: object
 *             properties:
 *               year:
 *                 type: integer
 *               month:
 *                 type: integer
 *               employeeCount:
 *                 type: integer
 *               totalGrossSalary:
 *                 type: number
 *               totalNetSalary:
 *                 type: number
 *               averageGrossSalary:
 *                 type: number
 */

// 認証が必要な全てのルートに適用
router.use(authenticateToken);

/**
 * @swagger
 * /api/v1/dashboard:
 *   get:
 *     summary: 総合ダッシュボードデータ取得
 *     description: リアルタイム統計、KPI、アラートを含む包括的ダッシュボードデータ
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: ダッシュボードデータ取得成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/DashboardData'
 *       403:
 *         description: 権限不足（管理者・HR担当・マネージャーのみアクセス可能）
 *       500:
 *         description: サーバーエラー
 */
router.get('/', requireRole('ADMIN', 'HR_STAFF', 'MANAGER'), dashboardController.getDashboardData.bind(dashboardController));

/**
 * @swagger
 * /api/v1/dashboard/attendance-trends:
 *   get:
 *     summary: 勤怠トレンド分析
 *     description: 指定期間の勤怠データのトレンド分析（日別・部署別統計）
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [7d, 30d, 90d]
 *           default: 7d
 *         description: 分析期間（7日、30日、90日）
 *     responses:
 *       200:
 *         description: 勤怠トレンド分析結果
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/AttendanceTrends'
 *       403:
 *         description: 権限不足
 *       500:
 *         description: サーバーエラー
 */
router.get('/attendance-trends', requireRole('ADMIN', 'HR_STAFF', 'MANAGER'), dashboardController.getAttendanceTrends.bind(dashboardController));

/**
 * @swagger
 * /api/v1/dashboard/payroll-report:
 *   get:
 *     summary: 給与統計レポート
 *     description: 指定期間の給与統計データ（月別推移・トレンド分析）
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *         description: 対象年度（デフォルト：現在年度）
 *       - in: query
 *         name: months
 *         schema:
 *           type: integer
 *           default: 12
 *         description: 遡る月数（デフォルト：12ヶ月）
 *     responses:
 *       200:
 *         description: 給与統計レポート取得成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/PayrollReport'
 *       403:
 *         description: 権限不足
 *       500:
 *         description: サーバーエラー
 */
router.get('/payroll-report', requireRole('ADMIN', 'HR_STAFF', 'MANAGER'), dashboardController.getPayrollReport.bind(dashboardController));

export { router as dashboardRoutes };