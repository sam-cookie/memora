import { createBrowserRouter } from 'react-router-dom'
import { ROUTES } from '@/config/routes'
import { AppLayout } from '@/components/layouts/AppLayout'
import { AuthLayout } from '@/components/layouts/AuthLayout'
import { ProtectedRoute } from '@/components/common/ProtectedRoute'
import { NotFoundPage } from '@/components/common/NotFoundPage'
import { lazy, Suspense } from 'react'
import { PageLoader } from '@/components/common/PageLoader'

// Lazy-loaded pages
const LandingPage = lazy(() =>
  import('@/features/landing/pages/LandingPage').then((m) => ({ default: m.LandingPage })),
)
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
const ActionItemsPage = lazy(() =>
  import('@/features/action-items/pages/ActionItemsPage').then((m) => ({ default: m.ActionItemsPage })),
)
const CalendarPage = lazy(() =>
  import('@/features/calendar/pages/CalendarPage').then((m) => ({ default: m.CalendarPage })),
)
const WorkspacesPage = lazy(() =>
  import('@/features/workspaces/pages/WorkspacesPage').then((m) => ({ default: m.WorkspacesPage })),
)
const ParticipantsPage = lazy(() =>
  import('@/features/participants/pages/ParticipantsPage').then((m) => ({ default: m.ParticipantsPage })),
)
const ParticipantProfilePage = lazy(() =>
  import('@/features/participants/pages/ParticipantProfilePage').then((m) => ({ default: m.ParticipantProfilePage })),
)

function withSuspense(Component: React.ComponentType) {
  return (
    <Suspense fallback={<PageLoader />}>
      <Component />
    </Suspense>
  )
}

export const router = createBrowserRouter([
  // Public landing page — handles its own auth redirect
  { path: ROUTES.home, element: withSuspense(LandingPage) },

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
      { path: ROUTES.dashboard, element: withSuspense(DashboardPage) },
      { path: ROUTES.meetings, element: withSuspense(MeetingsPage) },
      { path: '/meetings/:id', element: withSuspense(MeetingDetailPage) },
      { path: ROUTES.meetingNew, element: withSuspense(NewMeetingPage) },
      { path: ROUTES.search, element: withSuspense(SearchPage) },
      { path: ROUTES.actionItems, element: withSuspense(ActionItemsPage) },
      { path: ROUTES.calendar, element: withSuspense(CalendarPage) },
      { path: ROUTES.analytics, element: withSuspense(AnalyticsPage) },
      { path: ROUTES.settings, element: withSuspense(SettingsPage) },
      { path: `${ROUTES.settings}/:tab`, element: withSuspense(SettingsPage) },
      { path: ROUTES.workspaces, element: withSuspense(WorkspacesPage) },
      { path: ROUTES.participants, element: withSuspense(ParticipantsPage) },
      { path: `${ROUTES.participants}/:id`, element: withSuspense(ParticipantProfilePage) },
    ],
  },

  // Catch-all
  { path: '*', element: <NotFoundPage /> },
])
