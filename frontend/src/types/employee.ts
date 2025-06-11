export interface Employee {
  id: string;
  employeeNumber: string;
  email: string;
  firstName: string;
  lastName: string;
  firstNameKana?: string;
  lastNameKana?: string;
  birthDate?: string;
  gender?: Gender;
  phone?: string;
  mobile?: string;
  address?: string;
  postalCode?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  hireDate: string;
  resignationDate?: string;
  employmentType: EmploymentType;
  status: EmployeeStatus;
  profileImage?: string;
  bankAccount?: string;
  bankBranch?: string;
  bankName?: string;
  createdAt: string;
  updatedAt: string;
  department?: Department;
  position?: Position;
  attendances?: Attendance[];
}

export interface Department {
  id: string;
  name: string;
  description?: string;
  parentId?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  parent?: Department;
  children?: Department[];
  _count?: {
    employees: number;
  };
}

export interface Position {
  id: string;
  name: string;
  description?: string;
  level?: number;
  baseSalary?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  department: Department;
  _count?: {
    employees: number;
  };
}

export interface Attendance {
  id: string;
  date: string;
  clockIn?: string;
  clockOut?: string;
  breakStart?: string;
  breakEnd?: string;
  workHours?: number;
  overtimeHours?: number;
  nightHours?: number;
  holidayHours?: number;
  status: AttendanceStatus;
  attendanceType: AttendanceType;
  remarks?: string;
  location?: string;
  ipAddress?: string;
  approvedBy?: string;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
  employee?: Employee;
}

export interface LeaveRequest {
  id: string;
  startDate: string;
  endDate: string;
  days: number;
  leaveType: LeaveType;
  reason?: string;
  status: LeaveStatus;
  submittedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  remarks?: string;
  createdAt: string;
  updatedAt: string;
  employee?: Employee;
}

export interface LeaveBalance {
  year: number;
  annualLeave: number;
  usedAnnualLeave: number;
  remainingAnnualLeave: number;
  sickLeave: number;
  usedSickLeave: number;
  specialLeave: number;
  usedSpecialLeave: number;
}

export enum Gender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  OTHER = 'OTHER',
}

export enum EmploymentType {
  FULL_TIME = 'FULL_TIME',
  PART_TIME = 'PART_TIME',
  CONTRACT = 'CONTRACT',
  INTERN = 'INTERN',
}

export enum EmployeeStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  RESIGNED = 'RESIGNED',
  TERMINATED = 'TERMINATED',
}

export enum AttendanceStatus {
  PRESENT = 'PRESENT',
  ABSENT = 'ABSENT',
  LATE = 'LATE',
  EARLY_LEAVE = 'EARLY_LEAVE',
  VACATION = 'VACATION',
  SICK_LEAVE = 'SICK_LEAVE',
  BUSINESS_TRIP = 'BUSINESS_TRIP',
}

export enum AttendanceType {
  WORK_DAY = 'WORK_DAY',
  HOLIDAY = 'HOLIDAY',
  PAID_LEAVE = 'PAID_LEAVE',
  SICK_LEAVE = 'SICK_LEAVE',
  SPECIAL_LEAVE = 'SPECIAL_LEAVE',
  MATERNITY_LEAVE = 'MATERNITY_LEAVE',
  PATERNITY_LEAVE = 'PATERNITY_LEAVE',
  COMPENSATORY_LEAVE = 'COMPENSATORY_LEAVE',
}

export enum LeaveType {
  ANNUAL_LEAVE = 'ANNUAL_LEAVE',
  SICK_LEAVE = 'SICK_LEAVE',
  SPECIAL_LEAVE = 'SPECIAL_LEAVE',
  MATERNITY_LEAVE = 'MATERNITY_LEAVE',
  PATERNITY_LEAVE = 'PATERNITY_LEAVE',
  BEREAVEMENT_LEAVE = 'BEREAVEMENT_LEAVE',
  COMPENSATORY_LEAVE = 'COMPENSATORY_LEAVE',
  UNPAID_LEAVE = 'UNPAID_LEAVE',
}

export enum LeaveStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
}

