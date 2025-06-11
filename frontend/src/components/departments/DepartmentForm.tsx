import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { employeeService } from '../../services/employeeService';
import { useDepartments } from '../../hooks/useEmployees';
import { Department } from '../../types/employee';

const departmentSchema = z.object({
  name: z.string().min(1, '部署名は必須です').max(100, '部署名は100文字以下で入力してください'),
  description: z.string().max(500, '説明は500文字以下で入力してください').optional(),
  parentId: z.string().optional(),
});

type DepartmentFormData = z.infer<typeof departmentSchema>;

interface DepartmentFormProps {
  isEdit?: boolean;
}

export const DepartmentForm: React.FC<DepartmentFormProps> = ({ isEdit = false }) => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentDepartment, setCurrentDepartment] = useState<Department | null>(null);

  const { departments } = useDepartments();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<DepartmentFormData>({
    resolver: zodResolver(departmentSchema),
  });

  const parentId = watch('parentId');

  // Filter out current department and its descendants from parent options
  const getAvailableParents = (): Department[] => {
    if (!isEdit || !currentDepartment) {
      return departments.filter(dept => dept.isActive);
    }

    const isDescendant = (dept: Department, ancestorId: string): boolean => {
      if (dept.id === ancestorId) return true;
      if (!dept.parentId) return false;
      const parent = departments.find(d => d.id === dept.parentId);
      return parent ? isDescendant(parent, ancestorId) : false;
    };

    return departments.filter(dept => 
      dept.isActive && 
      dept.id !== currentDepartment.id && 
      !isDescendant(dept, currentDepartment.id)
    );
  };

  useEffect(() => {
    if (isEdit && id) {
      const fetchDepartment = async () => {
        try {
          setLoading(true);
          const department = await employeeService.getDepartment(id);
          setCurrentDepartment(department);
          
          reset({
            name: department.name,
            description: department.description || '',
            parentId: department.parentId || '',
          });
        } catch (err: any) {
          setError(err.message || 'Failed to fetch department');
        } finally {
          setLoading(false);
        }
      };

      fetchDepartment();
    }
  }, [isEdit, id, reset]);

  const onSubmit = async (data: DepartmentFormData) => {
    try {
      setLoading(true);
      setError(null);

      const requestData = {
        name: data.name,
        description: data.description || undefined,
        parentId: data.parentId || undefined,
      };

      if (isEdit && id) {
        await employeeService.updateDepartment(id, requestData);
        navigate(`/departments/${id}`);
      } else {
        const newDepartment = await employeeService.createDepartment(requestData);
        navigate(`/departments/${newDepartment.id}`);
      }
    } catch (err: any) {
      setError(err.message || `Failed to ${isEdit ? 'update' : 'create'} department`);
    } finally {
      setLoading(false);
    }
  };

  const buildDepartmentHierarchy = (depts: Department[], parentId?: string, level = 0): JSX.Element[] => {
    return depts
      .filter(dept => dept.parentId === parentId)
      .map(dept => (
        <React.Fragment key={dept.id}>
          <option value={dept.id}>
            {'　'.repeat(level)}{dept.name}
          </option>
          {buildDepartmentHierarchy(depts, dept.id, level + 1)}
        </React.Fragment>
      ));
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
                <Link to="/departments" className="text-gray-400 hover:text-gray-500">
                  部署管理
                </Link>
              </li>
              <li>
                <div className="flex items-center">
                  <svg className="flex-shrink-0 h-5 w-5 text-gray-300" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M5.555 17.776l8-16 .894.448-8 16-.894-.448z" />
                  </svg>
                  <span className="ml-4 text-sm font-medium text-gray-500">
                    {isEdit ? '部署編集' : '新規部署作成'}
                  </span>
                </div>
              </li>
            </ol>
          </nav>
          <h1 className="mt-2 text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            {isEdit ? '部署情報編集' : '新規部署作成'}
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
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-6">部署情報</h3>
            
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
              <div className="sm:col-span-4">
                <label className="block text-sm font-medium text-gray-700">
                  部署名 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  {...register('name')}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="例: 開発部"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>

              <div className="sm:col-span-4">
                <label className="block text-sm font-medium text-gray-700">
                  親部署
                </label>
                <select
                  {...register('parentId')}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                  <option value="">なし（トップレベル部署）</option>
                  {buildDepartmentHierarchy(getAvailableParents())}
                </select>
                <p className="mt-1 text-sm text-gray-500">
                  親部署を選択すると階層構造を作成できます
                </p>
              </div>

              <div className="sm:col-span-6">
                <label className="block text-sm font-medium text-gray-700">
                  部署の説明
                </label>
                <textarea
                  rows={4}
                  {...register('description')}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="部署の役割や業務内容を入力してください"
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
                )}
              </div>
            </div>

            {/* Preview Section */}
            {parentId && (
              <div className="mt-6 p-4 bg-blue-50 rounded-md">
                <h4 className="text-sm font-medium text-blue-900 mb-2">階層プレビュー</h4>
                <div className="text-sm text-blue-700">
                  {(() => {
                    const getHierarchyPath = (deptId: string): string[] => {
                      const dept = departments.find(d => d.id === deptId);
                      if (!dept) return [];
                      if (!dept.parentId) return [dept.name];
                      return [...getHierarchyPath(dept.parentId), dept.name];
                    };
                    
                    const path = getHierarchyPath(parentId);
                    return path.join(' > ') + ' > ' + (watch('name') || '新しい部署');
                  })()}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Additional Information */}
        <div className="bg-gray-50 shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">部署作成のヒント</h3>
            <div className="space-y-3 text-sm text-gray-700">
              <div className="flex items-start">
                <svg className="flex-shrink-0 h-5 w-5 text-green-500 mt-0.5 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>部署名は分かりやすく、業務内容を表すものにしましょう</span>
              </div>
              <div className="flex items-start">
                <svg className="flex-shrink-0 h-5 w-5 text-green-500 mt-0.5 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>階層構造を使って組織の管理を効率化できます</span>
              </div>
              <div className="flex items-start">
                <svg className="flex-shrink-0 h-5 w-5 text-green-500 mt-0.5 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>説明には部署の役割や責任範囲を明記しましょう</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3">
          <Link
            to="/departments"
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
                {isEdit ? '更新中...' : '作成中...'}
              </>
            ) : (
              isEdit ? '更新' : '作成'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};