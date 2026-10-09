import React, { useEffect, useState } from 'react';
import { MdVisibility, MdVisibilityOff, MdRefresh, MdSearch, MdClose } from 'react-icons/md';
import { toast } from 'react-hot-toast';
import API from '../../../../services/api';
import Loader from '../../../../components/common/Loader';
import { AdminTableHead, AdminTableHeaderCell, AdminTableHeaderRow } from '../../components/common/AdminTable';
import useCategoryStore from '../../store/categoryStore';
import Pagination from '../../components/common/Pagination';

const isVisible = (product) => product?.isVisible !== false;

const VisibilitySwitch = ({ on, busy, onChange, label }) => (
    <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-label={label}
        disabled={busy}
        onClick={onChange}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors ${
            on ? 'bg-green-500' : 'bg-gray-300'
        } ${busy ? 'opacity-50 cursor-wait' : 'cursor-pointer'}`}
    >
        <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${on ? 'translate-x-5' : 'translate-x-0.5'}`} />
    </button>
);

// Decides which products customers can see anywhere on the website. A hidden
// product is left out of listings, search, home sections, banners, offers and
// category pages, its page shows "currently unavailable", and it cannot be
// ordered. Existing orders are unaffected.
const ProductVisibilityManager = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [summary, setSummary] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [status, setStatus] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(20);
    const [totalPages, setTotalPages] = useState(1);
    const [totalProducts, setTotalProducts] = useState(0);
    const [selected, setSelected] = useState(() => new Set());
    const [busyIds, setBusyIds] = useState(() => new Set());

    const categories = useCategoryStore((state) => state.categories);
    const fetchCategories = useCategoryStore((state) => state.fetchCategories);

    const fetchSummary = async () => {
        try {
            const { data } = await API.get('/products/visibility/summary');
            setSummary(data);
        } catch {
            setSummary(null);
        }
    };

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const params = { pageNumber: currentPage, limit: itemsPerPage, all: 'true', lite: 'true' };
            if (selectedCategory !== 'All') params.category = selectedCategory;
            if (status !== 'all') params.visibility = status;
            const searchText = searchTerm.trim();
            if (searchText) params.search = searchText;

            const { data } = await API.get('/products', { params });
            const list = data?.products || (Array.isArray(data) ? data : []);
            setProducts(list);
            setTotalPages(data?.pages || 1);
            setTotalProducts(data?.total ?? list.length);
        } catch (error) {
            console.error('Fetch product visibility error:', error);
            toast.error(error.response?.data?.message || 'Failed to fetch products');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, [currentPage, itemsPerPage, selectedCategory, status, searchTerm]);

    useEffect(() => {
        fetchCategories();
        fetchSummary();
    }, [fetchCategories]);

    // Selection is per page; clear it when the list changes.
    useEffect(() => {
        setSelected(new Set());
    }, [currentPage, itemsPerPage, selectedCategory, status, searchTerm]);

    const applyVisibility = async (ids, nextVisible, { silent = false } = {}) => {
        if (!ids.length) return false;
        setBusyIds((prev) => new Set([...prev, ...ids]));
        try {
            await API.patch('/products/visibility', { ids, isVisible: nextVisible });
            setProducts((prev) => {
                const changed = prev.map((p) => (ids.includes(p.id) ? { ...p, isVisible: nextVisible } : p));
                // Drop rows that no longer match the status filter.
                if (status === 'visible') return changed.filter(isVisible);
                if (status === 'hidden') return changed.filter((p) => !isVisible(p));
                return changed;
            });
            fetchSummary();
            if (!silent) {
                const what = ids.length === 1 ? '1 product' : `${ids.length} products`;
                toast((t) => (
                    <span className="flex items-center gap-3 text-sm">
                        {what} {nextVisible ? 'now visible on the website' : 'hidden from the website'}
                        <button
                            type="button"
                            className="font-bold text-blue-600"
                            onClick={() => {
                                toast.dismiss(t.id);
                                applyVisibility(ids, !nextVisible, { silent: true }).then((ok) => {
                                    if (ok) {
                                        toast.success('Undone');
                                        fetchProducts();
                                    }
                                });
                            }}
                        >
                            Undo
                        </button>
                    </span>
                ), { duration: 6000 });
            }
            return true;
        } catch (error) {
            console.error('Update product visibility error:', error);
            toast.error(error.response?.data?.message || 'Failed to update visibility');
            return false;
        } finally {
            setBusyIds((prev) => {
                const next = new Set(prev);
                ids.forEach((id) => next.delete(id));
                return next;
            });
        }
    };

    const toggleOne = (product) => applyVisibility([product.id], !isVisible(product));

    const bulk = async (nextVisible) => {
        const ids = [...selected];
        const ok = await applyVisibility(ids, nextVisible);
        if (ok) setSelected(new Set());
    };

    const toggleSelected = (id) => {
        setSelected((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    };

    const allOnPageSelected = products.length > 0 && products.every((p) => selected.has(p.id));
    const toggleSelectPage = () => {
        setSelected(allOnPageSelected ? new Set() : new Set(products.map((p) => p.id)));
    };

    const handleClearFilters = () => {
        setSearchTerm('');
        setSelectedCategory('All');
        setStatus('all');
        setCurrentPage(1);
    };

    const refresh = () => {
        fetchProducts();
        fetchSummary();
    };

    const statusTabs = [
        { key: 'all', label: 'All', count: summary?.total },
        { key: 'visible', label: 'Visible', count: summary?.visible },
        { key: 'hidden', label: 'Hidden', count: summary?.hidden },
    ];

    return (
        <div className="space-y-6 max-w-7xl mx-auto p-4 md:p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                        <MdVisibility className="text-blue-600" /> Product Visibility
                    </h1>
                    <p className="text-sm text-gray-500 font-medium">
                        Hidden products disappear from the whole website (listings, search, home page, offers) and cannot be ordered.
                    </p>
                </div>
                <button
                    onClick={refresh}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-all font-bold text-sm shadow-sm self-start md:self-auto"
                >
                    <MdRefresh size={20} className={loading ? 'animate-spin' : ''} /> Refresh
                </button>
            </div>

            <div className="flex flex-wrap gap-2">
                {statusTabs.map((tab) => (
                    <button
                        key={tab.key}
                        type="button"
                        onClick={() => { setStatus(tab.key); setCurrentPage(1); }}
                        className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all ${
                            status === tab.key
                                ? 'bg-blue-600 text-white border-blue-600'
                                : 'bg-white text-gray-700 border-gray-200 hover:border-blue-300'
                        }`}
                    >
                        {tab.label}{typeof tab.count === 'number' ? ` · ${tab.count}` : ''}
                    </button>
                ))}
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                <div className="flex flex-col lg:flex-row gap-4">
                    <div className="relative flex-1">
                        <MdSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search products by name or brand..."
                            className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:border-blue-500 outline-none transition-all text-sm font-medium text-gray-900 placeholder:text-gray-500"
                            value={searchTerm}
                            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                        />
                    </div>
                    <div className="flex items-center gap-2 lg:w-56">
                        <select
                            value={selectedCategory}
                            onChange={(e) => { setSelectedCategory(e.target.value); setCurrentPage(1); }}
                            className="w-full px-3 py-2.5 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:border-blue-500 outline-none transition-all text-sm font-semibold text-gray-700 cursor-pointer"
                        >
                            <option value="All">All Categories</option>
                            {categories.map((cat) => (
                                <option key={cat.id || cat._id} value={cat.name}>{cat.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex items-center gap-2 lg:w-40">
                        <select
                            value={itemsPerPage}
                            onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                            className="w-full px-3 py-2.5 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:border-blue-500 outline-none transition-all text-sm font-semibold text-gray-700 cursor-pointer"
                        >
                            <option value={20}>20 per page</option>
                            <option value={50}>50 per page</option>
                            <option value={100}>100 per page</option>
                        </select>
                    </div>
                    {(searchTerm || selectedCategory !== 'All' || status !== 'all') && (
                        <button
                            type="button"
                            onClick={handleClearFilters}
                            className="flex items-center justify-center gap-1.5 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl transition-all font-bold text-sm border border-red-100"
                        >
                            <MdClose size={18} /> Clear
                        </button>
                    )}
                </div>

                {selected.size > 0 && (
                    <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-gray-100">
                        <span className="text-sm font-bold text-gray-700">{selected.size} selected</span>
                        <button
                            type="button"
                            onClick={() => bulk(false)}
                            className="flex items-center gap-1.5 px-4 py-2 bg-gray-800 hover:bg-gray-900 text-white rounded-xl font-bold text-sm"
                        >
                            <MdVisibilityOff size={18} /> Hide selected
                        </button>
                        <button
                            type="button"
                            onClick={() => bulk(true)}
                            className="flex items-center gap-1.5 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold text-sm"
                        >
                            <MdVisibility size={18} /> Show selected
                        </button>
                        <button type="button" onClick={() => setSelected(new Set())} className="text-sm font-bold text-gray-500">
                            Clear selection
                        </button>
                    </div>
                )}
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden min-h-[300px] flex flex-col justify-between">
                <div className="overflow-x-auto flex-1">
                    <table className="w-full text-left border-collapse">
                        <AdminTableHead>
                            <AdminTableHeaderRow>
                                <AdminTableHeaderCell compact className="w-10">
                                    <input
                                        type="checkbox"
                                        aria-label="Select all on this page"
                                        checked={allOnPageSelected}
                                        onChange={toggleSelectPage}
                                        className="h-4 w-4 cursor-pointer"
                                    />
                                </AdminTableHeaderCell>
                                <AdminTableHeaderCell compact>Product</AdminTableHeaderCell>
                                <AdminTableHeaderCell compact>Category</AdminTableHeaderCell>
                                <AdminTableHeaderCell compact className="text-right">Price</AdminTableHeaderCell>
                                <AdminTableHeaderCell compact className="text-center">Stock</AdminTableHeaderCell>
                                <AdminTableHeaderCell compact className="text-center">On website</AdminTableHeaderCell>
                            </AdminTableHeaderRow>
                        </AdminTableHead>
                        <tbody className="divide-y divide-gray-200">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="py-20 text-center">
                                        <Loader message="Loading products..." />
                                    </td>
                                </tr>
                            ) : (
                                products.map((product) => {
                                    const visible = isVisible(product);
                                    return (
                                        <tr key={product.id} className={`transition-colors ${visible ? 'hover:bg-blue-50/10' : 'bg-gray-50/80'}`}>
                                            <td className="px-4 py-3.5">
                                                <input
                                                    type="checkbox"
                                                    aria-label={`Select ${product.name}`}
                                                    checked={selected.has(product.id)}
                                                    onChange={() => toggleSelected(product.id)}
                                                    className="h-4 w-4 cursor-pointer"
                                                />
                                            </td>
                                            <td className="px-4 py-3.5">
                                                <div className={`flex items-center gap-3 ${visible ? '' : 'opacity-60'}`}>
                                                    <div className="h-10 w-10 rounded-lg bg-gray-50 border border-gray-100 overflow-hidden flex-shrink-0">
                                                        <img src={product.image} className="w-full h-full object-contain p-1" alt="" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <h4 className="text-sm font-black text-gray-800 truncate max-w-[260px]">{product.name}</h4>
                                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.14em]">{product.brand || 'No Brand'}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3.5">
                                                <span className="inline-flex text-[11px] font-bold text-gray-600 px-2 py-1 bg-gray-100 rounded-md">
                                                    {product.category}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3.5 text-right text-sm font-bold text-gray-800">
                                                ₹{Number(product.price || 0).toLocaleString('en-IN')}
                                            </td>
                                            <td className="px-4 py-3.5 text-center text-sm font-black text-blue-600">
                                                {Number(product.stock) || 0}
                                            </td>
                                            <td className="px-4 py-3.5">
                                                <div className="flex items-center justify-center gap-2">
                                                    <VisibilitySwitch
                                                        on={visible}
                                                        busy={busyIds.has(product.id)}
                                                        onChange={() => toggleOne(product)}
                                                        label={`${visible ? 'Hide' : 'Show'} ${product.name}`}
                                                    />
                                                    <span className={`text-[11px] font-bold uppercase w-14 ${visible ? 'text-green-600' : 'text-gray-500'}`}>
                                                        {visible ? 'Visible' : 'Hidden'}
                                                    </span>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
                {!loading && products.length > 0 && (
                    <p className="px-4 pt-3 text-xs font-semibold text-gray-400">{totalProducts} products</p>
                )}
                {totalPages > 1 && !loading && (
                    <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={(page) => setCurrentPage(page)} />
                )}
                {!loading && products.length === 0 && (
                    <div className="p-20 text-center">
                        <p className="text-gray-900 font-black tracking-tight">No products found</p>
                        <p className="text-sm text-gray-500 font-medium">Try adjusting your search or filters</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProductVisibilityManager;
