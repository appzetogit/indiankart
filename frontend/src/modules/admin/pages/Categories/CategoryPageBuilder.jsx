import React, { useMemo, useState } from 'react';
import { MdAdd, MdArrowForward, MdDelete, MdDragIndicator, MdToggleOff, MdToggleOn } from 'react-icons/md';
import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, arrayMove, rectSortingStrategy, sortableKeyboardCoordinates, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const makeId = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
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
            sectionLink: '/category/Electronics/Laptops', showArrow: true, backgroundColor: '#ffffff', backgroundImage: '', mediaDisplay: 'carousel',
            items: [
                { id: 'img-1', itemType: 'image', image: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1200&q=80', title: '', description: '', link: '' },
                { id: 'img-2', itemType: 'image', image: 'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?auto=format&fit=crop&w=1200&q=80', title: '', description: '', link: '' }
            ]
        },
        {
            id: 'sec-2', sectionKind: 'product', isActive: true, order: 2, title: 'Best Gadgets', description: 'Products in same section container',
            sectionLink: '', showArrow: false, backgroundColor: '#f8fafc', backgroundImage: '', mediaDisplay: 'scroll',
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
    const [catalog, setCatalog] = useState(dummyCatalog);
    const [categoryId, setCategoryId] = useState(dummyCatalog[0].id);
    const [sectionId, setSectionId] = useState(dummyCatalog[0].pageSections[0].id);
    const [newStripId, setNewStripId] = useState('');
    const [newProductId, setNewProductId] = useState('');
    const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

    const category = useMemo(() => catalog.find((item) => item.id === categoryId) || catalog[0], [catalog, categoryId]);
    const section = category.pageSections.find((item) => item.id === sectionId) || category.pageSections[0];
    const getSub = (id) => category.subCategories.find((item) => item.id === id);
    const getProduct = (id) => category.products.find((item) => item.id === id);

    const updateCategory = (updater) => setCatalog((prev) => prev.map((item) => item.id === categoryId ? updater(item) : item));
    const updateSection = (updates) => updateCategory((item) => ({ ...item, pageSections: item.pageSections.map((entry) => entry.id === section.id ? { ...entry, ...updates } : entry) }));
    const updateItems = (updater) => updateCategory((item) => ({ ...item, pageSections: item.pageSections.map((entry) => entry.id === section.id ? { ...entry, items: updater(entry.items) } : entry) }));
    const updateSectionItem = (itemId, updates) => updateItems((items) => items.map((entry) => entry.id === itemId ? { ...entry, ...updates } : entry));

    const onStripDragEnd = ({ active, over }) => {
        if (!over || active.id === over.id) return;
        updateCategory((item) => {
            const oldIndex = item.categoryStrip.items.findIndex((entry) => entry.id === active.id);
            const newIndex = item.categoryStrip.items.findIndex((entry) => entry.id === over.id);
            return { ...item, categoryStrip: { ...item.categoryStrip, items: arrayMove(item.categoryStrip.items, oldIndex, newIndex).map((entry, index) => ({ ...entry, order: index + 1 })) } };
        });
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
        if (!over || active.id === over.id) return;
        updateItems((items) => {
            const oldIndex = items.findIndex((entry) => entry.id === active.id);
            const newIndex = items.findIndex((entry) => entry.id === over.id);
            return arrayMove(items, oldIndex, newIndex);
        });
    };

    const previewItems = section.mediaDisplay === 'single' ? section.items.slice(0, 1) : section.items;

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Category Page Builder</h1>
                    <p className="text-sm text-gray-500">Frontend-only dummy admin page. Backend later step by step.</p>
                </div>
                <div className="flex items-center gap-3">
                    <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 outline-none">
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
                                <h2 className="text-sm font-black uppercase tracking-widest text-gray-800">Category Strip</h2>
                                <p className="mt-1 text-xs text-gray-500">Subcategories backend se aayengi later</p>
                            </div>
                            <button type="button" onClick={() => updateCategory((item) => ({ ...item, categoryStrip: { ...item.categoryStrip, isActive: !item.categoryStrip.isActive } }))} className={category.categoryStrip.isActive ? 'text-blue-600' : 'text-gray-400'}>
                                {category.categoryStrip.isActive ? <MdToggleOn size={28} /> : <MdToggleOff size={28} />}
                            </button>
                        </div>
                        <div className="mb-3 flex gap-2">
                            <select value={newStripId} onChange={(e) => setNewStripId(e.target.value)} className="flex-1 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none">
                                <option value="">Add subcategory</option>
                                {category.subCategories.filter((sub) => !category.categoryStrip.items.some((item) => item.subCategoryId === sub.id)).map((sub) => <option key={sub.id} value={sub.id}>{sub.name}</option>)}
                            </select>
                            <button type="button" onClick={() => {
                                if (!newStripId) return;
                                updateCategory((item) => ({ ...item, categoryStrip: { ...item.categoryStrip, items: [...item.categoryStrip.items, { id: makeId('strip'), subCategoryId: newStripId, isActive: true, order: item.categoryStrip.items.length + 1 }] } }));
                                setNewStripId('');
                            }} className="rounded-xl bg-blue-600 px-3 py-2 text-white"><MdAdd size={18} /></button>
                        </div>
                        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onStripDragEnd}>
                            <SortableContext items={category.categoryStrip.items.map((item) => item.id)} strategy={rectSortingStrategy}>
                                <div className="space-y-3">
                                    {category.categoryStrip.items.map((item) => {
                                        const sub = getSub(item.subCategoryId);
                                        return <SortableWrap key={item.id} id={item.id}>
                                            <div className="rounded-xl border border-gray-100 bg-gray-50 p-3 pl-10">
                                                <div className="flex items-center justify-between gap-3">
                                                    <div className="flex items-center gap-3">
                                                        <img src={sub?.image} alt={sub?.name} className="h-12 w-12 rounded-xl object-cover" />
                                                        <div>
                                                            <div className="text-sm font-bold text-gray-900">{sub?.name}</div>
                                                            <div className="text-xs text-gray-500">Order {item.order}</div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <button type="button" onClick={() => updateCategory((entry) => ({ ...entry, categoryStrip: { ...entry.categoryStrip, items: entry.categoryStrip.items.map((row) => row.id === item.id ? { ...row, isActive: !row.isActive } : row) } }))} className={item.isActive ? 'text-green-600' : 'text-gray-400'}>{item.isActive ? <MdToggleOn size={26} /> : <MdToggleOff size={26} />}</button>
                                                        <button type="button" onClick={() => updateCategory((entry) => ({ ...entry, categoryStrip: { ...entry.categoryStrip, items: entry.categoryStrip.items.filter((row) => row.id !== item.id).map((row, index) => ({ ...row, order: index + 1 })) } }))} className="text-red-500"><MdDelete size={18} /></button>
                                                    </div>
                                                </div>
                                            </div>
                                        </SortableWrap>;
                                    })}
                                </div>
                            </SortableContext>
                        </DndContext>
                    </div>

                    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                        <div className="mb-4 flex items-center justify-between">
                            <div>
                                <h2 className="text-sm font-black uppercase tracking-widest text-gray-800">Page Sections</h2>
                                <p className="mt-1 text-xs text-gray-500">One reusable section container</p>
                            </div>
                            <button type="button" onClick={() => {
                                const next = { id: makeId('sec'), sectionKind: 'image', isActive: true, order: category.pageSections.length + 1, title: 'New Section', description: '', sectionLink: '', showArrow: false, backgroundColor: '#ffffff', backgroundImage: '', mediaDisplay: 'single', items: [] };
                                updateCategory((item) => ({ ...item, pageSections: [...item.pageSections, next] }));
                                setSectionId(next.id);
                            }} className="rounded-xl bg-blue-600 px-3 py-2 text-white"><MdAdd size={18} /></button>
                        </div>
                        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onSectionDragEnd}>
                            <SortableContext items={category.pageSections.map((item) => item.id)} strategy={rectSortingStrategy}>
                                <div className="space-y-3">
                                    {category.pageSections.map((item) => <SortableWrap key={item.id} id={item.id}>
                                        <button type="button" onClick={() => setSectionId(item.id)} className={`w-full rounded-xl border p-3 pl-10 text-left ${section.id === item.id ? 'border-blue-500 bg-blue-50' : 'border-gray-100 bg-white'}`}>
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
                        <div className="mb-4">
                            <h2 className="text-lg font-bold text-gray-900">Section Editor</h2>
                            <p className="mt-1 text-sm text-gray-500">Dummy local state, backend payload later same shape mein jayega.</p>
                        </div>
                        <div className="grid gap-4 md:grid-cols-2">
                            <label className="space-y-2 text-sm font-semibold text-gray-700"><span>Heading</span><input value={section.title} onChange={(e) => updateSection({ title: e.target.value })} className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 outline-none" /></label>
                            <label className="space-y-2 text-sm font-semibold text-gray-700"><span>Paragraph</span><input value={section.description} onChange={(e) => updateSection({ description: e.target.value })} className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 outline-none" /></label>
                            <label className="space-y-2 text-sm font-semibold text-gray-700"><span>Section Kind</span><select value={section.sectionKind} onChange={(e) => updateSection({ sectionKind: e.target.value, items: [] })} className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none"><option value="image">Image</option><option value="product">Product</option></select></label>
                            <label className="space-y-2 text-sm font-semibold text-gray-700"><span>Display Mode</span><select value={section.mediaDisplay} onChange={(e) => updateSection({ mediaDisplay: e.target.value })} className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none"><option value="single">Single</option><option value="scroll">Scroll</option><option value="carousel">Carousel</option><option value="grid">Grid</option></select></label>
                            <label className="space-y-2 text-sm font-semibold text-gray-700"><span>Background Color</span><input value={section.backgroundColor} onChange={(e) => updateSection({ backgroundColor: e.target.value })} className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 outline-none" /></label>
                            <label className="space-y-2 text-sm font-semibold text-gray-700"><span>Background Image</span><input value={section.backgroundImage} onChange={(e) => updateSection({ backgroundImage: e.target.value })} className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 outline-none" /></label>
                            <label className="space-y-2 text-sm font-semibold text-gray-700"><span>Section Link</span><input value={section.sectionLink} onChange={(e) => updateSection({ sectionLink: e.target.value })} className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 outline-none" /></label>
                            <div className="grid grid-cols-2 gap-3">
                                <button type="button" onClick={() => updateSection({ isActive: !section.isActive })} className={`rounded-xl border px-3 py-2.5 text-sm font-semibold ${section.isActive ? 'border-green-200 bg-green-50 text-green-700' : 'border-gray-200 bg-white text-gray-600'}`}>{section.isActive ? 'Section Active' : 'Section Inactive'}</button>
                                <button type="button" onClick={() => updateSection({ showArrow: !section.showArrow })} className={`rounded-xl border px-3 py-2.5 text-sm font-semibold ${section.showArrow ? 'border-blue-200 bg-blue-50 text-blue-700' : 'border-gray-200 bg-white text-gray-600'}`}>{section.showArrow ? 'Arrow On' : 'Arrow Off'}</button>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                            <div>
                                <h3 className="text-base font-bold text-gray-900">Section Items</h3>
                                <p className="mt-1 text-sm text-gray-500">Image ya product source dono same section ke andar.</p>
                            </div>
                            {section.sectionKind === 'image' ? (
                                <button type="button" onClick={() => updateItems((items) => [...items, { id: makeId('item'), itemType: 'image', image: '', title: '', description: '', link: '' }])} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white"><MdAdd size={18} />Add Image</button>
                            ) : (
                                <div className="flex gap-2">
                                    <select value={newProductId} onChange={(e) => setNewProductId(e.target.value)} className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none">
                                        <option value="">Select product</option>
                                        {category.products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}
                                    </select>
                                    <button type="button" onClick={() => { if (!newProductId) return; updateItems((items) => [...items, { id: makeId('item'), itemType: 'product', productId: newProductId, title: '', description: '', link: '' }]); setNewProductId(''); }} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white"><MdAdd size={18} />Add Product</button>
                                </div>
                            )}
                        </div>
                        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onItemDragEnd}>
                            <SortableContext items={section.items.map((item) => item.id)} strategy={rectSortingStrategy}>
                                <div className="space-y-4">
                                    {section.items.map((item, index) => {
                                        const product = item.itemType === 'product' ? getProduct(item.productId) : null;
                                        return <SortableWrap key={item.id} id={item.id}>
                                            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 pl-10">
                                                <div className="mb-3 flex items-center justify-between">
                                                    <div><div className="text-sm font-bold text-gray-900">Item {index + 1}</div><div className="text-xs uppercase tracking-wider text-gray-500">{item.itemType}</div></div>
                                                    <button type="button" onClick={() => updateItems((items) => items.filter((row) => row.id !== item.id))} className="text-red-500"><MdDelete size={18} /></button>
                                                </div>
                                                {item.itemType === 'image' ? (
                                                    <div className="grid gap-3 md:grid-cols-2">
                                                        <input value={item.image || ''} onChange={(e) => updateSectionItem(item.id, { image: e.target.value })} className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none" placeholder="Web image URL" />
                                                        <input value={item.title || ''} onChange={(e) => updateSectionItem(item.id, { title: e.target.value })} className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none" placeholder="Title" />
                                                        <input value={item.description || ''} onChange={(e) => updateSectionItem(item.id, { description: e.target.value })} className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none" placeholder="Description" />
                                                        <input value={item.link || ''} onChange={(e) => updateSectionItem(item.id, { link: e.target.value })} className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none" placeholder="Link" />
                                                    </div>
                                                ) : (
                                                    <div className="grid gap-3 md:grid-cols-2">
                                                        <select value={item.productId || ''} onChange={(e) => updateSectionItem(item.id, { productId: e.target.value })} className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none">
                                                            <option value="">Select product</option>
                                                            {category.products.map((productOption) => <option key={productOption.id} value={productOption.id}>{productOption.name}</option>)}
                                                        </select>
                                                        <div className="rounded-xl border border-dashed border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-500">{product ? `Default: ${product.name}` : 'No product selected'}</div>
                                                        <input value={item.title || ''} onChange={(e) => updateSectionItem(item.id, { title: e.target.value })} className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none" placeholder="Title override" />
                                                        <input value={item.description || ''} onChange={(e) => updateSectionItem(item.id, { description: e.target.value })} className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none" placeholder="Description override" />
                                                    </div>
                                                )}
                                            </div>
                                        </SortableWrap>;
                                    })}
                                </div>
                            </SortableContext>
                        </DndContext>
                    </div>

                    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                        <div className="mb-4 flex items-center justify-between">
                            <div><h3 className="text-base font-bold text-gray-900">Dummy Preview</h3><p className="mt-1 text-sm text-gray-500">Selected section preview only.</p></div>
                            {section.showArrow && <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-white"><MdArrowForward size={18} /></div>}
                        </div>
                        <div className="rounded-2xl p-4" style={{ backgroundColor: section.backgroundColor || '#ffffff', backgroundImage: section.backgroundImage ? `url(${section.backgroundImage})` : undefined, backgroundSize: 'cover', backgroundPosition: 'center' }}>
                            {(section.title || section.description) && <div className="mb-4">{section.title && <h4 className="text-xl font-bold text-gray-900">{section.title}</h4>}{section.description && <p className="mt-1 text-sm text-gray-600">{section.description}</p>}</div>}
                            <div className={`${section.mediaDisplay === 'grid' ? 'grid grid-cols-2 gap-3 md:grid-cols-4' : 'flex gap-3 overflow-x-auto no-scrollbar pb-1'}`}>
                                {previewItems.map((item) => {
                                    const product = item.itemType === 'product' ? getProduct(item.productId) : null;
                                    const image = item.itemType === 'product' ? product?.image : item.image;
                                    const title = item.title || product?.name;
                                    const description = item.description || product?.subtitle;
                                    return <div key={item.id} className={`${section.mediaDisplay === 'single' ? 'w-full' : section.mediaDisplay === 'grid' ? '' : 'w-[220px] shrink-0'} rounded-xl bg-white p-2 shadow-sm`}>
                                        <div className="overflow-hidden rounded-xl bg-gray-100">{image ? <img src={image} alt="" className={`${section.mediaDisplay === 'single' ? 'max-h-[280px]' : 'h-40'} w-full object-cover`} /> : <div className="h-40 w-full bg-gray-100" />}</div>
                                        {(title || description) && <div className="pt-2">{title && <div className="text-sm font-semibold text-gray-900">{title}</div>}{description && <div className="mt-1 text-xs text-gray-500">{description}</div>}</div>}
                                    </div>;
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CategoryPageBuilder;
