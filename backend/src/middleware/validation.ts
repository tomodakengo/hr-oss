import { body, param, query } from 'express-validator';
import { validatePassword } from '../utils/password';

// Auth validation
export const validateLogin = [
  body('email')
    .isEmail()
    .withMessage('有効なメールアドレスを入力してください')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('パスワードは必須です'),
];

export const validateRegister = [
  body('email')
    .isEmail()
    .withMessage('有効なメールアドレスを入力してください')
    .normalizeEmail(),
  body('password')
    .custom((value) => {
      const { isValid, errors } = validatePassword(value);
      if (!isValid) {
        throw new Error(errors.join(', '));
      }
      return true;
    }),
  body('firstName')
    .notEmpty()
    .withMessage('名前（名）は必須です')
    .isLength({ min: 1, max: 50 })
    .withMessage('名前（名）は1文字以上50文字以下で入力してください'),
  body('lastName')
    .notEmpty()
    .withMessage('名前（姓）は必須です')
    .isLength({ min: 1, max: 50 })
    .withMessage('名前（姓）は1文字以上50文字以下で入力してください'),
  body('companyName')
    .notEmpty()
    .withMessage('会社名は必須です')
    .isLength({ min: 1, max: 100 })
    .withMessage('会社名は1文字以上100文字以下で入力してください'),
  body('companyEmail')
    .isEmail()
    .withMessage('有効な会社メールアドレスを入力してください')
    .normalizeEmail(),
];

export const validateUpdateProfile = [
  body('firstName')
    .notEmpty()
    .withMessage('名前（名）は必須です')
    .isLength({ min: 1, max: 50 })
    .withMessage('名前（名）は1文字以上50文字以下で入力してください'),
  body('lastName')
    .notEmpty()
    .withMessage('名前（姓）は必須です')
    .isLength({ min: 1, max: 50 })
    .withMessage('名前（姓）は1文字以上50文字以下で入力してください'),
];

export const validateChangePassword = [
  body('currentPassword')
    .notEmpty()
    .withMessage('現在のパスワードは必須です'),
  body('newPassword')
    .custom((value) => {
      const { isValid, errors } = validatePassword(value);
      if (!isValid) {
        throw new Error(errors.join(', '));
      }
      return true;
    }),
];

// Employee validation
export const validateEmployee = [
  body('employeeNumber')
    .notEmpty()
    .withMessage('社員番号は必須です')
    .isLength({ min: 1, max: 20 })
    .withMessage('社員番号は1文字以上20文字以下で入力してください'),
  body('email')
    .isEmail()
    .withMessage('有効なメールアドレスを入力してください')
    .normalizeEmail(),
  body('firstName')
    .notEmpty()
    .withMessage('名前（名）は必須です')
    .isLength({ min: 1, max: 50 })
    .withMessage('名前（名）は1文字以上50文字以下で入力してください'),
  body('lastName')
    .notEmpty()
    .withMessage('名前（姓）は必須です')
    .isLength({ min: 1, max: 50 })
    .withMessage('名前（姓）は1文字以上50文字以下で入力してください'),
  body('hireDate')
    .isISO8601()
    .withMessage('有効な入社日を入力してください'),
  body('birthDate')
    .optional()
    .isISO8601()
    .withMessage('有効な生年月日を入力してください'),
  body('phone')
    .optional()
    .isMobilePhone('ja-JP')
    .withMessage('有効な電話番号を入力してください'),
  body('mobile')
    .optional()
    .isMobilePhone('ja-JP')
    .withMessage('有効な携帯電話番号を入力してください'),
  body('postalCode')
    .optional()
    .matches(/^\d{3}-\d{4}$/)
    .withMessage('郵便番号は123-4567の形式で入力してください'),
];

// Department validation
export const validateDepartment = [
  body('name')
    .notEmpty()
    .withMessage('部署名は必須です')
    .isLength({ min: 1, max: 100 })
    .withMessage('部署名は1文字以上100文字以下で入力してください'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('説明は500文字以下で入力してください'),
];

// Position validation
export const validatePosition = [
  body('name')
    .notEmpty()
    .withMessage('役職名は必須です')
    .isLength({ min: 1, max: 100 })
    .withMessage('役職名は1文字以上100文字以下で入力してください'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('説明は500文字以下で入力してください'),
  body('level')
    .optional()
    .isInt({ min: 1, max: 10 })
    .withMessage('レベルは1から10の間で入力してください'),
  body('baseSalary')
    .optional()
    .isDecimal({ decimal_digits: '0,2' })
    .withMessage('基本給は有効な金額を入力してください'),
  body('departmentId')
    .notEmpty()
    .withMessage('部署IDは必須です')
    .isUUID()
    .withMessage('有効な部署IDを入力してください'),
];

// Attendance validation
export const validateAttendance = [
  body('date')
    .isISO8601()
    .withMessage('有効な日付を入力してください'),
  body('clockIn')
    .optional()
    .isISO8601()
    .withMessage('有効な出勤時刻を入力してください'),
  body('clockOut')
    .optional()
    .isISO8601()
    .withMessage('有効な退勤時刻を入力してください'),
  body('breakStart')
    .optional()
    .isISO8601()
    .withMessage('有効な休憩開始時刻を入力してください'),
  body('breakEnd')
    .optional()
    .isISO8601()
    .withMessage('有効な休憩終了時刻を入力してください'),
];

// Common parameter validation
export const validateUUIDParam = (paramName: string) => [
  param(paramName)
    .isUUID()
    .withMessage(`有効な${paramName}を入力してください`),
];

// Query validation
export const validatePaginationQuery = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('ページ番号は1以上の整数を入力してください'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('件数は1から100の間で入力してください'),
  query('sort')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('ソート順はascまたはdescを指定してください'),
];