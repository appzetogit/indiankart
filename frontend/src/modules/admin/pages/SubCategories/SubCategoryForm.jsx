import React, { useState, useEffect } from 'react';
import { MdClose } from 'react-icons/md';
import toast from 'react-hot-toast';
import useSubCategoryStore from '../../store/subCategoryStore';
import useCategoryStore from '../../store/categoryStore';

const SubCategoryForm = ({ subCategory, onClose }) => {
    const { addSubCategory, updateSubCategory } = useSubCategoryStore();
    const { categories, fetchCategories } = useCategoryStore();

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        image: '',
        category: '', // Primary Category ID
        isActive: true,
        file: null
    });

    useEffect(() => {
        if (categories.length === 0) {
            fetchCategories();
        }
    }, [fetchCategories, categories.length]);

    useEffect(() => {
        if (subCategory) {
            setFormData({
                name: subCategory.name,
                description: subCategory.description || '',
                image: subCategory.image || '',
                category: subCategory.category?._id || subCategory.category || '',
                isActive: subCategory.isActive ?? true,
                file: null
            });
        }
    }, [subCategory]);

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

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Basic validation
        if (!formData.category) {
            toast.error("Please select a parent category.");
            return;
        }

        const data = {
            name: formData.name,
            description: formData.description,
            category: formData.category,
            isActive: formData.isActive,
            image: formData.image 
        };

        if (subCategory?.id || subCategory?._id) {
            try {
                await updateSubCategory(subCategory._id || subCategory.id, data);
                toast.success('SubCategory updated successfully');
                onClose();
            } catch (error) {
                console.error(error);
                toast.error(error.response?.data?.message || 'Failed to update subcategory');
            }
        } else {
            try {
                await addSubCategory(data);
                toast.success('SubCategory created successfully');
                onClose();
            } catch (error) {
                console.error(error);
                toast.error(error.response?.data?.message || 'Failed to create subcategory');
            }
        }
    };


    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-y-auto max-h-[90vh]">
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <h2 className="text-2xl font-bold text-gray-800">
                        {subCategory ? 'Edit SubCategory' : 'Add New SubCategory'}
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition">
                        <MdClose size={24} className="text-gray-600" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Name *</label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 caret-black placeholder:text-gray-500"
                            placeholder="e.g. Mobile Accessories"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 caret-black placeholder:text-gray-500"
                            placeholder="Brief description of the subcategory..."
                            rows="3"
                        />
                    </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Primary Category *</label>
                            <select
                                name="category"
                                value={formData.category}
                                onChange={handleChange}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900"
                                required
                            >
                                <option value="">-- Select --</option>
                                {categories.map(cat => (
                                    <option key={cat.id || cat._id} value={cat._id || cat.id}>{cat.name}</option>
                                ))}
                            </select>
                        </div>


                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Image URL</label>
                         {/* Fallback to simple URL input since controller doesn't look like it handles files yet */}
                        <input
                            type="text"
                            name="image"
                            value={formData.image}
                            onChange={handleChange}
                            placeholder="https://..."
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 caret-black placeholder:text-gray-500"
                        />
                    </div>

                    <div className="flex items-center gap-3">
                        <input
                            type="checkbox"
                            id="isActive"
                            name="isActive"
                            checked={formData.isActive}
                            onChange={handleChange}
                            className="w-5 h-5 text-blue-600 rounded"
                        />
                        <label htmlFor="isActive" className="text-sm font-medium text-gray-700">Active</label>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button type="button" onClick={onClose} className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-semibold">
                            Cancel
                        </button>
                        <button type="submit" className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold">
                            {subCategory ? 'Update' : 'Create'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SubCategoryForm;
