import React, { useState, useEffect, useMemo } from 'react';
import { MdAdd, MdEdit, MdDelete, MdExpandMore, MdChevronRight } from 'react-icons/md';
import useSubCategoryStore from '../../store/subCategoryStore';
import SubCategoryForm from './SubCategoryForm';
import { confirmToast } from '../../../../utils/toastUtils.jsx';

const getSubId = (sub) => String(sub?._id || sub?.id || '');
const getCategoryId = (sub) => String(sub?.category?._id || sub?.category || '');
const getCategoryName = (sub) => sub?.category?.name || 'Unassigned';
const getParentSubId = (sub) => String(sub?.parentSubCategory?._id || sub?.parentSubCategory || '');

const SubCategoryList = () => {
    const { subCategories, deleteSubCategory, fetchSubCategories, isLoading } = useSubCategoryStore();
    const [showForm, setShowForm] = useState(false);
    const [editingSubCategory, setEditingSubCategory] = useState(null);
    const [expandedCategoryIds, setExpandedCategoryIds] = useState(new Set());
    const [expandedSubByParent, setExpandedSubByParent] = useState({});

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

    const categoryGroups = useMemo(() => {
        const subById = new Map();
        for (const sub of subCategories) {
            subById.set(getSubId(sub), sub);
        }

        const byCategory = new Map();
        for (const sub of subCategories) {
            const categoryId = getCategoryId(sub) || 'uncategorized';
            const categoryName = getCategoryName(sub);
            if (!byCategory.has(categoryId)) {
                byCategory.set(categoryId, { categoryId, name: categoryName, items: [] });
            }
            byCategory.get(categoryId).items.push(sub);
        }

        const sortByName = (arr) => [...arr].sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')));

        return [...byCategory.values()]
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((group) => {
                const byParent = new Map();
                for (const sub of group.items) {
                    const parentId = getParentSubId(sub) || 'root';
                    if (!byParent.has(parentId)) byParent.set(parentId, []);
                    byParent.get(parentId).push(sub);
                }

                const getParentPath = (sub) => {
                    const path = [group.name];
                    let current = sub;
                    let guard = 0;

                    while (getParentSubId(current) && guard < 25) {
                        const parent = subById.get(getParentSubId(current));
                        if (!parent?.name) break;
                        path.push(parent.name);
                        current = parent;
                        guard += 1;
                    }

                    return path.join(' -> ');
                };

                const parentNodeIds = [];

                const buildNodes = (parentId = 'root', depth = 0) => {
                    const children = sortByName(byParent.get(parentId) || []);

                    return children.map((child) => {
                        const childId = getSubId(child);
                        const nested = buildNodes(childId, depth + 1);
                        if (nested.length > 0) parentNodeIds.push(childId);

                        return {
                            id: childId,
                            parentId,
                            depth,
                            sub: child,
                            parentPath: getParentPath(child),
                            children: nested
                        };
                    });
                };

                return {
                    categoryId: group.categoryId,
                    name: group.name,
                    count: group.items.length,
                    nodes: buildNodes('root', 0),
                    parentNodeIds
                };
            });
    }, [subCategories]);

    useEffect(() => {
        if (categoryGroups.length === 0) return;
        setExpandedCategoryIds((prev) => {
            if (prev.size > 0) return prev;
            return new Set();
        });

        setExpandedSubByParent((prev) => {
            if (Object.keys(prev).length > 0) return prev;
            return {};
        });
    }, [categoryGroups]);

    const toggleCategory = (categoryId) => {
        setExpandedCategoryIds((prev) => {
            if (prev.has(categoryId)) return new Set();
            return new Set([categoryId]);
        });
        // Reset nested state when switching category accordion section
        setExpandedSubByParent({});
    };

    const toggleSubNode = (parentId, subId) => {
        setExpandedSubByParent((prev) => {
            const parentKey = String(parentId || 'root');
            const openForLevel = prev[parentKey];

            if (openForLevel === subId) {
                const next = { ...prev };
                delete next[parentKey];
                return next;
            }

            return {
                ...prev,
                [parentKey]: subId
            };
        });
    };

    const renderNodes = (nodes, groupCategoryId) => {
        return nodes.flatMap((node) => {
            const sub = node.sub;
            const hasChildren = node.children.length > 0;
            const parentKey = String(node.parentId || 'root');
            const isExpanded = expandedSubByParent[parentKey] === node.id;

            const currentRow = (
                <tr key={`${groupCategoryId}-${node.id}`} className="hover:bg-gray-50 transition">
                    <td className="p-4 font-semibold text-gray-800">
                        <div style={{ paddingLeft: `${node.depth * 18}px` }} className="flex items-center gap-2">
                            {hasChildren ? (
                                <button
                                    type="button"
                                    onClick={() => toggleSubNode(node.parentId, node.id)}
                                    className="text-gray-500 hover:text-gray-700"
                                >
                                    {isExpanded ? <MdExpandMore size={18} /> : <MdChevronRight size={18} />}
                                </button>
                            ) : (
                                <span className="w-[18px]" />
                            )}
                            <span>{sub.name}</span>
                        </div>
                    </td>
                    <td className="p-4 text-gray-700 text-sm">{node.parentPath}</td>
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
            );

            if (!hasChildren || !isExpanded) return [currentRow];
            return [currentRow, ...renderNodes(node.children, groupCategoryId)];
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">SubCategories</h1>
                    <p className="text-gray-500 mt-1">Categories with nested subcategory hierarchy (open/close).</p>
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
                                <th className="p-4 text-[10px] md:text-xs font-black text-gray-900 uppercase tracking-widest">Name</th>
                                <th className="p-4 text-[10px] md:text-xs font-black text-gray-900 uppercase tracking-widest">Parent Category</th>
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
                                categoryGroups.map((group) => {
                                    const isExpanded = expandedCategoryIds.has(group.categoryId);

                                    return (
                                        <React.Fragment key={group.categoryId}>
                                            <tr className="bg-blue-50/50">
                                                <td colSpan="4" className="px-4 py-2.5 border-y border-blue-100">
                                                    <button
                                                        type="button"
                                                        onClick={() => toggleCategory(group.categoryId)}
                                                        className="w-full flex items-center justify-between text-left"
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            {isExpanded ? (
                                                                <MdExpandMore className="text-blue-700" />
                                                            ) : (
                                                                <MdChevronRight className="text-blue-700" />
                                                            )}
                                                            <span className="font-bold text-blue-900">{group.name}</span>
                                                        </div>
                                                        <span className="text-xs font-semibold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                                                            {group.count} items
                                                        </span>
                                                    </button>
                                                </td>
                                            </tr>

                                            {isExpanded && renderNodes(group.nodes, group.categoryId)}
                                        </React.Fragment>
                                    );
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
