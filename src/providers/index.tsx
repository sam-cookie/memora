import type { ReactNode } from 'react'
import { RouterProvider } from 'react-router-dom'
import { QueryProvider } from './QueryProvider'
import { AuthProvider } from './AuthProvider'
import { ThemeProvider } from './ThemeProvider'
import { WorkspaceProvider } from './WorkspaceProvider'
import { Toaster } from '@/components/ui/toaster'
import { router } from '@/router'

interface RootProviderProps {
  children?: ReactNode
}

export function RootProvider(_props: RootProviderProps) {
  return (
    <ThemeProvider defaultTheme="dark">
      <QueryProvider>
        <AuthProvider>
          <WorkspaceProvider>
            <RouterProvider router={router} />
            <Toaster />
          </WorkspaceProvider>
        </AuthProvider>
      </QueryProvider>
    </ThemeProvider>
  )
}
