import { Router } from 'express';
import { PayrollController } from '../controllers/payrollController';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();
const payrollController = new PayrollController();

/**
 * @swagger
 * components:
 *   schemas:
 *     PayrollRequest:
 *       type: object
 *       required:
 *         - year
 *         - month
 *       properties:
 *         year:
 *           type: integer
 *           description: 給与年
 *           example: 2024
 *         month:
 *           type: integer
 *           description: 給与月
 *           example: 12
 *         baseSalary:
 *           type: number
 *           description: 基本給（指定しない場合は従業員設定から取得）
 *           example: 300000
 *         allowances:
 *           type: array
 *           description: 手当リスト
 *           items:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "住宅手当"
 *               amount:
 *                 type: number
 *                 example: 20000
 *     
 *     BulkPayrollRequest:
 *       type: object
 *       required:
 *         - year
 *         - month
 *       properties:
 *         year:
 *           type: integer
 *           description: 給与年
 *           example: 2024
 *         month:
 *           type: integer
 *           description: 給与月
 *           example: 12
 *         departmentIds:
 *           type: array
 *           description: 対象部署ID（指定しない場合は全部署）
 *           items:
 *             type: string
 *         employeeIds:
 *           type: array
 *           description: 対象従業員ID（指定しない場合は全従業員）
 *           items:
 *             type: string
 *     
 *     Payroll:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         employeeId:
 *           type: string
 *         year:
 *           type: integer
 *         month:
 *           type: integer
 *         baseSalary:
 *           type: number
 *           description: 基本給
 *         workHours:
 *           type: number
 *           description: 労働時間
 *         overtimeHours:
 *           type: number
 *           description: 残業時間
 *         grossSalary:
 *           type: number
 *           description: 総支給額
 *         netSalary:
 *           type: number
 *           description: 手取り額
 *         healthInsurance:
 *           type: number
 *           description: 健康保険料
 *         pensionInsurance:
 *           type: number
 *           description: 厚生年金保険料
 *         employmentInsurance:
 *           type: number
 *           description: 雇用保険料
 *         longCareInsurance:
 *           type: number
 *           description: 介護保険料
 *         incomeTax:
 *           type: number
 *           description: 所得税
 *         residentTax:
 *           type: number
 *           description: 住民税
 *         status:
 *           type: string
 *           enum: [CALCULATED, APPROVED, PAID]
 *           description: 給与状態
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
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     
 *     PayrollStatistics:
 *       type: object
 *       properties:
 *         period:
 *           type: object
 *           properties:
 *             year:
 *               type: integer
 *             month:
 *               type: integer
 *         totalEmployees:
 *           type: integer
 *           description: 対象従業員数
 *         totalGrossSalary:
 *           type: number
 *           description: 総支給額合計
 *         totalNetSalary:
 *           type: number
 *           description: 手取り額合計
 *         averageGrossSalary:
 *           type: number
 *           description: 平均総支給額
 *         totalSocialInsurance:
 *           type: number
 *           description: 社会保険料合計
 *         totalTax:
 *           type: number
 *           description: 税金合計
 *         statusCounts:
 *           type: object
 *           properties:
 *             calculated:
 *               type: integer
 *             approved:
 *               type: integer
 *             paid:
 *               type: integer
 *         departmentBreakdown:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               departmentName:
 *                 type: string
 *               employeeCount:
 *                 type: integer
 *               totalGross:
 *                 type: number
 *               averageGross:
 *                 type: number
 */

// 認証が必要な全てのルートに適用
router.use(authenticateToken);

/**
 * @swagger
 * /api/v1/payroll/{employeeId}/calculate:
 *   post:
 *     summary: 個別従業員の給与計算
 *     tags: [Payroll]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: employeeId
 *         required: true
 *         schema:
 *           type: string
 *         description: 従業員ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PayrollRequest'
 *     responses:
 *       201:
 *         description: 給与計算成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Payroll'
 *       400:
 *         description: 計算パラメータエラー
 *       403:
 *         description: 権限不足
 *       404:
 *         description: 従業員が見つからない
 */
router.post('/:employeeId/calculate', requireRole('ADMIN', 'HR_STAFF'), payrollController.calculatePayroll.bind(payrollController));

/**
 * @swagger
 * /api/v1/payroll/bulk-calculate:
 *   post:
 *     summary: 一括給与計算
 *     tags: [Payroll]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BulkPayrollRequest'
 *     responses:
 *       201:
 *         description: 一括計算成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     processed:
 *                       type: integer
 *                       description: 処理済み件数
 *                     payrolls:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Payroll'
 *       403:
 *         description: 権限不足
 */
router.post('/bulk-calculate', requireRole('ADMIN', 'HR_STAFF'), payrollController.calculateBulkPayroll.bind(payrollController));

/**
 * @swagger
 * /api/v1/payroll:
 *   get:
 *     summary: 給与一覧取得
 *     tags: [Payroll]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *         description: 対象年度
 *       - in: query
 *         name: month
 *         schema:
 *           type: integer
 *         description: 対象月
 *       - in: query
 *         name: departmentId
 *         schema:
 *           type: string
 *         description: 部署ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [CALCULATED, APPROVED, PAID]
 *         description: 給与状態
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: ページ番号
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: 1ページあたりの件数
 *     responses:
 *       200:
 *         description: 給与一覧取得成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     payrolls:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Payroll'
 *                     total:
 *                       type: integer
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 */
router.get('/', payrollController.getPayrolls.bind(payrollController));

/**
 * @swagger
 * /api/v1/payroll/{id}:
 *   get:
 *     summary: 個別給与詳細取得
 *     tags: [Payroll]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 給与ID
 *     responses:
 *       200:
 *         description: 給与詳細取得成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Payroll'
 *       404:
 *         description: 給与データが見つからない
 */
router.get('/:id', payrollController.getPayrollById.bind(payrollController));

/**
 * @swagger
 * /api/v1/payroll/{id}/approve:
 *   put:
 *     summary: 給与承認
 *     tags: [Payroll]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 給与ID
 *     responses:
 *       200:
 *         description: 給与承認成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Payroll'
 *       403:
 *         description: 権限不足
 *       404:
 *         description: 給与データが見つからない
 */
router.put('/:id/approve', requireRole('ADMIN', 'HR_STAFF'), payrollController.approvePayroll.bind(payrollController));

/**
 * @swagger
 * /api/v1/payroll/statistics/summary:
 *   get:
 *     summary: 給与統計
 *     tags: [Payroll]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *         description: 対象年度
 *       - in: query
 *         name: month
 *         schema:
 *           type: integer
 *         description: 対象月
 *     responses:
 *       200:
 *         description: 給与統計取得成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/PayrollStatistics'
 *       403:
 *         description: 権限不足
 */
router.get('/statistics/summary', requireRole('ADMIN', 'HR_STAFF', 'MANAGER'), payrollController.getPayrollStatistics.bind(payrollController));

export { router as payrollRoutes };