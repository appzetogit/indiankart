import Setting from '../models/Setting.js';
import { isAdminUser } from './authMiddleware.js';
import { normalizeAdminRole, normalizeSidebarPermissions } from '../constants/adminPermissions.js';

// PUT /api/settings is shared by several admin pages. Anyone who could change
// the payment or courier credentials could send customer payments to their
// own account or our courier tokens and customer data to their own server,
// so those fields are superadmin-only. Everything else needs one of the pages
// that edits settings.
const SECRET_FIELDS = ['razorpayKeySecret', 'razorpayWebhookSecret', 'delhiveryToken', 'ekartPassword', 'ekartApiKey'];
const CREDENTIAL_CONFIG_FIELDS = [
    'razorpayKeyId', 'deliveryApi', 'delhiveryClientName', 'ekartBaseUrl', 'ekartTrackingBaseUrl',
    'ekartClientId', 'ekartClientName', 'ekartUsername', 'ekartCreateShipmentPath', 'ekartTrackingPath', 'ekartCancelPath',
];
const SETTINGS_PAGES = ['storeSettings', 'shippingCharges', 'codAdvancedPayment', 'categoryPageBuilder', 'subCategoryPageBuilder', 'apiCredentials', 'homepageFooter'];

const filled = (value) => typeof value === 'string' ? value.trim() !== '' : value !== undefined && value !== null;

export const requireSettingsPermission = async (req, res, next) => {
    try {
        if (!isAdminUser(req.user)) {
            return res.status(403).json({ message: 'You do not have permission for this page' });
        }
        const role = normalizeAdminRole(req.user.role);
        const permissions = normalizeSidebarPermissions(role, req.user.permissions);
        const body = req.body || {};

        let touchesCredentials = SECRET_FIELDS.some((field) => filled(body[field]));
        if (!touchesCredentials) {
            const sent = CREDENTIAL_CONFIG_FIELDS.filter((field) => body[field] !== undefined);
            if (sent.length) {
                const current = await Setting.findOne().select(sent.join(' ')).lean();
                touchesCredentials = sent.some((field) => String(body[field] ?? '').trim() !== String(current?.[field] ?? '').trim());
            }
        }

        if (touchesCredentials) {
            if (role !== 'superadmin') {
                return res.status(403).json({ message: 'Only a superadmin can change payment or courier credentials' });
            }
            return next();
        }

        if (SETTINGS_PAGES.some((page) => permissions.includes(page))) {
            return next();
        }
        return res.status(403).json({ message: 'You do not have permission for this page' });
    } catch (error) {
        return res.status(500).json({ message: 'Could not check permissions' });
    }
};
