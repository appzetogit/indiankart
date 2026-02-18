import React, { useState, useEffect } from 'react';
import { MdClose } from 'react-icons/md';
import toast from 'react-hot-toast';
import useCategoryStore from '../../store/categoryStore';

const CategoryForm = ({ category, onClose }) => {
    const { addCategory, updateCategory, getAllCategoriesFlat } = useCategoryStore();
    const allCategories = getAllCategoriesFlat();

    const [formData, setFormData] = useState({
        name: '',
        image: '', // Will hold string URL or File object for preview/upload
        parentId: null,
        active: true,
        file: null // Explicit file state
    });

    useEffect(() => {
        if (category?.id) {
            // Edit Mode
            setFormData({
                name: category.name,
                image: category.icon || category.image || '', // Map icon to image for preview
                parentId: category.parentId || null,
                active: category.active,
                file: null
            });
        } else if (category?.parentId) {
            // Add Subcategory Mode
            setFormData({
                name: '',
                image: '',
                parentId: category.parentId,
                active: true,
                file: null
            });
        }
    }, [category]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        const data = new FormData();
        data.append('name', formData.name);
        if (formData.parentId) data.append('parentId', formData.parentId);
        data.append('active', formData.active);

        if (formData.file) {
            data.append('icon', formData.file);
        } else if (formData.image) {
            data.append('icon', formData.image);
        }

        try {
            if (category?.id) {
                // Update existing category
                await updateCategory(category.id, data);
                toast.success('Category updated successfully');
            } else {
                // Add new category
                await addCategory(data);
                toast.success('Category created successfully');
            }
            onClose();
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || 'Failed to save category');
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const imageUrl = URL.createObjectURL(file);
            setFormData(prev => ({ ...prev, image: imageUrl, file: file }));
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
                {/* Header */}
                <div className="flex items-center justify-between p-4 md:p-6 border-b border-gray-100">
                    <h2 className="text-xl md:text-2xl font-bold text-gray-800">
                        {category ? 'Edit Category' : 'Add New Category'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition"
                    >
                        <MdClose size={20} className="md:w-6 md:h-6 text-gray-600" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-4 md:p-6 space-y-4 md:space-y-5">
                    {/* Category Name */}
                    <div>
                        <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1 md:mb-2">
                            Category Name *
                        </label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            className="w-full px-3 py-2 md:px-4 md:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900 placeholder:text-gray-500 text-sm md:text-base"
                            placeholder="Enter category name"
                            required
                        />
                    </div>

                    {/* Parent Category */}
                    <div>
                        <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1 md:mb-2">
                            Parent Category
                        </label>
                        <select
                            name="parentId"
                            value={formData.parentId || ''}
                            onChange={(e) => setFormData(prev => ({
                                ...prev,
                                parentId: e.target.value ? parseInt(e.target.value) : null
                            }))}
                            className="w-full px-3 py-2 md:px-4 md:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900 text-sm md:text-base"
                        >
                            <option value="">-- Root Category --</option>
                            {allCategories
                                .filter(cat => !category || cat.id !== category.id) // Don't allow selecting itself
                                .map(cat => (
                                    <option key={cat.id} value={cat.id}>
                                        {'—'.repeat(cat.level * 2)} {cat.name}
                                    </option>
                                ))
                            }
                        </select>
                        <p className="text-xs text-gray-500 mt-1">
                            Leave empty to create a root category
                        </p>
                    </div>

                    {/* Category Image */}
                    <div>
                        <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1 md:mb-2">
                            Category Image
                        </label>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                            className="w-full px-3 py-2 md:px-4 md:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900 text-sm md:text-base"
                        />
                        {formData.image && (
                            <div className="mt-3 border border-gray-200 rounded-lg p-2 bg-gray-50">
                                <p className="text-xs text-gray-600 mb-2">Image Preview:</p>
                                <img
                                    src={formData.image}
                                    alt="Category preview"
                                    className="w-32 h-32 object-cover rounded-lg"
                                />
                            </div>
                        )}
                    </div>

                    {/* Active Status */}
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
                            Active (Category will be visible to users)
                        </label>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 md:gap-3 pt-2 md:pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 md:px-6 md:py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-semibold text-sm md:text-base"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-4 py-2.5 md:px-6 md:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold text-sm md:text-base"
                        >
                            {category ? 'Update' : 'Create'} Category
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CategoryForm;
