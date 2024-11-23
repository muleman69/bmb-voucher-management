import React from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Navbar from './components/Navbar';
import AdminDashboard from './pages/AdminDashboard';
import VoucherRedemption from './pages/VoucherRedemption';
import PublicVoucherView from './pages/PublicVoucherView';
import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';
import { Palmtree, LogIn } from 'lucide-react';
import { Toaster } from 'react-hot-toast';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-100">
        <Toaster position="top-center" />
        <Routes>
          <Route path="/admin/*" element={<Navbar />} />
          <Route path="/redeem/*" element={<Navbar />} />
        </Routes>
        
        <main className="container mx-auto px-4 py-8">
          <Routes>
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route 
              path="/redeem/:code" 
              element={
                <ProtectedRoute>
                  <VoucherRedemption />
                </ProtectedRoute>
              }
            />
            <Route 
              path="/voucher/:code" 
              element={<PublicVoucherView />}
            />
            <Route 
              path="/login" 
              element={<Login />}
            />
            <Route 
              path="/" 
              element={
                <div className="max-w-3xl mx-auto text-center">
                  <div className="mb-8">
                    <Palmtree className="w-16 h-16 mx-auto text-emerald-600" />
                  </div>

                  <h1 className="text-4xl font-bold text-gray-900 mb-4">
                    Agavia Bar Voucher System
                  </h1>

                  <p className="text-xl text-gray-600 mb-8">
                    Empowering new bars and restaurants to generate buzz and build their brand—fast, effectively, and affordably.
                  </p>

                  <Link 
                    to="/login"
                    className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700"
                  >
                    <LogIn className="w-5 h-5 mr-2" />
                    Login to Dashboard
                  </Link>
                </div>
              }
            />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
