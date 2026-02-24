import React, { useState, useEffect, useMemo } from 'react';
import { MdClose } from 'react-icons/md';
import toast from 'react-hot-toast';
import useSubCategoryStore from '../../store/subCategoryStore';
import useCategoryStore from '../../store/categoryStore';

const getId = (item) => String(item?._id || item?.id || '');
const getCategoryId = (sub) => String(sub?.category?._id || sub?.category || '');
const getParentSubId = (sub) => String(sub?.parentSubCategory?._id || sub?.parentSubCategory || '');

const SubCategoryForm = ({ subCategory, onClose }) => {
    const { addSubCategory, updateSubCategory, isLoading, subCategories, fetchSubCategories } = useSubCategoryStore();
    const { categories, fetchCategories, isLoading: isCategoriesLoading } = useCategoryStore();

    const [formData, setFormData] = useState({
        name: '',
        image: '',
        category: '',
        parentSubCategory: '',
        parentSelector: '',
        isActive: true,
        file: null
    });

    useEffect(() => {
        fetchCategories();
        fetchSubCategories();
    }, [fetchCategories, fetchSubCategories]);

    const categoryOptions = useMemo(() => {
        const seen = new Set();
        const deduped = [];

        for (const cat of categories || []) {
            const key = getId(cat);
            if (!key || seen.has(key)) continue;
            seen.add(key);
            deduped.push(cat);
        }

        return deduped;
    }, [categories]);

    const subCategoryOptions = useMemo(() => {
        const seen = new Set();
        const deduped = [];

        for (const sub of subCategories || []) {
            const key = getId(sub);
            if (!key || seen.has(key)) continue;
            seen.add(key);
            deduped.push(sub);
        }

        return deduped;
    }, [subCategories]);

    const hierarchyOptions = useMemo(() => {
        const currentId = getId(subCategory);

        const byParent = new Map();
        for (const sub of subCategoryOptions) {
            if (getId(sub) === currentId) continue;
            const parentId = getParentSubId(sub) || 'root';
            if (!byParent.has(parentId)) byParent.set(parentId, []);
            byParent.get(parentId).push(sub);
        }

        const sortedByName = (arr) => [...arr].sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')));

        const buildSubTree = (categoryId, parentId = 'root', depth = 1) => {
            const nodes = sortedByName(byParent.get(parentId) || []);
            const rows = [];
            const indent = '\u00A0\u00A0\u00A0';

            for (const node of nodes) {
                if (getCategoryId(node) !== String(categoryId)) continue;
                rows.push({
                    value: `sub:${getId(node)}`,
                    label: `${indent.repeat(depth)}↳ ${node.name}`
                });
                rows.push(...buildSubTree(categoryId, getId(node), depth + 1));
            }

            return rows;
        };

        const rows = [];
        for (const cat of categoryOptions) {
            const catId = getId(cat);
            rows.push({ value: `cat:${catId}`, label: cat.name });
            rows.push(...buildSubTree(catId));
        }

        return rows;
    }, [categoryOptions, subCategoryOptions, subCategory]);

    useEffect(() => {
        if (subCategory) {
            const categoryId = getCategoryId(subCategory);
            const parentSubId = getParentSubId(subCategory);

            setFormData({
                name: subCategory.name,
                image: subCategory.image || '',
                category: categoryId,
                parentSubCategory: parentSubId,
                parentSelector: parentSubId ? `sub:${parentSubId}` : `cat:${categoryId}`,
                isActive: subCategory.isActive ?? true,
                file: null
            });
        } else {
            setFormData({
                name: '',
                image: '',
                category: '',
                parentSubCategory: '',
                parentSelector: '',
                isActive: true,
                file: null
            });
        }
    }, [subCategory]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleParentSelectionChange = (e) => {
        const value = e.target.value;

        if (!value) {
            setFormData((prev) => ({
                ...prev,
                parentSelector: '',
                category: '',
                parentSubCategory: ''
            }));
            return;
        }

        const [kind, id] = value.split(':');

        if (kind === 'cat') {
            setFormData((prev) => ({
                ...prev,
                parentSelector: value,
                category: id,
                parentSubCategory: ''
            }));
            return;
        }

        const selectedSub = subCategoryOptions.find((sub) => getId(sub) === id);
        const selectedSubCategoryId = selectedSub ? getCategoryId(selectedSub) : '';

        setFormData((prev) => ({
            ...prev,
            parentSelector: value,
            category: selectedSubCategoryId,
            parentSubCategory: id
        }));
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = () => {
            setFormData((prev) => ({
                ...prev,
                file,
                image: reader.result || ''
            }));
        };
        reader.readAsDataURL(file);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.category) {
            toast.error('Please select a parent from hierarchy.');
            return;
        }

        const data = {
            name: formData.name,
            category: formData.category,
            parentSubCategory: formData.parentSubCategory || null,
            isActive: formData.isActive,
            image: formData.image
        };

        try {
            const ok = subCategory?._id || subCategory?.id
                ? await updateSubCategory(subCategory._id || subCategory.id, data)
                : await addSubCategory(data);

            if (ok) {
                onClose();
            }
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || 'Failed to save subcategory');
        }
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-3 md:p-6 bg-black/10 backdrop-blur-[1px]">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md border border-gray-200 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-3 md:p-4 border-b border-gray-100">
                    <h2 className="text-lg md:text-xl font-bold text-gray-800">
                        {subCategory ? 'Edit SubCategory' : 'Add New SubCategory'}
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
                        <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1 md:mb-2">Name *</label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            autoComplete="off"
                            autoCorrect="off"
                            autoCapitalize="none"
                            spellCheck={false}
                            className="w-full px-3 py-2 md:px-4 md:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 placeholder:text-gray-500"
                            placeholder="e.g. Mobile Accessories"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1 md:mb-2">Primary Category *</label>
                        <select
                            name="parentSelector"
                            value={formData.parentSelector}
                            onChange={handleParentSelectionChange}
                            className="w-full px-3 py-2 md:px-4 md:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900"
                            required
                        >
                            <option value="">
                                {isCategoriesLoading ? 'Loading categories...' : '-- Select --'}
                            </option>
                            {hierarchyOptions.map((item) => (
                                <option key={item.value} value={item.value}>
                                    {item.label}
                                </option>
                            ))}
                        </select>
                        {!isCategoriesLoading && categoryOptions.length === 0 && (
                            <p className="text-xs text-red-500 mt-1">No categories found. Create a category first.</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1 md:mb-2">SubCategory Image</label>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                            className="w-full px-3 py-2 md:px-4 md:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 text-sm md:text-base"
                        />
                        {formData.image && (
                            <div className="mt-2 border border-gray-200 rounded-lg p-2 bg-gray-50">
                                <p className="text-xs text-gray-600 mb-2">Image Preview:</p>
                                <img
                                    src={formData.image}
                                    alt="SubCategory preview"
                                    className="w-24 h-24 object-cover rounded-lg"
                                />
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-2 md:gap-3">
                        <input
                            type="checkbox"
                            id="isActive"
                            name="isActive"
                            checked={formData.isActive}
                            onChange={handleChange}
                            className="w-4 h-4 md:w-5 md:h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                        />
                        <label htmlFor="isActive" className="text-xs md:text-sm font-medium text-gray-700">Active</label>
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
                                    <span>{subCategory ? 'Updating...' : 'Creating...'}</span>
                                </>
                            ) : (
                                `${subCategory ? 'Update' : 'Create'} SubCategory`
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SubCategoryForm;
