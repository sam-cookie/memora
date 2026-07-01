export const ROUTES = {
  // Public
  home: '/',
  login: '/login',
  register: '/register',
  forgotPassword: '/forgot-password',
  resetPassword: '/reset-password',

  // Protected
  dashboard: '/dashboard',
  meetings: '/meetings',
  meeting: (id: string) => `/meetings/${id}`,
  meetingNew: '/meetings/new',
  search: '/search',
  settings: '/settings',
  settingsProfile: '/settings/profile',
  settingsAccount: '/settings/account',
  settingsNotifications: '/settings/notifications',

  // Errors
  notFound: '/404',
  serverError: '/500',
} as const

export type RouteKey = keyof typeof ROUTES
