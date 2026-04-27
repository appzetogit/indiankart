import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import AdminHeader from './AdminHeader';

const AdminLayout = () => {
    return (
        <div className="admin-layout flex h-screen bg-gray-50 overflow-hidden">
            <Sidebar />

            <div className="flex-1 flex flex-col lg:ml-64">
                <AdminHeader />

                <main
                    data-lenis-prevent
                    className="flex-1 overflow-y-auto overflow-x-auto p-2 md:p-4"
                >
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;
