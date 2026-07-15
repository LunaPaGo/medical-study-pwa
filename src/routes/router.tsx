import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
import { RootProviders } from '../components/providers/RootProviders';
import { ProtectedRoute } from '../components/routing/ProtectedRoute';
import { AuthPage } from '../pages/AuthPage';
import { AttachmentsPage } from '../pages/AttachmentsPage';
import { DashboardPage } from '../pages/DashboardPage';
import { PlaceholderPage } from '../pages/PlaceholderPage';
import { TopicDetailPage } from '../pages/TopicDetailPage';
import { TopicFormPage } from '../pages/TopicFormPage';
import { TopicsPage } from '../pages/TopicsPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <RootProviders>
        <ProtectedRoute>
          <AppLayout />
        </ProtectedRoute>
      </RootProviders>
    ),
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'temas', element: <TopicsPage /> },
      { path: 'temas/nuevo', element: <TopicFormPage /> },
      { path: 'temas/:topicId', element: <TopicDetailPage /> },
      { path: 'temas/:topicId/editar', element: <TopicFormPage /> },
      { path: 'farmacologia', element: <PlaceholderPage title="Farmacología" stage="Etapa 3" /> },
      { path: 'buscar', element: <PlaceholderPage title="Buscador global" stage="Etapa 6" /> },
      { path: 'favoritos', element: <TopicsPage favoritesOnly /> },
      { path: 'archivos', element: <AttachmentsPage /> },
      { path: 'historial', element: <PlaceholderPage title="Historial" stage="Etapa 7" /> },
      { path: 'respaldo', element: <PlaceholderPage title="Respaldo" stage="Etapa 7" /> }
    ]
  },
  {
    path: '/auth',
    element: (
      <RootProviders>
        <AuthPage />
      </RootProviders>
    )
  },
  { path: '*', element: <Navigate to="/" replace /> }
]);
