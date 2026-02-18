import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useContentStore } from '../../../admin/store/contentStore';
import { useFooterStore } from '../../../admin/store/footerStore';
import { 
    FaFacebookF, 
    FaTwitter, 
    FaYoutube, 
    FaInstagram,
    FaStore,
    FaGift,
    FaQuestionCircle,
    FaBullhorn
} from 'react-icons/fa';
import { RiTwitterXFill } from 'react-icons/ri';

const Footer = () => {
    const navigate = useNavigate();
    const { seoContent, copyright, fetchPages } = useContentStore();
    const { footerConfig, fetchFooterConfig } = useFooterStore();

    useEffect(() => {
        if (!footerConfig) {
            fetchFooterConfig();
        }
        fetchPages();
    }, [footerConfig, fetchFooterConfig, fetchPages]);

    if (!footerConfig) return null;

    const handleLinkClick = (link) => {
        if (link.isExternal || (link.url && link.url.startsWith('http'))) {
            window.open(link.url, '_blank', 'noopener,noreferrer');
        } else if (link.pageKey) {
            navigate(`/info?type=dynamic&key=${link.pageKey}`);
        } else if (link.url) {
            navigate(link.url);
        }
    };

    const socialIcons = [
        { platform: 'facebook', icon: FaFacebookF, url: footerConfig.socialLinks?.facebook },
        { platform: 'twitter', icon: RiTwitterXFill, url: footerConfig.socialLinks?.twitter },
        { platform: 'youtube', icon: FaYoutube, url: footerConfig.socialLinks?.youtube },
        { platform: 'instagram', icon: FaInstagram, url: footerConfig.socialLinks?.instagram },
    ];

    return (
        <>
            {/* ================= WHY CHOOSE US (SEO TEXT) - DESKTOP ONLY ================= */}
            {seoContent?.trim() && (
                <div className="hidden md:block bg-[#f1f3f6] border-t border-gray-200 py-10 px-4">
                    <div className="max-w-[1440px] mx-auto text-[#565656] text-xs leading-relaxed space-y-4">
                        {seoContent.split('\n').filter(line => line.trim() !== '').map((line, index) => {
                            if (line.length < 100 && !line.includes('.')) {
                                return <h2 key={index} className="text-[#878787] uppercase font-bold mb-1 mt-4 text-xs">{line}</h2>;
                            }
                            return <p key={index}>{line}</p>;
                        })}
                    </div>
                </div>
            )}

            <footer className="w-full bg-[#212121] text-white overflow-hidden text-[12px] font-sans border-t border-gray-700">
                {/* ================= DESKTOP VIEW ================= */}
                <div className="hidden md:block max-w-[1440px] mx-auto px-4 pt-10 pb-6">
                    <div className="flex w-full gap-8">
                        {/* LEFT SIDE: DYNAMIC SECTIONS */}
                        <div className={`flex-[4.5] grid grid-cols-${Math.max(footerConfig.sections.length, 4)} gap-6 pr-8`}>
                            {footerConfig.sections.map((section, idx) => (
                                <div key={idx}>
                                    <h6 className="text-[#878787] uppercase mb-3 font-medium cursor-default">{section.title}</h6>
                                    <ul className="space-y-1.5 font-bold">
                                        {section.links.map((link, lIdx) => (
                                            <li key={lIdx}>
                                                <button 
                                                    onClick={() => handleLinkClick(link)}
                                                    className="hover:underline text-left text-white"
                                                >
                                                    {link.label}
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>

                        {/* RIGHT SIDE: ADDRESS SECTION */}
                        <div className="flex-[3] flex border-l border-[#454d5e] pl-8 gap-8 text-[11px] leading-relaxed">
                            <div className="flex-1">
                                <h6 className="text-[#878787] uppercase mb-3 font-medium">Mail Us:</h6>
                                <p className="whitespace-pre-line text-white font-medium">
                                    {footerConfig.mailAddress}
                                </p>
                                
                                <div className="mt-6">
                                    <h6 className="text-[#878787] uppercase mb-3 font-medium">Social:</h6>
                                    <div className="flex gap-4">
                                        {socialIcons.map((social, idx) => (
                                            social.url && social.url.trim() !== '' && (
                                                <a 
                                                    key={idx} 
                                                    href={social.url} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer" 
                                                    className="text-white hover:text-blue-400 transition-colors"
                                                >
                                                    <social.icon size={18} />
                                                </a>
                                            )
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="flex-1">
                                <h6 className="text-[#878787] uppercase mb-3 font-medium">Registered Office Address:</h6>
                                <p className="whitespace-pre-line text-white font-medium">
                                    {footerConfig.officeAddress}
                                </p>
                                {footerConfig.cinNumber && (
                                    <div className="mt-4">
                                        <h6 className="text-[#878787] uppercase mb-1 font-medium">CIN:</h6>
                                        <p className="text-white font-medium uppercase">{footerConfig.cinNumber}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* BOTTOM BAR LINKS */}
                    <div className="border-t border-[#454d5e] mt-10 pt-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-10">
                                <div 
                                    onClick={() => navigate('/become-seller')}
                                    className="flex items-center gap-2 cursor-pointer group text-white hover:text-yellow-400 transition-colors"
                                >
                                    <FaStore className="text-yellow-500 text-sm group-hover:scale-110 transition-transform" />
                                    <span className="font-bold">Become a Seller</span>
                                </div>
                                <div 
                                    onClick={() => handleLinkClick({ pageKey: footerConfig.advertisePageKey || 'advertise' })}
                                    className="flex items-center gap-2 cursor-pointer group text-white hover:text-yellow-400 transition-colors"
                                >
                                    <FaBullhorn className="text-yellow-500 text-sm group-hover:scale-110 transition-transform" />
                                    <span className="font-bold">Advertise</span>
                                </div>
                                <div 
                                    onClick={() => handleLinkClick({ pageKey: footerConfig.giftCardsPageKey || 'gift-cards' })}
                                    className="flex items-center gap-2 cursor-pointer group text-white hover:text-yellow-400 transition-colors"
                                >
                                    <FaGift className="text-yellow-500 text-sm group-hover:scale-110 transition-transform" />
                                    <span className="font-bold">Gift Cards</span>
                                </div>
                                <div 
                                    onClick={() => handleLinkClick({ pageKey: footerConfig.helpCenterPageKey || 'help-center' })}
                                    className="flex items-center gap-2 cursor-pointer group text-white hover:text-yellow-400 transition-colors font-bold"
                                >
                                    <FaQuestionCircle className="text-yellow-500 text-sm group-hover:scale-110 transition-transform" />
                                    <span>Help Center</span>
                                </div>
                                {copyright ? (
                                    <span 
                                        className="font-bold text-white leading-none footer-copyright-html"
                                        dangerouslySetInnerHTML={{ __html: copyright }}
                                    />
                                ) : (
                                    <span className="font-bold text-white leading-none">
                                        {footerConfig.copyrightText}
                                    </span>
                                )}
                            </div>

                            <div className="flex items-center gap-2">
                                <img 
                                    src="https://static-assets-web.flixcart.com/batman-returns/batman-returns/p/images/payment-method-c454fb.svg" 
                                    alt="Payment Methods" 
                                    className="h-4 grayscale hover:grayscale-0 transition-all cursor-pointer" 
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* ================= MOBILE VIEW ================= */}
                <div className="md:hidden bg-[#212121] pt-8 pb-24 px-4 border-t border-gray-700">
                    <div className="flex flex-col gap-6 text-xs text-gray-300">
                        <div className="grid grid-cols-2 gap-y-4 gap-x-8">
                            {footerConfig.sections.map((section, sIdx) => (
                                <div key={sIdx}>
                                    <h6 className="text-[#878787] uppercase mb-2 font-bold">{section.title}</h6>
                                    <ul className="space-y-1">
                                        {section.links.slice(0, 4).map((link, lIdx) => (
                                            <li key={lIdx}>
                                                <button onClick={() => handleLinkClick(link)} className="text-white hover:text-blue-400 text-left">
                                                    {link.label}
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>

                        {/* Special Links Grid for Mobile */}
                        <div className="grid grid-cols-2 gap-y-4 gap-x-8 pt-6 border-t border-gray-800">
                            <div>
                                <div 
                                    onClick={() => navigate('/become-seller')}
                                    className="flex items-center gap-2 cursor-pointer text-white"
                                >
                                    <FaStore className="text-yellow-500 text-sm" />
                                    <span className="font-bold">Become a Seller</span>
                                </div>
                            </div>
                            <div>
                                <div 
                                    onClick={() => handleLinkClick({ pageKey: footerConfig.advertisePageKey || 'advertise' })}
                                    className="flex items-center gap-2 cursor-pointer text-white"
                                >
                                    <FaBullhorn className="text-yellow-500 text-sm" />
                                    <span className="font-bold">Advertise</span>
                                </div>
                            </div>
                            <div>
                                <div 
                                    onClick={() => handleLinkClick({ pageKey: footerConfig.giftCardsPageKey || 'gift-cards' })}
                                    className="flex items-center gap-2 cursor-pointer text-white"
                                >
                                    <FaGift className="text-yellow-500 text-sm" />
                                    <span className="font-bold">Gift Cards</span>
                                </div>
                            </div>
                            <div>
                                <div 
                                    onClick={() => handleLinkClick({ pageKey: footerConfig.helpCenterPageKey || 'help-center' })}
                                    className="flex items-center gap-2 cursor-pointer text-white font-bold"
                                >
                                    <FaQuestionCircle className="text-yellow-500 text-sm" />
                                    <span>Help Center</span>
                                </div>
                            </div>
                        </div>
                        
                        <div className="flex justify-center gap-6 py-4 border-y border-gray-800">
                            {socialIcons.map((social, idx) => (
                                social.url && social.url.trim() !== '' && (
                                    <a key={idx} href={social.url} className="text-white">
                                        <social.icon size={20} />
                                    </a>
                                )
                            ))}
                        </div>

                        {/* Mobile Address Section */}
                        <div className="grid grid-cols-2 gap-8 px-2 py-2 text-[10px] leading-relaxed">
                            <div className="flex flex-col">
                                <h6 className="text-[#878787] uppercase mb-2 font-bold tracking-wider">Mail Us:</h6>
                                <p className="whitespace-pre-line text-white/90">
                                    {footerConfig.mailAddress}
                                </p>
                            </div>
                            <div className="flex flex-col">
                                <h6 className="text-[#878787] uppercase mb-2 font-bold tracking-wider">Office:</h6>
                                <p className="whitespace-pre-line text-white/90">
                                    {footerConfig.officeAddress}
                                </p>
                            </div>
                        </div>

                        {footerConfig.cinNumber && (
                            <div className="text-center px-4">
                                <p className="text-[#878787] uppercase font-bold text-[10px] mb-1">CIN: {footerConfig.cinNumber}</p>
                            </div>
                        )}

                        <div className="text-center">
                            {copyright ? (
                                <div 
                                    className="block mb-4 font-bold text-white footer-copyright-html"
                                    dangerouslySetInnerHTML={{ __html: copyright }}
                                />
                            ) : (
                                <span className="block mb-4 font-bold text-white">{footerConfig.copyrightText}</span>
                            )}
                            <img src="https://static-assets-web.flixcart.com/batman-returns/batman-returns/p/images/payment-method-c454fb.svg" alt="Payment Methods" className="h-4 mx-auto opacity-70" />
                        </div>
                    </div>
                </div>
            </footer>
        </>
    );
};

export default Footer;
