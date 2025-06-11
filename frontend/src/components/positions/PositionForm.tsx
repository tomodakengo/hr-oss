import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { employeeService } from '../../services/employeeService';
import { useDepartments } from '../../hooks/useEmployees';
import { Position } from '../../types/employee';

const positionSchema = z.object({
  name: z.string().min(1, '役職名は必須です').max(100, '役職名は100文字以下で入力してください'),
  description: z.string().max(500, '説明は500文字以下で入力してください').optional(),
  departmentId: z.string().min(1, '部署の選択は必須です'),
  level: z.number().min(1, 'レベルは1以上で入力してください').max(10, 'レベルは10以下で入力してください').optional(),
  baseSalary: z.number().min(0, '基本給は0以上で入力してください').optional(),
});

type PositionFormData = z.infer<typeof positionSchema>;

interface PositionFormProps {
  isEdit?: boolean;
}

export const PositionForm: React.FC<PositionFormProps> = ({ isEdit = false }) => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, setCurrentPosition] = useState<Position | null>(null);

  const { departments } = useDepartments();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<PositionFormData>({
    resolver: zodResolver(positionSchema),
  });

  const selectedDepartment = watch('departmentId');

  useEffect(() => {
    if (isEdit && id) {
      const fetchPosition = async () => {
        try {
          setLoading(true);
          const position = await employeeService.getPosition(id);
          setCurrentPosition(position);
          
          reset({
            name: position.name,
            description: position.description || '',
            departmentId: position.department.id,
            level: position.level || undefined,
            baseSalary: position.baseSalary || undefined,
          });
        } catch (err: any) {
          setError(err.message || 'Failed to fetch position');
        } finally {
          setLoading(false);
        }
      };

      fetchPosition();
    }
  }, [isEdit, id, reset]);

  const onSubmit = async (data: PositionFormData) => {
    try {
      setLoading(true);
      setError(null);

      const requestData = {
        name: data.name,
        description: data.description || undefined,
        departmentId: data.departmentId,
        level: data.level || undefined,
        baseSalary: data.baseSalary || undefined,
      };

      if (isEdit && id) {
        await employeeService.updatePosition(id, requestData);
        navigate(`/positions/${id}`);
      } else {
        const newPosition = await employeeService.createPosition(requestData);
        navigate(`/positions/${newPosition.id}`);
      }
    } catch (err: any) {
      setError(err.message || `Failed to ${isEdit ? 'update' : 'create'} position`);
    } finally {
      setLoading(false);
    }
  };

  const formatSalary = (salary?: number) => {
    if (!salary) return '';
    return new Intl.NumberFormat('ja-JP').format(salary);
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
                <Link to="/positions" className="text-gray-400 hover:text-gray-500">
                  役職管理
                </Link>
              </li>
              <li>
                <div className="flex items-center">
                  <svg className="flex-shrink-0 h-5 w-5 text-gray-300" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M5.555 17.776l8-16 .894.448-8 16-.894-.448z" />
                  </svg>
                  <span className="ml-4 text-sm font-medium text-gray-500">
                    {isEdit ? '役職編集' : '新規役職作成'}
                  </span>
                </div>
              </li>
            </ol>
          </nav>
          <h1 className="mt-2 text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            {isEdit ? '役職情報編集' : '新規役職作成'}
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
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-6">役職基本情報</h3>
            
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
              <div className="sm:col-span-4">
                <label className="block text-sm font-medium text-gray-700">
                  役職名 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  {...register('name')}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="例: マネージャー"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>

              <div className="sm:col-span-4">
                <label className="block text-sm font-medium text-gray-700">
                  所属部署 <span className="text-red-500">*</span>
                </label>
                <select
                  {...register('departmentId')}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                  <option value="">部署を選択してください</option>
                  {departments
                    .filter(dept => dept.isActive)
                    .map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}
                      </option>
                    ))}
                </select>
                {errors.departmentId && (
                  <p className="mt-1 text-sm text-red-600">{errors.departmentId.message}</p>
                )}
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700">
                  役職レベル
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  {...register('level', { valueAsNumber: true })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="1-10"
                />
                <p className="mt-1 text-sm text-gray-500">
                  数値が高いほど上位の役職を表します（1-10）
                </p>
                {errors.level && (
                  <p className="mt-1 text-sm text-red-600">{errors.level.message}</p>
                )}
              </div>

              <div className="sm:col-span-3">
                <label className="block text-sm font-medium text-gray-700">
                  基本給（円）
                </label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  {...register('baseSalary', { valueAsNumber: true })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="例: 300000"
                />
                <p className="mt-1 text-sm text-gray-500">
                  この役職の標準的な基本給を設定できます
                </p>
                {errors.baseSalary && (
                  <p className="mt-1 text-sm text-red-600">{errors.baseSalary.message}</p>
                )}
              </div>

              <div className="sm:col-span-6">
                <label className="block text-sm font-medium text-gray-700">
                  役職の説明
                </label>
                <textarea
                  rows={4}
                  {...register('description')}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="役職の責任範囲や業務内容を入力してください"
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
                )}
              </div>
            </div>

            {/* Preview Section */}
            {selectedDepartment && (
              <div className="mt-6 p-4 bg-blue-50 rounded-md">
                <h4 className="text-sm font-medium text-blue-900 mb-2">役職プレビュー</h4>
                <div className="text-sm text-blue-700 space-y-1">
                  <div>
                    <span className="font-medium">部署:</span> {departments.find(d => d.id === selectedDepartment)?.name}
                  </div>
                  <div>
                    <span className="font-medium">役職:</span> {watch('name') || '新しい役職'}
                  </div>
                  {watch('level') && (
                    <div>
                      <span className="font-medium">レベル:</span> {watch('level')}
                    </div>
                  )}
                  {watch('baseSalary') && (
                    <div>
                      <span className="font-medium">基本給:</span> {formatSalary(watch('baseSalary'))}円
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Additional Information */}
        <div className="bg-gray-50 shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">役職作成のヒント</h3>
            <div className="space-y-3 text-sm text-gray-700">
              <div className="flex items-start">
                <svg className="flex-shrink-0 h-5 w-5 text-green-500 mt-0.5 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>役職名は業務内容や責任レベルを表す分かりやすいものにしましょう</span>
              </div>
              <div className="flex items-start">
                <svg className="flex-shrink-0 h-5 w-5 text-green-500 mt-0.5 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>役職レベルを設定することで組織の階層を明確化できます</span>
              </div>
              <div className="flex items-start">
                <svg className="flex-shrink-0 h-5 w-5 text-green-500 mt-0.5 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>基本給は給与計算の基準として活用されます</span>
              </div>
              <div className="flex items-start">
                <svg className="flex-shrink-0 h-5 w-5 text-green-500 mt-0.5 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>役職の説明には具体的な職務内容や期待される成果を記載しましょう</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3">
          <Link
            to="/positions"
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