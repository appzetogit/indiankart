import React, { useState, useEffect } from 'react';
import API from '../../../../services/api';
import toast from 'react-hot-toast';

const SettingsPage = () => {
    const [settings, setSettings] = useState({
        sellerName: '',
        sellerAddress: '',
        gstNumber: '',
        panNumber: '',
        logoUrl: '',
        signatureUrl: '',
        contactEmail: '',
        contactPhone: ''
    });

    // States for locally selected files and their previews
    const [logoFile, setLogoFile] = useState(null);
    const [logoPreview, setLogoPreview] = useState('');
    const [signatureFile, setSignatureFile] = useState(null);
    const [signaturePreview, setSignaturePreview] = useState('');

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const { data } = await API.get('/settings');
                if (data) {
                    setSettings({
                        sellerName: data.sellerName || '',
                        sellerAddress: data.sellerAddress || '',
                        gstNumber: data.gstNumber || '',
                        panNumber: data.panNumber || '',
                        logoUrl: data.logoUrl || '',
                        signatureUrl: data.signatureUrl || '',
                        contactEmail: data.contactEmail || '',
                        contactPhone: data.contactPhone || ''
                    });
                    setLogoPreview(data.logoUrl || '');
                    setSignaturePreview(data.signatureUrl || '');
                }
            } catch (error) {
                console.error('Error fetching settings:', error);
                toast.error('Failed to load settings');
            } finally {
                setLoading(false);
            }
        };

        fetchSettings();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setSettings(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e, field) => {
        const file = e.target.files[0];
        if (!file) return;

        const previewUrl = URL.createObjectURL(file);
        if (field === 'logo') {
            setLogoFile(file);
            setLogoPreview(previewUrl);
        } else if (field === 'signature') {
            setSignatureFile(file);
            setSignaturePreview(previewUrl);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData();
        
        // Append text fields
        formData.append('sellerName', settings.sellerName);
        formData.append('sellerAddress', settings.sellerAddress);
        formData.append('gstNumber', settings.gstNumber);
        formData.append('panNumber', settings.panNumber);
        formData.append('contactEmail', settings.contactEmail);
        formData.append('contactPhone', settings.contactPhone);
        
        // Append existing URLs to handle cases where no new file is uploaded
        formData.append('logoUrl', settings.logoUrl);
        formData.append('signatureUrl', settings.signatureUrl);

        // Append new files if selected
        if (logoFile) {
            formData.append('logo', logoFile);
        }
        if (signatureFile) {
            formData.append('signature', signatureFile);
        }

        try {
            const { data } = await API.put('/settings', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setSettings(data);
            setLogoPreview(data.logoUrl);
            setSignaturePreview(data.signatureUrl);
            setLogoFile(null);
            setSignatureFile(null);
            toast.success('Settings updated successfully');
        } catch (error) {
            console.error('Error updating settings:', error);
            toast.error(error.response?.data?.message || 'Failed to update settings');
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500 font-medium">Loading settings...</div>;

    return (
        <div className="p-8 bg-gray-50 min-h-screen font-sans">
            <h1 className="text-3xl font-black text-gray-900 mb-2 tracking-tight">Store Settings</h1>
            <p className="text-gray-500 mb-8 font-medium italic">Configure your business details and invoice visuals</p>
            
            <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 max-w-5xl">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Basic Info */}
                    <div className="space-y-6">
                        <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest border-b pb-2">Business Details</h2>
                        
                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase mb-2 tracking-wider">Seller / Store Name</label>
                            <input 
                                type="text" 
                                name="sellerName"
                                value={settings.sellerName}
                                onChange={handleChange}
                                className="w-full border border-gray-200 rounded-xl p-3.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none placeholder:text-gray-500 caret-black font-medium text-gray-900 bg-gray-50/50 transition-all"
                                placeholder="Enter store name"
                            />
                        </div>
                        
                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase mb-2 tracking-wider">GST Number</label>
                            <input 
                                type="text" 
                                name="gstNumber"
                                value={settings.gstNumber}
                                onChange={handleChange}
                                className="w-full border border-gray-200 rounded-xl p-3.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none placeholder:text-gray-500 caret-black font-medium text-gray-900 bg-gray-50/50 transition-all"
                                placeholder="GSTIN"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase mb-2 tracking-wider">PAN Number</label>
                            <input 
                                type="text" 
                                name="panNumber"
                                value={settings.panNumber}
                                onChange={handleChange}
                                className="w-full border border-gray-200 rounded-xl p-3.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none placeholder:text-gray-500 caret-black font-medium text-gray-900 bg-gray-50/50 transition-all"
                                placeholder="PAN"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase mb-2 tracking-wider">Business Address</label>
                            <textarea 
                                name="sellerAddress"
                                value={settings.sellerAddress}
                                onChange={handleChange}
                                rows="4"
                                className="w-full border border-gray-200 rounded-xl p-3.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none placeholder:text-gray-500 caret-black font-medium text-gray-900 bg-gray-50/50 transition-all resize-none"
                                placeholder="Full registered address"
                            ></textarea>
                        </div>
                    </div>

                    {/* Contact & Assets */}
                    <div className="space-y-6">
                        <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest border-b pb-2">Contact & Brand Identity</h2>

                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase mb-2 tracking-wider">Support Email</label>
                            <input 
                                type="email" 
                                name="contactEmail"
                                value={settings.contactEmail}
                                onChange={handleChange}
                                className="w-full border border-gray-200 rounded-xl p-3.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none placeholder:text-gray-500 caret-black font-medium text-gray-900 bg-gray-50/50 transition-all"
                                placeholder="support@yourstore.com"
                            />
                        </div>

                        {/* Logo Upload */}
                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase mb-2 tracking-wider">Official Logo</label>
                            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                <div className="w-20 h-20 bg-white rounded-lg border flex items-center justify-center overflow-hidden flex-shrink-0">
                                    {logoPreview ? (
                                        <img src={logoPreview} alt="Logo" className="w-full h-full object-contain" />
                                    ) : (
                                        <span className="text-2xl text-gray-300 font-black">?</span>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <input 
                                        type="file" 
                                        id="logoInput"
                                        accept="image/*"
                                        onChange={(e) => handleFileChange(e, 'logo')}
                                        className="hidden" 
                                    />
                                    <label 
                                        htmlFor="logoInput"
                                        className="inline-block px-4 py-2 bg-white border border-gray-200 rounded-lg text-xs font-black text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors"
                                    >
                                        CHOOSE FILE
                                    </label>
                                    <p className="mt-1.5 text-[10px] text-gray-400 font-bold uppercase tracking-tight">JPG, PNG OR WEBP. MAX 2MB.</p>
                                </div>
                            </div>
                        </div>

                        {/* Signature Upload */}
                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase mb-2 tracking-wider">Authorized Signature</label>
                            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                <div className="w-20 h-20 bg-white rounded-lg border flex items-center justify-center overflow-hidden flex-shrink-0">
                                    {signaturePreview ? (
                                        <img src={signaturePreview} alt="Signature" className="w-full h-full object-contain" />
                                    ) : (
                                        <span className="text-2xl text-gray-300 font-black">?</span>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <input 
                                        type="file" 
                                        id="sigInput"
                                        accept="image/*"
                                        onChange={(e) => handleFileChange(e, 'signature')}
                                        className="hidden" 
                                    />
                                    <label 
                                        htmlFor="sigInput"
                                        className="inline-block px-4 py-2 bg-white border border-gray-200 rounded-lg text-xs font-black text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors"
                                    >
                                        CHOOSE FILE
                                    </label>
                                    <p className="mt-1.5 text-[10px] text-gray-400 font-bold uppercase tracking-tight">Used for automated invoice signing</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-10 pt-8 border-t border-gray-100 flex justify-end">
                    <button 
                        type="submit"
                        className="bg-blue-600 text-white font-black text-xs uppercase tracking-widest py-4 px-12 rounded-xl hover:bg-black transition-all shadow-xl shadow-blue-500/20 active:scale-95"
                    >
                        Synchronize Settings
                    </button>
                </div>
            </form>
        </div>
    );
};

export default SettingsPage;