export interface EmployeeCreateRequest {
  employeeNumber: string;
  email: string;
  firstName: string;
  lastName: string;
  firstNameKana?: string;
  lastNameKana?: string;
  birthDate?: string;
  gender?: Gender;
  phone?: string;
  mobile?: string;
  address?: string;
  postalCode?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  hireDate: string;
  employmentType: EmploymentType;
  departmentId?: string;
  positionId?: string;
  bankAccount?: string;
  bankBranch?: string;
  bankName?: string;
}

export interface EmployeeListParams {
  page?: number;
  limit?: number;
  search?: string;
  department?: string;
  position?: string;
  status?: EmployeeStatus;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface EmployeeListResponse {
  success: boolean;
  data: {
    employees: Employee[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  };
}

export interface EmployeeStatsResponse {
  success: boolean;
  data: {
    totalEmployees: number;
    activeEmployees: number;
    departmentStats: Array<{
      departmentId: string;
      _count: { id: number };
    }>;
    employmentTypeStats: Array<{
      employmentType: EmploymentType;
      _count: { id: number };
    }>;
    recentHires: Array<{
      id: string;
      firstName: string;
      lastName: string;
      hireDate: string;
      department?: { name: string };
    }>;
  };
}

export enum PayrollStatus {
  DRAFT = 'DRAFT',
  CALCULATED = 'CALCULATED',
  APPROVED = 'APPROVED',
  PAID = 'PAID'
}

export enum PayrollItemType {
  ALLOWANCE = 'ALLOWANCE',
  DEDUCTION = 'DEDUCTION'
}

export interface Payroll {
  id: string;
  year: number;
  month: number;
  employeeId: string;
  employee?: Employee;
  
  // 基本給与
  baseSalary: number;
  
  // 労働時間
  workHours: number;
  overtimeHours: number;
  nightHours: number;
  holidayHours: number;
  
  // 割増賃金
  overtimePay: number;
  nightPay: number;
  holidayPay: number;
  
  // 各種手当
  transportAllowance: number;
  familyAllowance: number;
  housingAllowance: number;
  positionAllowance: number;
  skillAllowance: number;
  otherAllowances: number;
  
  // 総支給額
  grossSalary: number;
  
  // 社会保険料
  healthInsurance: number;
  pensionInsurance: number;
  employmentInsurance: number;
  longCareInsurance: number;
  
  // 税金
  incomeTax: number;
  residenceTax: number;
  
  // その他控除
  otherDeductions: number;
  
  // 総控除額
  totalDeductions: number;
  
  // 差引支給額
  netSalary: number;
  
  // 勤怠データ参照期間
  attendanceFrom: string;
  attendanceTo: string;
  
  status: PayrollStatus;
  calculatedAt?: string;
  approvedBy?: string;
  approvedAt?: string;
  paymentDate?: string;
  remarks?: string;
  createdAt: string;
  updatedAt: string;
  
  payrollItems?: PayrollItem[];
}

export interface PayrollItem {
  id: string;
  payrollId: string;
  name: string;
  type: PayrollItemType;
  amount: number;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SalaryTemplate {
  id: string;
  name: string;
  baseSalary: number;
  transportAllowance: number;
  familyAllowance: number;
  housingAllowance: number;
  positionAllowance: number;
  skillAllowance: number;
  hourlyRate?: number;
  overtimeRate: number;
  nightRate: number;
  holidayRate: number;
  isActive: boolean;
  companyId: string;
  positionId?: string;
  position?: Position;
  createdAt: string;
  updatedAt: string;
}

export interface PayrollCalculationRequest {
  employeeId: string;
  year: number;
  month: number;
}

export interface PayrollListParams {
  employeeId?: string;
  year?: number;
  month?: number;
  status?: PayrollStatus;
  page?: number;
  limit?: number;
}

export interface PayrollListResponse {
  success: boolean;
  data: {
    payrolls: Payroll[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  };
}

export interface PayrollStatistics {
  period: {
    year: number;
    month: number;
  };
  summary: {
    totalEmployees: number;
    totalGrossSalary: number;
    totalNetSalary: number;
    totalOvertimePay: number;
    averageGrossSalary: number;
  };
  departmentStats: Record<string, {
    count: number;
    totalGross: number;
    totalNet: number;
    totalOvertime: number;
  }>;
}