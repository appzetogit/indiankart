import React, { useState, useEffect } from 'react';
import { MdLocalOffer, MdDelete, MdAdd, MdCheckCircle, MdCancel } from 'react-icons/md';
import useBankOfferStore from '../../store/bankOfferStore';
import useCategoryStore from '../../store/categoryStore';
import useSubCategoryStore from '../../store/subCategoryStore';
import useProductStore from '../../store/productStore';
import API from '../../../../services/api';

const BankOfferManager = () => {
    const { offers, fetchOffers, createOffer, deleteOffer, toggleOfferStatus, isLoading } = useBankOfferStore();
    const { categories, fetchCategories } = useCategoryStore();
    const { subCategories, fetchSubCategories } = useSubCategoryStore();
    const { products, fetchProducts } = useProductStore();
    
    const [formData, setFormData] = useState({
        offerName: '',
        description: '',
        bankName: '',
        discountType: 'percentage',
        discountValue: '',
        isUniversal: false,
        applicableCategories: [],
        applicableSubCategories: [],
        applicableProducts: []
    });

    useEffect(() => {
        fetchOffers();
        fetchCategories();
        fetchSubCategories();
        fetchProducts();
    }, [fetchOffers, fetchCategories, fetchSubCategories, fetchProducts]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ 
            ...prev, 
            [name]: type === 'checkbox' ? checked : value 
        }));
    };

    // Generic handler for adding IDs to specific arrays
    const handleAddId = (field, id) => {
        if (!id) return;
        if (!formData[field].includes(id)) {
            setFormData(prev => ({
                ...prev,
                [field]: [...prev[field], id]
            }));
        }
    };

    // Generic handler for removing IDs
    const handleRemoveId = (field, id) => {
        setFormData(prev => ({
            ...prev,
            [field]: prev[field].filter(itemId => itemId !== id)
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const success = await createOffer(formData);
        if (success) {
            setFormData({
                offerName: '',
                description: '',
                bankName: '',
                discountType: 'percentage',
                discountValue: '',
                isUniversal: false,
                applicableCategories: [],
                applicableSubCategories: [],
                applicableProducts: []
            });
        }
    };

    // Helper to get name
    const getName = (list, id) => {
        const item = list.find(i => (i._id === id || i.id === id));
        return item ? item.name : id;
    };

    return (
        <div className="space-y-6 max-w-6xl mx-auto pb-10">
            <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-purple-100 text-purple-600 rounded-xl">
                    <MdLocalOffer size={28} />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Bank Offers</h1>
                    <p className="text-gray-500 text-sm">Manage bank discounts and partner offers</p>
                </div>
            </div>

            {/* Create Offer Form */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h2 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                    <MdAdd className="text-purple-500" /> Create New Offer
                </h2>
                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    
                    {/* Basic Details */}
                    <div className="col-span-1 md:col-span-2 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-400 uppercase">Offer Name</label>
                                <input type="text" name="offerName" value={formData.offerName} onChange={handleChange} required placeholder="e.g. 10% Off on HDFC" className="w-full px-4 py-2 bg-gray-50 border rounded-lg focus:border-purple-500 outline-none text-gray-900 caret-black placeholder:text-gray-500" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-400 uppercase">Bank Name</label>
                                <input type="text" name="bankName" value={formData.bankName} onChange={handleChange} required placeholder="e.g. HDFC Bank" className="w-full px-4 py-2 bg-gray-50 border rounded-lg focus:border-purple-500 outline-none text-gray-900 caret-black placeholder:text-gray-500" />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-400 uppercase">Description</label>
                            <input type="text" name="description" value={formData.description} onChange={handleChange} placeholder="Brief details about the offer" className="w-full px-4 py-2 bg-gray-50 border rounded-lg focus:border-purple-500 outline-none text-gray-900 caret-black placeholder:text-gray-500" />
                        </div>
                    </div>

                    {/* Discount Logic */}
                    <div className="col-span-1 md:col-span-2 space-y-4 border-l pl-4 border-gray-100">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-400 uppercase">Discount Type</label>
                                <select name="discountType" value={formData.discountType} onChange={handleChange} className="w-full px-4 py-2 bg-gray-50 border rounded-lg outline-none text-gray-900 caret-black">
                                    <option value="percentage">Percentage (%)</option>
                                    <option value="flat">Flat Amount (₹)</option>
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-400 uppercase">Value</label>
                                <input type="number" name="discountValue" value={formData.discountValue} onChange={handleChange} required placeholder="e.g. 10" className="w-full px-4 py-2 bg-gray-50 border rounded-lg outline-none text-gray-900 caret-black placeholder:text-gray-500" />
                            </div>
                        </div>
                    </div>

                    {/* Applicability Logic - 3 Separate Dropdowns */}
                    <div className="col-span-full border-t border-gray-100 pt-4 mt-2">
                        <div className="mb-4">
                            <label className="flex items-center gap-2 cursor-pointer w-max">
                                <input 
                                    type="checkbox" 
                                    name="isUniversal" 
                                    checked={formData.isUniversal} 
                                    onChange={handleChange} 
                                    className="w-5 h-5 accent-purple-600 rounded"
                                />
                                <span className="font-bold text-gray-700">Applies Storewide (All Products)</span>
                            </label>
                            <p className="text-xs text-gray-400 mt-1 ml-7">If checked, this offer applies to every item in the store.</p>
                        </div>

                        {!formData.isUniversal && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                
                                {/* Categories Dropdown */}
                                <div className="space-y-2 p-3 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                    <label className="text-xs font-bold text-purple-600 uppercase block mb-1">Applicable Categories</label>
                                    <select 
                                        value="" 
                                        onChange={(e) => handleAddId('applicableCategories', e.target.value)}
                                        className="w-full px-3 py-2 bg-white border rounded-lg outline-none text-sm text-gray-900 caret-black"
                                    >
                                        <option value="">+ Add Category</option>
                                        {categories.map(c => !formData.applicableCategories.includes(c._id) && (
                                            <option key={c._id} value={c._id}>{c.name}</option>
                                        ))}
                                    </select>
                                    <div className="flex flex-wrap gap-1.5 mt-2 min-h-[30px]">
                                        {formData.applicableCategories.map(id => (
                                            <div key={id} className="flex items-center gap-1 px-2 py-0.5 bg-white border border-gray-200 rounded text-xs text-gray-700 shadow-sm">
                                                <span>{getName(categories, id)}</span>
                                                <button type="button" onClick={() => handleRemoveId('applicableCategories', id)} className="text-red-400 hover:text-red-600"><MdCancel /></button>
                                            </div>
                                        ))}
                                        {formData.applicableCategories.length === 0 && <span className="text-xs text-gray-400 italic">None selected</span>}
                                    </div>
                                </div>

                                {/* Subcategories Dropdown */}
                                <div className="space-y-2 p-3 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                    <label className="text-xs font-bold text-purple-600 uppercase block mb-1">Applicable Subcategories</label>
                                    <select 
                                        value="" 
                                        onChange={(e) => handleAddId('applicableSubCategories', e.target.value)}
                                        className="w-full px-3 py-2 bg-white border rounded-lg outline-none text-sm text-gray-900 caret-black"
                                    >
                                        <option value="">+ Add Subcategory</option>
                                        {subCategories.map(s => !formData.applicableSubCategories.includes(s._id) && (
                                            <option key={s._id} value={s._id}>{s.name}</option>
                                        ))}
                                    </select>
                                    <div className="flex flex-wrap gap-1.5 mt-2 min-h-[30px]">
                                        {formData.applicableSubCategories.map(id => (
                                            <div key={id} className="flex items-center gap-1 px-2 py-0.5 bg-white border border-gray-200 rounded text-xs text-gray-700 shadow-sm">
                                                <span>{getName(subCategories, id)}</span>
                                                <button type="button" onClick={() => handleRemoveId('applicableSubCategories', id)} className="text-red-400 hover:text-red-600"><MdCancel /></button>
                                            </div>
                                        ))}
                                        {formData.applicableSubCategories.length === 0 && <span className="text-xs text-gray-400 italic">None selected</span>}
                                    </div>
                                </div>

                                {/* Products Dropdown */}
                                <div className="space-y-2 p-3 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                    <label className="text-xs font-bold text-purple-600 uppercase block mb-1">Applicable Products</label>
                                    <select 
                                        value="" 
                                        onChange={(e) => handleAddId('applicableProducts', e.target.value)}
                                        className="w-full px-3 py-2 bg-white border rounded-lg outline-none text-sm text-gray-900 caret-black"
                                    >
                                        <option value="">+ Add Product</option>
                                        {products.map(p => !formData.applicableProducts.includes(p._id || p.id) && (
                                            <option key={p._id || p.id} value={p._id || p.id}>{p.name}</option>
                                        ))}
                                    </select>
                                    <div className="flex flex-wrap gap-1.5 mt-2 min-h-[30px]">
                                        {formData.applicableProducts.map(id => (
                                            <div key={id} className="flex items-center gap-1 px-2 py-0.5 bg-white border border-gray-200 rounded text-xs text-gray-700 shadow-sm">
                                                <span className="truncate max-w-[100px]">{getName(products, id)}</span>
                                                <button type="button" onClick={() => handleRemoveId('applicableProducts', id)} className="text-red-400 hover:text-red-600"><MdCancel /></button>
                                            </div>
                                        ))}
                                        {formData.applicableProducts.length === 0 && <span className="text-xs text-gray-400 italic">None selected</span>}
                                    </div>
                                </div>
                            </div>
                        )}
                        
                        <div className="mt-6">
                            <button type="submit" disabled={isLoading} className="w-full md:w-auto px-8 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold rounded-xl hover:from-purple-700 hover:to-indigo-700 transition shadow-lg shadow-purple-200 disabled:opacity-70">
                                {isLoading ? 'Creating Offer...' : 'Create Bank Offer'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
            
            {/* Display Logic for Cards also needs update to show mixed types */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {offers.map(offer => (
                    <div key={offer._id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm relative group hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-3">
                            <span className="px-2 py-1 bg-purple-50 text-purple-700 text-xs font-bold rounded uppercase tracking-wider">{offer.bankName}</span>
                            <div className="flex gap-2">
                                <button onClick={() => toggleOfferStatus(offer._id)} className={`text-xl ${offer.isActive ? 'text-green-500' : 'text-gray-300'}`}>
                                    {offer.isActive ? <MdCheckCircle /> : <MdCancel />}
                                </button>
                                <button onClick={() => deleteOffer(offer._id)} className="text-gray-300 hover:text-red-500 transition-colors">
                                    <MdDelete size={20} />
                                </button>
                            </div>
                        </div>
                        
                        <h3 className="text-lg font-bold text-gray-800 leading-tight mb-1">{offer.offerName}</h3>
                        <p className="text-sm text-gray-500 mb-4 line-clamp-2">{offer.description}</p>
                        
                        <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                            <div>
                                <p className="text-xs text-gray-400 font-bold uppercase">Discount</p>
                                <p className="font-bold text-gray-700">
                                    {offer.discountType === 'flat' ? '₹' + offer.discountValue : offer.discountValue + '%'} OFF
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-gray-400 font-bold uppercase">Applies To</p>
                                <p className="font-bold text-gray-700 capitalize text-xs max-w-[120px] truncate">
                                    {offer.isUniversal ? 'Storewide' : [
                                        offer.applicableCategories?.length > 0 && `${offer.applicableCategories.length} Cats`,
                                        offer.applicableSubCategories?.length > 0 && `${offer.applicableSubCategories.length} Sub`,
                                        offer.applicableProducts?.length > 0 && `${offer.applicableProducts.length} Prods`
                                    ].filter(Boolean).join(', ') || 'None'}
                                </p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default BankOfferManager;
