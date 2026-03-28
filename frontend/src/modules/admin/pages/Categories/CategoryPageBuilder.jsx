import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MdAdd, MdArrowForward, MdDelete, MdDragIndicator, MdToggleOff, MdToggleOn } from 'react-icons/md';
import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, arrayMove, rectSortingStrategy, sortableKeyboardCoordinates, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const makeId = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
const BUILDER_STORAGE_KEY = 'category-page-builder-dummy-catalog-v1';
const PRODUCT_PICKER_RESULT_KEY = 'category-page-builder-product-picker-result-v1';
const dummyCatalog = [{
    id: 'electronics',
    name: 'Electronics',
    subCategories: [
        { id: 'sub-headsets', name: 'Headsets', image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=300&q=80' },
        { id: 'sub-wearables', name: 'Wearables', image: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=300&q=80' },
        { id: 'sub-laptops', name: 'Laptops', image: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=300&q=80' },
        { id: 'sub-grooming', name: 'Grooming', image: 'https://images.unsplash.com/photo-1522338140262-f46f5913618a?auto=format&fit=crop&w=300&q=80' }
    ],
    products: [
        { id: 'prod-airbuds', name: 'Noise Air Buds', image: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=400&q=80', subtitle: 'Wireless audio' },
        { id: 'prod-watch', name: 'Active Smartwatch', image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=400&q=80', subtitle: 'Health and style' },
        { id: 'prod-laptop', name: 'Slim Laptop Pro', image: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=400&q=80', subtitle: 'Work and study' }
    ],
    categoryStrip: {
        isActive: true,
        items: [
            { id: 'strip-1', subCategoryId: 'sub-headsets', isActive: true, order: 1 },
            { id: 'strip-2', subCategoryId: 'sub-wearables', isActive: true, order: 2 },
            { id: 'strip-3', subCategoryId: 'sub-laptops', isActive: false, order: 3 }
        ]
    },
    pageSections: [
        {
            id: 'sec-1', sectionKind: 'image', isActive: true, order: 1, title: 'Exclusively For You', description: 'Frontend only preview',
            sectionLink: '/category/Electronics/Laptops', showArrow: true, backgroundType: 'color', backgroundColor: '#ffffff', backgroundImage: '', mediaDisplay: 'carousel',
            items: [
                { id: 'img-1', itemType: 'image', image: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1200&q=80', title: '', description: '', link: '' },
                { id: 'img-2', itemType: 'image', image: 'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?auto=format&fit=crop&w=1200&q=80', title: '', description: '', link: '' }
            ]
        },
        {
            id: 'sec-2', sectionKind: 'product', isActive: true, order: 2, title: 'Best Gadgets', description: 'Products in same section container',
            sectionLink: '', showArrow: false, backgroundType: 'color', backgroundColor: '#f8fafc', backgroundImage: '', mediaDisplay: 'scroll',
            items: [
                { id: 'prod-1', itemType: 'product', productId: 'prod-airbuds', title: '', description: '', link: '' },
                { id: 'prod-2', itemType: 'product', productId: 'prod-watch', title: '', description: '', link: '' }
            ]
        }
    ]
}];

const SortableWrap = ({ id, children }) => {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
    return (
        <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} className="relative">
            <div className="absolute left-2 top-2 z-10 rounded-lg bg-white/90 p-1 shadow-sm" {...attributes} {...listeners}>
                <MdDragIndicator className="text-gray-400" size={18} />
            </div>
            {children}
        </div>
    );
};

const CategoryPageBuilder = () => {
    const [catalog, setCatalog] = useState(() => {
        try {
            const stored = localStorage.getItem(BUILDER_STORAGE_KEY);
            if (!stored) return dummyCatalog;
            const parsed = JSON.parse(stored);
            return Array.isArray(parsed) && parsed.length > 0 ? parsed : dummyCatalog;
        } catch (err) {
            return dummyCatalog;
        }
    });
    const [categoryId, setCategoryId] = useState(dummyCatalog[0].id);
    const [sectionId, setSectionId] = useState('');
    const [isDirty, setIsDirty] = useState(false);
    const [saveMessage, setSaveMessage] = useState('');
    const navigate = useNavigate();
    const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

    const category = useMemo(() => catalog.find((item) => item.id === categoryId) || catalog[0], [catalog, categoryId]);
    const section = category.pageSections.find((item) => item.id === sectionId) || null;
    const getProduct = (id) => category.products.find((item) => item.id === id);
    const hasSelectedSection = Boolean(section);

    const updateCategory = (updater) => setCatalog((prev) => {
        const next = prev.map((item) => item.id === categoryId ? updater(item) : item);
        setIsDirty(true);
        return next;
    });
    const updateSection = (updates) => {
        if (!section) return;
        updateCategory((item) => ({ ...item, pageSections: item.pageSections.map((entry) => entry.id === section.id ? { ...entry, ...updates } : entry) }));
    };
    const updateItems = (updater) => {
        if (!section) return;
        updateCategory((item) => ({ ...item, pageSections: item.pageSections.map((entry) => entry.id === section.id ? { ...entry, items: updater(entry.items) } : entry) }));
    };
    const updateSectionItem = (itemId, updates) => updateItems((items) => items.map((entry) => entry.id === itemId ? { ...entry, ...updates } : entry));
    const handleSectionItemImageUpload = (itemId, file) => {
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            updateSectionItem(itemId, { image: String(reader.result || '') });
        };
        reader.readAsDataURL(file);
    };
    const handleBackgroundImageUpload = (file) => {
        if (!section || !file) return;
        const reader = new FileReader();
        reader.onload = () => {
            updateSection({ backgroundImage: String(reader.result || '') });
        };
        reader.readAsDataURL(file);
    };

    const onSectionDragEnd = ({ active, over }) => {
        if (!over || active.id === over.id) return;
        updateCategory((item) => {
            const oldIndex = item.pageSections.findIndex((entry) => entry.id === active.id);
            const newIndex = item.pageSections.findIndex((entry) => entry.id === over.id);
            return { ...item, pageSections: arrayMove(item.pageSections, oldIndex, newIndex).map((entry, index) => ({ ...entry, order: index + 1 })) };
        });
    };

    const onItemDragEnd = ({ active, over }) => {
        if (!section || !over || active.id === over.id) return;
        updateItems((items) => {
            const oldIndex = items.findIndex((entry) => entry.id === active.id);
            const newIndex = items.findIndex((entry) => entry.id === over.id);
            return arrayMove(items, oldIndex, newIndex);
        });
    };

    const selectedBackgroundType = section?.backgroundType || (section?.backgroundImage ? 'image' : 'color');

    const previewItems = section
        ? (section.mediaDisplay === 'single' ? section.items.slice(0, 1) : section.items)
        : [];
    const selectedProductIds = new Set(
        (section?.items || [])
            .filter((item) => item.itemType === 'product' && item.productId)
            .map((item) => item.productId)
    );

    const openProductPicker = () => {
        if (!section) return;
        const params = new URLSearchParams({
            picker: 'category-builder',
            returnTo: '/admin/categories/page-builder',
            categoryId: category.id,
            sectionId: section.id,
            selected: Array.from(selectedProductIds).join(',')
        });
        navigate(`/admin/products?${params.toString()}`);
    };

    useEffect(() => {
        try {
            const raw = localStorage.getItem(PRODUCT_PICKER_RESULT_KEY);
            if (!raw) return;
            const payload = JSON.parse(raw);
            if (payload?.target !== 'category-page-builder') return;

            localStorage.removeItem(PRODUCT_PICKER_RESULT_KEY);

            const payloadCategoryId = String(payload?.categoryId || '').trim();
            const payloadSectionId = String(payload?.sectionId || '').trim();
            const pickedIds = Array.isArray(payload?.productIds) ? payload.productIds.map((id) => String(id)).filter(Boolean) : [];
            const pickedProducts = Array.isArray(payload?.products) ? payload.products : [];
            const pickedProductMap = new Map(
                pickedProducts
                    .map((product) => ({
                        id: String(product?.id || product?._id || '').trim(),
                        name: String(product?.name || '').trim(),
                        image: String(product?.image || '').trim(),
                        subtitle: String(product?.subtitle || '').trim()
                    }))
                    .filter((product) => product.id)
                    .map((product) => [product.id, product])
            );
            if (!payloadCategoryId || !payloadSectionId) return;

            setCatalog((prev) => {
                const next = prev.map((cat) => {
                    if (cat.id !== payloadCategoryId) return cat;
                    return {
                        ...cat,
                        pageSections: cat.pageSections.map((sec) => {
                            if (sec.id !== payloadSectionId) return sec;
                            const existingProductMap = new Map(
                                (sec.items || [])
                                    .filter((row) => row.itemType === 'product' && row.productId)
                                    .map((row) => [String(row.productId), row])
                            );
                            const nonProductItems = (sec.items || []).filter((row) => row.itemType !== 'product');
                            const nextProductItems = pickedIds.map((pid) => existingProductMap.get(pid) || {
                                id: makeId('item'),
                                itemType: 'product',
                                productId: pid,
                                productSnapshot: pickedProductMap.get(pid) || null,
                                title: '',
                                description: '',
                                link: ''
                            });
                            return { ...sec, items: [...nonProductItems, ...nextProductItems] };
                        })
                    };
                });
                return next;
            });

            setCategoryId(payloadCategoryId);
            setSectionId(payloadSectionId);
            setIsDirty(true);
            setSaveMessage('Products added');
            window.setTimeout(() => setSaveMessage(''), 1800);
        } catch (err) {
            localStorage.removeItem(PRODUCT_PICKER_RESULT_KEY);
        }
    }, []);

    const handleSaveSection = () => {
        if (!section) return;
        try {
            localStorage.setItem(BUILDER_STORAGE_KEY, JSON.stringify(catalog));
            setIsDirty(false);
            setSaveMessage('Section saved');
            window.setTimeout(() => setSaveMessage(''), 1800);
        } catch (err) {
            setSaveMessage('Save failed');
            window.setTimeout(() => setSaveMessage(''), 1800);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Category Page Builder</h1>
                    <p className="text-sm text-gray-500">Frontend-only dummy admin page. Backend later step by step.</p>
                </div>
                <div className="flex items-center gap-3">
                    <select
                        value={categoryId}
                        onChange={(e) => {
                            setCategoryId(e.target.value);
                            setSectionId('');
                        }}
                        className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 outline-none"
                    >
                        {catalog.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                    </select>
                    <div className="rounded-full bg-blue-50 px-4 py-2 text-xs font-bold uppercase tracking-wider text-blue-600">Frontend Dummy</div>
                </div>
            </div>

            <div className="grid gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
                <div className="space-y-6">
                    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                        <div className="mb-4 flex items-center justify-between">
                            <div>
                                <h2 className="text-sm font-black uppercase tracking-widest text-gray-800">Page Sections</h2>
                                <p className="mt-1 text-xs text-gray-500">One reusable section container</p>
                            </div>
                            <button type="button" onClick={() => {
                                const next = { id: makeId('sec'), sectionKind: 'image', isActive: true, order: category.pageSections.length + 1, title: 'New Section', description: '', sectionLink: '', showArrow: false, backgroundType: 'color', backgroundColor: '#ffffff', backgroundImage: '', mediaDisplay: 'single', items: [] };
                                updateCategory((item) => ({ ...item, pageSections: [...item.pageSections, next] }));
                            }} className="rounded-xl bg-blue-600 px-3 py-2 text-white"><MdAdd size={18} /></button>
                        </div>
                        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onSectionDragEnd}>
                            <SortableContext items={category.pageSections.map((item) => item.id)} strategy={rectSortingStrategy}>
                                <div className="space-y-3">
                                    {category.pageSections.map((item) => <SortableWrap key={item.id} id={item.id}>
                                        <button type="button" onClick={() => { setSectionId(item.id); }} className={`w-full rounded-xl border p-3 pl-10 text-left ${section?.id === item.id ? 'border-blue-500 bg-blue-50' : 'border-gray-100 bg-white'}`}>
                                            <div className="flex items-start justify-between gap-3">
                                                <div>
                                                    <div className="text-sm font-bold text-gray-900">{item.title || 'Untitled Section'}</div>
                                                    <div className="mt-1 flex flex-wrap gap-2 text-[11px] font-semibold uppercase tracking-wider text-gray-500"><span>{item.sectionKind}</span><span>{item.mediaDisplay}</span><span>{item.items.length} items</span></div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span onClick={(e) => { e.stopPropagation(); updateCategory((entry) => ({ ...entry, pageSections: entry.pageSections.map((row) => row.id === item.id ? { ...row, isActive: !row.isActive } : row) })); }} className={item.isActive ? 'text-green-600' : 'text-gray-400'}>{item.isActive ? <MdToggleOn size={26} /> : <MdToggleOff size={26} />}</span>
                                                    <span onClick={(e) => { e.stopPropagation(); updateCategory((entry) => ({ ...entry, pageSections: entry.pageSections.filter((row) => row.id !== item.id).map((row, index) => ({ ...row, order: index + 1 })) })); }} className="text-red-500"><MdDelete size={18} /></span>
                                                </div>
                                            </div>
                                        </button>
                                    </SortableWrap>)}
                                </div>
                            </SortableContext>
                        </DndContext>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                        <div className="mb-4 flex items-start justify-between gap-3">
                            <div>
                                <h2 className="text-lg font-bold text-gray-900">Section Editor</h2>
                                <p className="mt-1 text-sm text-gray-500">Dummy local state, backend payload later same shape mein jayega.</p>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                                <button
                                    type="button"
                                    onClick={handleSaveSection}
                                    disabled={!hasSelectedSection}
                                    className={`rounded-lg px-3 py-2 text-xs font-bold uppercase tracking-wide ${
                                        hasSelectedSection
                                            ? 'bg-blue-600 text-white hover:bg-blue-700'
                                            : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                    }`}
                                >
                                    Save Section
                                </button>
                                {hasSelectedSection && (
                                    <p className={`text-[11px] font-semibold ${saveMessage ? 'text-green-700' : isDirty ? 'text-amber-600' : 'text-gray-400'}`}>
                                        {saveMessage || (isDirty ? 'Unsaved changes' : 'Saved')}
                                    </p>
                                )}
                            </div>
                        </div>
                        {!hasSelectedSection ? (
                            <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-4 text-sm font-medium text-gray-600">
                                Select a section from the left panel to edit.
                            </div>
                        ) : (
                        <div className="grid gap-4 md:grid-cols-2">
                            <label className="space-y-2 text-sm font-semibold text-gray-700"><span>Heading</span><input value={section.title} onChange={(e) => updateSection({ title: e.target.value })} className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 outline-none" /></label>
                            <label className="space-y-2 text-sm font-semibold text-gray-700"><span>Paragraph</span><input value={section.description} onChange={(e) => updateSection({ description: e.target.value })} className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 outline-none" /></label>
                            <label className="space-y-2 text-sm font-semibold text-gray-700"><span>Section Kind</span><select value={section.sectionKind} onChange={(e) => updateSection({ sectionKind: e.target.value, items: [] })} className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none"><option value="image">Image</option><option value="product">Product</option></select></label>
                            <label className="space-y-2 text-sm font-semibold text-gray-700"><span>Display Mode</span><select value={section.mediaDisplay} onChange={(e) => updateSection({ mediaDisplay: e.target.value })} className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none"><option value="single">Single</option><option value="scroll">Scroll</option><option value="carousel">Carousel</option><option value="grid">Grid</option></select></label>
                            <label className="space-y-2 text-sm font-semibold text-gray-700">
                                <span>Background Type</span>
                                <select
                                    value={selectedBackgroundType}
                                    onChange={(e) => updateSection({ backgroundType: e.target.value })}
                                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none"
                                >
                                    <option value="color">Color</option>
                                    <option value="image">Image</option>
                                </select>
                            </label>
                            {selectedBackgroundType === 'color' ? (
                                <label className="space-y-2 text-sm font-semibold text-gray-700">
                                    <span>Background Color</span>
                                    <input
                                        value={section.backgroundColor}
                                        onChange={(e) => updateSection({ backgroundColor: e.target.value, backgroundImage: '' })}
                                        className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 outline-none"
                                    />
                                </label>
                            ) : (
                                <label className="space-y-2 text-sm font-semibold text-gray-700">
                                    <span>Background Image</span>
                                    <input
                                        id={`section-bg-upload-${section.id}`}
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => handleBackgroundImageUpload(e.target.files?.[0])}
                                        className="hidden"
                                    />
                                    {!section.backgroundImage && (
                                        <label
                                            htmlFor={`section-bg-upload-${section.id}`}
                                            className="inline-flex cursor-pointer items-center rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                                        >
                                            Upload background image
                                        </label>
                                    )}
                                    {section.backgroundImage ? (
                                        <div className="space-y-2">
                                            <div className="h-24 w-full overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
                                                <img src={section.backgroundImage} alt="Background preview" className="h-full w-full object-cover" />
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => updateSection({ backgroundImage: '' })}
                                                className="inline-flex items-center rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                                            >
                                                Remove image
                                            </button>
                                        </div>
                                    ) : (
                                        <p className="text-xs text-gray-500">Upload image from local system.</p>
                                    )}
                                </label>
                            )}
                            {section.showArrow && (
                                <label className="space-y-2 text-sm font-semibold text-gray-700">
                                    <span>Section Link</span>
                                    <input
                                        value={section.sectionLink}
                                        onChange={(e) => updateSection({ sectionLink: e.target.value })}
                                        className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 outline-none"
                                    />
                                </label>
                            )}
                            <div className="grid grid-cols-2 gap-3">
                                <button type="button" onClick={() => updateSection({ isActive: !section.isActive })} className={`rounded-xl border px-3 py-2.5 text-sm font-semibold ${section.isActive ? 'border-green-200 bg-green-50 text-green-700' : 'border-gray-200 bg-white text-gray-600'}`}>{section.isActive ? 'Section Active' : 'Section Inactive'}</button>
                                <button type="button" onClick={() => updateSection({ showArrow: !section.showArrow })} className={`rounded-xl border px-3 py-2.5 text-sm font-semibold ${section.showArrow ? 'border-blue-200 bg-blue-50 text-blue-700' : 'border-gray-200 bg-white text-gray-600'}`}>{section.showArrow ? 'Arrow On' : 'Arrow Off'}</button>
                            </div>
                        </div>
                        )}
                    </div>

                    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                            <div>
                                <h3 className="text-base font-bold text-gray-900">Section Items</h3>
                                <p className="mt-1 text-sm text-gray-500">Image ya product source dono same section ke andar.</p>
                            </div>
                            {!hasSelectedSection ? null : section.sectionKind === 'image' ? (
                                <button type="button" onClick={() => updateItems((items) => [...items, { id: makeId('item'), itemType: 'image', image: '', title: '', description: '', link: '' }])} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white"><MdAdd size={18} />Add Image</button>
                            ) : (
                                <button type="button" onClick={openProductPicker} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white"><MdAdd size={18} />Add Product</button>
                            )}
                        </div>
                        {!hasSelectedSection ? (
                            <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-4 text-sm font-medium text-gray-600">
                                Select a section to manage items.
                            </div>
                        ) : (
                        <>
                        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onItemDragEnd}>
                            <SortableContext items={section.items.map((item) => item.id)} strategy={rectSortingStrategy}>
                                <div className="space-y-4">
                                    {section.items.map((item, index) => {
                                        const product = item.itemType === 'product' ? (getProduct(item.productId) || item.productSnapshot) : null;
                                        return <SortableWrap key={item.id} id={item.id}>
                                            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 pl-10">
                                                <div className="mb-3 flex items-center justify-between">
                                                    <div><div className="text-sm font-bold text-gray-900">Item {index + 1}</div><div className="text-xs uppercase tracking-wider text-gray-500">{item.itemType}</div></div>
                                                    <button type="button" onClick={() => updateItems((items) => items.filter((row) => row.id !== item.id))} className="text-red-500"><MdDelete size={18} /></button>
                                                </div>
                                                {item.itemType === 'image' ? (
                                                    <div className="grid gap-3 md:grid-cols-2">
                                                        <div className="space-y-2">
                                                            <input
                                                                id={`section-item-image-${item.id}`}
                                                                type="file"
                                                                accept="image/*"
                                                                onChange={(e) => handleSectionItemImageUpload(item.id, e.target.files?.[0])}
                                                                className="hidden"
                                                            />
                                                            {!item.image && (
                                                                <label
                                                                    htmlFor={`section-item-image-${item.id}`}
                                                                    className="inline-flex cursor-pointer items-center rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                                                                >
                                                                    Upload image
                                                                </label>
                                                            )}
                                                            {item.image ? (
                                                                <div className="flex items-center gap-2">
                                                                    <div className="h-12 w-12 overflow-hidden rounded-md border border-gray-200 bg-gray-50">
                                                                        <img src={item.image} alt="Item preview" className="h-full w-full object-cover" />
                                                                    </div>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => updateSectionItem(item.id, { image: '' })}
                                                                        className="inline-flex items-center rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                                                                    >
                                                                        Remove image
                                                                    </button>
                                                                </div>
                                                            ) : (
                                                                <p className="text-xs text-gray-500">Upload image from local system.</p>
                                                            )}
                                                        </div>
                                                        <input value={item.title || ''} onChange={(e) => updateSectionItem(item.id, { title: e.target.value })} className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none" placeholder="Title" />
                                                        <input value={item.description || ''} onChange={(e) => updateSectionItem(item.id, { description: e.target.value })} className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none" placeholder="Description" />
                                                    </div>
                                                ) : (
                                                    <div className="grid gap-3 md:grid-cols-2">
                                                        <div className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-semibold text-gray-800">
                                                            {product ? product.name : 'No product selected'}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </SortableWrap>;
                                    })}
                                </div>
                            </SortableContext>
                        </DndContext>
                        </>
                        )}
                    </div>

                </div>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                    <div><h3 className="text-base font-bold text-gray-900">Dummy Preview</h3><p className="mt-1 text-sm text-gray-500">Selected section preview only.</p></div>
                    {hasSelectedSection && section.showArrow && <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-white"><MdArrowForward size={18} /></div>}
                </div>
                {!hasSelectedSection ? (
                    <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-4 text-sm font-medium text-gray-600">
                        Select a section to preview.
                    </div>
                ) : (
                <div
                    className="rounded-2xl p-4"
                    style={{
                        backgroundColor: selectedBackgroundType === 'color' ? (section.backgroundColor || '#ffffff') : '#ffffff',
                        backgroundImage: selectedBackgroundType === 'image' && section.backgroundImage ? `url(${section.backgroundImage})` : undefined,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                    }}
                >
                    {(section.title || section.description) && <div className="mb-4">{section.title && <h4 className="text-xl font-bold text-gray-900">{section.title}</h4>}{section.description && <p className="mt-1 text-sm text-gray-600">{section.description}</p>}</div>}
                    <div className={`${section.mediaDisplay === 'grid' ? 'grid grid-cols-2 gap-3 md:grid-cols-4' : section.mediaDisplay === 'single' ? 'block' : 'flex gap-3 overflow-x-auto no-scrollbar pb-1'}`}>
                                {previewItems.map((item) => {
                                    const product = item.itemType === 'product' ? (getProduct(item.productId) || item.productSnapshot) : null;
                                    const image = item.itemType === 'product' ? product?.image : item.image;
                            const title = item.title || product?.name;
                            const description = item.description || product?.subtitle;
                            return <div key={item.id} className={`${section.mediaDisplay === 'single' ? 'w-full' : section.mediaDisplay === 'grid' ? '' : 'w-[220px] shrink-0'} rounded-xl bg-white p-2 shadow-sm`}>
                                <div className="overflow-hidden rounded-xl bg-gray-100">{image ? <img src={image} alt="" className={`${section.mediaDisplay === 'single' ? 'h-[300px]' : 'h-40'} w-full object-cover`} /> : <div className={`${section.mediaDisplay === 'single' ? 'h-[300px]' : 'h-40'} w-full bg-gray-100`} />}</div>
                                {(title || description) && <div className="pt-2">{title && <div className="text-sm font-semibold text-gray-900">{title}</div>}{description && <div className="mt-1 text-xs text-gray-500">{description}</div>}</div>}
                            </div>;
                        })}
                    </div>
                </div>
                )}
            </div>
        </div>
    );
};

export default CategoryPageBuilder;
