import Setting from '../models/Setting.js';
import { uploadBufferToCloudinary } from '../utils/cloudinaryUpload.js';
import Product from '../models/Product.js';
import mongoose from 'mongoose';

const normalizeSettingKey = (value) => String(value || '').trim().toLowerCase();
const CATEGORY_PAGE_PROJECTION = 'id name brand subcategoryBrand price originalPrice discount rating image category categoryId subCategories tags subtitle skus ram';

const buildCatalogEntryPipeline = (field, normalizedName) => ([
    { $limit: 1 },
    {
        $project: {
            entry: {
                $first: {
                    $filter: {
                        input: `$${field}`,
                        as: 'entry',
                        cond: {
                            $eq: [
                                {
                                    $toLower: {
                                        $trim: {
                                            input: { $ifNull: ['$$entry.name', ''] }
                                        }
                                    }
                                },
                                normalizedName
                            ]
                        }
                    }
                }
            }
        }
    }
]);

const buildCatalogLayoutPipeline = (field, normalizedName) => ([
    ...buildCatalogEntryPipeline(field, normalizedName),
    {
        $project: {
            entry: {
                $cond: [
                    { $ifNull: ['$entry', false] },
                    {
                        id: '$entry.id',
                        dbId: '$entry.dbId',
                        name: '$entry.name',
                        subCategories: { $ifNull: ['$entry.subCategories', []] },
                        categoryStrip: {
                            $ifNull: [
                                '$entry.categoryStrip',
                                { isActive: true, items: [] }
                            ]
                        },
                        products: [],
                        pageSections: {
                            $map: {
                                input: { $ifNull: ['$entry.pageSections', []] },
                                as: 'section',
                                in: {
                                    id: '$$section.id',
                                    sectionKind: '$$section.sectionKind',
                                    isActive: '$$section.isActive',
                                    order: '$$section.order',
                                    title: { $ifNull: ['$$section.title', ''] },
                                    description: { $ifNull: ['$$section.description', ''] },
                                    sectionLink: { $ifNull: ['$$section.sectionLink', ''] },
                                    showArrow: { $ifNull: ['$$section.showArrow', false] },
                                    backgroundType: { $ifNull: ['$$section.backgroundType', 'color'] },
                                    backgroundColor: { $ifNull: ['$$section.backgroundColor', '#ffffff'] },
                                    backgroundImage: { $ifNull: ['$$section.backgroundImage', ''] },
                                    imageRatio: { $ifNull: ['$$section.imageRatio', 'square'] },
                                    imageWidth: { $ifNull: ['$$section.imageWidth', ''] },
                                    desktopImageItemsPerRow: { $ifNull: ['$$section.desktopImageItemsPerRow', ''] },
                                    mediaDisplay: { $ifNull: ['$$section.mediaDisplay', 'grid'] },
                                    locked: { $ifNull: ['$$section.locked', false] },
                                    itemCount: {
                                        $size: {
                                            $ifNull: ['$$section.items', []]
                                        }
                                    }
                                }
                            }
                        }
                    },
                    null
                ]
            }
        }
    }
]);

const buildCatalogSectionPipeline = (field, normalizedName, sectionId) => ([
    ...buildCatalogEntryPipeline(field, normalizedName),
    {
        $project: {
            section: {
                $first: {
                    $filter: {
                        input: { $ifNull: ['$entry.pageSections', []] },
                        as: 'section',
                        cond: {
                            $eq: [
                                {
                                    $trim: {
                                        input: { $ifNull: ['$$section.id', ''] }
                                    }
                                },
                                sectionId
                            ]
                        }
                    }
                }
            }
        }
    }
]);

const loadMatchingCatalogEntry = async (field, normalizedName) => {
    const [result] = await Setting.aggregate(buildCatalogEntryPipeline(field, normalizedName));
    return result?.entry || null;
};

const loadMatchingCatalogLayout = async (field, normalizedName) => {
    const [result] = await Setting.aggregate(buildCatalogLayoutPipeline(field, normalizedName));
    return result?.entry || null;
};

const loadMatchingCatalogSection = async (field, normalizedName, sectionId) => {
    const [result] = await Setting.aggregate(buildCatalogSectionPipeline(field, normalizedName, sectionId));
    return result?.section || null;
};

