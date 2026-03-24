import React, { useState, useEffect, useMemo } from 'react';
import { MdAdd, MdEdit, MdDelete, MdExpandMore, MdChevronRight } from 'react-icons/md';
import useSubCategoryStore from '../../store/subCategoryStore';
import SubCategoryForm from './SubCategoryForm';
import { confirmToast } from '../../../../utils/toastUtils.jsx';

const getCategoryId = (sub) => String(sub?.category?._id || sub?.category || 'uncategorized');
const getCategoryName = (sub) => sub?.category?.name || 'Unassigned';

const SubCategoryList = () => {
    const subCategories = useSubCategoryStore((state) => state.subCategories);
    const deleteSubCategory = useSubCategoryStore((state) => state.deleteSubCategory);
    const fetchSubCategories = useSubCategoryStore((state) => state.fetchSubCategories);
    const isLoading = useSubCategoryStore((state) => state.isLoading);

    const [showForm, setShowForm] = useState(false);
    const [editingSubCategory, setEditingSubCategory] = useState(null);
    const [expandedCategoryId, setExpandedCategoryId] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchSubCategories();
    }, [fetchSubCategories]);

    const handleEdit = (subCategory) => {
        setEditingSubCategory(subCategory);
        setShowForm(true);
    };

    const handleDelete = (id, name) => {
        confirmToast({
            message: `Are you sure you want to delete subcategory "${name}"?`,
            type: 'danger',
            icon: 'delete_sweep',
            confirmText: 'Delete SubCategory',
            onConfirm: () => deleteSubCategory(id)
        });
    };

    const handleCloseForm = () => {
        setShowForm(false);
        setEditingSubCategory(null);
    };

    const toggleCategory = (categoryId) => {
        setExpandedCategoryId((prev) => (prev === categoryId ? null : categoryId));
    };

    const categoryGroups = useMemo(() => {
        const filtered = (subCategories || []).filter(sub => {
            const search = searchTerm.toLowerCase();
            return (
                sub.name?.toLowerCase().includes(search) || 
                getCategoryName(sub).toLowerCase().includes(search)
            );
        });

        const byCategory = new Map();

        for (const sub of filtered) {
            const categoryId = getCategoryId(sub);
            const categoryName = getCategoryName(sub);
            if (!byCategory.has(categoryId)) {
                byCategory.set(categoryId, { categoryId, name: categoryName, items: [] });
            }
            byCategory.get(categoryId).items.push(sub);
        }

        return [...byCategory.values()]
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((group) => ({
                ...group,
                items: [...group.items].sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')))
            }));
    }, [subCategories, searchTerm]);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">SubCategories</h1>
                    <p className="text-gray-500 mt-1">Each subcategory belongs directly to one category (no nested hierarchy).</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search subcategories..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-4 pr-10 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-64 text-sm"
                        />
                    </div>
                    <button
                        onClick={() => setShowForm(true)}
                        className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                    >
                        <MdAdd size={20} />
                        Add SubCategory
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-100">
                                <th className="p-4 text-[10px] md:text-xs font-black text-gray-900 uppercase tracking-widest">Name</th>
                                <th className="p-4 text-[10px] md:text-xs font-black text-gray-900 uppercase tracking-widest">Category</th>
                                <th className="p-4 text-[10px] md:text-xs font-black text-gray-900 uppercase tracking-widest">Status</th>
                                <th className="p-4 text-[10px] md:text-xs font-black text-gray-900 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {isLoading ? (
                                <tr>
                                    <td colSpan="4" className="p-8 text-center text-gray-500">Loading subcategories...</td>
                                </tr>
                            ) : categoryGroups.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="p-8 text-center text-gray-500">No subcategories found.</td>
                                </tr>
                            ) : (
                                categoryGroups.flatMap((group) => {
                                    const isExpanded = expandedCategoryId === group.categoryId;
                                    return [
                                    <tr key={`group-${group.categoryId}`} className="bg-blue-50/50">
                                        <td colSpan="4" className="px-4 py-2.5 border-y border-blue-100">
                                            <button
                                                type="button"
                                                onClick={() => toggleCategory(group.categoryId)}
                                                className="w-full flex items-center justify-between text-left"
                                            >
                                                <span className="flex items-center gap-2 font-bold text-blue-900">
                                                    {isExpanded ? <MdExpandMore /> : <MdChevronRight />}
                                                    {group.name}
                                                </span>
                                                <span className="text-xs font-semibold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                                                    {group.items.length} items
                                                </span>
                                            </button>
                                        </td>
                                    </tr>,
                                    ...(isExpanded ? group.items.map((sub) => (
                                        <tr key={sub._id || sub.id} className="hover:bg-gray-50 transition">
                                            <td className="p-4 font-semibold text-gray-800">{sub.name}</td>
                                            <td className="p-4 text-gray-700 text-sm">{group.name}</td>
                                            <td className="p-4">
                                                <span className={`px-2 py-1 rounded-full text-xs font-bold ${sub.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                    {sub.isActive ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td className="p-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        onClick={() => handleEdit(sub)}
                                                        className="p-2 hover:bg-blue-50 rounded-lg text-blue-600 transition"
                                                    >
                                                        <MdEdit size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(sub._id || sub.id, sub.name)}
                                                        className="p-2 hover:bg-red-50 rounded-lg text-red-600 transition"
                                                    >
                                                        <MdDelete size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    )) : [])
                                ];
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {showForm && (
                <SubCategoryForm
                    subCategory={editingSubCategory}
                    onClose={handleCloseForm}
                />
            )}
        </div>
    );
};

export default SubCategoryList;
