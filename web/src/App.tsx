import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { LoginPage } from '@/pages/LoginPage';
import { ApplicationsPage } from '@/pages/ApplicationsPage';
import { ProfilePage } from '@/pages/ProfilePage';
import { ContactsPage } from '@/pages/ContactsPage';
import { ActionItemsPage } from '@/pages/ActionItemsPage';
import { RadarPage } from '@/pages/RadarPage';
import { WatchlistPage } from '@/pages/WatchlistPage';
import { PlaybookPage } from '@/pages/PlaybookPage';
import { Spinner } from '@/components/Spinner';
import { UpdateBanner } from '@/components/UpdateBanner';
import { isJobSearchEnabled } from '@/lib/features';

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
      <Route
        path="/radar"
        element={isJobSearchEnabled ? <RadarPage /> : <Navigate to="/applications" replace />}
      />
      <Route path="/watchlist"     element={<WatchlistPage />} />
      <Route path="/action-items"  element={<ActionItemsPage />} />
      <Route path="/playbook"      element={<PlaybookPage />} />

      {/* Hamburger menu pages */}
      <Route path="/profile"       element={<ProfilePage />} />

      {/* Redirects from old routes */}
      <Route path="/"              element={<Navigate to="/applications" replace />} />
      <Route path="/today"         element={<Navigate to="/applications" replace />} />
      <Route path="/dashboard"     element={<Navigate to="/applications" replace />} />
      <Route path="/interviews"    element={<Navigate to="/applications" replace />} />
      <Route path="/notifications" element={<Navigate to="/applications" replace />} />
      <Route
        path="/job-boards"
        element={<Navigate to={isJobSearchEnabled ? '/radar' : '/applications'} replace />}
      />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/applications" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <>
      <UpdateBanner />
      <AppRoutes />
    </>
  );
}
