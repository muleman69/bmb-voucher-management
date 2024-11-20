import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { Palmtree, LogOut } from 'lucide-react';

const Navbar = () => {
  const { isAuthenticated, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!isAuthenticated) return null;

  return (
    <nav className="bg-white shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center space-x-2">
            <Palmtree className="h-8 w-8 text-teal-600" />
            <span className="font-bold text-xl text-gray-800">Agavia Bar</span>
          </Link>
          
          <div className="flex items-center space-x-6">
            <Link
              to="/admin"
              className={`text-gray-600 hover:text-teal-600 transition-colors ${
                location.pathname.startsWith('/admin') ? 'text-teal-600' : ''
              }`}
            >
              Dashboard
            </Link>
            <Link
              to="/redeem"
              className={`text-gray-600 hover:text-teal-600 transition-colors ${
                location.pathname === '/redeem' ? 'text-teal-600' : ''
              }`}
            >
              Redeem Voucher
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-1 text-gray-600 hover:text-red-600 transition-colors"
            >
              <LogOut className="h-5 w-5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;