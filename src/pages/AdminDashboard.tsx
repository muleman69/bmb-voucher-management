import React from 'react';
import { Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { QrCode, Users, BarChart3, Settings as SettingsIcon } from 'lucide-react';
import VoucherGenerator from '../components/admin/VoucherGenerator';
import VoucherList from '../components/admin/VoucherList';
import CampaignList from '../components/admin/CampaignList';
import Statistics from '../components/admin/Statistics';
import Settings from '../components/admin/Settings';

const AdminDashboard = () => {
  const location = useLocation();

  const isActivePath = (path: string) => {
    if (path === '/admin') {
      return location.pathname === '/admin' || location.pathname === '/admin/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg">
        <nav className="p-4 space-y-2">
          <Link
            to="/admin"
            className={`flex items-center space-x-3 p-3 rounded-lg hover:bg-teal-50 text-gray-700 hover:text-teal-600 ${
              isActivePath('/admin') ? 'bg-teal-50 text-teal-600' : ''
            }`}
          >
            <QrCode className="h-5 w-5" />
            <span>Generate Vouchers</span>
          </Link>
          <Link
            to="/admin/list"
            className={`flex items-center space-x-3 p-3 rounded-lg hover:bg-teal-50 text-gray-700 hover:text-teal-600 ${
              isActivePath('/admin/list') ? 'bg-teal-50 text-teal-600' : ''
            }`}
          >
            <Users className="h-5 w-5" />
            <span>Manage Vouchers</span>
          </Link>
          <Link
            to="/admin/stats"
            className={`flex items-center space-x-3 p-3 rounded-lg hover:bg-teal-50 text-gray-700 hover:text-teal-600 ${
              isActivePath('/admin/stats') ? 'bg-teal-50 text-teal-600' : ''
            }`}
          >
            <BarChart3 className="h-5 w-5" />
            <span>Statistics</span>
          </Link>
          <Link
            to="/admin/settings"
            className={`flex items-center space-x-3 p-3 rounded-lg hover:bg-teal-50 text-gray-700 hover:text-teal-600 ${
              isActivePath('/admin/settings') ? 'bg-teal-50 text-teal-600' : ''
            }`}
          >
            <SettingsIcon className="h-5 w-5" />
            <span>Settings</span>
          </Link>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8 bg-gray-50">
        <Routes>
          <Route index element={<VoucherGenerator />} />
          <Route path="list" element={<CampaignList />} />
          <Route path="list/:campaignName" element={<VoucherList />} />
          <Route path="stats" element={<Statistics />} />
          <Route path="settings" element={<Settings />} />
          {/* Catch any unknown routes and redirect to the generator */}
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
      </div>
    </div>
  );
};

export default AdminDashboard;
