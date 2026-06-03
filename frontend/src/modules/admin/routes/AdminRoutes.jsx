import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AdminLogin from '../pages/AdminLogin';
import AdminLayout from '../components/layout/AdminLayout';
import Dashboard from '../pages/Dashboard';
import CategoryList from '../pages/Categories/CategoryList';
import CategoryPageBuilder from '../pages/Categories/CategoryPageBuilder';
import SubCategoryList from '../pages/SubCategories/SubCategoryList';
import SubCategoryPageBuilder from '../pages/SubCategories/SubCategoryPageBuilder';
import BrandList from '../pages/Brands/BrandList';
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
import ProductAnalytics from '../pages/Products/ProductAnalytics';
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
import CODAdvancedPayment from '../pages/Settings/CODAdvancedPayment';
import AdminPermissionRoute from './AdminPermissionRoute';
import AdminManagement from '../pages/AdminManagement';
import useAdminAuthStore from '../store/adminAuthStore';
import { getDefaultAdminRoute } from '../constants/adminPermissions';

const HOME_PAGE_BUILDER_REDIRECT = '/admin/categories/page-builder?categoryName=For%20You';

const withPermission = (permission, element) => (
    <AdminPermissionRoute permission={permission}>{element}</AdminPermissionRoute>
);

const AdminIndexRedirect = () => {
    const adminUser = useAdminAuthStore((state) => state.adminUser);
    return <Navigate to={getDefaultAdminRoute(adminUser)} replace />;
};

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
                <Route index element={<AdminIndexRedirect />} />
                <Route path="dashboard" element={withPermission('dashboard', <Dashboard />)} />

                {/* Modules */}
                <Route path="products" element={withPermission('products', <ProductManager />)} />
                <Route path="products/max-selling-quantity" element={withPermission('maxSellingQty', <MaxSellingQuantityManager />)} />
                <Route path="product-views" element={withPermission('productViews', <ProductViews />)} />
                <Route path="product-views/:id" element={withPermission('productViews', <ProductAnalytics />)} />
                <Route path="b2b" element={withPermission('b2b', <B2BManager />)} />
                <Route path="products/new" element={withPermission('products', <ProductForm />)} />
                <Route path="products/edit/:id" element={withPermission('products', <ProductForm />)} />
                <Route path="stock" element={withPermission('stockManagement', <StockManagement />)} />
                <Route path="categories" element={withPermission('categories', <CategoryList />)} />
                <Route path="categories/page-builder" element={withPermission('categoryPageBuilder', <CategoryPageBuilder />)} />
                <Route path="categories/page-builder/section/:sectionId" element={withPermission('categoryPageBuilder', <CategoryPageBuilder />)} />
                <Route path="subcategories" element={withPermission('subcategories', <SubCategoryList />)} />
                <Route path="subcategories/page-builder" element={withPermission('subCategoryPageBuilder', <SubCategoryPageBuilder />)} />
                <Route path="subcategories/page-builder/section/:sectionId" element={withPermission('subCategoryPageBuilder', <SubCategoryPageBuilder />)} />
                <Route path="brands" element={withPermission('brands', <BrandList />)} />
                <Route path="orders" element={withPermission('orders', <OrderList />)} />
                <Route path="orders/:id" element={withPermission('orders', <OrderDetail />)} />
                <Route path="delivery-slip" element={withPermission('deliverySlip', <DeliverySlip />)} />
                <Route
                    path="returns"
                    element={withPermission(
                        'returns',
                        <ReturnRequests
                            forcedType="Return"
                            pageTitle="Returns"
                            pageDescription="Manage lifecycle of return requests"
                        />
                    )}
                />
                <Route
                    path="replacements"
                    element={withPermission(
                        'replacements',
                        <ReturnRequests
                            forcedType="Replacement"
                            pageTitle="Replacements"
                            pageDescription="Manage lifecycle of replacement requests"
                        />
                    )}
                />
                <Route path="reviews" element={withPermission('reviews', <ReviewList />)} />
                <Route path="coupons" element={withPermission('coupons', <CouponManager />)} />
                <Route path="offers" element={withPermission('coupons', <OfferList />)} />
                <Route path="offers/edit/:id" element={withPermission('coupons', <OfferForm />)} />
                <Route path="play" element={withPermission('play', <PlayManager />)} />
                <Route path="homepage" element={withPermission('categoryPageBuilder', <Navigate to={HOME_PAGE_BUILDER_REDIRECT} replace />)} />
                <Route path="users" element={withPermission('users', <UserList />)} />
                <Route path="users/:id" element={withPermission('users', <UserDetail />)} />
                <Route path="seller-requests" element={withPermission('sellerRequests', <SellerRequests />)} />
                <Route path="pages" element={withPermission('staticPages', <PageManager />)} />
                <Route path="content/layout" element={withPermission('categoryPageBuilder', <Navigate to={HOME_PAGE_BUILDER_REDIRECT} replace />)} />
                <Route path="content/sections" element={withPermission('categoryPageBuilder', <Navigate to={HOME_PAGE_BUILDER_REDIRECT} replace />)} />
                <Route path="content/banners" element={withPermission('categoryPageBuilder', <Navigate to={HOME_PAGE_BUILDER_REDIRECT} replace />)} />
                <Route path="content/help-center" element={withPermission('helpCenterContent', <HelpCenterContentManager />)} />
                <Route path="content/home" element={withPermission('categoryPageBuilder', <Navigate to={HOME_PAGE_BUILDER_REDIRECT} replace />)} />
                <Route path="pincodes" element={withPermission('pinCodes', <PinCodeManager />)} />
                <Route path="bank-offers" element={withPermission('bankOffers', <BankOfferManager />)} />
                <Route path="support" element={withPermission('users', <SupportRequests />)} />
                <Route path="settings" element={withPermission('storeSettings', <SettingsPage />)} />
                <Route path="razorpay-credentials" element={<Navigate to="/admin/api-credentials" replace />} />
                <Route path="api-credentials" element={withPermission('apiCredentials', <RazorpayCredentials />)} />
                <Route path="shipping-charges" element={withPermission('shippingCharges', <ShippingCharges />)} />
                <Route path="cod-advanced-payment" element={withPermission('codAdvancedPayment', <CODAdvancedPayment />)} />
                <Route path="footer-settings" element={withPermission('homepageFooter', <FooterManager />)} />
                <Route path="notifications" element={withPermission('adminNotifications', <AdminNotifications />)} />
                <Route path="user-notifications" element={withPermission('userNotifications', <NotificationManager />)} />
                <Route path="admin-management" element={withPermission('adminManagement', <AdminManagement />)} />
            </Route>
        </Routes>
    );
};

export default AdminRoutes;
