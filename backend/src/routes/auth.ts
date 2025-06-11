import express from 'express';
import {
  login,
  register,
  logout,
  refreshToken,
  getProfile,
  updateProfile,
  changePassword,
} from '../controllers/authController';
import { authenticateToken } from '../middleware/auth';
import {
  validateLogin,
  validateRegister,
  validateUpdateProfile,
  validateChangePassword,
} from '../middleware/validation';

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     LoginRequest:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           description: ユーザーのメールアドレス
 *         password:
 *           type: string
 *           description: ユーザーのパスワード
 *     
 *     RegisterRequest:
 *       type: object
 *       required:
 *         - email
 *         - password
 *         - firstName
 *         - lastName
 *         - companyName
 *         - companyEmail
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           description: ユーザーのメールアドレス
 *         password:
 *           type: string
 *           description: パスワード（8文字以上、大文字・小文字・数字・特殊文字を含む）
 *         firstName:
 *           type: string
 *           description: 名前（名）
 *         lastName:
 *           type: string
 *           description: 名前（姓）
 *         companyName:
 *           type: string
 *           description: 会社名
 *         companyEmail:
 *           type: string
 *           format: email
 *           description: 会社のメールアドレス
 *     
 *     AuthResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         message:
 *           type: string
 *         data:
 *           type: object
 *           properties:
 *             user:
 *               $ref: '#/components/schemas/User'
 *             accessToken:
 *               type: string
 *     
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         email:
 *           type: string
 *         firstName:
 *           type: string
 *         lastName:
 *           type: string
 *         role:
 *           type: string
 *           enum: [ADMIN, HR_STAFF, MANAGER, EMPLOYEE]
 *         company:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *             name:
 *               type: string
 *     
 *     Error:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         error:
 *           type: string
 *           description: エラーメッセージ
 */

/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     summary: ユーザーログイン
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: ログイン成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       401:
 *         description: 認証失敗
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/login', validateLogin, login);

/**
 * @swagger
 * /api/v1/auth/register:
 *   post:
 *     summary: 新規アカウント登録
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *     responses:
 *       201:
 *         description: 登録成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       409:
 *         description: メールアドレスが既に使用されている
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/register', validateRegister, register);

/**
 * @swagger
 * /api/v1/auth/logout:
 *   post:
 *     summary: ログアウト
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: ログアウト成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 */
router.post('/logout', authenticateToken, logout);

/**
 * @swagger
 * /api/v1/auth/refresh:
 *   post:
 *     summary: アクセストークンリフレッシュ
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: トークン更新成功
 *       401:
 *         description: リフレッシュトークンが無効
 */
router.post('/refresh', refreshToken);

/**
 * @swagger
 * /api/v1/auth/profile:
 *   get:
 *     summary: ユーザープロフィール取得
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: プロフィール取得成功
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
 *                     user:
 *                       $ref: '#/components/schemas/User'
 */
router.get('/profile', authenticateToken, getProfile);

/**
 * @swagger
 * /api/v1/auth/profile:
 *   put:
 *     summary: ユーザープロフィール更新
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - firstName
 *               - lastName
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *     responses:
 *       200:
 *         description: プロフィール更新成功
 */
router.put('/profile', authenticateToken, validateUpdateProfile, updateProfile);

/**
 * @swagger
 * /api/v1/auth/change-password:
 *   put:
 *     summary: パスワード変更
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: パスワード変更成功
 */
router.put('/change-password', authenticateToken, validateChangePassword, changePassword);

export default router;