const loadSectionProducts = async (items = []) => {
    const snapshotsById = new Map();
    const numericIds = new Set();
    const objectIds = new Set();

    items.forEach((item) => {
        if (item?.itemType !== 'product' || !item?.productId) return;
        const normalizedId = String(item.productId).trim();
        if (!normalizedId) return;

        if (item?.productSnapshot) {
            snapshotsById.set(normalizedId, item.productSnapshot);
        }

        const numericId = Number(normalizedId);
        if (Number.isFinite(numericId)) {
            numericIds.add(numericId);
        }

        if (mongoose.Types.ObjectId.isValid(normalizedId)) {
            objectIds.add(normalizedId);
        }
    });

    if (numericIds.size === 0 && objectIds.size === 0) {
        return Array.from(snapshotsById.values());
    }

    const productQuery = [];
    if (numericIds.size > 0) {
        productQuery.push({ id: { $in: Array.from(numericIds) } });
    }
    if (objectIds.size > 0) {
        productQuery.push({ _id: { $in: Array.from(objectIds) } });
    }

    const products = await Product.find(productQuery.length === 1 ? productQuery[0] : { $or: productQuery })
        .select(CATEGORY_PAGE_PROJECTION)
        .lean();

    products.forEach((product) => {
        const normalizedNumericId = String(product?.id || '').trim();
        const normalizedObjectId = String(product?._id || '').trim();

        if (normalizedNumericId) {
            snapshotsById.set(normalizedNumericId, product);
        }
        if (normalizedObjectId) {
            snapshotsById.set(normalizedObjectId, product);
        }
    });

    return items
        .filter((item) => item?.itemType === 'product' && item?.productId)
        .map((item) => snapshotsById.get(String(item.productId).trim()) || item?.productSnapshot || null)
        .filter(Boolean);
};

