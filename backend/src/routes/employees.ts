import express from 'express';
import {
  getEmployees,
  getEmployee,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  getEmployeeStats,
} from '../controllers/employeeController';
import { authenticateToken, requireRole, canAccessEmployee } from '../middleware/auth';
import {
  validateEmployee,
  validateUUIDParam,
  validatePaginationQuery,
} from '../middleware/validation';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

/**
 * @swagger
 * components:
 *   schemas:
 *     Employee:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         employeeNumber:
 *           type: string
 *           description: 社員番号
 *         email:
 *           type: string
 *           format: email
 *         firstName:
 *           type: string
 *           description: 名前（名）
 *         lastName:
 *           type: string
 *           description: 名前（姓）
 *         firstNameKana:
 *           type: string
 *           description: 名前（名）カナ
 *         lastNameKana:
 *           type: string
 *           description: 名前（姓）カナ
 *         birthDate:
 *           type: string
 *           format: date
 *           description: 生年月日
 *         gender:
 *           type: string
 *           enum: [MALE, FEMALE, OTHER]
 *         phone:
 *           type: string
 *           description: 電話番号
 *         mobile:
 *           type: string
 *           description: 携帯電話番号
 *         address:
 *           type: string
 *           description: 住所
 *         postalCode:
 *           type: string
 *           description: 郵便番号
 *         emergencyContact:
 *           type: string
 *           description: 緊急連絡先
 *         emergencyPhone:
 *           type: string
 *           description: 緊急連絡先電話番号
 *         hireDate:
 *           type: string
 *           format: date
 *           description: 入社日
 *         resignationDate:
 *           type: string
 *           format: date
 *           description: 退職日
 *         employmentType:
 *           type: string
 *           enum: [FULL_TIME, PART_TIME, CONTRACT, INTERN]
 *         status:
 *           type: string
 *           enum: [ACTIVE, INACTIVE, RESIGNED, TERMINATED]
 *         profileImage:
 *           type: string
 *           description: プロフィール画像URL
 *         department:
 *           $ref: '#/components/schemas/Department'
 *         position:
 *           $ref: '#/components/schemas/Position'
 *     
 *     Department:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         name:
 *           type: string
 *         description:
 *           type: string
 *     
 *     Position:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         level:
 *           type: integer
 *         baseSalary:
 *           type: number
 *     
 *     EmployeeCreateRequest:
 *       type: object
 *       required:
 *         - employeeNumber
 *         - email
 *         - firstName
 *         - lastName
 *         - hireDate
 *       properties:
 *         employeeNumber:
 *           type: string
 *         email:
 *           type: string
 *           format: email
 *         firstName:
 *           type: string
 *         lastName:
 *           type: string
 *         firstNameKana:
 *           type: string
 *         lastNameKana:
 *           type: string
 *         birthDate:
 *           type: string
 *           format: date
 *         gender:
 *           type: string
 *           enum: [MALE, FEMALE, OTHER]
 *         phone:
 *           type: string
 *         mobile:
 *           type: string
 *         address:
 *           type: string
 *         postalCode:
 *           type: string
 *         emergencyContact:
 *           type: string
 *         emergencyPhone:
 *           type: string
 *         hireDate:
 *           type: string
 *           format: date
 *         employmentType:
 *           type: string
 *           enum: [FULL_TIME, PART_TIME, CONTRACT, INTERN]
 *         departmentId:
 *           type: string
 *         positionId:
 *           type: string
 *         bankAccount:
 *           type: string
 *         bankBranch:
 *           type: string
 *         bankName:
 *           type: string
 */

/**
 * @swagger
 * /api/v1/employees:
 *   get:
 *     summary: 従業員一覧取得
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: ページ番号
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *         description: 1ページあたりの件数
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: 検索キーワード（名前、メール、社員番号）
 *       - in: query
 *         name: department
 *         schema:
 *           type: string
 *         description: 部署ID
 *       - in: query
 *         name: position
 *         schema:
 *           type: string
 *         description: 役職ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [ACTIVE, INACTIVE, RESIGNED, TERMINATED]
 *         description: 従業員ステータス
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *         description: ソートフィールド
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *         description: ソート順
 *     responses:
 *       200:
 *         description: 従業員一覧取得成功
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
 *                     employees:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Employee'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         page:
 *                           type: integer
 *                         limit:
 *                           type: integer
 *                         total:
 *                           type: integer
 *                         totalPages:
 *                           type: integer
 *                         hasNext:
 *                           type: boolean
 *                         hasPrev:
 *                           type: boolean
 */
router.get('/', validatePaginationQuery, getEmployees);

/**
 * @swagger
 * /api/v1/employees/stats:
 *   get:
 *     summary: 従業員統計情報取得
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 統計情報取得成功
 */
router.get('/stats', requireRole('ADMIN', 'HR_STAFF'), getEmployeeStats);

/**
 * @swagger
 * /api/v1/employees/{id}:
 *   get:
 *     summary: 従業員詳細取得
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 従業員ID
 *     responses:
 *       200:
 *         description: 従業員詳細取得成功
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
 *                     employee:
 *                       $ref: '#/components/schemas/Employee'
 *       404:
 *         description: 従業員が見つかりません
 */
router.get('/:id', validateUUIDParam('id'), canAccessEmployee, getEmployee);

/**
 * @swagger
 * /api/v1/employees:
 *   post:
 *     summary: 従業員新規登録
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/EmployeeCreateRequest'
 *     responses:
 *       201:
 *         description: 従業員登録成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     employee:
 *                       $ref: '#/components/schemas/Employee'
 *       409:
 *         description: 社員番号またはメールアドレスが既に使用されています
 */
router.post('/', requireRole('ADMIN', 'HR_STAFF'), validateEmployee, createEmployee);

/**
 * @swagger
 * /api/v1/employees/{id}:
 *   put:
 *     summary: 従業員情報更新
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 従業員ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/EmployeeCreateRequest'
 *     responses:
 *       200:
 *         description: 従業員情報更新成功
 *       404:
 *         description: 従業員が見つかりません
 */
router.put('/:id', validateUUIDParam('id'), requireRole('ADMIN', 'HR_STAFF'), validateEmployee, updateEmployee);

/**
 * @swagger
 * /api/v1/employees/{id}:
 *   delete:
 *     summary: 従業員削除（退職処理）
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 従業員ID
 *     responses:
 *       200:
 *         description: 従業員削除成功
 *       404:
 *         description: 従業員が見つかりません
 */
router.delete('/:id', validateUUIDParam('id'), requireRole('ADMIN', 'HR_STAFF'), deleteEmployee);

export default router;