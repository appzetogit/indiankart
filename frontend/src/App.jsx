import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { lazy, Suspense, useEffect } from 'react';
import { useAuthStore } from './modules/user/store/authStore';
import { requestForToken, onMessageListener } from './services/firebase';
import './App.css';

import { Toaster } from 'react-hot-toast';
import toast from 'react-hot-toast';
import ScrollToTop from './components/common/ScrollToTop';
import LenisProvider from './components/common/LenisProvider';
import Loader from './components/common/Loader';

const UserRoutes = lazy(() => import('./modules/user/routes/UserRoutes'));
const AdminRoutes = lazy(() => import('./modules/admin/routes/AdminRoutes'));

function App() {
  const checkAuth = useAuthStore((state) => state.checkAuth);

  useEffect(() => {
    checkAuth();

    // Firebase Push Notifications
    requestForToken();
    onMessageListener().then(payload => {
      if (!payload?.notification) return;

      toast.success(`${payload.notification.title}: ${payload.notification.body}`, {
        duration: 5000,
        position: 'top-right'
      });
      console.log('Received foreground message: ', payload);
    }).catch(err => console.log('failed: ', err));
  }, [checkAuth]);

  return (
    <Router>
      <LenisProvider>
        <ScrollToTop />
        <Toaster position="top-right" reverseOrder={false} />
        <Suspense fallback={<Loader fullPage message="Loading page..." variant="shimmer" />}>
          <Routes>
            <Route path="/admin/*" element={<AdminRoutes />} />
            <Route path="/*" element={<UserRoutes />} />
          </Routes>
        </Suspense>
      </LenisProvider>
    </Router>
  );
}

export default App;
