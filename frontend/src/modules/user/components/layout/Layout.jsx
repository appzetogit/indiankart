import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Header from './Header';
import BottomNav from './BottomNav';
import Footer from './Footer';

const Layout = () => {
    const location = useLocation();
    const isPDP = location.pathname.includes('/product/');
    const isCategory = location.pathname.includes('/category/');

    // Pages that provide their own header/navigation and should hide the global header
    const isStandalonePage = [
        '/cart',
        '/checkout',
        '/order-success',
        '/my-orders',
        '/track-order',
        '/deals',
        '/notification-settings',
        '/select-language',
        '/coupons',
        '/help-center',
        '/addresses',
        '/login',
        '/signup',
        '/play',
        '/categories',
        '/wishlist'
    ].some(path => location.pathname.includes(path));

    const isAccountPage = location.pathname === '/account';
    const isHome = location.pathname === '/';

    return (
        <div className="w-full min-h-screen flex flex-col relative bg-background-light">
            {!isStandalonePage && (
                <div className={isAccountPage ? 'hidden md:block' : ''}>
                    <Header />
                </div>
            )}
            <main className={`flex flex-col pb-[80px] md:pb-0 w-full transition-all duration-300 bg-white
                ${isStandalonePage ? 'pt-0' :
                    isPDP ? 'pt-[0px] md:pt-[130px]' :
                        isCategory ? 'pt-[80px] md:pt-[160px]' :
                            isHome ? 'pt-[260px] md:pt-[240px]' :
                                isAccountPage ? 'pt-0 md:pt-[160px]' :
                                    'pt-[110px] md:pt-[160px]'}`}>
                <AnimatePresence mode="popLayout">
                    <motion.div
                        key={location.pathname}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.2 }}
                        className="flex-1 flex flex-col"
                    >
                        <Outlet />
                    </motion.div>
                </AnimatePresence>
            </main>
            {
                !location.pathname.includes('/product/') &&

                !location.pathname.includes('/checkout') &&
                !location.pathname.includes('/login') &&
                !location.pathname.includes('/signup') &&
                !location.pathname.includes('/track-order') &&
                !location.pathname.includes('/category/') &&
                !location.pathname.includes('/play') && <BottomNav />
            }
            {!isCategory && (
                <div className="hidden md:block">
                    <Footer />
                </div>
            )}
        </div >
    );
};

export default Layout;
