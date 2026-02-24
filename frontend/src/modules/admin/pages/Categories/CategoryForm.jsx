import React, { useState, useEffect } from 'react';
import { MdClose } from 'react-icons/md';
import toast from 'react-hot-toast';
import useCategoryStore from '../../store/categoryStore';

const CategoryForm = ({ category, onClose }) => {
    const { addCategory, updateCategory, isLoading } = useCategoryStore();

    const [formData, setFormData] = useState({
        name: '',
        image: '',
        active: true,
        file: null
    });

    useEffect(() => {
        if (category?.id) {
            setFormData({
                name: category.name,
                image: category.icon || category.image || '',
                active: category.active,
                file: null
            });
        } else {
            setFormData({
                name: '',
                image: '',
                active: true,
                file: null
            });
        }
    }, [category]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        const data = new FormData();
        data.append('name', formData.name);
        data.append('active', formData.active);

        if (formData.file) {
            data.append('icon', formData.file);
        } else if (formData.image) {
            data.append('icon', formData.image);
        }

        try {
            if (category?.id) {
                await updateCategory(category.id, data);
                toast.success('Category updated successfully', { duration: 1200 });
            } else {
                await addCategory(data);
                toast.success('Category created successfully', { duration: 1200 });
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

    return (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-3 md:p-6 bg-black/10 backdrop-blur-[1px]">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md border border-gray-200">
                <div className="flex items-center justify-between p-3 md:p-4 border-b border-gray-100">
                    <h2 className="text-lg md:text-xl font-bold text-gray-800">
                        {category ? 'Edit Category' : 'Add New Category'}
                    </h2>
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className="p-2 hover:bg-gray-100 rounded-lg transition"
                    >
                        <MdClose size={20} className="md:w-6 md:h-6 text-gray-600" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-3 md:p-4 space-y-3 md:space-y-4">
                    <div>
                        <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1 md:mb-2">
                            Category Name *
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
                            placeholder="Enter category name"
                            required
                        />
                    </div>

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
                            <div className="mt-2 border border-gray-200 rounded-lg p-2 bg-gray-50">
                                <p className="text-xs text-gray-600 mb-2">Image Preview:</p>
                                <img
                                    src={formData.image}
                                    alt="Category preview"
                                    className="w-24 h-24 object-cover rounded-lg"
                                />
                            </div>
                        )}
                    </div>

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

                    <div className="flex gap-2 md:gap-3 pt-1 md:pt-2">
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
                                `${category ? 'Update' : 'Create'} Category`
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CategoryForm;
