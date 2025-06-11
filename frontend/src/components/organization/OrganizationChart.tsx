import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDepartments, usePositions } from '../../hooks/useEmployees';
import { employeeService } from '../../services/employeeService';
import { Department, Position, Employee } from '../../types/employee';

interface OrganizationNode {
  id: string;
  name: string;
  type: 'department' | 'position';
  level: number;
  employees?: Employee[];
  employeeCount: number;
  children: OrganizationNode[];
  department?: Department;
  position?: Position;
}

export const OrganizationChart: React.FC = () => {
  const { departments, loading: deptsLoading } = useDepartments();
  const { positions, loading: positionsLoading } = usePositions();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'departments' | 'full'>('departments');

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        setLoading(true);
        const response = await employeeService.getEmployees({ limit: 1000 });
        setEmployees(response.data.employees);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch employees');
      } finally {
        setLoading(false);
      }
    };

    if (!deptsLoading && !positionsLoading) {
      fetchEmployees();
    }
  }, [deptsLoading, positionsLoading]);

  const toggleExpanded = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  const buildOrganizationTree = (): OrganizationNode[] => {
    if (viewMode === 'departments') {
      return buildDepartmentTree();
    } else {
      return buildFullTree();
    }
  };

  const buildDepartmentTree = (): OrganizationNode[] => {
    const deptMap = new Map<string, OrganizationNode>();
    const roots: OrganizationNode[] = [];

    // Create department nodes
    departments.forEach(dept => {
      const deptEmployees = employees.filter(emp => emp.department?.id === dept.id);
      const node: OrganizationNode = {
        id: dept.id,
        name: dept.name,
        type: 'department',
        level: 0,
        employeeCount: deptEmployees.length,
        employees: deptEmployees,
        children: [],
        department: dept,
      };
      deptMap.set(dept.id, node);
    });

    // Build hierarchy
    departments.forEach(dept => {
      const node = deptMap.get(dept.id)!;
      if (dept.parentId && deptMap.has(dept.parentId)) {
        const parent = deptMap.get(dept.parentId)!;
        node.level = parent.level + 1;
        parent.children.push(node);
      } else {
        roots.push(node);
      }
    });

    return roots;
  };

  const buildFullTree = (): OrganizationNode[] => {
    const deptNodes = buildDepartmentTree();
    
    // Add positions as children of departments
    const addPositions = (nodes: OrganizationNode[]): OrganizationNode[] => {
      return nodes.map(node => {
        if (node.type === 'department' && node.department) {
          const deptPositions = positions.filter(pos => pos.department.id === node.department!.id);
          const positionNodes: OrganizationNode[] = deptPositions.map(pos => {
            const posEmployees = employees.filter(emp => emp.position?.id === pos.id);
            return {
              id: `pos-${pos.id}`,
              name: pos.name,
              type: 'position',
              level: node.level + 1,
              employeeCount: posEmployees.length,
              employees: posEmployees,
              children: [],
              position: pos,
            };
          });

          // Add employees without specific positions
          const employeesWithoutPosition = employees.filter(
            emp => emp.department?.id === node.department!.id && !emp.position
          );

          if (employeesWithoutPosition.length > 0) {
            positionNodes.push({
              id: `dept-${node.department!.id}-unassigned`,
              name: '未配属',
              type: 'position',
              level: node.level + 1,
              employeeCount: employeesWithoutPosition.length,
              employees: employeesWithoutPosition,
              children: [],
            });
          }

          return {
            ...node,
            children: [...addPositions(node.children), ...positionNodes],
          };
        }
        return {
          ...node,
          children: addPositions(node.children),
        };
      });
    };

    return addPositions(deptNodes);
  };

  const renderNode = (node: OrganizationNode, isLast = false) => {
    const hasChildren = node.children.length > 0;
    const isExpanded = expandedNodes.has(node.id);

    return (
      <div key={node.id} className="relative">
        {/* Node */}
        <div className="flex items-center space-x-2 py-2">
          {/* Tree lines */}
          <div className="flex items-center">
            {node.level > 0 && (
              <div className="w-6 h-6 flex items-center justify-center">
                <div className="w-3 h-px bg-gray-300"></div>
              </div>
            )}
            
            {/* Expand/collapse button */}
            {hasChildren && (
              <button
                onClick={() => toggleExpanded(node.id)}
                className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-600 focus:outline-none"
              >
                <svg
                  className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}
            
            {!hasChildren && <div className="w-6"></div>}
          </div>

          {/* Node content */}
          <div className={`flex-1 min-w-0 p-3 rounded-lg border-2 transition-colors ${
            node.type === 'department' 
              ? 'bg-blue-50 border-blue-200 hover:bg-blue-100' 
              : 'bg-green-50 border-green-200 hover:bg-green-100'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  {/* Icon */}
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                    node.type === 'department' ? 'bg-blue-200' : 'bg-green-200'
                  }`}>
                    {node.type === 'department' ? (
                      <svg className="w-4 h-4 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    )}
                  </div>

                  {/* Name and link */}
                  <div className="flex-1 min-w-0">
                    {node.department ? (
                      <Link
                        to={`/departments/${node.department.id}`}
                        className="text-sm font-medium text-gray-900 hover:text-blue-600 truncate"
                      >
                        {node.name}
                      </Link>
                    ) : node.position ? (
                      <Link
                        to={`/positions/${node.position.id}`}
                        className="text-sm font-medium text-gray-900 hover:text-green-600 truncate"
                      >
                        {node.name}
                      </Link>
                    ) : (
                      <span className="text-sm font-medium text-gray-900 truncate">{node.name}</span>
                    )}
                    
                    {/* Additional info */}
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {node.employeeCount}名
                      </span>
                      
                      {node.position?.level && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          レベル {node.position.level}
                        </span>
                      )}
                      
                      {node.position?.baseSalary && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          {new Intl.NumberFormat('ja-JP', {
                            style: 'currency',
                            currency: 'JPY',
                            minimumFractionDigits: 0,
                          }).format(node.position.baseSalary)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Employee list preview */}
                {node.employees && node.employees.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {node.employees.slice(0, 5).map(emp => (
                      <Link
                        key={emp.id}
                        to={`/employees/${emp.id}`}
                        className="inline-flex items-center px-2 py-1 rounded text-xs bg-white border border-gray-200 hover:bg-gray-50 text-gray-700"
                      >
                        {emp.lastName} {emp.firstName}
                      </Link>
                    ))}
                    {node.employees.length > 5 && (
                      <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-200 text-gray-600">
                        +{node.employees.length - 5}名
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Children */}
        {hasChildren && isExpanded && (
          <div className="ml-8 border-l-2 border-gray-200 pl-4">
            {node.children.map((child, index) => 
              renderNode(child, index === node.children.length - 1)
            )}
          </div>
        )}
      </div>
    );
  };

  if (loading || deptsLoading || positionsLoading) {
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

  const organizationTree = buildOrganizationTree();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">組織図</h1>
          <p className="mt-1 text-sm text-gray-500">
            組織の階層構造と配属状況を可視化します
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <div className="flex space-x-2">
            <button
              onClick={() => setViewMode('departments')}
              className={`px-4 py-2 text-sm font-medium rounded-md ${
                viewMode === 'departments'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              部署のみ
            </button>
            <button
              onClick={() => setViewMode('full')}
              className={`px-4 py-2 text-sm font-medium rounded-md ${
                viewMode === 'full'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              部署・役職
            </button>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setExpandedNodes(new Set(departments.map(d => d.id)))}
              className="text-sm text-indigo-600 hover:text-indigo-500"
            >
              すべて展開
            </button>
            <button
              onClick={() => setExpandedNodes(new Set())}
              className="text-sm text-indigo-600 hover:text-indigo-500"
            >
              すべて折りたたみ
            </button>
          </div>
          
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-200 rounded"></div>
              <span>部署</span>
            </div>
            {viewMode === 'full' && (
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-200 rounded"></div>
                <span>役職</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Organization Tree */}
      <div className="bg-white shadow rounded-lg p-6">
        {organizationTree.length > 0 ? (
          <div className="space-y-2">
            {organizationTree.map(node => renderNode(node))}
          </div>
        ) : (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">組織データがありません</h3>
            <p className="mt-1 text-sm text-gray-500">
              部署や役職を作成して組織図を構築しましょう。
            </p>
            <div className="mt-6 flex justify-center space-x-3">
              <Link
                to="/departments/new"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                部署を作成
              </Link>
              <Link
                to="/positions/new"
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                役職を作成
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">総役職数</dt>
                  <dd className="text-lg font-medium text-gray-900">{positions.length}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">総従業員数</dt>
                  <dd className="text-lg font-medium text-gray-900">{employees.length}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">階層レベル</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {Math.max(...departments.map(d => {
                      let level = 1;
                      let currentDept = d;
                      while (currentDept.parentId) {
                        level++;
                        currentDept = departments.find(parent => parent.id === currentDept.parentId) || currentDept;
                        if (level > 10) break; // Prevent infinite loop
                      }
                      return level;
                    }))}
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