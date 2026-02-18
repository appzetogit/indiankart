import React, { useState, useEffect } from 'react';
import { MdAdd, MdEdit, MdDelete } from 'react-icons/md';
import useSubCategoryStore from '../../store/subCategoryStore';
import SubCategoryForm from './SubCategoryForm';
import Pagination from '../../components/common/Pagination';

const SubCategoryList = () => {
    const { subCategories, deleteSubCategory, fetchSubCategories, isLoading } = useSubCategoryStore();
    const [showForm, setShowForm] = useState(false);
    const [editingSubCategory, setEditingSubCategory] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    useEffect(() => {
        fetchSubCategories();
    }, [fetchSubCategories]);

    const handleEdit = (subCategory) => {
        setEditingSubCategory(subCategory);
        setShowForm(true);
    };

    const handleDelete = async (id, name) => {
        if (window.confirm(`Are you sure you want to delete subcategory "${name}"?`)) {
            await deleteSubCategory(id);
        }
    };

    const handleCloseForm = () => {
        setShowForm(false);
        setEditingSubCategory(null);
    };

    // Pagination
    const totalPages = Math.ceil(subCategories.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedSubCategories = subCategories.slice(startIndex, startIndex + itemsPerPage);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">SubCategories</h1>
                    <p className="text-gray-500 mt-1">Manage subcategories for better product organization</p>
                </div>
                <button
                    onClick={() => setShowForm(true)}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                >
                    <MdAdd size={20} />
                    Add SubCategory
                </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-100">
                                <th className="p-4 text-[10px] md:text-xs font-black text-gray-900 uppercase tracking-widest">Image</th>
                                <th className="p-4 text-[10px] md:text-xs font-black text-gray-900 uppercase tracking-widest">Name</th>
                                <th className="p-4 text-[10px] md:text-xs font-black text-gray-900 uppercase tracking-widest">Parent Category</th>
                                <th className="p-4 text-[10px] md:text-xs font-black text-gray-900 uppercase tracking-widest">Description</th>
                                <th className="p-4 text-[10px] md:text-xs font-black text-gray-900 uppercase tracking-widest">Status</th>
                                <th className="p-4 text-[10px] md:text-xs font-black text-gray-900 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {isLoading ? (
                                <tr>
                                    <td colSpan="6" className="p-8 text-center text-gray-500">Loading subcategories...</td>
                                </tr>
                            ) : subCategories.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="p-8 text-center text-gray-500">No subcategories found.</td>
                                </tr>
                            ) : (
                                paginatedSubCategories.map((sub) => (
                                    <tr key={sub._id || sub.id} className="hover:bg-gray-50 transition">
                                        <td className="p-4">
                                            {sub.image ? (
                                                <img src={sub.image} alt={sub.name} className="w-10 h-10 rounded-lg object-cover bg-gray-100" />
                                            ) : (
                                                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 font-bold text-xs">
                                                    {sub.name.substring(0, 2).toUpperCase()}
                                                </div>
                                            )}
                                        </td>
                                        <td className="p-4 font-semibold text-gray-800">{sub.name}</td>
                                        <td className="p-4 text-gray-600">
                                            {sub.category?.name || <span className="text-red-400 italic">Unassigned</span>}
                                        </td>
                                        <td className="p-4 text-gray-500 text-sm max-w-xs truncate">{sub.description}</td>
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
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {
                totalPages > 1 && (
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                    />
                )
            }

            {
                showForm && (
                    <SubCategoryForm
                        subCategory={editingSubCategory}
                        onClose={handleCloseForm}
                    />
                )
            }
        </div >
    );
};

export default SubCategoryList;
