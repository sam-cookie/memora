import { createBrowserRouter } from 'react-router-dom'
import { ROUTES } from '@/config/routes'
import { AppLayout } from '@/components/layouts/AppLayout'
import { AuthLayout } from '@/components/layouts/AuthLayout'
import { ProtectedRoute } from '@/components/common/ProtectedRoute'
import { NotFoundPage } from '@/components/common/NotFoundPage'
import { lazy, Suspense } from 'react'
import { PageLoader } from '@/components/common/PageLoader'

// Lazy-loaded pages
const LoginPage = lazy(() =>
  import('@/features/auth/pages/LoginPage').then((m) => ({ default: m.LoginPage })),
)
const RegisterPage = lazy(() =>
  import('@/features/auth/pages/RegisterPage').then((m) => ({ default: m.RegisterPage })),
)
const ForgotPasswordPage = lazy(() =>
  import('@/features/auth/pages/ForgotPasswordPage').then((m) => ({ default: m.ForgotPasswordPage })),
)
const ResetPasswordPage = lazy(() =>
  import('@/features/auth/pages/ResetPasswordPage').then((m) => ({ default: m.ResetPasswordPage })),
)
const DashboardPage = lazy(() =>
  import('@/features/dashboard/pages/DashboardPage').then((m) => ({ default: m.DashboardPage })),
)
const MeetingsPage = lazy(() =>
  import('@/features/meetings/pages/MeetingsPage').then((m) => ({ default: m.MeetingsPage })),
)
const MeetingDetailPage = lazy(() =>
  import('@/features/meetings/pages/MeetingDetailPage').then((m) => ({ default: m.MeetingDetailPage })),
)
const NewMeetingPage = lazy(() =>
  import('@/features/meetings/pages/NewMeetingPage').then((m) => ({ default: m.NewMeetingPage })),
)
const SettingsPage = lazy(() =>
  import('@/features/settings/pages/SettingsPage').then((m) => ({ default: m.SettingsPage })),
)
const SearchPage = lazy(() =>
  import('@/features/search/pages/SearchPage').then((m) => ({ default: m.SearchPage })),
)
const AnalyticsPage = lazy(() =>
  import('@/features/analytics/pages/AnalyticsPage').then((m) => ({ default: m.AnalyticsPage })),
)

function withSuspense(Component: React.ComponentType) {
  return (
    <Suspense fallback={<PageLoader />}>
      <Component />
    </Suspense>
  )
}

export const router = createBrowserRouter([
  // Auth routes
  {
    element: <AuthLayout />,
    children: [
      { path: ROUTES.login, element: withSuspense(LoginPage) },
      { path: ROUTES.register, element: withSuspense(RegisterPage) },
      { path: ROUTES.forgotPassword, element: withSuspense(ForgotPasswordPage) },
      { path: ROUTES.resetPassword, element: withSuspense(ResetPasswordPage) },
    ],
  },
  // Protected app routes
  {
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      { path: ROUTES.home, element: withSuspense(DashboardPage) },
      { path: ROUTES.dashboard, element: withSuspense(DashboardPage) },
      { path: ROUTES.meetings, element: withSuspense(MeetingsPage) },
      { path: '/meetings/:id', element: withSuspense(MeetingDetailPage) },
      { path: ROUTES.meetingNew, element: withSuspense(NewMeetingPage) },
      { path: ROUTES.search, element: withSuspense(SearchPage) },
      { path: ROUTES.analytics, element: withSuspense(AnalyticsPage) },
      { path: ROUTES.settings, element: withSuspense(SettingsPage) },
      { path: `${ROUTES.settings}/:tab`, element: withSuspense(SettingsPage) },
    ],
  },
  // Catch-all
  { path: '*', element: <NotFoundPage /> },
])
