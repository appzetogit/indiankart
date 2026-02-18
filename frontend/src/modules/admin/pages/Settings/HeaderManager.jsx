import React, { useEffect, useState, useMemo } from 'react';
import useCategoryStore from '../../store/categoryStore';
import { useHeaderStore } from '../../store/headerStore';
import { 
    MdSave, 
    MdDragIndicator, 
    MdCheckBox, 
    MdInfo, 
    MdAdd,
    MdFolder,
    MdList
} from 'react-icons/md';
import toast from 'react-hot-toast';

// DnD Kit imports
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    MouseSensor,
    TouchSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

/**
 * SortableItem Component
 * Represents a category in the reorderable preview list
 */
const SortableItem = ({ id, category, onRemove }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: String(id) });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : 'auto',
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`flex items-center justify-between p-3 rounded-xl border border-gray-100 mb-2 bg-white shadow-sm group ${
                isDragging ? 'shadow-lg ring-2 ring-blue-100 opacity-50 z-50' : 'hover:shadow-md transition-all'
            }`}
        >
            <div className="flex items-center gap-3">
                <div 
                    {...attributes} 
                    {...listeners} 
                    className="p-1.5 rounded-lg text-gray-300 hover:bg-gray-100 hover:text-blue-500 cursor-grab active:cursor-grabbing transition-colors"
                >
                    <MdDragIndicator size={22} />
                </div>
                
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600">
                    <MdList size={20} />
                </div>
                
                <div>
                    <h4 className="font-bold text-gray-800 text-sm">{category?.name || 'Unnamed Category'}</h4>
                    <p className="text-[10px] uppercase font-bold text-gray-400">
                        {category?.children?.length || category?.subCategories?.length || 0} Subcategories
                    </p>
                </div>
            </div>

            <button
                type="button"
                onClick={() => onRemove(id)}
                className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                title="Remove from header"
            >
                <MdCheckBox size={24} />
            </button>
        </div>
    );
};

