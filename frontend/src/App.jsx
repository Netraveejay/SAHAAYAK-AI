import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { Layout } from './components/Layout';
import { warmupSpeech } from './utils/speak';
import Login from './pages/Login';
import Home from './pages/Home';
import Profiles from './pages/Profiles';
import ProfileForm from './pages/ProfileForm';
import Schemes from './pages/Schemes';
import SchemeDetails from './pages/SchemeDetails';
import Documents from './pages/Documents';
import ApplicationTracker from './pages/ApplicationTracker';
import Recommendations from './pages/Recommendations';

function PrivateRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
}

export default function App() {
  useEffect(() => {
    const run = () => {
      warmupSpeech();
      document.removeEventListener('click', run);
      document.removeEventListener('touchstart', run);
      document.removeEventListener('keydown', run);
    };
    document.addEventListener('click', run, { once: true });
    document.addEventListener('touchstart', run, { once: true });
    document.addEventListener('keydown', run, { once: true });
  }, []);

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <Layout>
              <Home />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/profiles"
        element={
          <PrivateRoute>
            <Layout>
              <Profiles />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/profiles/new"
        element={
          <PrivateRoute>
            <Layout>
              <ProfileForm />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/profiles/edit/:id"
        element={
          <PrivateRoute>
            <Layout>
              <ProfileForm edit />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/schemes"
        element={
          <PrivateRoute>
            <Layout>
              <Schemes />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/schemes/:id"
        element={
          <PrivateRoute>
            <Layout>
              <SchemeDetails />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/documents"
        element={
          <PrivateRoute>
            <Layout>
              <Documents />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/applications"
        element={
          <PrivateRoute>
            <Layout>
              <ApplicationTracker />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/recommendations"
        element={
          <PrivateRoute>
            <Layout>
              <Recommendations />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