// @desc    Get settings
// @route   GET /api/settings
// @access  Private/Admin
const getSettings = async (req, res) => {
    try {
        const checkoutFields = [
            'sellerName',
            'logoUrl',
            'shippingCharge',
            'freeShippingThreshold',
            'minShippingOrderAmount',
            'maxShippingOrderAmount',
            'codAdvancedPaymentEnabled',
            'codAdvancedPaymentAmount'
        ].join(' ');
        const query = Setting.findOne();
        if (req.query.view === 'checkout') query.select(checkoutFields);
        let settings = await query.lean();
        if (!settings) {
            // Create default settings if not exists
            const createdSettings = await Setting.create({
                sellerName: 'My E-com Store',
                sellerAddress: '123 E-com St, Digital City',
                shippingCharge: 40,
                freeShippingThreshold: 500,
                minShippingOrderAmount: 0,
                maxShippingOrderAmount: 499,
                categoryPageCatalog: [],
                subCategoryPageCatalog: []
            });
            settings = req.query.view === 'checkout'
                ? await Setting.findById(createdSettings._id).select(checkoutFields).lean()
                : createdSettings.toObject();
        }
        res.set('Cache-Control', 'private, max-age=30, stale-while-revalidate=120');
        res.json(settings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get one category page config by category name
// @route   GET /api/settings/category-page-config/:categoryName
// @access  Public
const getCategoryPageConfig = async (req, res) => {
    try {
        const categoryName = normalizeSettingKey(decodeURIComponent(req.params.categoryName || ''));
        const config = await loadMatchingCatalogEntry('categoryPageCatalog', categoryName);
        res.json({ config });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get one subcategory page config by category/subcategory name
// @route   GET /api/settings/subcategory-page-config/:categoryName/:subCategoryName
// @access  Public
const getSubCategoryPageConfig = async (req, res) => {
    try {
        const categoryName = normalizeSettingKey(decodeURIComponent(req.params.categoryName || ''));
        const subCategoryName = normalizeSettingKey(decodeURIComponent(req.params.subCategoryName || ''));
        const targetName = `${categoryName} / ${subCategoryName}`;

        const config = await loadMatchingCatalogEntry('subCategoryPageCatalog', targetName);
        res.json({ config });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get category page layout metadata only
// @route   GET /api/settings/category-page-layout/:categoryName
// @access  Public
const getCategoryPageLayout = async (req, res) => {
    try {
        const categoryName = normalizeSettingKey(decodeURIComponent(req.params.categoryName || ''));
        const config = await loadMatchingCatalogLayout('categoryPageCatalog', categoryName);
        res.json({ config: config || null });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get one category page section payload
// @route   GET /api/settings/category-page-section/:categoryName/:sectionId
// @access  Public
const getCategoryPageSection = async (req, res) => {
    try {
        const categoryName = normalizeSettingKey(decodeURIComponent(req.params.categoryName || ''));
        const sectionId = String(req.params.sectionId || '').trim();
        const section = await loadMatchingCatalogSection('categoryPageCatalog', categoryName, sectionId);

        if (!section) {
            return res.status(404).json({ message: 'Section not found' });
        }

        const products = await loadSectionProducts(section.items);
        return res.json({ section, products });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

// @desc    Get subcategory page layout metadata only
// @route   GET /api/settings/subcategory-page-layout/:categoryName/:subCategoryName
// @access  Public
const getSubCategoryPageLayout = async (req, res) => {
    try {
        const categoryName = normalizeSettingKey(decodeURIComponent(req.params.categoryName || ''));
        const subCategoryName = normalizeSettingKey(decodeURIComponent(req.params.subCategoryName || ''));
        const targetName = `${categoryName} / ${subCategoryName}`;
        const config = await loadMatchingCatalogLayout('subCategoryPageCatalog', targetName);
        res.json({ config: config || null });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get one subcategory page section payload
// @route   GET /api/settings/subcategory-page-section/:categoryName/:subCategoryName/:sectionId
// @access  Public
const getSubCategoryPageSection = async (req, res) => {
    try {
        const categoryName = normalizeSettingKey(decodeURIComponent(req.params.categoryName || ''));
        const subCategoryName = normalizeSettingKey(decodeURIComponent(req.params.subCategoryName || ''));
        const targetName = `${categoryName} / ${subCategoryName}`;
        const sectionId = String(req.params.sectionId || '').trim();
        const section = await loadMatchingCatalogSection('subCategoryPageCatalog', targetName, sectionId);

        if (!section) {
            return res.status(404).json({ message: 'Section not found' });
        }

        const products = await loadSectionProducts(section.items);
        return res.json({ section, products });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

// @desc    Update settings
// @route   PUT /api/settings
// @access  Private/Admin
const updateSettings = async (req, res) => {
    try {
        const {
            sellerName,
            sellerAddress,
            gstNumber,
            panNumber,
            contactEmail,
            contactPhone,
            fssai,
            razorpayKeyId,
            razorpayKeySecret,
            deliveryApi,
            delhiveryClientName,
            delhiveryPickupLocation,
            delhiveryToken,
            ekartBaseUrl,
            ekartTrackingBaseUrl,
            ekartClientId,
            ekartClientName,
            ekartPickupLocation,
            ekartUsername,
            ekartPassword,
            ekartApiKey,
            ekartCreateShipmentPath,
            ekartTrackingPath,
            ekartCancelPath,
            shippingCharge,
            freeShippingThreshold,
            minShippingOrderAmount,
            maxShippingOrderAmount,
            categoryPageCatalog,
            subCategoryPageCatalog,
            codAdvancedPaymentEnabled,
            codAdvancedPaymentAmount
        } = req.body;

        let settings = await Setting.findOne();

        // Handle uploaded files via Cloudinary
        let logoUrl = req.body.logoUrl;
        let signatureUrl = req.body.signatureUrl;

        if (req.files) {
            if (req.files.logo && req.files.logo[0]) {
                const uploadedLogo = await uploadBufferToCloudinary(
                    req.files.logo[0],
                    { folder: 'ecom_uploads/settings' }
                );
                logoUrl = uploadedLogo.secure_url;
            }
            if (req.files.signature && req.files.signature[0]) {
                const uploadedSignature = await uploadBufferToCloudinary(
                    req.files.signature[0],
                    { folder: 'ecom_uploads/settings' }
                );
                signatureUrl = uploadedSignature.secure_url;
            }
        }

        if (settings) {
            settings.sellerName = sellerName || settings.sellerName;
            settings.sellerAddress = sellerAddress || settings.sellerAddress;
            settings.gstNumber = gstNumber || settings.gstNumber;
            settings.panNumber = panNumber || settings.panNumber;
            settings.logoUrl = logoUrl || settings.logoUrl;
            settings.signatureUrl = signatureUrl || settings.signatureUrl;
            settings.contactEmail = contactEmail || settings.contactEmail;
            settings.contactPhone = contactPhone || settings.contactPhone;
            settings.fssai = fssai || settings.fssai;
            settings.razorpayKeyId = razorpayKeyId || settings.razorpayKeyId;
            if (typeof razorpayKeySecret === 'string' && razorpayKeySecret.trim()) {
                settings.razorpayKeySecret = razorpayKeySecret.trim();
            }
            if (deliveryApi !== undefined) {
                settings.deliveryApi = String(deliveryApi || '').trim();
            }
            if (delhiveryClientName !== undefined) {
                settings.delhiveryClientName = String(delhiveryClientName || '').trim();
            }
            if (delhiveryPickupLocation !== undefined) {
                settings.delhiveryPickupLocation = String(delhiveryPickupLocation || '').trim();
            }
            if (typeof delhiveryToken === 'string' && delhiveryToken.trim()) {
                settings.delhiveryToken = delhiveryToken.trim();
            }
            if (ekartBaseUrl !== undefined) {
                settings.ekartBaseUrl = String(ekartBaseUrl || '').trim();
            }
            if (ekartTrackingBaseUrl !== undefined) {
                settings.ekartTrackingBaseUrl = String(ekartTrackingBaseUrl || '').trim();
            }
            if (ekartClientId !== undefined) {
                settings.ekartClientId = String(ekartClientId || '').trim();
            }
            if (ekartClientName !== undefined) {
                settings.ekartClientName = String(ekartClientName || '').trim();
            }
            if (ekartPickupLocation !== undefined) {
                settings.ekartPickupLocation = String(ekartPickupLocation || '').trim();
            }
            if (ekartUsername !== undefined) {
                settings.ekartUsername = String(ekartUsername || '').trim();
            }
            if (typeof ekartPassword === 'string' && ekartPassword.trim()) {
                settings.ekartPassword = ekartPassword.trim();
            }
            if (typeof ekartApiKey === 'string' && ekartApiKey.trim()) {
                settings.ekartApiKey = ekartApiKey.trim();
            }
            if (ekartCreateShipmentPath !== undefined) {
                settings.ekartCreateShipmentPath = String(ekartCreateShipmentPath || '').trim();
            }
            if (ekartTrackingPath !== undefined) {
                settings.ekartTrackingPath = String(ekartTrackingPath || '').trim();
            }
            if (ekartCancelPath !== undefined) {
                settings.ekartCancelPath = String(ekartCancelPath || '').trim();
            }
            if (shippingCharge !== undefined) {
                const parsed = Number(shippingCharge);
                if (Number.isFinite(parsed) && parsed >= 0) settings.shippingCharge = parsed;
            }
            if (freeShippingThreshold !== undefined) {
                const parsed = Number(freeShippingThreshold);
                if (Number.isFinite(parsed) && parsed >= 0) settings.freeShippingThreshold = parsed;
            }
            if (minShippingOrderAmount !== undefined) {
                const parsed = Number(minShippingOrderAmount);
                if (Number.isFinite(parsed) && parsed >= 0) settings.minShippingOrderAmount = parsed;
            }
            if (maxShippingOrderAmount !== undefined) {
                const parsed = Number(maxShippingOrderAmount);
                if (Number.isFinite(parsed) && parsed >= 0) settings.maxShippingOrderAmount = parsed;
            }
            if (categoryPageCatalog !== undefined) {
                const parsedCatalog = typeof categoryPageCatalog === 'string'
                    ? JSON.parse(categoryPageCatalog)
                    : categoryPageCatalog;
                if (Array.isArray(parsedCatalog)) {
                    settings.categoryPageCatalog = parsedCatalog;
                }
            }
            if (subCategoryPageCatalog !== undefined) {
                const parsedCatalog = typeof subCategoryPageCatalog === 'string'
                    ? JSON.parse(subCategoryPageCatalog)
                    : subCategoryPageCatalog;
                if (Array.isArray(parsedCatalog)) {
                    settings.subCategoryPageCatalog = parsedCatalog;
                }
            }
            if (codAdvancedPaymentEnabled !== undefined) {
                settings.codAdvancedPaymentEnabled = codAdvancedPaymentEnabled === 'true' || codAdvancedPaymentEnabled === true;
            }
            if (codAdvancedPaymentAmount !== undefined) {
                const parsed = Number(codAdvancedPaymentAmount);
                if (Number.isFinite(parsed) && parsed >= 0) settings.codAdvancedPaymentAmount = parsed;
            }

            const updatedSettings = await settings.save();
            res.json(updatedSettings);
        } else {
            // Create new settings if not exists
            const newSettings = await Setting.create({
                sellerName,
                sellerAddress,
                gstNumber,
                panNumber,
                logoUrl,
                signatureUrl,
                contactEmail,
                contactPhone,
                fssai,
                razorpayKeyId: razorpayKeyId || '',
                razorpayKeySecret: (typeof razorpayKeySecret === 'string' ? razorpayKeySecret.trim() : '') || '',
                deliveryApi: typeof deliveryApi === 'string' ? deliveryApi.trim() : '',
                delhiveryClientName: typeof delhiveryClientName === 'string' ? delhiveryClientName.trim() : '',
                delhiveryPickupLocation: typeof delhiveryPickupLocation === 'string' ? delhiveryPickupLocation.trim() : '',
                delhiveryToken: (typeof delhiveryToken === 'string' ? delhiveryToken.trim() : '') || '',
                ekartBaseUrl: typeof ekartBaseUrl === 'string' ? ekartBaseUrl.trim() : '',
                ekartTrackingBaseUrl: typeof ekartTrackingBaseUrl === 'string' ? ekartTrackingBaseUrl.trim() : '',
                ekartClientId: typeof ekartClientId === 'string' ? ekartClientId.trim() : '',
                ekartClientName: typeof ekartClientName === 'string' ? ekartClientName.trim() : '',
                ekartPickupLocation: typeof ekartPickupLocation === 'string' ? ekartPickupLocation.trim() : '',
                ekartUsername: typeof ekartUsername === 'string' ? ekartUsername.trim() : '',
                ekartPassword: (typeof ekartPassword === 'string' ? ekartPassword.trim() : '') || '',
                ekartApiKey: (typeof ekartApiKey === 'string' ? ekartApiKey.trim() : '') || '',
                ekartCreateShipmentPath: typeof ekartCreateShipmentPath === 'string' ? ekartCreateShipmentPath.trim() : '/api/v1/package/create',
                ekartTrackingPath: typeof ekartTrackingPath === 'string' ? ekartTrackingPath.trim() : '/api/v1/track/{id}',
                ekartCancelPath: typeof ekartCancelPath === 'string' ? ekartCancelPath.trim() : '/api/v1/package/cancel',
                shippingCharge: Number.isFinite(Number(shippingCharge)) ? Number(shippingCharge) : 40,
                freeShippingThreshold: Number.isFinite(Number(freeShippingThreshold)) ? Number(freeShippingThreshold) : 500,
                minShippingOrderAmount: Number.isFinite(Number(minShippingOrderAmount)) ? Number(minShippingOrderAmount) : 0,
                maxShippingOrderAmount: Number.isFinite(Number(maxShippingOrderAmount)) ? Number(maxShippingOrderAmount) : 499,
                categoryPageCatalog: Array.isArray(categoryPageCatalog)
                    ? categoryPageCatalog
                    : (typeof categoryPageCatalog === 'string'
                        ? (JSON.parse(categoryPageCatalog) || [])
                        : []),
                subCategoryPageCatalog: Array.isArray(subCategoryPageCatalog)
                    ? subCategoryPageCatalog
                    : (typeof subCategoryPageCatalog === 'string'
                        ? (JSON.parse(subCategoryPageCatalog) || [])
                        : []),
                codAdvancedPaymentEnabled: codAdvancedPaymentEnabled === 'true' || codAdvancedPaymentEnabled === true,
                codAdvancedPaymentAmount: Number.isFinite(Number(codAdvancedPaymentAmount)) ? Number(codAdvancedPaymentAmount) : 0
            });
            res.json(newSettings);
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Upload category page builder image
// @route   POST /api/settings/category-page-image
// @access  Private/Admin
const uploadCategoryPageImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'Image file is required' });
        }

        const uploaded = await uploadBufferToCloudinary(req.file, {
            folder: 'ecom_uploads/category-page'
        });

        return res.json({
            imageUrl: uploaded?.secure_url || ''
        });
    } catch (error) {
        return res.status(500).json({ message: error.message || 'Image upload failed' });
    }
};

export {
    getSettings,
    getCategoryPageConfig,
    getCategoryPageLayout,
    getCategoryPageSection,
    getSubCategoryPageConfig,
    getSubCategoryPageLayout,
    getSubCategoryPageSection,
    updateSettings,
    uploadCategoryPageImage
};
