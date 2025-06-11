import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { employeeService } from '../../services/employeeService';
import { useDepartments, usePositions } from '../../hooks/useEmployees';
import { EmployeeCreateRequest, Gender, EmploymentType } from '../../types/employee';

const employeeSchema = z.object({
  employeeNumber: z.string().min(1, '社員番号は必須です'),
  email: z.string().email('有効なメールアドレスを入力してください'),
  firstName: z.string().min(1, '名前（名）は必須です'),
  lastName: z.string().min(1, '名前（姓）は必須です'),
  firstNameKana: z.string().optional(),
  lastNameKana: z.string().optional(),
  birthDate: z.string().optional(),
  gender: z.nativeEnum(Gender).optional(),
  phone: z.string().optional(),
  mobile: z.string().optional(),
  address: z.string().optional(),
  postalCode: z.string().optional(),
  emergencyContact: z.string().optional(),
  emergencyPhone: z.string().optional(),
  hireDate: z.string().min(1, '入社日は必須です'),
  employmentType: z.nativeEnum(EmploymentType),
  departmentId: z.string().optional(),
  positionId: z.string().optional(),
  bankAccount: z.string().optional(),
  bankBranch: z.string().optional(),
  bankName: z.string().optional(),
});

type EmployeeFormData = z.infer<typeof employeeSchema>;

interface EmployeeFormProps {
  isEdit?: boolean;
}

