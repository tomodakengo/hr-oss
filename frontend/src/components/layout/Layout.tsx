'use client'

import React from 'react';
import Link from 'next/link';
import { useAuth } from '../../contexts/AuthContext';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <nav className="bg-white/80 backdrop-blur-lg border-b border-white/20 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-8">
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 515.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">HR-OSS</h1>
              </div>
              <div className="hidden md:flex space-x-1">
                <Link href="/dashboard" className="text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200">
                  ダッシュボード
                </Link>
                <Link href="/employees" className="text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200">
                  従業員管理
                </Link>
                <Link href="/departments" className="text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200">
                  部署管理
                </Link>
                <Link href="/positions" className="text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200">
                  役職管理
                </Link>
                <Link href="/organization" className="text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200">
                  組織図
                </Link>
                <Link href="/attendance" className="text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200">
                  勤怠管理
                </Link>
                <Link href="/payroll" className="text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200">
                  給与管理
                </Link>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                <span className="font-medium">{user?.lastName} {user?.firstName}</span>
                <span className="text-gray-400 ml-1">({user?.company.name})</span>
              </div>
              <button
                onClick={logout}
                className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                ログアウト
              </button>
            </div>
          </div>
        </div>
      </nav>
      
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
};