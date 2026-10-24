import {
  createBrowserRouter,
  Navigate,
  RouterProvider,
} from 'react-router-dom';
import { AppShell } from '@/components/layout/app-shell';
import { LoginPage } from '@/features/auth/login-page';
import { AlertsPage } from '@/features/cases/alerts-page';
import { CalendarPage } from '@/features/cases/calendar-page';
import { CaseDetailPage } from '@/features/cases/case-detail-page';
import { ClosedPage } from '@/features/cases/closed-page';
import { NewCasePage } from '@/features/cases/new-case-page';
import { PatientPage } from '@/features/cases/patient-page';
import { ProtectedRoute } from './protected-route';

const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  { path: '/p/:token', element: <PatientPage /> },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppShell />,
        children: [
          { index: true, element: <CalendarPage /> },
          { path: 'casos/novo', element: <NewCasePage /> },
          { path: 'alertas', element: <AlertsPage /> },
          { path: 'concluidos', element: <ClosedPage /> },
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
