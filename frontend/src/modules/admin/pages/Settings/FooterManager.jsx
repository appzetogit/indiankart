import React, { useState, useEffect } from 'react';
import { useFooterStore } from '../../store/footerStore';
import { useContentStore } from '../../store/contentStore';
import { MdSave, MdAdd, MdDelete, MdDragIndicator, MdLink, MdBusiness, MdCopyright } from 'react-icons/md';
import toast from 'react-hot-toast';

const FooterManager = () => {
    const { footerConfig, fetchFooterConfig, updateFooterConfig, isLoading } = useFooterStore();
    const { fetchPages } = useContentStore();
    const [config, setConfig] = useState(null);

    useEffect(() => {
        fetchFooterConfig();
        fetchPages(); // To ensure we have page keys if needed for selection
    }, []);

    useEffect(() => {
        if (footerConfig) {
            setConfig(JSON.parse(JSON.stringify(footerConfig)));
        }
    }, [footerConfig]);

    const handleSave = async () => {
        try {
            await updateFooterConfig(config);
            toast.success('Footer configuration updated successfully');
        } catch (error) {
            toast.error('Failed to update footer');
        }
    };

    const addSection = () => {
        const newConfig = { ...config };
        newConfig.sections.push({ title: 'New Section', links: [] });
        setConfig(newConfig);
    };

    const removeSection = (index) => {
        const newConfig = { ...config };
        newConfig.sections.splice(index, 1);
        setConfig(newConfig);
    };

    const addLink = (sectionIndex) => {
        const newConfig = { ...config };
        newConfig.sections[sectionIndex].links.push({ label: 'New Link', pageKey: '', url: '', isExternal: false });
        setConfig(newConfig);
    };

    const removeLink = (sectionIndex, linkIndex) => {
        const newConfig = { ...config };
        newConfig.sections[sectionIndex].links.splice(linkIndex, 1);
        setConfig(newConfig);
    };

    const handleConfigChange = (field, value) => {
        setConfig({ ...config, [field]: value });
    };

    const handleSectionTitleChange = (index, value) => {
        const newConfig = { ...config };
        newConfig.sections[index].title = value;
        setConfig(newConfig);
    };

    const handleLinkChange = (sectionIndex, linkIndex, field, value) => {
        const newConfig = { ...config };
        newConfig.sections[sectionIndex].links[linkIndex][field] = value;
        setConfig(newConfig);
    };

    if (!config) return <div className="p-8 text-center text-gray-500 font-bold">Loading Footer Settings...</div>;

    return (
        <div className="p-6 max-w-6xl mx-auto space-y-8 pb-32">
            <div className="flex items-center justify-between sticky top-0 bg-gray-50/80 backdrop-blur-md py-4 z-10">
                <div>
                    <h1 className="text-2xl font-black text-gray-900">Footer Settings</h1>
                    <p className="text-gray-500 font-medium italic">Manage links, addresses, and copyright info</p>
                </div>
                <button 
                    onClick={handleSave}
                    disabled={isLoading}
                    className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-black flex items-center gap-2 hover:bg-blue-700 transition-all shadow-xl shadow-blue-100"
                >
                    <MdSave /> {isLoading ? 'Saving...' : 'Save Configuration'}
                </button>
            </div>

            {/* Sections Management */}
            <div className="space-y-6">
                <div className="flex items-center justify-between border-b pb-4">
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <MdLink className="text-blue-600" /> Link Sections
                    </h2>
                    <button 
                        onClick={addSection}
                        className="text-blue-600 font-black text-sm flex items-center gap-1 hover:bg-blue-50 px-3 py-1.5 rounded-xl transition-all"
                    >
                        <MdAdd /> Add Section
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {config.sections.map((section, sIdx) => (
                        <div key={sIdx} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col group">
                            <div className="flex items-center gap-4 mb-4">
                                <MdDragIndicator className="text-gray-300" />
                                <input 
                                    value={section.title}
                                    onChange={(e) => handleSectionTitleChange(sIdx, e.target.value)}
                                    className="bg-gray-50 border-none focus:ring-2 focus:ring-blue-100 rounded-xl px-4 py-2 font-black text-gray-950 uppercase tracking-widest flex-1"
                                />
                                <button onClick={() => removeSection(sIdx)} className="text-red-400 p-2 hover:bg-red-50 rounded-xl">
                                    <MdDelete />
                                </button>
                            </div>

                            <div className="space-y-3 flex-1">
                                {section.links.map((link, lIdx) => (
                                    <div key={lIdx} className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100 flex items-center gap-3">
                                        <div className="grid grid-cols-2 gap-3 flex-1">
                                            <input 
                                                placeholder="Label (e.g. About Us)"
                                                value={link.label}
                                                onChange={(e) => handleLinkChange(sIdx, lIdx, 'label', e.target.value)}
                                                className="bg-white border-none focus:ring-2 focus:ring-blue-100 rounded-xl px-3 py-2 text-sm font-bold placeholder:text-gray-500 text-gray-900"
                                            />
                                            <div className="relative">
                                                <select
                                                    value={link.pageKey || ''}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        if (val === 'external_url_custom') {
                                                            handleLinkChange(sIdx, lIdx, 'url', 'https://');
                                                            handleLinkChange(sIdx, lIdx, 'pageKey', '');
                                                        } else {
                                                            handleLinkChange(sIdx, lIdx, 'pageKey', val);
                                                            handleLinkChange(sIdx, lIdx, 'url', '');
                                                        }
                                                    }}
                                                    className="w-full bg-white border-none focus:ring-2 focus:ring-blue-100 rounded-xl px-3 py-2 text-sm font-mono text-gray-900 appearance-none cursor-pointer"
                                                >
                                                    <option value="" disabled>Select Page / Action</option>
                                                    <optgroup label="Dynamic Pages">
                                                        {useContentStore.getState().pages.map(p => (
                                                            <option key={p.pageKey} value={p.pageKey}>{p.pageKey} ({p.updatedAt ? 'Dynamic' : 'Static'})</option>
                                                        ))}
                                                    </optgroup>
                                                    <optgroup label="Custom">
                                                        <option value="external_url_custom">External URL</option>
                                                    </optgroup>
                                                </select>
                                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                                    <MdLink />
                                                </div>
                                            </div>
                                            {(link.url || (!link.pageKey && link.label)) && (
                                                 <input 
                                                    placeholder="External URL (https://...)"
                                                    value={link.url}
                                                    onChange={(e) => handleLinkChange(sIdx, lIdx, 'url', e.target.value)}
                                                    className="col-span-2 bg-white border-none focus:ring-2 focus:ring-blue-100 rounded-xl px-3 py-2 text-xs font-mono placeholder:text-gray-500 text-gray-600"
                                                />
                                            )}
                                        </div>
                                        <button onClick={() => removeLink(sIdx, lIdx)} className="text-red-400 p-2 hover:bg-red-50 rounded-xl">
                                            <MdDelete size={18} />
                                        </button>
                                    </div>
                                ))}
                                <button 
                                    onClick={() => addLink(sIdx)}
                                    className="w-full py-3 border-2 border-dashed border-gray-200 rounded-2xl text-gray-400 font-bold text-sm hover:border-blue-200 hover:text-blue-400 transition-all flex items-center justify-center gap-2"
                                >
                                    <MdAdd /> Add Link
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Corporate Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t">
                <div className="space-y-6">
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <MdBusiness className="text-blue-600" /> Addresses
                    </h2>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Mail Us Address</label>
                            <textarea 
                                value={config.mailAddress}
                                onChange={(e) => handleConfigChange('mailAddress', e.target.value)}
                                rows="4"
                                placeholder="Enter mailing address..."
                                className="w-full bg-white border border-gray-100 rounded-3xl p-4 focus:ring-4 focus:ring-blue-100 outline-none font-medium text-gray-900 resize-none shadow-sm placeholder:text-gray-500"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Registered Office Address</label>
                            <textarea 
                                value={config.officeAddress}
                                onChange={(e) => handleConfigChange('officeAddress', e.target.value)}
                                rows="4"
                                placeholder="Enter registered office address..."
                                className="w-full bg-white border border-gray-100 rounded-3xl p-4 focus:ring-4 focus:ring-blue-100 outline-none font-medium text-gray-900 resize-none shadow-sm placeholder:text-gray-500"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">CIN Number</label>
                            <input 
                                value={config.cinNumber || ''}
                                onChange={(e) => handleConfigChange('cinNumber', e.target.value)}
                                placeholder="Enter CIN number..."
                                className="w-full bg-white border border-gray-100 rounded-2xl p-4 focus:ring-4 focus:ring-blue-100 outline-none font-black text-gray-900 shadow-sm placeholder:text-gray-500"
                            />
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <MdCopyright className="text-blue-600" /> Footer Meta
                    </h2>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Copyright Text</label>
                            <input 
                                value={config.copyrightText}
                                onChange={(e) => handleConfigChange('copyrightText', e.target.value)}
                                className="w-full bg-white border border-gray-100 rounded-2xl p-4 focus:ring-4 focus:ring-blue-100 outline-none font-black text-gray-900 shadow-sm"
                            />
                        </div>

                        <div className="space-y-4 pt-4 border-t">
                            <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest ml-1">Special Page Links</h3>
                            <div className="grid grid-cols-1 gap-4">
                                {[
                                    { label: 'Advertise', field: 'advertisePageKey' },
                                    { label: 'Gift Cards', field: 'giftCardsPageKey' },
                                    { label: 'Help Center', field: 'helpCenterPageKey' }
                                ].map(item => (
                                    <div key={item.field} className="space-y-1">
                                        <label className="text-[10px] font-bold text-gray-400 ml-1">{item.label} Page Mapping</label>
                                        <select
                                            value={config[item.field] || ''}
                                            onChange={(e) => handleConfigChange(item.field, e.target.value)}
                                            className="w-full bg-white border border-gray-100 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-blue-100 outline-none text-gray-900 appearance-none cursor-pointer"
                                        >
                                            <option value="">Select Page</option>
                                            {useContentStore.getState().pages.map(p => (
                                                <option key={p.pageKey} value={p.pageKey}>{p.pageKey}</option>
                                            ))}
                                        </select>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-4 pt-4 border-t">
                            <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest ml-1">Social Media Links</h3>
                            <div className="grid grid-cols-2 gap-4">
                                {['facebook', 'twitter', 'youtube', 'instagram'].map(platform => (
                                    <div key={platform} className="space-y-1">
                                        <label className="text-[10px] font-bold text-gray-400 capitalize ml-1">{platform}</label>
                                        <input 
                                            value={config.socialLinks?.[platform] || ''}
                                            onChange={(e) => {
                                                const newSocial = { ...config.socialLinks, [platform]: e.target.value };
                                                handleConfigChange('socialLinks', newSocial);
                                            }}
                                            placeholder={`https://${platform}.com/...`}
                                            className="w-full bg-white border border-gray-100 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-blue-100 outline-none placeholder:text-gray-500 text-gray-900"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FooterManager;
