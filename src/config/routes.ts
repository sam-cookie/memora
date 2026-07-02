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
  actionItems: '/action-items',
  calendar: '/calendar',
  analytics: '/analytics',
  settings: '/settings',
  settingsProfile: '/settings/profile',
  settingsAccount: '/settings/account',
  settingsNotifications: '/settings/notifications',

  workspaces: '/workspaces',
  participants: '/participants',
  participant: (id: string) => `/participants/${id}`,

  // Errors
  notFound: '/404',
  serverError: '/500',
} as const

export type RouteKey = keyof typeof ROUTES
