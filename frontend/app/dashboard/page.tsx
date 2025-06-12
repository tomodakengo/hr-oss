'use client'

import { DashboardOverview } from '../../src/components/dashboard/DashboardOverview'
import { ProtectedRoute } from '../../src/components/auth/ProtectedRoute'
import { Layout } from '../../src/components/layout/Layout'

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <Layout>
        <DashboardOverview />
      </Layout>
    </ProtectedRoute>
  )
}