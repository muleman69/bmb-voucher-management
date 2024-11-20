import React from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Navbar from './components/Navbar';
import AdminDashboard from './pages/AdminDashboard';
import VoucherRedemption from './pages/VoucherRedemption';
import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';
import { Palmtree, LogIn } from 'lucide-react';
import { Toaster } from 'react-hot-toast';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-teal-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/admin/*"
              element={
                <ProtectedRoute>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/redeem"
              element={
                <ProtectedRoute>
                  <VoucherRedemption />
                </ProtectedRoute>
              }
            />
            <Route
              path="/"
              element={
                <div className="flex flex-col items-center justify-center min-h-[80vh]">
                  <Palmtree className="w-16 h-16 text-teal-600 mb-4" />
                  <h1 className="text-4xl font-bold text-gray-800 mb-2">
                    Agavia Bar Voucher System
                  </h1>
                  <p className="text-gray-600 text-center max-w-md mb-8">
                    Empowering new bars and restaurants to generate buzz and build their brand—fast, effectively, and affordably.
                  </p>
                  <Link
                    to="/login"
                    className="flex items-center gap-2 bg-teal-600 text-white px-6 py-3 rounded-lg hover:bg-teal-700 transition-colors shadow-lg"
                  >
                    <LogIn className="w-5 h-5" />
                    <span>Login to Dashboard</span>
                  </Link>
                </div>
              }
            />
          </Routes>
        </div>
        <Toaster position="top-right" />
      </div>
    </BrowserRouter>
  );
}

export default App;