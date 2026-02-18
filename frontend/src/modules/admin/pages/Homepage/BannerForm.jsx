import React, { useState, useEffect } from 'react';
import { MdClose, MdCloudUpload, MdAdd, MdDelete } from 'react-icons/md';
import toast from 'react-hot-toast';
import useBannerStore from '../../store/bannerStore';
import API from '../../../../services/api';

const BannerForm = ({ banner, onClose }) => {
    const { addBanner, updateBanner } = useBannerStore();
    const [offers, setOffers] = useState([]);

    const [formData, setFormData] = useState({
        section: 'For You',
        active: true,
        slides: []
    });

    useEffect(() => {
        // Fetch offers
        API.get('/offers').then(({ data }) => setOffers(data)).catch(console.error);
        
        if (banner) {
            console.log('Loading banner for edit:', banner);
            
            // Ensure all slides have targetType for backward compatibility
            const updatedBanner = {
                ...banner,
                slides: banner.slides.map((slide, idx) => {
                    const inferredType = slide.linkedOffer ? 'offer' : 
                                        (slide.targetValue || slide.linkedProduct) ? 'product' : 
                                        slide.link ? 'url' : 'product';
                    
                    const result = {
                        ...slide,
                        targetType: slide.targetType || inferredType
                    };
                    
                    console.log(`Slide ${idx}:`, { original: slide, updated: result });
                    return result;
                })
            };
            
            console.log('Updated banner:', updatedBanner);
            setFormData(updatedBanner);
        } else {
            // Start with one empty slide
            setFormData(prev => ({ ...prev, slides: [createEmptySlide()] }));
        }
    }, [banner]);

    const createEmptySlide = () => ({
        id: Date.now() + Math.random(),
        imageUrl: '',
        targetType: 'product',
        targetValue: ''
    });

    const handleSubmit = (e) => {
        e.preventDefault();

        // Filter out slides without images
        const validSlides = formData.slides.filter(s => s.imageUrl);

        if (validSlides.length === 0) {
            toast.error('Please add at least one slide with an image.');
            return;
        }

        const data = new FormData();
        data.append('section', formData.section);
        data.append('active', formData.active);
        
        const slideImages = [];
        const processedSlides = validSlides.map(slide => {
            if (slide.file) {
                slideImages.push(slide.file);
                return { ...slide, imageUrl: `SLIDE_IMG_INDEX::${slideImages.length - 1}`, file: undefined }; // Remove file object from JSON
            }
            return slide;
        });
        
        data.append('slides', JSON.stringify(processedSlides));
        
        slideImages.forEach(file => {
            data.append('slide_images', file);
        });

        if (banner) {
            updateBanner(banner.id, data);
        } else {
            addBanner(data);
        }
        onClose();
    };

    const handleSlideImageChange = (index, e) => {
        const file = e.target.files[0];
        if (file) {
            const tempUrl = URL.createObjectURL(file);
            updateSlide(index, { imageUrl: tempUrl, file: file });
        }
    };

    const updateSlide = (index, updates) => {
        const newSlides = [...formData.slides];
        newSlides[index] = { ...newSlides[index], ...updates };
        
        // If an offer is selected, auto-populate image from offer's bannerImage
        if (updates.linkedOffer && offers.length > 0) {
            const selectedOffer = offers.find(o => o._id === updates.linkedOffer);
            if (selectedOffer && selectedOffer.bannerImage) {
                newSlides[index].imageUrl = selectedOffer.bannerImage;
                // Clear any file upload since we're using offer's image
                delete newSlides[index].file;
            }
        }
        
        setFormData(prev => ({ ...prev, slides: newSlides }));
    };

    const addSlide = () => {
        setFormData(prev => ({
            ...prev,
            slides: [...prev.slides, createEmptySlide()]
        }));
    };

    const removeSlide = (index) => {
        const newSlides = formData.slides.filter((_, i) => i !== index);
        setFormData(prev => ({ ...prev, slides: newSlides }));
    };

    const sections = [
        'For You',
        'Electronics',
        'Fashion',
        'Mobiles',
        'Home & Kitchen',
        'Grocery'
    ];

    const productOptions = [
        { id: '101', name: 'iPhone 14 Pro Max' },
        { id: '102', name: 'Samsung S23 Ultra' },
        { id: '103', name: 'Nike Air Jordan' },
        { id: '104', name: 'Sony WH-1000XM5' }
    ];

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h2 className="text-lg font-bold text-gray-800">
                        {banner ? 'Edit Banner Collection' : 'Create New Collection'}
                    </h2>
                    <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-full">
                        <MdClose size={24} className="text-gray-500" />
                    </button>
                </div>

                <div className="overflow-y-auto p-6 space-y-6 flex-1">
                    {/* Section Selection */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Display Section</label>
                        <select
                            value={formData.section}
                            onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                            className="w-full p-2 border border-gray-300 rounded-lg outline-none focus:border-blue-500"
                        >
                            {sections.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>

                    {/* Slides Management */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <label className="block text-sm font-semibold text-gray-700">Slides ({formData.slides.length})</label>
                            <button
                                type="button"
                                onClick={addSlide}
                                className="text-sm flex items-center gap-1 text-blue-600 font-semibold hover:bg-blue-50 px-3 py-1 rounded-lg transition"
                            >
                                <MdAdd size={16} /> Add Slide
                            </button>
                        </div>

                        {formData.slides.map((slide, index) => (
                            <div key={slide.id || index} className="border border-gray-200 rounded-xl p-4 bg-gray-50 relative group">
                                <button
                                    type="button"
                                    onClick={() => removeSlide(index)}
                                    className="absolute top-2 right-2 p-1.5 bg-white text-red-500 rounded-full shadow-sm hover:bg-red-50 border border-gray-100 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                    title="Remove Slide"
                                >
                                    <MdDelete size={16} />
                                </button>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Image Upload */}
                                    <div>
                                        {slide.linkedOffer && offers.find(o => o._id === slide.linkedOffer)?.bannerImage ? (
                                            <>
                                                <label className="text-xs font-semibold text-green-600 mb-1 block">
                                                    Image from Offer
                                                </label>
                                                <div className="border-2 border-green-300 rounded-lg h-32 flex items-center justify-center relative bg-white overflow-hidden">
                                                    <img src={slide.imageUrl} alt="Offer Banner" className="w-full h-full object-cover" />
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <label className="text-xs font-semibold text-gray-500 mb-1 block">Banner Image</label>
                                                <div className="border-2 border-dashed border-gray-300 rounded-lg h-32 flex items-center justify-center relative bg-white overflow-hidden hover:border-blue-400 transition">
                                                    <input
                                                        type="file"
                                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                        accept="image/*"
                                                        onChange={(e) => handleSlideImageChange(index, e)}
                                                    />
                                                    {slide.imageUrl ? (
                                                        <img src={slide.imageUrl} alt="Slide" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="text-center p-2">
                                                            <MdCloudUpload size={24} className="mx-auto text-gray-400 mb-1" />
                                                            <span className="text-xs text-gray-500">Upload Image</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </>
                                        )}
                                    </div>

                                    {/* Link Properties */}
                                    <div className="space-y-3">
                                        <div>
                                            <label className="text-xs font-semibold text-gray-500 mb-1 block">Click Action</label>
                                            <div className="flex gap-2 flex-wrap">
                                                <label className="flex items-center gap-1 cursor-pointer bg-white px-2 py-1 rounded border border-gray-200 text-xs">
                                                    <input
                                                        type="radio"
                                                        checked={slide.targetType === 'product'}
                                                        onChange={() => updateSlide(index, { targetType: 'product' })}
                                                        className="text-blue-600"
                                                    />
                                                    Product
                                                </label>
                                                <label className="flex items-center gap-1 cursor-pointer bg-white px-2 py-1 rounded border border-gray-200 text-xs">
                                                    <input
                                                        type="radio"
                                                        checked={slide.targetType === 'offer'}
                                                        onChange={() => updateSlide(index, { targetType: 'offer' })}
                                                        className="text-blue-600"
                                                    />
                                                    Offer
                                                </label>
                                                <label className="flex items-center gap-1 cursor-pointer bg-white px-2 py-1 rounded border border-gray-200 text-xs">
                                                    <input
                                                        type="radio"
                                                        checked={slide.targetType === 'url'}
                                                        onChange={() => updateSlide(index, { targetType: 'url' })}
                                                        className="text-blue-600"
                                                    />
                                                    URL
                                                </label>
                                            </div>
                                        </div>

                                        {slide.targetType === 'product' ? (
                                            <select
                                                value={slide.targetValue}
                                                onChange={(e) => updateSlide(index, { targetValue: e.target.value })}
                                                className="w-full p-2 text-sm border border-gray-300 rounded-lg outline-none focus:border-blue-500 bg-white"
                                            >
                                                <option value="">Select Product...</option>
                                                {productOptions.map(p => (
                                                    <option key={p.id} value={p.id}>{p.name}</option>
                                                ))}
                                            </select>
                                        ) : slide.targetType === 'offer' ? (
                                            <select
                                                value={slide.linkedOffer || ''}
                                                onChange={(e) => updateSlide(index, { linkedOffer: e.target.value })}
                                                className="w-full p-2 text-sm border border-gray-300 rounded-lg outline-none focus:border-blue-500 bg-white"
                                            >
                                                <option value="">Select Offer...</option>
                                                {offers.map(offer => (
                                                    <option key={offer._id} value={offer._id}>
                                                        {offer.title} ({offer.discountType === 'percentage' ? `${offer.discountValue}%` : `₹${offer.discountValue}`} OFF)
                                                    </option>
                                                ))}
                                            </select>
                                        ) : (
                                            <input
                                                type="text"
                                                placeholder="/path"
                                                value={slide.targetValue}
                                                onChange={(e) => updateSlide(index, { targetValue: e.target.value })}
                                                className="w-full p-2 text-sm border border-gray-300 rounded-lg outline-none focus:border-blue-500 bg-white"
                                            />
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}

                        <button
                            type="button"
                            onClick={addSlide}
                            className="w-full py-3 border-2 border-dashed border-gray-200 rounded-xl text-gray-500 hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50 transition flex items-center justify-center gap-2 font-medium"
                        >
                            <MdAdd size={20} /> Add Another Slide
                        </button>
                    </div>

                    {/* Active Status */}
                    <div className="pt-4 border-t border-gray-100">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={formData.active}
                                onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                                className="w-4 h-4 text-blue-600"
                            />
                            <span className="text-sm font-medium text-gray-700">Collection is Active</span>
                        </label>
                    </div>
                </div>

                <div className="p-4 border-t border-gray-100 bg-gray-50">
                    <button
                        onClick={handleSubmit}
                        className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition"
                    >
                        {banner ? 'Save Changes' : 'Create Collection'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BannerForm;
