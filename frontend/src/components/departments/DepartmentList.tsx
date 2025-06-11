import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useDepartments } from '../../hooks/useEmployees';
import { employeeService } from '../../services/employeeService';
import { Department } from '../../types/employee';

export const DepartmentList: React.FC = () => {
  const { departments, loading, error, fetchDepartments } = useDepartments();
  const [expandedDepts, setExpandedDepts] = useState<Set<string>>(new Set());
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const toggleExpanded = (deptId: string) => {
    const newExpanded = new Set(expandedDepts);
    if (newExpanded.has(deptId)) {
      newExpanded.delete(deptId);
    } else {
      newExpanded.add(deptId);
    }
    setExpandedDepts(newExpanded);
  };

  const handleDelete = async (department: Department) => {
    if (!window.confirm(`「${department.name}」を削除しますか？`)) {
      return;
    }

    try {
      setDeleteLoading(department.id);
      setDeleteError(null);
      await employeeService.deleteDepartment(department.id);
      await fetchDepartments();
    } catch (err: any) {
      setDeleteError(err.message || 'Failed to delete department');
    } finally {
      setDeleteLoading(null);
    }
  };

  // Build department hierarchy
  const buildHierarchy = (depts: Department[]): (Department & { children: Department[] })[] => {
    const deptMap = new Map<string, Department & { children: Department[] }>();
    const roots: (Department & { children: Department[] })[] = [];

    // Create map with children arrays
    depts.forEach(dept => {
      deptMap.set(dept.id, { ...dept, children: [] });
    });

    // Build hierarchy
    depts.forEach(dept => {
      const deptWithChildren = deptMap.get(dept.id)!;
      if (dept.parentId && deptMap.has(dept.parentId)) {
        deptMap.get(dept.parentId)!.children.push(deptWithChildren);
      } else {
        roots.push(deptWithChildren);
      }
    });

    return roots;
  };

  const renderDepartmentTree = (depts: (Department & { children: Department[] })[], level = 0) => {
    return depts.map(dept => (
      <div key={dept.id} className="border-b border-gray-200 last:border-b-0">
        <div className={`flex items-center py-4 px-4 hover:bg-gray-50 ${level > 0 ? 'ml-' + (level * 8) : ''}`}>
          <div className="flex-1 min-w-0">
            <div className="flex items-center">
              {dept.children.length > 0 && (
                <button
                  onClick={() => toggleExpanded(dept.id)}
                  className="mr-2 p-1 rounded hover:bg-gray-200"
                >
                  <svg
                    className={`h-4 w-4 transform transition-transform ${
                      expandedDepts.has(dept.id) ? 'rotate-90' : ''
                    }`}
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
              )}
              {level > 0 && (
                <div className="flex items-center mr-2 text-gray-400">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              )}
              <div className="flex-1">
                <div className="flex items-center">
                  <h3 className="text-sm font-medium text-gray-900">{dept.name}</h3>
                  <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {dept._count?.employees || 0}名
                  </span>
                  {!dept.isActive && (
                    <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      無効
                    </span>
                  )}
                </div>
                {dept.description && (
                  <p className="mt-1 text-sm text-gray-500">{dept.description}</p>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Link
              to={`/departments/${dept.id}`}
              className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
            >
              詳細
            </Link>
            <Link
              to={`/departments/${dept.id}/edit`}
              className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
            >
              編集
            </Link>
            <button
              onClick={() => handleDelete(dept)}
              disabled={deleteLoading === dept.id || (dept._count?.employees || 0) > 0}
              className="text-red-600 hover:text-red-900 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {deleteLoading === dept.id ? '削除中...' : '削除'}
            </button>
          </div>
        </div>
        
        {dept.children.length > 0 && expandedDepts.has(dept.id) && (
          <div className="bg-gray-50">
            {renderDepartmentTree(dept.children as (Department & { children: Department[] })[], level + 1)}
          </div>
        )}
      </div>
    ));
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
      <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
        エラーが発生しました: {error}
      </div>
    );
  }

  const hierarchicalDepts = buildHierarchy(departments);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">部署管理</h1>
          <p className="mt-1 text-sm text-gray-500">
            組織の部署構造を管理します
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <Link
            to="/departments/new"
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            新規部署作成
          </Link>
        </div>
      </div>

      {deleteError && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
          {deleteError}
        </div>
      )}

      {/* Department Tree */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              部署一覧
            </h3>
            <div className="text-sm text-gray-500">
              {departments.length}部署 / アクティブ従業員 {departments.reduce((sum, dept) => sum + (dept._count?.employees || 0), 0)}名
            </div>
          </div>
        </div>

        {hierarchicalDepts.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {renderDepartmentTree(hierarchicalDepts)}
          </div>
        ) : (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">部署がありません</h3>
            <p className="mt-1 text-sm text-gray-500">
              新しい部署を作成して組織構造を構築しましょう。
            </p>
            <div className="mt-6">
              <Link
                to="/departments/new"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                最初の部署を作成
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">総部署数</dt>
                  <dd className="text-lg font-medium text-gray-900">{departments.length}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">所属従業員数</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {departments.reduce((sum, dept) => sum + (dept._count?.employees || 0), 0)}名
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">階層レベル</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {Math.max(1, departments.filter(d => d.parentId).length > 0 ? 2 : 1)}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};