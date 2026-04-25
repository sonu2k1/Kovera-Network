/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { NetworkProvider } from '../frontend/src/context/NetworkContext';
import Login from '../frontend/src/pages/Login';
import NetworkPortal from '../frontend/src/pages/Network';
import AdminPortal from '../frontend/src/pages/Admin';

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem('kovera_token');
  return token ? <>{children}</> : <Navigate to="/login" />;
};

export default function App() {
  return (
    <NetworkProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/network"
            element={
              <PrivateRoute>
                <NetworkPortal />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <PrivateRoute>
                <AdminPortal />
              </PrivateRoute>
            }
          />
          <Route path="/" element={<Navigate to="/network" replace />} />
        </Routes>
      </BrowserRouter>
    </NetworkProvider>
  );
}
