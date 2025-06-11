import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { employeeService } from '../../services/employeeService';
import { Employee, EmployeeStatus, EmploymentType, Gender } from '../../types/employee';

export const EmployeeDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEmployee = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        setError(null);
        const data = await employeeService.getEmployee(id);
        setEmployee(data);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch employee');
      } finally {
        setLoading(false);
      }
    };

    fetchEmployee();
  }, [id]);

  const handleDelete = async () => {
    if (!employee || !id) return;
    
    if (window.confirm(`${employee.lastName} ${employee.firstName}さんを退職処理しますか？`)) {
      try {
        await employeeService.deleteEmployee(id);
        navigate('/employees');
      } catch (err: any) {
        setError(err.message || 'Failed to delete employee');
      }
    }
  };

  const getStatusLabel = (status: EmployeeStatus) => {
    switch (status) {
      case EmployeeStatus.ACTIVE: return '在職';
      case EmployeeStatus.INACTIVE: return '休職';
      case EmployeeStatus.RESIGNED: return '退職';
      case EmployeeStatus.TERMINATED: return '解雇';
      default: return status;
    }
  };

  const getEmploymentTypeLabel = (type: EmploymentType) => {
    switch (type) {
      case EmploymentType.FULL_TIME: return '正社員';
      case EmploymentType.PART_TIME: return 'パート';
      case EmploymentType.CONTRACT: return '契約社員';
      case EmploymentType.INTERN: return 'インターン';
      default: return type;
    }
  };

  const getGenderLabel = (gender?: Gender) => {
    switch (gender) {
      case Gender.MALE: return '男性';
      case Gender.FEMALE: return '女性';
      case Gender.OTHER: return 'その他';
      default: return '未設定';
    }
  };

  const getStatusBadgeColor = (status: EmployeeStatus) => {
    switch (status) {
      case EmployeeStatus.ACTIVE: return 'bg-green-100 text-green-800';
      case EmployeeStatus.INACTIVE: return 'bg-yellow-100 text-yellow-800';
      case EmployeeStatus.RESIGNED: return 'bg-gray-100 text-gray-800';
      case EmployeeStatus.TERMINATED: return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
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

  if (!employee) {
    return (
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="text-center">
          <h3 className="mt-2 text-sm font-medium text-gray-900">従業員が見つかりません</h3>
          <div className="mt-6">
            <Link
              to="/employees"
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
            >
              従業員一覧に戻る
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
                    {employee.lastName} {employee.firstName}
                  </span>
                </div>
              </li>
            </ol>
          </nav>
          <h1 className="mt-2 text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            {employee.lastName} {employee.firstName}
          </h1>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4">
          <Link
            to={`/employees/${employee.id}/edit`}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            編集
          </Link>
          <button
            onClick={handleDelete}
            className="ml-3 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            退職処理
          </button>
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 h-20 w-20">
              <div className="h-20 w-20 rounded-full bg-indigo-100 flex items-center justify-center">
                <span className="text-xl font-medium text-indigo-700">
                  {employee.lastName.charAt(0)}{employee.firstName.charAt(0)}
                </span>
              </div>
            </div>
            <div className="ml-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                {employee.lastName} {employee.firstName}
                {employee.lastNameKana && employee.firstNameKana && (
                  <span className="ml-2 text-sm text-gray-500">
                    ({employee.lastNameKana} {employee.firstNameKana})
                  </span>
                )}
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                {employee.department?.name || '未配属'} {employee.position?.name && `・ ${employee.position.name}`}
              </p>
              <div className="mt-2">
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(employee.status)}`}>
                  {getStatusLabel(employee.status)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200">
          <dl>
            {/* 基本情報 */}
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-900 col-span-3 mb-4">基本情報</dt>
            </div>
            
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">社員番号</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{employee.employeeNumber}</dd>
            </div>
            
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">メールアドレス</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                <a href={`mailto:${employee.email}`} className="text-indigo-600 hover:text-indigo-500">
                  {employee.email}
                </a>
              </dd>
            </div>
            
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">生年月日</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {employee.birthDate ? new Date(employee.birthDate).toLocaleDateString('ja-JP') : '未設定'}
              </dd>
            </div>
            
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">性別</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{getGenderLabel(employee.gender)}</dd>
            </div>

            {/* 連絡先情報 */}
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-900 col-span-3 mb-4">連絡先情報</dt>
            </div>
            
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">電話番号</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {employee.phone ? (
                  <a href={`tel:${employee.phone}`} className="text-indigo-600 hover:text-indigo-500">
                    {employee.phone}
                  </a>
                ) : '未設定'}
              </dd>
            </div>
            
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">携帯電話</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {employee.mobile ? (
                  <a href={`tel:${employee.mobile}`} className="text-indigo-600 hover:text-indigo-500">
                    {employee.mobile}
                  </a>
                ) : '未設定'}
              </dd>
            </div>
            
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">住所</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {employee.postalCode && <div>〒{employee.postalCode}</div>}
                {employee.address || '未設定'}
              </dd>
            </div>

            {/* 雇用情報 */}
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-900 col-span-3 mb-4">雇用情報</dt>
            </div>
            
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">入社日</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {new Date(employee.hireDate).toLocaleDateString('ja-JP')}
              </dd>
            </div>
            
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">雇用形態</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {getEmploymentTypeLabel(employee.employmentType)}
              </dd>
            </div>
            
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">所属部署</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {employee.department?.name || '未配属'}
              </dd>
            </div>
            
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">役職</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {employee.position ? (
                  <div>
                    {employee.position.name}
                    {employee.position.level && (
                      <span className="ml-2 text-gray-500">レベル {employee.position.level}</span>
                    )}
                  </div>
                ) : '未設定'}
              </dd>
            </div>

            {/* 緊急連絡先 */}
            {(employee.emergencyContact || employee.emergencyPhone) && (
              <>
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-900 col-span-3 mb-4">緊急連絡先</dt>
                </div>
                
                <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">緊急連絡先</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {employee.emergencyContact || '未設定'}
                  </dd>
                </div>
                
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">緊急連絡先電話番号</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {employee.emergencyPhone ? (
                      <a href={`tel:${employee.emergencyPhone}`} className="text-indigo-600 hover:text-indigo-500">
                        {employee.emergencyPhone}
                      </a>
                    ) : '未設定'}
                  </dd>
                </div>
              </>
            )}

            {/* 退職情報 */}
            {employee.resignationDate && (
              <>
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-900 col-span-3 mb-4">退職情報</dt>
                </div>
                
                <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">退職日</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {new Date(employee.resignationDate).toLocaleDateString('ja-JP')}
                  </dd>
                </div>
              </>
            )}
          </dl>
        </div>
      </div>

      {/* 最近の勤怠記録 */}
      {employee.attendances && employee.attendances.length > 0 && (
        <div className="mt-6">
          <div className="bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">最近の勤怠記録</h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">直近10件の勤怠記録を表示しています</p>
            </div>
            <div className="border-t border-gray-200">
              <div className="overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">日付</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">出勤時刻</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">退勤時刻</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">労働時間</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ステータス</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {employee.attendances.map((attendance) => (
                      <tr key={attendance.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(attendance.date).toLocaleDateString('ja-JP')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {attendance.clockIn ? new Date(attendance.clockIn).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }) : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {attendance.clockOut ? new Date(attendance.clockOut).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }) : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {attendance.workHours ? `${attendance.workHours}時間` : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                            {attendance.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};