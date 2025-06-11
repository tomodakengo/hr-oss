import express from 'express';
import {
  getPositions,
  getPosition,
  createPosition,
  updatePosition,
  deletePosition,
} from '../controllers/positionController';
import { authenticateToken, requireRole } from '../middleware/auth';
import {
  validatePosition,
  validateUUIDParam,
} from '../middleware/validation';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

/**
 * @swagger
 * /api/v1/positions:
 *   get:
 *     summary: 役職一覧取得
 *     tags: [Positions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: departmentId
 *         schema:
 *           type: string
 *         description: 部署IDでフィルタリング
 *       - in: query
 *         name: includeInactive
 *         schema:
 *           type: boolean
 *         description: 非アクティブな役職も含める
 *     responses:
 *       200:
 *         description: 役職一覧取得成功
 */
router.get('/', getPositions);

/**
 * @swagger
 * /api/v1/positions/{id}:
 *   get:
 *     summary: 役職詳細取得
 *     tags: [Positions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 役職ID
 *     responses:
 *       200:
 *         description: 役職詳細取得成功
 *       404:
 *         description: 役職が見つかりません
 */
router.get('/:id', validateUUIDParam('id'), getPosition);

/**
 * @swagger
 * /api/v1/positions:
 *   post:
 *     summary: 役職新規作成
 *     tags: [Positions]
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
 *               - departmentId
 *             properties:
 *               name:
 *                 type: string
 *                 description: 役職名
 *               description:
 *                 type: string
 *                 description: 役職の説明
 *               level:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 10
 *                 description: 役職レベル
 *               baseSalary:
 *                 type: number
 *                 description: 基本給
 *               departmentId:
 *                 type: string
 *                 description: 所属部署ID
 *     responses:
 *       201:
 *         description: 役職作成成功
 *       409:
 *         description: 同じ部署に同じ名前の役職が既に存在します
 */
router.post('/', requireRole('ADMIN', 'HR_STAFF'), validatePosition, createPosition);

/**
 * @swagger
 * /api/v1/positions/{id}:
 *   put:
 *     summary: 役職情報更新
 *     tags: [Positions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 役職ID
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
 *               level:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 10
 *               baseSalary:
 *                 type: number
 *               departmentId:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: 役職情報更新成功
 *       404:
 *         description: 役職が見つかりません
 */
router.put('/:id', validateUUIDParam('id'), requireRole('ADMIN', 'HR_STAFF'), validatePosition, updatePosition);

/**
 * @swagger
 * /api/v1/positions/{id}:
 *   delete:
 *     summary: 役職削除
 *     tags: [Positions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 役職ID
 *     responses:
 *       200:
 *         description: 役職削除成功
 *       400:
 *         description: アクティブな従業員が配属されている役職は削除できません
 *       404:
 *         description: 役職が見つかりません
 */
router.delete('/:id', validateUUIDParam('id'), requireRole('ADMIN', 'HR_STAFF'), deletePosition);

export default router;