export const EmployeeForm: React.FC<EmployeeFormProps> = ({ isEdit = false }) => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');

  const { departments } = useDepartments();
  const { positions } = usePositions(selectedDepartment);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
  } = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      employmentType: EmploymentType.FULL_TIME,
    },
  });

  const watchedDepartmentId = watch('departmentId');

  useEffect(() => {
    setSelectedDepartment(watchedDepartmentId || '');
  }, [watchedDepartmentId]);

  useEffect(() => {
    if (isEdit && id) {
      const fetchEmployee = async () => {
        try {
          setLoading(true);
          const employee = await employeeService.getEmployee(id);
          
          reset({
            employeeNumber: employee.employeeNumber,
            email: employee.email,
            firstName: employee.firstName,
            lastName: employee.lastName,
            firstNameKana: employee.firstNameKana || '',
            lastNameKana: employee.lastNameKana || '',
            birthDate: employee.birthDate ? employee.birthDate.split('T')[0] : '',
            gender: employee.gender,
            phone: employee.phone || '',
            mobile: employee.mobile || '',
            address: employee.address || '',
            postalCode: employee.postalCode || '',
            emergencyContact: employee.emergencyContact || '',
            emergencyPhone: employee.emergencyPhone || '',
            hireDate: employee.hireDate.split('T')[0],
            employmentType: employee.employmentType,
            departmentId: employee.department?.id || '',
            positionId: employee.position?.id || '',
            bankAccount: employee.bankAccount || '',
            bankBranch: employee.bankBranch || '',
            bankName: employee.bankName || '',
          });
          
          setSelectedDepartment(employee.department?.id || '');
        } catch (err: any) {
          setError(err.message || 'Failed to fetch employee');
        } finally {
          setLoading(false);
        }
      };

      fetchEmployee();
    }
  }, [isEdit, id, reset]);

  const onSubmit = async (data: EmployeeFormData) => {
    try {
      setLoading(true);
      setError(null);

      const requestData: EmployeeCreateRequest = {
        ...data,
        departmentId: data.departmentId || undefined,
        positionId: data.positionId || undefined,
        birthDate: data.birthDate || undefined,
        firstNameKana: data.firstNameKana || undefined,
        lastNameKana: data.lastNameKana || undefined,
        phone: data.phone || undefined,
        mobile: data.mobile || undefined,
        address: data.address || undefined,
        postalCode: data.postalCode || undefined,
        emergencyContact: data.emergencyContact || undefined,
        emergencyPhone: data.emergencyPhone || undefined,
        bankAccount: data.bankAccount || undefined,
        bankBranch: data.bankBranch || undefined,
        bankName: data.bankName || undefined,
      };

      if (isEdit && id) {
        await employeeService.updateEmployee(id, requestData);
        navigate(`/employees/${id}`);
      } else {
        const newEmployee = await employeeService.createEmployee(requestData);
        navigate(`/employees/${newEmployee.id}`);
      }
    } catch (err: any) {
      setError(err.message || `Failed to ${isEdit ? 'update' : 'create'} employee`);
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEdit) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="md:flex md:items-center md:justify-between mb-6">
        <div className="flex-1 min-w-0">
          <nav className="flex" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-4">
              <li>
                <Link to="/employees" className="text-gray-400 hover:text-gray-500">
                  従業員管理
                </Link>
              </li>
              <li>
                <div className="flex items-center">
                  <svg className="flex-shrink-0 h-5 w-5 text-gray-300" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M5.555 17.776l8-16 .894.448-8 16-.894-.448z" />
                  </svg>
                  <span className="ml-4 text-sm font-medium text-gray-500">
                    {isEdit ? '従業員編集' : '新規従業員登録'}
                  </span>
                </div>
              </li>
            </ol>
          </nav>
          <h1 className="mt-2 text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            {isEdit ? '従業員情報編集' : '新規従業員登録'}
          </h1>
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-6">基本情報</h3>
            
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700">
                  社員番号 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  {...register('employeeNumber')}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
                {errors.employeeNumber && (
                  <p className="mt-1 text-sm text-red-600">{errors.employeeNumber.message}</p>
                )}
              </div>

              <div className="sm:col-span-4">
                <label className="block text-sm font-medium text-gray-700">
                  メールアドレス <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  {...register('email')}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>

              <div className="sm:col-span-3">
                <label className="block text-sm font-medium text-gray-700">
                  姓 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  {...register('lastName')}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
                {errors.lastName && (
                  <p className="mt-1 text-sm text-red-600">{errors.lastName.message}</p>
                )}
              </div>

              <div className="sm:col-span-3">
                <label className="block text-sm font-medium text-gray-700">
                  名 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  {...register('firstName')}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
                {errors.firstName && (
                  <p className="mt-1 text-sm text-red-600">{errors.firstName.message}</p>
                )}
              </div>

              <div className="sm:col-span-3">
                <label className="block text-sm font-medium text-gray-700">姓（カナ）</label>
                <input
                  type="text"
                  {...register('lastNameKana')}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block text-sm font-medium text-gray-700">名（カナ）</label>
                <input
                  type="text"
                  {...register('firstNameKana')}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700">生年月日</label>
                <input
                  type="date"
                  {...register('birthDate')}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700">性別</label>
                <select
                  {...register('gender')}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                  <option value="">選択してください</option>
                  <option value={Gender.MALE}>男性</option>
                  <option value={Gender.FEMALE}>女性</option>
                  <option value={Gender.OTHER}>その他</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-6">連絡先情報</h3>
            
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
              <div className="sm:col-span-3">
                <label className="block text-sm font-medium text-gray-700">電話番号</label>
                <input
                  type="tel"
                  {...register('phone')}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block text-sm font-medium text-gray-700">携帯電話</label>
                <input
                  type="tel"
                  {...register('mobile')}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700">郵便番号</label>
                <input
                  type="text"
                  placeholder="123-4567"
                  {...register('postalCode')}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>

              <div className="sm:col-span-4">
                <label className="block text-sm font-medium text-gray-700">住所</label>
                <input
                  type="text"
                  {...register('address')}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block text-sm font-medium text-gray-700">緊急連絡先</label>
                <input
                  type="text"
                  {...register('emergencyContact')}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block text-sm font-medium text-gray-700">緊急連絡先電話番号</label>
                <input
                  type="tel"
                  {...register('emergencyPhone')}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-6">雇用情報</h3>
            
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700">
                  入社日 <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  {...register('hireDate')}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
                {errors.hireDate && (
                  <p className="mt-1 text-sm text-red-600">{errors.hireDate.message}</p>
                )}
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700">
                  雇用形態 <span className="text-red-500">*</span>
                </label>
                <select
                  {...register('employmentType')}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                  <option value={EmploymentType.FULL_TIME}>正社員</option>
                  <option value={EmploymentType.PART_TIME}>パート</option>
                  <option value={EmploymentType.CONTRACT}>契約社員</option>
                  <option value={EmploymentType.INTERN}>インターン</option>
                </select>
                {errors.employmentType && (
                  <p className="mt-1 text-sm text-red-600">{errors.employmentType.message}</p>
                )}
              </div>

              <div className="sm:col-span-3">
                <label className="block text-sm font-medium text-gray-700">所属部署</label>
                <select
                  {...register('departmentId')}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                  <option value="">選択してください</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-3">
                <label className="block text-sm font-medium text-gray-700">役職</label>
                <select
                  {...register('positionId')}
                  disabled={!selectedDepartment}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-gray-100"
                >
                  <option value="">選択してください</option>
                  {positions
                    .filter(pos => pos.department.id === selectedDepartment)
                    .map((pos) => (
                      <option key={pos.id} value={pos.id}>
                        {pos.name}
                      </option>
                    ))}
                </select>
                {!selectedDepartment && (
                  <p className="mt-1 text-sm text-gray-500">先に部署を選択してください</p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-6">銀行口座情報</h3>
            
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700">銀行名</label>
                <input
                  type="text"
                  {...register('bankName')}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700">支店名</label>
                <input
                  type="text"
                  {...register('bankBranch')}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700">口座番号</label>
                <input
                  type="text"
                  {...register('bankAccount')}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3">
          <Link
            to="/employees"
            className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            キャンセル
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {isEdit ? '更新中...' : '登録中...'}
              </>
            ) : (
              isEdit ? '更新' : '登録'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};