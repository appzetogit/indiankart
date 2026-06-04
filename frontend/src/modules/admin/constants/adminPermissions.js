import {
    MdDashboard,
    MdInventory,
    MdCategory,
    MdShoppingCart,
    MdAssignmentReturn,
    MdLocalOffer,
    MdLocalShipping,
    MdStorefront,
    MdPeople,
    MdSettings,
    MdDescription,
    MdViewAgenda,
    MdRateReview,
    MdLocationOn,
    MdHelpCenter,
    MdViewCompact,
    MdNotifications,
    MdBusinessCenter,
    MdPlayCircle,
    MdVisibility,
    MdPayment,
    MdAdminPanelSettings,
    MdSupportAgent
} from 'react-icons/md';

export const ADMIN_MENU_GROUPS = [
    {
        title: 'Operations',
        items: [
            { key: 'dashboard', name: 'Dashboard', icon: MdDashboard, path: '/admin/dashboard' },
            { key: 'orders', name: 'Orders', icon: MdShoppingCart, path: '/admin/orders' },
            { key: 'returns', name: 'Returns', icon: MdAssignmentReturn, path: '/admin/returns' },
            { key: 'replacements', name: 'Replacements', icon: MdAssignmentReturn, path: '/admin/replacements' },
            { key: 'deliverySlip', name: 'Delivery Slip', icon: MdLocalShipping, path: '/admin/delivery-slip' },
            { key: 'shippingCharges', name: 'Shipping Charges', icon: MdLocalShipping, path: '/admin/shipping-charges' },
            { key: 'pinCodes', name: 'PIN Codes', icon: MdLocationOn, path: '/admin/pincodes' },
        ]
    },
    {
        title: 'Catalog',
        items: [
            { key: 'products', name: 'Products', icon: MdInventory, path: '/admin/products' },
            { key: 'maxSellingQty', name: 'Max Selling Qty', icon: MdInventory, path: '/admin/products/max-selling-quantity' },
            { key: 'productViews', name: 'Product Views', icon: MdVisibility, path: '/admin/product-views' },
            { key: 'stockManagement', name: 'Stock Management', icon: MdInventory, path: '/admin/stock' },
            { key: 'categories', name: 'Categories', icon: MdCategory, path: '/admin/categories' },
            { key: 'categoryPageBuilder', name: 'Category Page Builder', icon: MdViewAgenda, path: '/admin/categories/page-builder' },
            { key: 'subcategories', name: 'Subcategories', icon: MdCategory, path: '/admin/subcategories' },
            { key: 'subCategoryPageBuilder', name: 'Subcategory Page Builder', icon: MdViewAgenda, path: '/admin/subcategories/page-builder' },
            { key: 'brands', name: 'Brands', icon: MdCategory, path: '/admin/brands' },
        ]
    },
    {
        title: 'Marketing',
        items: [
            { key: 'coupons', name: 'Coupons', icon: MdLocalOffer, path: '/admin/coupons' },
            { key: 'bankOffers', name: 'Bank Offers', icon: MdLocalOffer, path: '/admin/bank-offers' },
            { key: 'play', name: 'Play', icon: MdPlayCircle, path: '/admin/play' },
        ]
    },
    {
        title: 'Users & Support',
        items: [
            { key: 'users', name: 'Users', icon: MdPeople, path: '/admin/users' },
            { key: 'sellerRequests', name: 'Seller Requests', icon: MdStorefront, path: '/admin/seller-requests' },
            { key: 'reviews', name: 'Reviews', icon: MdRateReview, path: '/admin/reviews' },
            { key: 'adminNotifications', name: 'Admin Notifications', icon: MdNotifications, path: '/admin/notifications' },
            { key: 'userNotifications', name: 'User Notifications', icon: MdNotifications, path: '/admin/user-notifications' },
            { key: 'b2b', name: 'B2B Enquiries', icon: MdBusinessCenter, path: '/admin/b2b' },
            { key: 'agentManagement', name: 'Agent Management', icon: MdSupportAgent, path: '/admin/agent-management' },
            { key: 'adminManagement', name: 'Admin Management', icon: MdAdminPanelSettings, path: '/admin/admin-management', assignable: false },
        ]
    },
    {
        title: 'Content',
        items: [
            { key: 'staticPages', name: 'Static Pages', icon: MdDescription, path: '/admin/pages' },
            { key: 'helpCenterContent', name: 'Help Center Content', icon: MdHelpCenter, path: '/admin/content/help-center' },
            { key: 'homepageFooter', name: 'Homepage Footer', icon: MdViewCompact, path: '/admin/footer-settings' },
        ]
    },
    {
        title: 'Configuration',
        items: [
            { key: 'apiCredentials', name: 'API Credentials', icon: MdSettings, path: '/admin/api-credentials' },
            { key: 'storeSettings', name: 'Store Settings', icon: MdSettings, path: '/admin/settings' },
            { key: 'codAdvancedPayment', name: 'COD Advanced Payment', icon: MdPayment, path: '/admin/cod-advanced-payment' },
        ]
    }
];

export const ADMIN_SIDEBAR_OPTIONS = ADMIN_MENU_GROUPS.flatMap((group) => group.items);

export const ADMIN_PERMISSION_PATHS = ADMIN_SIDEBAR_OPTIONS.reduce((acc, item) => {
    acc[item.key] = item.path;
    return acc;
}, {});

export const getDefaultAdminRoute = (adminUser) => {
    const isSuperadmin = adminUser?.role === 'superadmin';
    if (isSuperadmin) {
        return '/admin/dashboard';
    }

    const permissions = Array.isArray(adminUser?.sidebarPermissions) ? adminUser.sidebarPermissions : [];
    const firstAllowed = ADMIN_SIDEBAR_OPTIONS.find((item) => permissions.includes(item.key));
    return firstAllowed?.path || '/admin/login';
};

export const hasAdminPermission = (adminUser, permissionKey) => {
    if (!permissionKey) {
        return true;
    }

    if (adminUser?.role === 'superadmin') {
        return true;
    }

    return Array.isArray(adminUser?.sidebarPermissions) && adminUser.sidebarPermissions.includes(permissionKey);
};
