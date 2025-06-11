import { useState, useEffect } from 'react';
import { employeeService } from '../services/employeeService';
import {
  Employee,
  Department,
  Position,
  EmployeeListParams,
  EmployeeCreateRequest,
} from '../types/employee';

export const useEmployees = (params?: EmployeeListParams) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEmployees = async (searchParams?: EmployeeListParams) => {
    try {
      setLoading(true);
      setError(null);
      const response = await employeeService.getEmployees(searchParams || params);
      setEmployees(response.data.employees);
      setPagination(response.data.pagination);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch employees');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params?.page, params?.limit, params?.search, params?.department, params?.position, params?.status]);

  const createEmployee = async (data: EmployeeCreateRequest): Promise<Employee> => {
    try {
      const newEmployee = await employeeService.createEmployee(data);
      await fetchEmployees(); // Refresh the list
      return newEmployee;
    } catch (err: any) {
      throw new Error(err.response?.data?.error || 'Failed to create employee');
    }
  };

  const updateEmployee = async (id: string, data: Partial<EmployeeCreateRequest>): Promise<Employee> => {
    try {
      const updatedEmployee = await employeeService.updateEmployee(id, data);
      await fetchEmployees(); // Refresh the list
      return updatedEmployee;
    } catch (err: any) {
      throw new Error(err.response?.data?.error || 'Failed to update employee');
    }
  };

  const deleteEmployee = async (id: string): Promise<void> => {
    try {
      await employeeService.deleteEmployee(id);
      await fetchEmployees(); // Refresh the list
    } catch (err: any) {
      throw new Error(err.response?.data?.error || 'Failed to delete employee');
    }
  };

  return {
    employees,
    pagination,
    loading,
    error,
    fetchEmployees,
    createEmployee,
    updateEmployee,
    deleteEmployee,
  };
};

export const useDepartments = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDepartments = async (includeInactive = false) => {
    try {
      setLoading(true);
      setError(null);
      const data = await employeeService.getDepartments(includeInactive);
      setDepartments(data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch departments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  return {
    departments,
    loading,
    error,
    fetchDepartments,
  };
};

export const usePositions = (departmentId?: string) => {
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPositions = async (deptId?: string, includeInactive = false) => {
    try {
      setLoading(true);
      setError(null);
      const data = await employeeService.getPositions(deptId, includeInactive);
      setPositions(data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch positions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPositions(departmentId);
  }, [departmentId]);

  return {
    positions,
    loading,
    error,
    fetchPositions,
  };
};