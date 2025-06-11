import express from 'express';
import {
  getDepartments,
  getDepartment,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} from '../controllers/departmentController';
import { authenticateToken, requireRole } from '../middleware/auth';
import {
  validateDepartment,
  validateUUIDParam,
} from '../middleware/validation';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

/**
 * @swagger
 * /api/v1/departments:
 *   get:
 *     summary: 部署一覧取得
 *     tags: [Departments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: includeInactive
 *         schema:
 *           type: boolean
 *         description: 非アクティブな部署も含める
 *     responses:
 *       200:
 *         description: 部署一覧取得成功
 */
router.get('/', getDepartments);

/**
 * @swagger
 * /api/v1/departments/{id}:
 *   get:
 *     summary: 部署詳細取得
 *     tags: [Departments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 部署ID
 *     responses:
 *       200:
 *         description: 部署詳細取得成功
 *       404:
 *         description: 部署が見つかりません
 */
router.get('/:id', validateUUIDParam('id'), getDepartment);

/**
 * @swagger
 * /api/v1/departments:
 *   post:
 *     summary: 部署新規作成
 *     tags: [Departments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 description: 部署名
 *               description:
 *                 type: string
 *                 description: 部署の説明
 *               parentId:
 *                 type: string
 *                 description: 親部署ID
 *     responses:
 *       201:
 *         description: 部署作成成功
 *       409:
 *         description: 同じ名前の部署が既に存在します
 */
router.post('/', requireRole('ADMIN', 'HR_STAFF'), validateDepartment, createDepartment);

/**
 * @swagger
 * /api/v1/departments/{id}:
 *   put:
 *     summary: 部署情報更新
 *     tags: [Departments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 部署ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               parentId:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: 部署情報更新成功
 *       404:
 *         description: 部署が見つかりません
 */
router.put('/:id', validateUUIDParam('id'), requireRole('ADMIN', 'HR_STAFF'), validateDepartment, updateDepartment);

/**
 * @swagger
 * /api/v1/departments/{id}:
 *   delete:
 *     summary: 部署削除
 *     tags: [Departments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 部署ID
 *     responses:
 *       200:
 *         description: 部署削除成功
 *       400:
 *         description: アクティブな従業員が所属している部署は削除できません
 *       404:
 *         description: 部署が見つかりません
 */
router.delete('/:id', validateUUIDParam('id'), requireRole('ADMIN', 'HR_STAFF'), deleteDepartment);

export default router;