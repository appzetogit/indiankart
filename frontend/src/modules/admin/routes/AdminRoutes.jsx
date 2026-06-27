import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Loader from '../../../components/common/Loader';
import ProtectedAdminRoute from './ProtectedAdminRoute';
import AdminPermissionRoute from './AdminPermissionRoute';
import useAdminAuthStore from '../store/adminAuthStore';
import { getDefaultAdminRoute } from '../constants/adminPermissions';

const HOME_PAGE_BUILDER_REDIRECT = '/admin/categories/page-builder?categoryName=For%20You';

const AdminLogin = lazy(() => import('../pages/AdminLogin'));
const AdminLayout = lazy(() => import('../components/layout/AdminLayout'));
const Dashboard = lazy(() => import('../pages/Dashboard'));
const CategoryList = lazy(() => import('../pages/Categories/CategoryList'));
const CategoryPageBuilder = lazy(() => import('../pages/Categories/CategoryPageBuilder'));
const SubCategoryList = lazy(() => import('../pages/SubCategories/SubCategoryList'));
const SubCategoryPageBuilder = lazy(() => import('../pages/SubCategories/SubCategoryPageBuilder'));
const BrandList = lazy(() => import('../pages/Brands/BrandList'));
const PlayManager = lazy(() => import('../pages/Play/PlayManager'));
const CouponManager = lazy(() => import('../pages/Coupons/CouponManager'));
const OrderList = lazy(() => import('../pages/Orders/OrderList'));
const OrderDetail = lazy(() => import('../pages/Orders/OrderDetail'));
const DeliverySlip = lazy(() => import('../pages/DeliverySlip/DeliverySlip'));
const ReturnRequests = lazy(() => import('../pages/Returns/ReturnRequests'));
const ProductManager = lazy(() => import('../pages/Products/ProductManager'));
const ProductForm = lazy(() => import('../pages/Products/ProductForm'));
const ProductViews = lazy(() => import('../pages/Products/ProductViews'));
const ProductAnalytics = lazy(() => import('../pages/Products/ProductAnalytics'));
const MaxSellingQuantityManager = lazy(() => import('../pages/Products/MaxSellingQuantityManager'));
const UserList = lazy(() => import('../pages/Users/UserList'));
const UserDetail = lazy(() => import('../pages/Users/UserDetail'));
const SellerRequests = lazy(() => import('../pages/Users/SellerRequests'));
const PageManager = lazy(() => import('../pages/PageManager'));
const SupportRequests = lazy(() => import('../pages/Support/SupportRequests'));
const HelpCenterContentManager = lazy(() => import('../pages/Content/HelpCenterContentManager'));
const ReviewList = lazy(() => import('../pages/Reviews/ReviewList'));
const PinCodeManager = lazy(() => import('../pages/PinCodes/PinCodeManager'));
const BankOfferManager = lazy(() => import('../pages/BankOffers/BankOfferManager'));
const SettingsPage = lazy(() => import('../pages/Settings/SettingsPage'));
const OfferList = lazy(() => import('../pages/Offers/OfferList'));
const OfferForm = lazy(() => import('../pages/Offers/OfferForm'));
const StockManagement = lazy(() => import('../pages/StockManagement/StockManagement'));
const FooterManager = lazy(() => import('../pages/Settings/FooterManager'));
const NotificationManager = lazy(() => import('../pages/Notifications/NotificationManager'));
const AdminNotifications = lazy(() => import('../pages/Notifications/AdminNotifications'));
const ShippingCharges = lazy(() => import('../pages/Settings/ShippingCharges'));
const RazorpayCredentials = lazy(() => import('../pages/Settings/RazorpayCredentials'));
const B2BManager = lazy(() => import('../pages/B2B/B2BManager'));
const CODAdvancedPayment = lazy(() => import('../pages/Settings/CODAdvancedPayment'));
const AdminManagement = lazy(() => import('../pages/AdminManagement'));
const AgentManagement = lazy(() => import('../pages/AgentManagement'));

const AdminRouteFallback = () => (
    <Loader fullPage message="Loading admin workspace..." variant="shimmer" />
);

const withPermission = (permission, element) => (
    <AdminPermissionRoute permission={permission}>{element}</AdminPermissionRoute>
);

const AdminIndexRedirect = () => {
    const adminUser = useAdminAuthStore((state) => state.adminUser);
    return <Navigate to={getDefaultAdminRoute(adminUser)} replace />;
};

const AdminRoutes = () => {
    return (
        <Suspense fallback={<AdminRouteFallback />}>
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
                    {/* Products Module */}
                    <Route path="products">
                        <Route index element={withPermission('products', <ProductManager />)} />
                        <Route path="max-selling-quantity" element={withPermission('maxSellingQty', <MaxSellingQuantityManager />)} />
                        <Route path="new" element={withPermission('products', <ProductForm />)} />
                        <Route path="edit/:id" element={withPermission('products', <ProductForm />)} />
                    </Route>

                    <Route path="product-views" element={withPermission('productViews', <ProductViews />)} />
                    <Route path="product-views/:id" element={withPermission('productViews', <ProductAnalytics />)} />
                    <Route path="b2b" element={withPermission('b2b', <B2BManager />)} />
                    <Route path="stock" element={withPermission('stockManagement', <StockManagement />)} />

                    {/* Categories Module */}
                    <Route path="categories">
                        <Route index element={withPermission('categories', <CategoryList />)} />
                        <Route path="page-builder" element={withPermission('categoryPageBuilder', <CategoryPageBuilder />)} />
                        <Route path="page-builder/section/:sectionId" element={withPermission('categoryPageBuilder', <CategoryPageBuilder />)} />
                    </Route>

                    {/* Subcategories Module */}
                    <Route path="subcategories">
                        <Route index element={withPermission('subcategories', <SubCategoryList />)} />
                        <Route path="page-builder" element={withPermission('subCategoryPageBuilder', <SubCategoryPageBuilder />)} />
                        <Route path="page-builder/section/:sectionId" element={withPermission('subCategoryPageBuilder', <SubCategoryPageBuilder />)} />
                    </Route>
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
                    <Route path="agent-management" element={withPermission('agentManagement', <AgentManagement />)} />
                    <Route path="admin-management" element={withPermission('adminManagement', <AdminManagement />)} />
                </Route>
            </Routes>
        </Suspense>
    );
};

export default AdminRoutes;
