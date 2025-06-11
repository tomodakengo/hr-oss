import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { employeeService } from '../../services/employeeService';
import { Department } from '../../types/employee';

export const DepartmentDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [department, setDepartment] = useState<Department | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDepartment = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        setError(null);
        const data = await employeeService.getDepartment(id);
        setDepartment(data);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch department');
      } finally {
        setLoading(false);
      }
    };

    fetchDepartment();
  }, [id]);

  const handleDelete = async () => {
    if (!department || !id) return;
    
    if (window.confirm(`「${department.name}」を削除しますか？`)) {
      try {
        await employeeService.deleteDepartment(id);
        navigate('/departments');
      } catch (err: any) {
        setError(err.message || 'Failed to delete department');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
          エラーが発生しました: {error}
        </div>
      </div>
    );
  }

  if (!department) {
    return (
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="text-center">
          <h3 className="mt-2 text-sm font-medium text-gray-900">部署が見つかりません</h3>
          <div className="mt-6">
            <Link
              to="/departments"
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
            >
              部署一覧に戻る
            </Link>
          </div>
        </div>
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
                    {department.name}
                  </span>
                </div>
              </li>
            </ol>
          </nav>
          <h1 className="mt-2 text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            {department.name}
          </h1>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4">
          <Link
            to={`/departments/${department.id}/edit`}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            編集
          </Link>
          <button
            onClick={handleDelete}
            disabled={(department._count?.employees || 0) > 0 || (department.children && department.children.length > 0)}
            className="ml-3 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            削除
          </button>
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 h-16 w-16">
              <div className="h-16 w-16 rounded-lg bg-indigo-100 flex items-center justify-center">
                <svg className="h-8 w-8 text-indigo-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
            </div>
            <div className="ml-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                {department.name}
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                {department.description || '説明が設定されていません'}
              </p>
              <div className="mt-2 flex items-center space-x-4">
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  department.isActive 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {department.isActive ? 'アクティブ' : '無効'}
                </span>
                <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                  {department._count?.employees || 0}名所属
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200">
          <dl>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">部署名</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{department.name}</dd>
            </div>
            
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">親部署</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {department.parent ? (
                  <Link 
                    to={`/departments/${department.parent.id}`}
                    className="text-indigo-600 hover:text-indigo-500"
                  >
                    {department.parent.name}
                  </Link>
                ) : (
                  'なし（トップレベル部署）'
                )}
              </dd>
            </div>
            
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">説明</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {department.description || '説明が設定されていません'}
              </dd>
            </div>
            
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">作成日</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {new Date(department.createdAt).toLocaleDateString('ja-JP')}
              </dd>
            </div>
            
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">最終更新日</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {new Date(department.updatedAt).toLocaleDateString('ja-JP')}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Child Departments */}
      {department.children && department.children.length > 0 && (
        <div className="mt-6">
          <div className="bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">下位部署</h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">この部署の下位にある部署一覧</p>
            </div>
            <div className="border-t border-gray-200">
              <ul className="divide-y divide-gray-200">
                {department.children.map((child) => (
                  <li key={child.id} className="px-4 py-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <Link 
                          to={`/departments/${child.id}`}
                          className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
                        >
                          {child.name}
                        </Link>
                      </div>
                      <div className="text-sm text-gray-500">
                        <Link 
                          to={`/departments/${child.id}`}
                          className="hover:text-gray-700"
                        >
                          詳細を見る →
                        </Link>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};