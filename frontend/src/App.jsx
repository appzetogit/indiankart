import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import UserRoutes from './modules/user/routes/UserRoutes';
import AdminRoutes from './modules/admin/routes/AdminRoutes';
import { useAuthStore } from './modules/user/store/authStore';
import { requestForToken, onMessageListener } from './services/firebase';
import './App.css';

import { Toaster } from 'react-hot-toast';
import toast from 'react-hot-toast';
import ScrollToTop from './components/common/ScrollToTop';

function App() {
  const checkAuth = useAuthStore((state) => state.checkAuth);

  useEffect(() => {
    checkAuth();

    // Firebase Push Notifications
    requestForToken();
    onMessageListener().then(payload => {
      toast.success(`${payload.notification.title}: ${payload.notification.body}`, {
        duration: 5000,
        position: 'top-right'
      });
      console.log('Received foreground message: ', payload);
    }).catch(err => console.log('failed: ', err));
  }, [checkAuth]);

  return (
    <Router>
      <ScrollToTop />
      <Toaster position="top-right" reverseOrder={false} />
      <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet" />
      <link href="https://fonts.googleapis.com/icon?family=Material+Icons+Outlined" rel="stylesheet" />
      <link href="https://fonts.googleapis.com/icon?family=Material+Icons+Round" rel="stylesheet" />
      <Routes>
        <Route path="/admin/*" element={<AdminRoutes />} />
        <Route path="/*" element={<UserRoutes />} />
      </Routes>
    </Router>
  );
}

export default App;
