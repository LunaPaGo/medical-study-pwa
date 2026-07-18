import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
import { RootProviders } from '../components/providers/RootProviders';
import { ProtectedRoute } from '../components/routing/ProtectedRoute';
import { AuthPage } from '../pages/AuthPage';
import { AttachmentsPage } from '../pages/AttachmentsPage';
import { DashboardPage } from '../pages/DashboardPage';
import { BackupPage } from '../features/backups/BackupPage';
import { CalculatorsPage } from '../features/calculators/CalculatorsPage';
import { FavoritesPage } from '../pages/FavoritesPage';
import { MedicationComparePage } from '../pages/MedicationComparePage';
import { MedicationDetailPage } from '../pages/MedicationDetailPage';
import { MedicationFormPage } from '../pages/MedicationFormPage';
import { MedicationsPage } from '../pages/MedicationsPage';
import { PlaceholderPage } from '../pages/PlaceholderPage';
import { ProcedureDetailPage } from '../pages/ProcedureDetailPage';
import { ProcedureFormPage } from '../pages/ProcedureFormPage';
import { ProceduresPage } from '../pages/ProceduresPage';
import { SearchPage } from '../pages/SearchPage';
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
      { path: 'farmacologia', element: <MedicationsPage /> },
      { path: 'farmacologia/nuevo', element: <MedicationFormPage /> },
      { path: 'farmacologia/comparar', element: <MedicationComparePage /> },
      { path: 'farmacologia/:medicationId', element: <MedicationDetailPage /> },
      { path: 'farmacologia/:medicationId/editar', element: <MedicationFormPage /> },
      { path: 'procedimientos', element: <ProceduresPage /> },
      { path: 'procedimientos/nuevo', element: <ProcedureFormPage /> },
      { path: 'procedimientos/:procedureId', element: <ProcedureDetailPage /> },
      { path: 'procedimientos/:procedureId/editar', element: <ProcedureFormPage /> },
      { path: 'calculadoras', element: <CalculatorsPage /> },
      { path: 'buscar', element: <SearchPage /> },
      { path: 'favoritos', element: <FavoritesPage /> },
      { path: 'archivos', element: <AttachmentsPage /> },
      { path: 'historial', element: <PlaceholderPage title="Historial" stage="Etapa 7" /> },
      { path: 'respaldo', element: <BackupPage /> }
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
