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
  status: AttendanceStatus;
  remarks?: string;
  location?: string;
  ipAddress?: string;
  approvedBy?: string;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
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