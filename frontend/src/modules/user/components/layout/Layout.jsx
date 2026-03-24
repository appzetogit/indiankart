import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Header from './Header';
import BottomNav from './BottomNav';
import Footer from './Footer';

const Layout = () => {
    const location = useLocation();
    const isPDP = location.pathname.includes('/product/');
    const isCategory = location.pathname.includes('/category/');
    const isAllCategories = location.pathname === '/categories';
    const isInfoPage = location.pathname.includes('/info');
    const isCheckout = location.pathname.includes('/checkout');
    const isAccountSectionPage = [
        '/account',
        '/settings',
        '/addresses',
        '/wishlist',
        '/my-orders'
    ].some(path => location.pathname.includes(path));

    // Pages that provide their own header/navigation and should hide the global header
    const isStandalonePage = [
        '/cart',
        '/order-success',
        '/track-order',
        '/deals',
        '/notification-settings',
        '/select-language',
        '/help-center',
        '/login',
        '/play',
        '/categories'
    ].some(path => location.pathname.includes(path));

    const isHome = location.pathname === '/';
    const standardTopPadding = 'pt-[110px] md:pt-[160px]';
    const accountSectionTopPadding = 'pt-[110px] md:pt-[96px]';
    const showBottomNav =
        !location.pathname.includes('/product/') &&
        !location.pathname.includes('/checkout') &&
        !location.pathname.includes('/login') &&
        !location.pathname.includes('/track-order') &&
        !location.pathname.includes('/category/') &&
        !location.pathname.includes('/play');
    const showFooter = !isCategory && !isAllCategories;

    return (
        <div className="w-full min-h-screen flex flex-col relative bg-background-light">
            {!isStandalonePage && (
                <div className={isCheckout ? 'hidden md:block' : ''}>
                    <Header />
                </div>
            )}
            <main className={`flex flex-col ${showFooter ? 'pb-0' : 'pb-[calc(92px+env(safe-area-inset-bottom))]'} md:pb-0 w-full transition-all duration-300 ${isInfoPage ? 'bg-white' : 'bg-white'}
                ${isStandalonePage ? 'pt-0' :
                    isPDP ? 'pt-[0px] md:pt-[130px]' :
                        isCategory ? 'pt-[72px] md:pt-[116px]' :
                            isInfoPage ? 'pt-[76px] md:pt-[108px]' :
                            isCheckout ? 'pt-0 md:pt-[96px]' :
                            isHome ? 'pt-[260px] md:pt-[210px]' :
                                isAccountSectionPage ? accountSectionTopPadding :
                                    standardTopPadding}`}>
                <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                        key={location.pathname}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className={`${isInfoPage ? '' : 'flex-1'} flex flex-col`}
                    >
                        <Outlet />
                    </motion.div>
                </AnimatePresence>
            </main>
            {showBottomNav && <BottomNav />}
            {showFooter && (
                <Footer />
            )}
        </div >
    );
};

export default Layout;
