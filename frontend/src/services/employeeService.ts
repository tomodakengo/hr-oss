import { apiService } from './api';
import {
  Employee,
  Department,
  Position,
  EmployeeCreateRequest,
  EmployeeListParams,
  EmployeeListResponse,
  EmployeeStatsResponse,
} from '../types/employee';

export class EmployeeService {
  // Employee CRUD operations
  async getEmployees(params?: EmployeeListParams): Promise<EmployeeListResponse> {
    const queryParams = new URLSearchParams();
    
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.department) queryParams.append('department', params.department);
    if (params?.position) queryParams.append('position', params.position);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.sort) queryParams.append('sort', params.sort);
    if (params?.order) queryParams.append('order', params.order);

    const response = await apiService.get<EmployeeListResponse>(
      `/employees?${queryParams.toString()}`
    );
    return response.data;
  }

  async getEmployee(id: string): Promise<Employee> {
    const response = await apiService.get<{ success: boolean; data: { employee: Employee } }>(
      `/employees/${id}`
    );
    return response.data.data.employee;
  }

  async createEmployee(data: EmployeeCreateRequest): Promise<Employee> {
    const response = await apiService.post<{ success: boolean; data: { employee: Employee } }>(
      '/employees',
      data
    );
    return response.data.data.employee;
  }

  async updateEmployee(id: string, data: Partial<EmployeeCreateRequest>): Promise<Employee> {
    const response = await apiService.put<{ success: boolean; data: { employee: Employee } }>(
      `/employees/${id}`,
      data
    );
    return response.data.data.employee;
  }

  async deleteEmployee(id: string): Promise<void> {
    await apiService.delete(`/employees/${id}`);
  }

  async getEmployeeStats(): Promise<EmployeeStatsResponse['data']> {
    const response = await apiService.get<EmployeeStatsResponse>('/employees/stats');
    return response.data.data;
  }

  // Department operations
  async getDepartments(includeInactive = false): Promise<Department[]> {
    const response = await apiService.get<{ success: boolean; data: { departments: Department[] } }>(
      `/departments?includeInactive=${includeInactive}`
    );
    return response.data.data.departments;
  }

  async getDepartment(id: string): Promise<Department> {
    const response = await apiService.get<{ success: boolean; data: { department: Department } }>(
      `/departments/${id}`
    );
    return response.data.data.department;
  }

  async createDepartment(data: { name: string; description?: string; parentId?: string }): Promise<Department> {
    const response = await apiService.post<{ success: boolean; data: { department: Department } }>(
      '/departments',
      data
    );
    return response.data.data.department;
  }

  async updateDepartment(id: string, data: { name?: string; description?: string; parentId?: string; isActive?: boolean }): Promise<Department> {
    const response = await apiService.put<{ success: boolean; data: { department: Department } }>(
      `/departments/${id}`,
      data
    );
    return response.data.data.department;
  }

  async deleteDepartment(id: string): Promise<void> {
    await apiService.delete(`/departments/${id}`);
  }

  // Position operations
  async getPositions(departmentId?: string, includeInactive = false): Promise<Position[]> {
    const queryParams = new URLSearchParams();
    if (departmentId) queryParams.append('departmentId', departmentId);
    if (includeInactive) queryParams.append('includeInactive', includeInactive.toString());

    const response = await apiService.get<{ success: boolean; data: { positions: Position[] } }>(
      `/positions?${queryParams.toString()}`
    );
    return response.data.data.positions;
  }

  async getPosition(id: string): Promise<Position> {
    const response = await apiService.get<{ success: boolean; data: { position: Position } }>(
      `/positions/${id}`
    );
    return response.data.data.position;
  }

  async createPosition(data: {
    name: string;
    description?: string;
    level?: number;
    baseSalary?: number;
    departmentId: string;
  }): Promise<Position> {
    const response = await apiService.post<{ success: boolean; data: { position: Position } }>(
      '/positions',
      data
    );
    return response.data.data.position;
  }

  async updatePosition(id: string, data: {
    name?: string;
    description?: string;
    level?: number;
    baseSalary?: number;
    departmentId?: string;
    isActive?: boolean;
  }): Promise<Position> {
    const response = await apiService.put<{ success: boolean; data: { position: Position } }>(
      `/positions/${id}`,
      data
    );
    return response.data.data.position;
  }

  async deletePosition(id: string): Promise<void> {
    await apiService.delete(`/positions/${id}`);
  }
}

export const employeeService = new EmployeeService();