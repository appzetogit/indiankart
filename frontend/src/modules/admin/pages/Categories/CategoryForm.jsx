import React, { useState, useEffect } from 'react';
import { MdClose, MdDelete } from 'react-icons/md';
import toast from 'react-hot-toast';
import useCategoryStore from '../../store/categoryStore';

const CategoryForm = ({ category, onClose, isBannerMode = false }) => {
    const { addCategory, updateCategory, isLoading } = useCategoryStore();
    const isEditMode = Boolean(category?.id);
    const canManageBanners = isEditMode || isBannerMode;

    const [formData, setFormData] = useState({
        name: '',
        image: '',
        active: true,
        file: null,
        smallBanners: [],
        newSmallBannerUploads: [],
        secondaryBannerTitle: '',
        secondaryBanners: [],
        newSecondaryBannerUploads: []
    });

    const extractBannerImage = (banner) => {
        if (!banner) return '';
        if (typeof banner === 'string') return banner;
        return banner.image || '';
    };

    const normalizeSmallBannerItem = (banner) => {
        if (!banner) return null;
        if (typeof banner === 'string') {
            return { image: banner, title: '', redirectLink: '' };
        }
        if (banner.image) {
            return {
                image: banner.image,
                title: banner.title || '',
                redirectLink: banner.redirectLink || ''
            };
        }
        return null;
    };

    const normalizeSecondaryBannerItem = (banner) => {
        if (!banner) return null;
        if (typeof banner === 'string') {
            return { image: banner, title: '', redirectLink: '' };
        }
        if (banner.image) {
            return {
                image: banner.image,
                title: banner.title || '',
                redirectLink: banner.redirectLink || ''
            };
        }
        return null;
    };

    useEffect(() => {
        if (category?.id) {
            const existingSmallBanners = Array.isArray(category.smallBanners)
                ? category.smallBanners.map(normalizeSmallBannerItem).filter(Boolean)
                : [];

            setFormData({
                name: category.name,
                image: category.icon || category.image || '',
                active: category.active,
                file: null,
                smallBanners: existingSmallBanners,
                newSmallBannerUploads: [],
                secondaryBannerTitle: category.secondaryBannerTitle || '',
                secondaryBanners: Array.isArray(category.secondaryBanners)
                    ? category.secondaryBanners.map(normalizeSecondaryBannerItem).filter(Boolean)
                    : [],
                newSecondaryBannerUploads: []
            });
        } else {
            setFormData({
                name: '',
                image: '',
                active: true,
                file: null,
                smallBanners: [],
                newSmallBannerUploads: [],
                secondaryBannerTitle: '',
                secondaryBanners: [],
                newSecondaryBannerUploads: []
            });
        }
    }, [category]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (isBannerMode && !isEditMode) {
            toast.error('Please edit an existing category to manage its banners');
            return;
        }

        const data = new FormData();
        const normalizedName = isBannerMode
            ? (formData.name || `Banner-${Date.now()}`)
            : formData.name;
        data.append('name', normalizedName);
        data.append('active', formData.active);
        if (isBannerMode) {
            data.append('allowBannerData', 'true');
        }

        if (!isBannerMode && formData.file) {
            data.append('icon', formData.file);
        } else if (!isBannerMode && formData.image) {
            data.append('icon', formData.image);
        }

        if (canManageBanners) {
            const retainedSmallBanners = formData.smallBanners.map((banner) => ({
                image: banner.image,
                alt: normalizedName,
                redirectLink: banner.redirectLink || ''
            }));
            data.append('smallBanners', JSON.stringify(retainedSmallBanners));
            data.append('secondaryBannerTitle', '');
            const retainedSecondaryBanners = formData.secondaryBanners.map((banner) => ({
                image: banner.image,
                alt: normalizedName,
                title: banner.title || '',
                redirectLink: banner.redirectLink || ''
            }));
            data.append('secondaryBanners', JSON.stringify(retainedSecondaryBanners));

            formData.newSmallBannerUploads.forEach((item) => {
                if (item?.file) {
                    data.append('smallBanners', item.file);
                }
            });
            const newSmallBannersMeta = formData.newSmallBannerUploads.map((item) => ({
                redirectLink: item.redirectLink || ''
            }));
            data.append('newSmallBannersMeta', JSON.stringify(newSmallBannersMeta));
            formData.newSecondaryBannerUploads.forEach((item) => {
                if (item?.file) {
                    data.append('secondaryBanners', item.file);
                }
            });
            const newSecondaryBannersMeta = formData.newSecondaryBannerUploads.map((item) => ({
                title: item.title || '',
                redirectLink: item.redirectLink || ''
            }));
            data.append('newSecondaryBannersMeta', JSON.stringify(newSecondaryBannersMeta));
        }

        try {
            if (isEditMode) {
                await updateCategory(category.id, data);
                toast.success(
                    isBannerMode ? 'Banner updated successfully' : 'Category updated successfully',
                    { duration: 1200 }
                );
            } else {
                await addCategory(data);
                toast.success(
                    isBannerMode ? 'Banner created successfully' : 'Category created successfully',
                    { duration: 1200 }
                );
            }
            onClose();
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || 'Failed to save category');
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const imageUrl = URL.createObjectURL(file);
            setFormData((prev) => ({ ...prev, image: imageUrl, file }));
        }
    };

    const handleSmallBannersChange = (e) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        const uploads = files.map((file) => ({
            file,
            preview: URL.createObjectURL(file),
            redirectLink: ''
        }));

        setFormData((prev) => ({
            ...prev,
            newSmallBannerUploads: [...prev.newSmallBannerUploads, ...uploads]
        }));

        e.target.value = '';
    };

    const updateExistingSmallBannerMeta = (indexToUpdate, field, value) => {
        setFormData((prev) => ({
            ...prev,
            smallBanners: prev.smallBanners.map((banner, index) => (
                index === indexToUpdate ? { ...banner, [field]: value } : banner
            ))
        }));
    };

    const removeExistingSmallBanner = (indexToRemove) => {
        setFormData((prev) => ({
            ...prev,
            smallBanners: prev.smallBanners.filter((_, index) => index !== indexToRemove)
        }));
    };

    const updateNewSmallBannerMeta = (previewToUpdate, field, value) => {
        setFormData((prev) => ({
            ...prev,
            newSmallBannerUploads: prev.newSmallBannerUploads.map((item) => (
                item.preview === previewToUpdate ? { ...item, [field]: value } : item
            ))
        }));
    };

    const removeNewSmallBannerUpload = (previewToRemove) => {
        setFormData((prev) => {
            const itemToRemove = prev.newSmallBannerUploads.find((item) => item.preview === previewToRemove);
            if (itemToRemove?.preview) {
                URL.revokeObjectURL(itemToRemove.preview);
            }

            return {
                ...prev,
                newSmallBannerUploads: prev.newSmallBannerUploads.filter((item) => item.preview !== previewToRemove)
            };
        });
    };

    const handleSecondaryBannersChange = (e) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        const uploads = files.map((file) => ({
            file,
            preview: URL.createObjectURL(file),
            title: '',
            redirectLink: ''
        }));

        setFormData((prev) => ({
            ...prev,
            newSecondaryBannerUploads: [...prev.newSecondaryBannerUploads, ...uploads]
        }));

        e.target.value = '';
    };

    const updateExistingSecondaryBannerMeta = (indexToUpdate, field, value) => {
        setFormData((prev) => ({
            ...prev,
            secondaryBanners: prev.secondaryBanners.map((banner, index) => (
                index === indexToUpdate ? { ...banner, [field]: value } : banner
            ))
        }));
    };

    const removeExistingSecondaryBanner = (indexToRemove) => {
        setFormData((prev) => ({
            ...prev,
            secondaryBanners: prev.secondaryBanners.filter((_, index) => index !== indexToRemove)
        }));
    };

    const updateNewSecondaryBannerMeta = (previewToUpdate, field, value) => {
        setFormData((prev) => ({
            ...prev,
            newSecondaryBannerUploads: prev.newSecondaryBannerUploads.map((item) => (
                item.preview === previewToUpdate ? { ...item, [field]: value } : item
            ))
        }));
    };

    const removeNewSecondaryBannerUpload = (previewToRemove) => {
        setFormData((prev) => {
            const itemToRemove = prev.newSecondaryBannerUploads.find((item) => item.preview === previewToRemove);
            if (itemToRemove?.preview) {
                URL.revokeObjectURL(itemToRemove.preview);
            }

            return {
                ...prev,
                newSecondaryBannerUploads: prev.newSecondaryBannerUploads.filter((item) => item.preview !== previewToRemove)
            };
        });
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-3 md:p-6 bg-black/10 backdrop-blur-[1px]">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md border border-gray-200 max-h-[92vh] flex flex-col overflow-hidden">
                <div className="flex items-center justify-between p-3 md:p-4 border-b border-gray-100 shrink-0">
                    <h2 className="text-lg md:text-xl font-bold text-gray-800">
                        {category
                            ? (isBannerMode ? 'Edit Banner' : 'Edit Category')
                            : (isBannerMode ? 'Create Banner' : 'Add New Category')}
                    </h2>
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className="p-2 hover:bg-gray-100 rounded-lg transition"
                    >
                        <MdClose size={20} className="md:w-6 md:h-6 text-gray-600" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-3 md:p-4 space-y-3 md:space-y-4 overflow-y-auto">
                    {!isBannerMode && (
                    <div>
                        <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1 md:mb-2">
                            {isBannerMode ? 'Banner Name *' : 'Category Name *'}
                        </label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            autoComplete="off"
                            autoCorrect="off"
                            autoCapitalize="none"
                            spellCheck={false}
                            className="w-full px-3 py-2 md:px-4 md:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900 placeholder:text-gray-500 text-sm md:text-base"
                            placeholder={isBannerMode ? 'Enter banner name' : 'Enter category name'}
                            required
                        />
                    </div>
                    )}

                    {!isBannerMode && (
                    <div>
                        <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1 md:mb-2">
                            {isBannerMode ? 'Banner Image' : 'Category Image'}
                        </label>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                            className="w-full px-3 py-2 md:px-4 md:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900 text-sm md:text-base"
                        />
                        {formData.image && (
                            <div className="mt-2 border border-gray-200 rounded-lg p-2 bg-gray-50">
                                <p className="text-xs text-gray-600 mb-2">Image Preview:</p>
                                <img
                                    src={formData.image}
                                    alt={isBannerMode ? 'Banner preview' : 'Category preview'}
                                    className="w-24 h-24 object-cover rounded-lg"
                                />
                            </div>
                        )}
                    </div>
                    )}

                    {canManageBanners && (
                    <div className="border border-gray-200 rounded-lg p-3 md:p-4 bg-gray-50/60">
                        <div className="mb-2 md:mb-3">
                            <h3 className="text-sm md:text-base font-bold text-gray-800">Category Small Banners</h3>
                            <p className="text-[11px] md:text-xs text-gray-500 mt-0.5">
                                These banners are shown on the category landing page as horizontal cards.
                            </p>
                        </div>

                        <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleSmallBannersChange}
                            className="w-full px-3 py-2 md:px-4 md:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900 text-sm md:text-base"
                        />

                        <div className="mt-3 space-y-3">
                            {formData.smallBanners.length > 0 && (
                                <div>
                                    <p className="text-xs font-semibold text-gray-700 mb-2">Saved Banners</p>
                                    <div className="grid grid-cols-2 gap-2">
                                        {formData.smallBanners.map((banner, index) => (
                                            <div key={`${banner.image}-${index}`} className="relative rounded-lg border border-gray-200 bg-white p-2">
                                                <img src={banner.image} alt="Small banner" className="w-full h-20 object-cover rounded-md" />
                                                <div className="mt-2 space-y-2">
                                                    <input
                                                        type="text"
                                                        value={banner.redirectLink || ''}
                                                        onChange={(e) => updateExistingSmallBannerMeta(index, 'redirectLink', e.target.value)}
                                                        className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-xs outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                        placeholder="Redirect link"
                                                    />
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => removeExistingSmallBanner(index)}
                                                    className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/70 text-white flex items-center justify-center"
                                                    title="Remove banner"
                                                >
                                                    <MdDelete size={14} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {formData.newSmallBannerUploads.length > 0 && (
                                <div>
                                    <p className="text-xs font-semibold text-gray-700 mb-2">New Uploads</p>
                                    <div className="grid grid-cols-2 gap-2">
                                        {formData.newSmallBannerUploads.map((item) => (
                                            <div key={item.preview} className="relative rounded-lg border border-gray-200 bg-white p-2">
                                                <img src={item.preview} alt="New banner preview" className="w-full h-20 object-cover rounded-md" />
                                                <div className="mt-2 space-y-2">
                                                    <input
                                                        type="text"
                                                        value={item.redirectLink || ''}
                                                        onChange={(e) => updateNewSmallBannerMeta(item.preview, 'redirectLink', e.target.value)}
                                                        className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-xs outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                        placeholder="Redirect link"
                                                    />
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => removeNewSmallBannerUpload(item.preview)}
                                                    className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/70 text-white flex items-center justify-center"
                                                    title="Remove banner"
                                                >
                                                    <MdDelete size={14} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                    )}

                    {canManageBanners && (
                    <div className="border border-gray-200 rounded-lg p-3 md:p-4 bg-gray-50/60">
                        <div className="mb-2 md:mb-3">
                            <h3 className="text-sm md:text-base font-bold text-gray-800">Secondary Banner Section</h3>
                            <p className="text-[11px] md:text-xs text-gray-500 mt-0.5">
                                Shown after category icons on the user category page.
                            </p>
                        </div>

                        <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleSecondaryBannersChange}
                            className="w-full px-3 py-2 md:px-4 md:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900 text-sm md:text-base"
                        />

                        <div className="mt-3 space-y-3">
                            {formData.secondaryBanners.length > 0 && (
                                <div>
                                    <p className="text-xs font-semibold text-gray-700 mb-2">Saved Secondary Banners</p>
                                    <div className="grid grid-cols-1 gap-2">
                                        {formData.secondaryBanners.map((banner, index) => (
                                            <div key={`${banner.image}-${index}`} className="relative rounded-lg border border-gray-200 bg-white p-2">
                                                <img src={banner.image} alt="Secondary banner" className="w-full h-28 object-cover rounded-md" />
                                                <div className="mt-2 space-y-2">
                                                    <input
                                                        type="text"
                                                        value={banner.title || ''}
                                                        onChange={(e) => updateExistingSecondaryBannerMeta(index, 'title', e.target.value)}
                                                        className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-xs outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                        placeholder="Heading"
                                                    />
                                                    <input
                                                        type="text"
                                                        value={banner.redirectLink || ''}
                                                        onChange={(e) => updateExistingSecondaryBannerMeta(index, 'redirectLink', e.target.value)}
                                                        className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-xs outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                        placeholder="Redirect link"
                                                    />
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => removeExistingSecondaryBanner(index)}
                                                    className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/70 text-white flex items-center justify-center"
                                                    title="Remove banner"
                                                >
                                                    <MdDelete size={14} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {formData.newSecondaryBannerUploads.length > 0 && (
                                <div>
                                    <p className="text-xs font-semibold text-gray-700 mb-2">New Secondary Uploads</p>
                                    <div className="grid grid-cols-1 gap-2">
                                        {formData.newSecondaryBannerUploads.map((item) => (
                                            <div key={item.preview} className="relative rounded-lg border border-gray-200 bg-white p-2">
                                                <img src={item.preview} alt="New secondary banner preview" className="w-full h-28 object-cover rounded-md" />
                                                <div className="mt-2 space-y-2">
                                                    <input
                                                        type="text"
                                                        value={item.title || ''}
                                                        onChange={(e) => updateNewSecondaryBannerMeta(item.preview, 'title', e.target.value)}
                                                        className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-xs outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                        placeholder="Heading"
                                                    />
                                                    <input
                                                        type="text"
                                                        value={item.redirectLink || ''}
                                                        onChange={(e) => updateNewSecondaryBannerMeta(item.preview, 'redirectLink', e.target.value)}
                                                        className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-xs outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                        placeholder="Redirect link"
                                                    />
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => removeNewSecondaryBannerUpload(item.preview)}
                                                    className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/70 text-white flex items-center justify-center"
                                                    title="Remove banner"
                                                >
                                                    <MdDelete size={14} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                    )}

                    <div className="flex items-center gap-2 md:gap-3">
                        <input
                            type="checkbox"
                            id="active"
                            name="active"
                            checked={formData.active}
                            onChange={handleChange}
                            className="w-4 h-4 md:w-5 md:h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                        />
                        <label htmlFor="active" className="text-xs md:text-sm font-medium text-gray-700">
                            {isBannerMode ? 'Active (Banner will be visible to users)' : 'Active (Category will be visible to users)'}
                        </label>
                    </div>

                    <div className="flex gap-2 md:gap-3 pt-1 md:pt-2 sticky bottom-0 bg-white pb-1">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isLoading}
                            className={`flex-1 px-4 py-2.5 md:px-6 md:py-3 border border-gray-300 text-gray-700 rounded-lg transition font-semibold text-sm md:text-base ${isLoading ? 'bg-gray-100 cursor-not-allowed opacity-70' : 'hover:bg-gray-50'}`}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className={`flex-1 px-4 py-2.5 md:px-6 md:py-3 text-white rounded-lg transition font-semibold text-sm md:text-base flex items-center justify-center gap-2 ${isLoading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
                        >
                            {isLoading ? (
                                <>
                                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    <span>{category ? 'Updating...' : 'Creating...'}</span>
                                </>
                            ) : (
                                isBannerMode
                                    ? `${category ? 'Update' : 'Create'} Banner`
                                    : `${category ? 'Update' : 'Create'} Category`
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CategoryForm;
