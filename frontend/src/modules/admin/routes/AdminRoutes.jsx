import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AdminLogin from '../pages/AdminLogin';
import AdminLayout from '../components/layout/AdminLayout';
import Dashboard from '../pages/Dashboard';
import CategoryList from '../pages/Categories/CategoryList';
import SubCategoryList from '../pages/SubCategories/SubCategoryList';
import BannerManager from '../pages/Homepage/BannerManager';
import PlayManager from '../pages/Play/PlayManager';
import CouponManager from '../pages/Coupons/CouponManager';
import OrderList from '../pages/Orders/OrderList';
import OrderDetail from '../pages/Orders/OrderDetail';
import DeliverySlip from '../pages/DeliverySlip/DeliverySlip';
import ReturnRequests from '../pages/Returns/ReturnRequests';
import ProtectedAdminRoute from './ProtectedAdminRoute';
import ProductManager from '../pages/Products/ProductManager';
import ProductForm from '../pages/Products/ProductForm';
import UserList from '../pages/Users/UserList';
import UserDetail from '../pages/Users/UserDetail';
import SellerRequests from '../pages/Users/SellerRequests';
import PageManager from '../pages/PageManager';
import SupportRequests from '../pages/Support/SupportRequests';
import HomeContentManager from '../pages/Content/HomeContentManager'; // Can be removed later if unused
import HomeLayoutEditor from '../pages/Content/HomeLayoutEditor';
import HomeSections from '../pages/Content/HomeSections';
import HomeBanners from '../pages/Content/HomeBanners';
import ReviewList from '../pages/Reviews/ReviewList';
import PinCodeManager from '../pages/PinCodes/PinCodeManager';
import BankOfferManager from '../pages/BankOffers/BankOfferManager';
import SettingsPage from '../pages/Settings/SettingsPage';
import OfferList from '../pages/Offers/OfferList';
import OfferForm from '../pages/Offers/OfferForm';
import StockManagement from '../pages/StockManagement/StockManagement';
import FooterManager from '../pages/Settings/FooterManager';
import HeaderManager from '../pages/Settings/HeaderManager';
import NotificationManager from '../pages/Notifications/NotificationManager';

const AdminRoutes = () => {
    return (
        <Routes>
            <Route path="login" element={<AdminLogin />} />

            <Route
                path="/"
                element={
                    <ProtectedAdminRoute>
                        <AdminLayout />
                    </ProtectedAdminRoute>
                }
            >
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<Dashboard />} />

                {/* Modules */}
                <Route path="products" element={<ProductManager />} />
                <Route path="products/new" element={<ProductForm />} />
                <Route path="products/edit/:id" element={<ProductForm />} />
                <Route path="stock" element={<StockManagement />} />
                <Route path="categories" element={<CategoryList />} />
                <Route path="subcategories" element={<SubCategoryList />} />
                <Route path="orders" element={<OrderList />} />
                <Route path="orders/:id" element={<OrderDetail />} />
                <Route path="delivery-slip" element={<DeliverySlip />} />
                <Route path="returns" element={<ReturnRequests />} />
                <Route path="reviews" element={<ReviewList />} />
                <Route path="coupons" element={<CouponManager />} />
                <Route path="offers" element={<OfferList />} />
                <Route path="offers/add" element={<OfferForm />} />
                <Route path="offers/edit/:id" element={<OfferForm />} />
                <Route path="play" element={<PlayManager />} />
                <Route path="homepage" element={<BannerManager />} />
                <Route path="users" element={<UserList />} />
                <Route path="users/:id" element={<UserDetail />} />
                <Route path="seller-requests" element={<SellerRequests />} />
                <Route path="pages" element={<PageManager />} />
                <Route path="content/layout" element={<HomeLayoutEditor />} />
                <Route path="content/sections" element={<HomeSections />} />
                <Route path="content/banners" element={<HomeBanners />} />
                {/* Legacy redirect or keep for backward compat for a moment if needed, but sidebar changes will shift traffic */}
                <Route path="content/home" element={<HomeLayoutEditor />} />
                <Route path="pincodes" element={<PinCodeManager />} />
                <Route path="bank-offers" element={<BankOfferManager />} />
                <Route path="support" element={<SupportRequests />} />
                <Route path="settings" element={<SettingsPage />} />
                <Route path="footer-settings" element={<FooterManager />} />
                <Route path="header-settings" element={<HeaderManager />} />
                <Route path="notifications" element={<NotificationManager />} />
            </Route>
        </Routes>
    );
};

export default AdminRoutes;
