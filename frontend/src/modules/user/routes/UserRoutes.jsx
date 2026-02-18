import { Routes, Route } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import Home from '../pages/Home';
import Play from '../pages/Play';
import Account from '../pages/Account';
import Cart from '../pages/Cart';
import TopDeals from '../pages/TopDeals';
import ProductDetails from '../pages/ProductDetails';
import CategoryPage from '../pages/CategoryPage';
import Wishlist from '../pages/Wishlist';
import Checkout from '../pages/Checkout';
import OrderSuccess from '../pages/OrderSuccess';
import MyOrders from '../pages/MyOrders';
import OrderDetails from '../pages/OrderDetails';
import TrackOrder from '../pages/TrackOrder';
import ReturnOrder from '../pages/ReturnOrder';
import Addresses from '../pages/Addresses';
import SelectLanguage from '../pages/SelectLanguage';
import NotificationSettings from '../pages/NotificationSettings';
import Coupons from '../pages/Coupons';
import HelpCenter from '../pages/HelpCenter';
import Login from '../pages/Login';
import Signup from '../pages/Signup';
import ProtectedRoute from './ProtectedRoute';
import ProductListingPage from '../pages/ProductListingPage';
import AllCategories from '../pages/AllCategories';
import InfoPage from '../pages/InfoPage';
import OfferPage from '../pages/OfferPage';
import BecomeSeller from '../pages/BecomeSeller';

const UserRoutes = () => {
    return (
        <Routes>
            <Route path="/" element={<Layout />}>
                <Route index element={<Home />} />
                <Route path="products" element={<ProductListingPage />} />
                <Route path="play" element={<Play />} />
                <Route path="account" element={<ProtectedRoute><Account /></ProtectedRoute>} />
                <Route path="addresses" element={<ProtectedRoute><Addresses /></ProtectedRoute>} />
                <Route path="select-language" element={<SelectLanguage />} />
                <Route path="notification-settings" element={<ProtectedRoute><NotificationSettings /></ProtectedRoute>} />
                <Route path="coupons" element={<ProtectedRoute><Coupons /></ProtectedRoute>} />
                <Route path="help-center" element={<HelpCenter />} />
                <Route path="cart" element={<Cart />} />
                <Route path="wishlist" element={<ProtectedRoute><Wishlist /></ProtectedRoute>} />
                <Route path="checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
                <Route path="order-success" element={<ProtectedRoute><OrderSuccess /></ProtectedRoute>} />
                <Route path="my-orders" element={<ProtectedRoute><MyOrders /></ProtectedRoute>} />
                <Route path="my-orders/:orderId" element={<ProtectedRoute><OrderDetails /></ProtectedRoute>} />
                <Route path="my-orders/:orderId/track" element={<ProtectedRoute><TrackOrder /></ProtectedRoute>} />
                <Route path="track-order/:orderId" element={<ProtectedRoute><TrackOrder /></ProtectedRoute>} />
                <Route path="track-order/:orderId/:productId" element={<ProtectedRoute><TrackOrder /></ProtectedRoute>} />
                <Route path="my-orders/:orderId/return" element={<ProtectedRoute><ReturnOrder /></ProtectedRoute>} />
                <Route path="my-orders/:orderId/return/:productId" element={<ProtectedRoute><ReturnOrder /></ProtectedRoute>} />
                <Route path="deals" element={<TopDeals />} />
                <Route path="categories" element={<AllCategories />} />
                <Route path="category/:categoryName/*" element={<CategoryPage />} />
                <Route path="product/:id" element={<ProductDetails />} />
                <Route path="login" element={<Login />} />
                <Route path="signup" element={<Signup />} />
                <Route path="offers/:id" element={<OfferPage />} />
                <Route path="info" element={<InfoPage />} />
                <Route path="become-seller" element={<BecomeSeller />} />
            </Route>
        </Routes>
    );
};

export default UserRoutes;