const HeaderManager = () => {
    const { categories = [], fetchCategories } = useCategoryStore();
    const { headerCategories = [], fetchHeaderConfig, updateHeaderConfig, isLoading } = useHeaderStore();
    
    const [selectedIds, setSelectedIds] = useState([]);
    const [hasChanges, setHasChanges] = useState(false);

    // Initial Data Fetch
    useEffect(() => {
        fetchCategories();
        fetchHeaderConfig();
    }, [fetchCategories, fetchHeaderConfig]);

    // Sync local state when config is fetched
    useEffect(() => {
        if (headerCategories && Array.isArray(headerCategories)) {
            setSelectedIds(headerCategories.map(c => String(c?._id || c?.id)));
        }
    }, [headerCategories]);

    // Helper to find category object by ID
    const findCategory = (id) => {
        if (!categories || !Array.isArray(categories)) return null;
        return categories.find(c => String(c?._id || c?.id) === String(id));
    };

    // Derived: Selected categories in their current order
    const selectedList = useMemo(() => {
        if (!selectedIds) return [];
        return selectedIds
            .map(id => findCategory(id))
            .filter(Boolean);
    }, [selectedIds, categories]);

    // Derived: Valid string IDs for DnD context
    const validRenderIds = useMemo(() => {
        return selectedList.map(c => String(c?._id || c?.id));
    }, [selectedList]);

    // Derived: Categories NOT in the header
    const availableList = useMemo(() => {
        if (!categories) return [];
        const selectedIdSet = new Set(selectedIds);
        return categories.filter(c => !selectedIdSet.has(String(c?._id || c?.id)));
    }, [categories, selectedIds]);

    // Sensor Configuration
    const sensors = useSensors(
        useSensor(MouseSensor, {
            activationConstraint: { distance: 5 },
        }),
        useSensor(TouchSensor, {
            activationConstraint: { delay: 250, tolerance: 5 },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // DnD Event Handler
    const handleDragEnd = (event) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            setSelectedIds((items) => {
                const oldIndex = items.indexOf(String(active.id));
                const newIndex = items.indexOf(String(over.id));
                
                if (oldIndex !== -1 && newIndex !== -1) {
                    setHasChanges(true);
                    return arrayMove(items, oldIndex, newIndex);
                }
                return items;
            });
        }
    };

    // Add to selected list
    const addToHeader = (id) => {
        const idStr = String(id);
        if (!selectedIds.includes(idStr)) {
            setSelectedIds(prev => [...prev, idStr]);
            setHasChanges(true);
        }
    };

    // Remove from selected list
    const removeFromHeader = (id) => {
        const idStr = String(id);
        setSelectedIds(prev => prev.filter(pid => String(pid) !== idStr));
        setHasChanges(true);
    };

    // Save to Backend
    const handleSave = async () => {
        try {
            await updateHeaderConfig(selectedIds);
            toast.success('Header menu saved successfully!');
            setHasChanges(false);
        } catch (error) {
            toast.error('Failed to update header configuration');
        }
    };

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto min-h-screen bg-gray-50/50">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 sticky top-0 bg-gray-50/90 backdrop-blur-md z-30 py-4 -mx-4 px-4 border-b border-gray-200/60">
                <div className="mb-4 md:mb-0">
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight">Navigation Menu</h1>
                    <p className="text-gray-500 text-sm font-medium">Reorder the header categories by dragging the handles.</p>
                </div>
                <div className="flex gap-3">
                    <button 
                        onClick={handleSave}
                        disabled={isLoading || !hasChanges}
                        className={`px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-xl active:scale-95 ${
                            hasChanges 
                                ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-200' 
                                : 'bg-white border border-gray-200 text-gray-300 cursor-not-allowed shadow-none'
                        }`}
                    >
                        <MdSave size={20} />
                        {isLoading ? 'SAVING...' : 'SAVE CHANGES'}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                {/* Left Column: Preview & Reorder */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between px-1">
                        <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                            PREVIEW: TOP NAVIGATION MENU ({selectedList.length})
                        </span>
                        {hasChanges && (
                            <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-full ring-1 ring-amber-200">
                                UNSAVED CHANGES
                            </span>
                        )}
                    </div>

                    <div className="min-h-[600px] rounded-[32px] bg-white border border-gray-100 p-6 shadow-sm">
                        {selectedList.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-center p-12 py-24">
                                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                                    <MdInfo size={32} className="text-gray-200" />
                                </div>
                                <h3 className="text-gray-800 font-bold mb-1">Menu is empty</h3>
                                <p className="text-gray-400 text-sm max-w-[200px]">Add categories from the list on the right to start building your menu.</p>
                            </div>
                        ) : (
                            <DndContext 
                                sensors={sensors} 
                                collisionDetection={closestCenter} 
                                onDragEnd={handleDragEnd}
                            >
                                <SortableContext 
                                    items={validRenderIds} 
                                    strategy={verticalListSortingStrategy}
                                >
                                    <div className="space-y-1">
                                        {selectedList.map((category) => (
                                            <SortableItem 
                                                key={String(category?._id || category?.id)} 
                                                id={String(category?._id || category?.id)}
                                                category={category} 
                                                onRemove={removeFromHeader}
                                            />
                                        ))}
                                    </div>
                                </SortableContext>
                            </DndContext>
                        )}
                        <p className="mt-8 text-[10px] text-center text-gray-300 font-bold uppercase tracking-widest flex items-center justify-center gap-2">
                            <MdInfo size={14} /> Only active categories will show on front-end
                        </p>
                    </div>
                </div>

                {/* Right Column: Available Categories */}
                <div className="space-y-4">
                    <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest block px-1">
                        AVAILABLE CATEGORIES ({availableList.length})
                    </span>

                    <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 p-6 max-h-[700px] overflow-y-auto custom-scrollbar">
                        <div className="grid grid-cols-1 gap-2">
                            {availableList.map(category => (
                                <div 
                                    key={String(category?._id || category?.id)}
                                    onClick={() => addToHeader(category?._id || category?.id)}
                                    className="flex items-center justify-between p-4 rounded-xl border border-gray-50 hover:bg-blue-50/40 hover:border-blue-100 cursor-pointer transition-all group"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center text-gray-400 group-hover:bg-white group-hover:text-blue-500 transition-colors">
                                            <MdFolder size={20} />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="font-bold text-gray-700 group-hover:text-blue-700 leading-none">{category?.name || 'Unnamed'}</span>
                                            <span className="text-[10px] text-gray-400 mt-1 font-bold">{category?.active ? 'Active' : 'Disabled'}</span>
                                        </div>
                                    </div>
                                    <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-300 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                                        <MdAdd size={20} />
                                    </div>
                                </div>
                            ))}
                            {availableList.length === 0 && (
                                <div className="text-center py-20">
                                    <p className="text-gray-400 text-sm font-medium italic">All categories are already in your menu.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HeaderManager;
