import {
  createBrowserRouter,
  Navigate,
  RouterProvider,
} from 'react-router-dom';
import { AppShell } from '@/components/layout/app-shell';
import { LoginPage } from '@/features/auth/login-page';
import { CalendarPage } from '@/features/cases/calendar-page';
import { CaseDetailPage } from '@/features/cases/case-detail-page';
import { NewCasePage } from '@/features/cases/new-case-page';
import { ProtectedRoute } from './protected-route';

const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppShell />,
        children: [
          { index: true, element: <CalendarPage /> },
          { path: 'casos/novo', element: <NewCasePage /> },
          { path: 'casos/:id', element: <CaseDetailPage /> },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
