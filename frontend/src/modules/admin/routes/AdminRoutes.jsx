import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AdminLogin from '../pages/AdminLogin';
import AdminLayout from '../components/layout/AdminLayout';
import Dashboard from '../pages/Dashboard';
import CategoryList from '../pages/Categories/CategoryList';
import CategoryPageBuilder from '../pages/Categories/CategoryPageBuilder';
import SubCategoryList from '../pages/SubCategories/SubCategoryList';
import PlayManager from '../pages/Play/PlayManager';
import CouponManager from '../pages/Coupons/CouponManager';
import OrderList from '../pages/Orders/OrderList';
import OrderDetail from '../pages/Orders/OrderDetail';
import DeliverySlip from '../pages/DeliverySlip/DeliverySlip';
import ReturnRequests from '../pages/Returns/ReturnRequests';
import ProtectedAdminRoute from './ProtectedAdminRoute';
import ProductManager from '../pages/Products/ProductManager';
import ProductForm from '../pages/Products/ProductForm';
import ProductViews from '../pages/Products/ProductViews';
import MaxSellingQuantityManager from '../pages/Products/MaxSellingQuantityManager';
import UserList from '../pages/Users/UserList';
import UserDetail from '../pages/Users/UserDetail';
import SellerRequests from '../pages/Users/SellerRequests';
import PageManager from '../pages/PageManager';
import SupportRequests from '../pages/Support/SupportRequests';
import HelpCenterContentManager from '../pages/Content/HelpCenterContentManager';
import ReviewList from '../pages/Reviews/ReviewList';
import PinCodeManager from '../pages/PinCodes/PinCodeManager';
import BankOfferManager from '../pages/BankOffers/BankOfferManager';
import SettingsPage from '../pages/Settings/SettingsPage';
import OfferList from '../pages/Offers/OfferList';
import OfferForm from '../pages/Offers/OfferForm';
import StockManagement from '../pages/StockManagement/StockManagement';
import FooterManager from '../pages/Settings/FooterManager';
import NotificationManager from '../pages/Notifications/NotificationManager';
import AdminNotifications from '../pages/Notifications/AdminNotifications';
import ShippingCharges from '../pages/Settings/ShippingCharges';
import RazorpayCredentials from '../pages/Settings/RazorpayCredentials';
import B2BManager from '../pages/B2B/B2BManager';

const HOME_PAGE_BUILDER_REDIRECT = '/admin/categories/page-builder?categoryName=For%20You';

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
                <Route path="products/max-selling-quantity" element={<MaxSellingQuantityManager />} />
                <Route path="product-views" element={<ProductViews />} />
                <Route path="b2b" element={<B2BManager />} />
                <Route path="products/new" element={<ProductForm />} />
                <Route path="products/edit/:id" element={<ProductForm />} />
                <Route path="stock" element={<StockManagement />} />
                <Route path="categories" element={<CategoryList />} />
                <Route path="categories/page-builder" element={<CategoryPageBuilder />} />
                <Route path="categories/page-builder/section/:sectionId" element={<CategoryPageBuilder />} />
                <Route path="subcategories" element={<SubCategoryList />} />
                <Route path="orders" element={<OrderList />} />
                <Route path="orders/:id" element={<OrderDetail />} />
                <Route path="delivery-slip" element={<DeliverySlip />} />
                <Route
                    path="returns"
                    element={
                        <ReturnRequests
                            forcedType="Return"
                            pageTitle="Returns"
                            pageDescription="Manage lifecycle of return requests"
                        />
                    }
                />
                <Route
                    path="replacements"
                    element={
                        <ReturnRequests
                            forcedType="Replacement"
                            pageTitle="Replacements"
                            pageDescription="Manage lifecycle of replacement requests"
                        />
                    }
                />
                <Route path="reviews" element={<ReviewList />} />
                <Route path="coupons" element={<CouponManager />} />
                <Route path="offers" element={<OfferList />} />
                <Route path="offers/edit/:id" element={<OfferForm />} />
                <Route path="play" element={<PlayManager />} />
                <Route path="homepage" element={<Navigate to={HOME_PAGE_BUILDER_REDIRECT} replace />} />
                <Route path="users" element={<UserList />} />
                <Route path="users/:id" element={<UserDetail />} />
                <Route path="seller-requests" element={<SellerRequests />} />
                <Route path="pages" element={<PageManager />} />
                <Route path="content/layout" element={<Navigate to={HOME_PAGE_BUILDER_REDIRECT} replace />} />
                <Route path="content/sections" element={<Navigate to={HOME_PAGE_BUILDER_REDIRECT} replace />} />
                <Route path="content/banners" element={<Navigate to={HOME_PAGE_BUILDER_REDIRECT} replace />} />
                <Route path="content/help-center" element={<HelpCenterContentManager />} />
                <Route path="content/home" element={<Navigate to={HOME_PAGE_BUILDER_REDIRECT} replace />} />
                <Route path="pincodes" element={<PinCodeManager />} />
                <Route path="bank-offers" element={<BankOfferManager />} />
                <Route path="support" element={<SupportRequests />} />
                <Route path="settings" element={<SettingsPage />} />
                <Route path="razorpay-credentials" element={<Navigate to="/admin/api-credentials" replace />} />
                <Route path="api-credentials" element={<RazorpayCredentials />} />
                <Route path="shipping-charges" element={<ShippingCharges />} />
                <Route path="footer-settings" element={<FooterManager />} />
                <Route path="notifications" element={<AdminNotifications />} />
                <Route path="user-notifications" element={<NotificationManager />} />
            </Route>
        </Routes>
    );
};

export default AdminRoutes;
