import FooterConfig from '../models/FooterConfig.js';

// @desc    Get footer configuration
// @route   GET /api/footer
// @access  Public
export const getFooterConfig = async (req, res) => {
    try {
        let config = await FooterConfig.findOne();
        if (!config) {
            // Create default config if none exists
            config = await FooterConfig.create({
                sections: [
                    {
                        title: 'ABOUT',
                        links: [
                            { label: 'Contact Us', pageKey: 'contactUs' },
                            { label: 'About Us', pageKey: 'aboutUs' }
                        ]
                    }
                ],
                mailAddress: 'Store Address, City, State, ZIP, Country',
                officeAddress: 'Registered Office Address, City, State, ZIP, Country',
                copyrightText: `© 2007-${new Date().getFullYear()} YourStore.com`
            });
        }
        res.json(config);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update footer configuration
// @route   POST /api/footer
// @access  Private/Admin
export const updateFooterConfig = async (req, res) => {
    try {
        const { 
            sections, 
            quickLinks,
            mailAddress, 
            officeAddress, 
            cinNumber, 
            copyrightText, 
            socialLinks,
            becomeSellerPageKey,
            becomeSellerUrl,
            advertisePageKey,
            advertiseUrl,
            giftCardsPageKey,
            giftCardsUrl,
            helpCenterPageKey
            ,
            helpCenterUrl
        } = req.body;

        let config = await FooterConfig.findOne();

        if (config) {
            config.sections = sections;
            config.quickLinks = quickLinks;
            config.mailAddress = mailAddress;
            config.officeAddress = officeAddress;
            config.cinNumber = cinNumber;
            config.copyrightText = copyrightText;
            config.socialLinks = socialLinks;
            config.becomeSellerPageKey = becomeSellerPageKey;
            config.becomeSellerUrl = becomeSellerUrl;
            config.advertisePageKey = advertisePageKey;
            config.advertiseUrl = advertiseUrl;
            config.giftCardsPageKey = giftCardsPageKey;
            config.giftCardsUrl = giftCardsUrl;
            config.helpCenterPageKey = helpCenterPageKey;
            config.helpCenterUrl = helpCenterUrl;
            await config.save();
        } else {
            config = await FooterConfig.create({
                sections,
                quickLinks,
                mailAddress,
                officeAddress,
                cinNumber,
                copyrightText,
                socialLinks,
                becomeSellerPageKey,
                becomeSellerUrl,
                advertisePageKey,
                advertiseUrl,
                giftCardsPageKey,
                giftCardsUrl,
                helpCenterPageKey
                ,
                helpCenterUrl
            });
        }

        res.json(config);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
