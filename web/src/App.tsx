import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { LoginPage } from '@/pages/LoginPage';
import { ApplicationsPage } from '@/pages/ApplicationsPage';
import { ProfilePage } from '@/pages/ProfilePage';
import { JobBoardsPage } from '@/pages/JobBoardsPage';
import { ContactsPage } from '@/pages/ContactsPage';
import { InterviewsPage } from '@/pages/InterviewsPage';
import { ActionItemsPage } from '@/pages/ActionItemsPage';
import { PlaybookPage } from '@/pages/PlaybookPage';
import { NotificationsPage } from '@/pages/NotificationsPage';
import { Spinner } from '@/components/Spinner';

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner size="xl" />
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return (
    <Routes>
      {/* Primary tabs */}
      <Route path="/applications"  element={<ApplicationsPage />} />
      <Route path="/contacts"      element={<ContactsPage />} />
      <Route path="/interviews"    element={<InterviewsPage />} />
      <Route path="/action-items"  element={<ActionItemsPage />} />

      {/* Hamburger menu pages */}
      <Route path="/job-boards"    element={<JobBoardsPage />} />
      <Route path="/playbook"      element={<PlaybookPage />} />
      <Route path="/notifications" element={<NotificationsPage />} />
      <Route path="/profile"       element={<ProfilePage />} />

      {/* Redirects from old routes */}
      <Route path="/"          element={<Navigate to="/applications" replace />} />
      <Route path="/dashboard" element={<Navigate to="/applications" replace />} />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/applications" replace />} />
    </Routes>
  );
}

export default function App() {
  return <AppRoutes />;
}
