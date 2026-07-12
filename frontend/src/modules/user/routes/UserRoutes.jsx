import { lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import ProtectedRoute from './ProtectedRoute';

const Home = lazy(() => import('../pages/Home'));
const Play = lazy(() => import('../pages/Play'));
const Account = lazy(() => import('../pages/Account'));
const ProfileSettings = lazy(() => import('../pages/ProfileSettings'));
const Cart = lazy(() => import('../pages/Cart'));
const TopDeals = lazy(() => import('../pages/TopDeals'));
const ProductDetails = lazy(() => import('../pages/ProductDetails'));
const CategoryPage = lazy(() => import('../pages/CategoryPage'));
const Wishlist = lazy(() => import('../pages/Wishlist'));
const Checkout = lazy(() => import('../pages/Checkout'));
const OrderSuccess = lazy(() => import('../pages/OrderSuccess'));
const MyOrders = lazy(() => import('../pages/MyOrders'));
const OrderDetails = lazy(() => import('../pages/OrderDetails'));
const TrackOrder = lazy(() => import('../pages/TrackOrder'));
const ReturnOrder = lazy(() => import('../pages/ReturnOrder'));
const Addresses = lazy(() => import('../pages/Addresses'));
const SelectLanguage = lazy(() => import('../pages/SelectLanguage'));
const NotificationSettings = lazy(() => import('../pages/NotificationSettings'));
const HelpCenter = lazy(() => import('../pages/HelpCenter'));
const Login = lazy(() => import('../pages/Login'));
const ProductListingPage = lazy(() => import('../pages/ProductListingPage'));
const AllCategories = lazy(() => import('../pages/AllCategories'));
const InfoPage = lazy(() => import('../pages/InfoPage'));
const OfferPage = lazy(() => import('../pages/OfferPage'));
const BecomeSeller = lazy(() => import('../pages/BecomeSeller'));
const DelhiveryRedirect = lazy(() => import('../pages/DelhiveryRedirect'));
const ShippingRedirect = lazy(() => import('../pages/ShippingRedirect'));
const SupportPage = lazy(() => import('../pages/SupportPage'));
const PrivacyPolicyPage = lazy(() => import('../pages/PrivacyPolicyPage'));
const TermsAndConditionsPage = lazy(() => import('../pages/TermsAndConditionsPage'));

const UserRoutes = () => {
    return (
        <Routes>
            <Route path="/" element={<Layout />}>
                <Route index element={<Home />} />
                <Route path="products" element={<ProductListingPage />} />
                <Route path="search" element={<ProductListingPage />} />
                <Route path="play" element={<Play />} />
                <Route path="account" element={<ProtectedRoute><Account /></ProtectedRoute>} />
                <Route path="settings" element={<ProtectedRoute><ProfileSettings /></ProtectedRoute>} />
                <Route path="addresses" element={<ProtectedRoute><Addresses /></ProtectedRoute>} />
                <Route path="select-language" element={<SelectLanguage />} />
                <Route path="notification-settings" element={<ProtectedRoute><NotificationSettings /></ProtectedRoute>} />
                <Route path="help-center" element={<HelpCenter />} />
                <Route path="support" element={<SupportPage />} />
                <Route path="privacy" element={<PrivacyPolicyPage />} />
                <Route path="privacy-policy" element={<PrivacyPolicyPage />} />
                <Route path="terms-and-conditions" element={<TermsAndConditionsPage />} />
                <Route path="cart" element={<Cart />} />
                <Route path="wishlist" element={<ProtectedRoute><Wishlist /></ProtectedRoute>} />
                <Route path="checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
                <Route path="order-success" element={<ProtectedRoute><OrderSuccess /></ProtectedRoute>} />
                <Route path="my-orders" element={<ProtectedRoute><MyOrders /></ProtectedRoute>} />
                <Route path="my-orders/:orderId" element={<ProtectedRoute><OrderDetails /></ProtectedRoute>} />
                <Route path="my-orders/:orderId/track" element={<ProtectedRoute><TrackOrder /></ProtectedRoute>} />
                <Route path="track-order/:orderId" element={<ProtectedRoute><TrackOrder /></ProtectedRoute>} />
                <Route path="track-order/:orderId/:productId" element={<ProtectedRoute><TrackOrder /></ProtectedRoute>} />
                <Route path="my-orders/:orderId/:action" element={<ProtectedRoute><ReturnOrder /></ProtectedRoute>} />
                <Route path="my-orders/:orderId/:action/:productId" element={<ProtectedRoute><ReturnOrder /></ProtectedRoute>} />
                <Route path="deals" element={<TopDeals />} />
                <Route path="categories" element={<AllCategories />} />
                <Route path="category/:categoryName/*" element={<CategoryPage />} />
                <Route path="product/:id" element={<ProductDetails />} />
                <Route path="login" element={<Login />} />
                <Route path="offers/:id" element={<OfferPage />} />
                <Route path="info" element={<InfoPage />} />
                <Route path="become-seller" element={<BecomeSeller />} />
                <Route path="r/delhivery/:waybill" element={<DelhiveryRedirect />} />
                <Route path="r/:provider/:trackingId" element={<ShippingRedirect />} />
            </Route>
        </Routes>
    );
};

export default UserRoutes;
