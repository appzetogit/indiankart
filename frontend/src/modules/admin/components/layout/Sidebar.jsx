import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
    MdDashboard,
    MdInventory,
    MdCategory,
    MdShoppingCart,
    MdAssignmentReturn,

    MdLocalOffer,
    MdLocalShipping,
    MdStorefront,
    MdPlayCircle,
    MdHome,
    MdPeople,
    MdSettings,
    MdMenu,
    MdClose,
    MdDescription,
    MdSupportAgent,
    MdLabel,
    MdViewAgenda,
    MdViewCarousel,
    MdRateReview,
    MdLocationOn,
    MdLayers,
    MdHelpCenter,
    MdViewCompact,
    MdNotifications
} from 'react-icons/md';

import logo from '../../../../assets/indiankart-logo.png';

const Sidebar = () => {
    const [isOpen, setIsOpen] = useState(true);

    const menuItems = [
        { name: 'Dashboard', icon: MdDashboard, path: '/admin/dashboard' },
        { name: 'Orders', icon: MdShoppingCart, path: '/admin/orders' },
        { name: 'Manage PIN Codes', icon: MdLocationOn, path: '/admin/pincodes' },
        { name: 'Products', icon: MdInventory, path: '/admin/products' },
        { name: 'Stock Management', icon: MdInventory, path: '/admin/stock' },
        { name: 'Categories', icon: MdCategory, path: '/admin/categories' },
        { name: 'Subcategories', icon: MdCategory, path: '/admin/subcategories' },
        { name: 'Users', icon: MdPeople, path: '/admin/users' },
        { name: 'Seller Requests', icon: MdStorefront, path: '/admin/seller-requests' },
        { name: 'Delivery Slip', icon: MdLocalShipping, path: '/admin/delivery-slip' },
        { name: 'Reviews', icon: MdRateReview, path: '/admin/reviews' },
        { name: 'Returns', icon: MdAssignmentReturn, path: '/admin/returns' },
        { name: 'Coupons & Offers', icon: MdLocalOffer, path: '/admin/coupons' },
        { name: 'Offers', icon: MdLabel, path: '/admin/offers' },
        { name: 'Bank Offers', icon: MdLocalOffer, path: '/admin/bank-offers' },
        { name: 'Home Layout', icon: MdLayers, path: '/admin/content/layout' },
        { name: 'Home Sections', icon: MdViewAgenda, path: '/admin/content/sections' },
        { name: 'Home Banners', icon: MdViewCarousel, path: '/admin/content/banners' },
        { name: 'Content Pages', icon: MdDescription, path: '/admin/pages' },
        { name: 'Footer Settings', icon: MdViewCompact, path: '/admin/footer-settings' },
        { name: 'Header Settings', icon: MdViewCompact, path: '/admin/header-settings' },
        { name: 'Notifications', icon: MdNotifications, path: '/admin/notifications' },
        { name: 'Settings', icon: MdSettings, path: '/admin/settings' },
    ];

    return (
        <>
            {/* Mobile Toggle */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="lg:hidden fixed top-3 left-4 z-50 p-2 text-white bg-transparent rounded-lg"
            >
                {isOpen ? <MdClose size={28} /> : <MdMenu size={28} />}
            </button>

            {/* Sidebar */}
            <aside
                className={`fixed left-0 top-0 h-full bg-gradient-to-b from-gray-900 to-gray-800 text-white transition-all duration-300 z-40 ${isOpen ? 'w-64' : 'w-0 lg:w-20'
                    } flex flex-col overflow-hidden shadow-2xl`}
            >
                {/* Logo */}
                <div className="h-20 flex items-center px-3 border-b border-gray-700/50 bg-gray-900/50 backdrop-blur-sm overflow-hidden">
                    <div className="flex items-center gap-2 pl-12 lg:pl-0">
                        <img
                            src={logo}
                            alt="Logo"
                            className={`w-16 h-16 object-contain transition-all duration-500 ease-in-out ${!isOpen && 'lg:scale-125 lg:translate-x-1'}`}
                        />
                        <div className={`transition-all duration-300 delay-100 ${isOpen ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4 pointer-events-none w-0'}`}>
                            <h1 className="font-black text-xl tracking-tighter leading-none bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent italic">
                                INDIAN<span className="text-blue-500 not-italic">KART</span>
                            </h1>
                            <p className="text-[10px] font-black text-blue-500 tracking-[0.2em] uppercase mt-1">Admin Central</p>
                        </div>
                    </div>
                </div>

                {/* Menu Items */}
                <nav className="mt-4 px-2 flex-1 overflow-y-auto custom-scrollbar pb-10">
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        return (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                className={({ isActive }) =>
                                    `flex items-center gap-3 px-4 py-3 rounded-lg mb-1 transition-colors ${isActive
                                        ? 'bg-blue-600 text-white'
                                        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                                    }`
                                }
                            >
                                <Icon size={22} className="shrink-0" />
                                <span className={`${isOpen ? 'block' : 'hidden lg:hidden'}`}>
                                    {item.name}
                                </span>
                            </NavLink>
                        );
                    })}
                </nav>
            </aside>

            {/* Overlay for mobile */}
            {isOpen && (
                <div
                    className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
                    onClick={() => setIsOpen(false)}
                />
            )}
        </>
    );
};

export default Sidebar;
