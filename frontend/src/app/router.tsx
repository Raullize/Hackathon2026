import {
  createBrowserRouter,
  Navigate,
  RouterProvider,
} from 'react-router-dom';
import { AppShell } from '@/components/layout/app-shell';
import { AlertsPage } from '@/pages/alerts-page';
import { CalendarPage } from '@/pages/calendar-page';
import { CaseDetailPage } from '@/pages/case-detail-page';
import { ClosedPage } from '@/pages/closed-page';
import { LoginPage } from '@/pages/login-page';
import { NewCasePage } from '@/pages/new-case-page';
import { PatientPage } from '@/pages/patient-page';
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
