import React, { useEffect, useState } from 'react';
import { MdInventory, MdRefresh, MdSave, MdSearch } from 'react-icons/md';
import { toast } from 'react-hot-toast';
import API from '../../../../services/api';
import Loader from '../../../../components/common/Loader';
import { AdminTableHead, AdminTableHeaderCell, AdminTableHeaderRow } from '../../components/common/AdminTable';

const normalizeSearchValue = (value = '') => String(value).toLowerCase().replace(/\s+/g, '');

const MaxSellingQuantityManager = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [editingLimits, setEditingLimits] = useState({});

    const fetchProducts = async (showToast = false) => {
        try {
            setLoading(true);
            const { data } = await API.get('/products?all=true');
            setProducts(Array.isArray(data) ? data : []);
            if (showToast) toast.success('Product limits synced successfully');
        } catch (error) {
            console.error('Fetch max quantity products error:', error);
            toast.error('Failed to fetch products');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    const handleRefresh = () => {
        setSearchTerm('');
        setEditingLimits({});
        fetchProducts(true);
    };

    const handleLimitChange = (productId, value) => {
        setEditingLimits((prev) => ({
            ...prev,
            [productId]: value
        }));
    };

    const updateLimit = async (product) => {
        const rawValue = editingLimits[product.id];
        const normalizedValue = Math.max(1, Number(rawValue) || 1);

        try {
            toast.loading('Updating max quantity...', { id: `max-order-qty-${product.id}` });
            const { data } = await API.put(`/products/${product.id}/stock`, {
                maxOrderQuantity: normalizedValue
            });

            setProducts((prev) => prev.map((item) => (
                item.id === product.id ? { ...item, maxOrderQuantity: data.maxOrderQuantity } : item
            )));

            setEditingLimits((prev) => {
                const next = { ...prev };
                delete next[product.id];
                return next;
            });

            toast.success('Max quantity updated', { id: `max-order-qty-${product.id}` });
        } catch (error) {
            console.error('Update max quantity error:', error);
            toast.error(error.response?.data?.message || 'Failed to update max quantity', { id: `max-order-qty-${product.id}` });
        }
    };

    const normalizedSearchTerm = normalizeSearchValue(searchTerm);
    const filteredProducts = products.filter((product) =>
        normalizeSearchValue(product.name).includes(normalizedSearchTerm)
        || normalizeSearchValue(product.brand).includes(normalizedSearchTerm)
    );

    if (loading && products.length === 0) {
        return <Loader fullPage message="Fetching max quantity rules..." />;
    }

    return (
        <div className="space-y-6 max-w-7xl mx-auto p-4 md:p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                        <MdInventory className="text-blue-600" /> Max Selling Quantity
                    </h1>
                    <p className="text-sm text-gray-500 font-medium">Set the maximum quantity a user can buy per product</p>
                </div>
                <button
                    onClick={handleRefresh}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-all font-bold text-sm shadow-sm"
                >
                    <MdRefresh size={20} className={loading ? 'animate-spin' : ''} /> Refresh
                </button>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                <div className="relative">
                    <MdSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search products by name or brand..."
                        className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:border-blue-500 outline-none transition-all text-sm font-medium text-gray-900 placeholder:text-gray-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <AdminTableHead>
                            <AdminTableHeaderRow>
                                <AdminTableHeaderCell compact>Product Info</AdminTableHeaderCell>
                                <AdminTableHeaderCell compact>Category</AdminTableHeaderCell>
                                <AdminTableHeaderCell compact className="text-center">Stock</AdminTableHeaderCell>
                                <AdminTableHeaderCell compact className="text-center">Max Qty</AdminTableHeaderCell>
                                <AdminTableHeaderCell compact className="text-right">Actions</AdminTableHeaderCell>
                            </AdminTableHeaderRow>
                        </AdminTableHead>
                        <tbody className="divide-y divide-gray-200">
                            {filteredProducts.map((product) => {
                                const draftValue = editingLimits[product.id];
                                const effectiveValue = draftValue ?? product.maxOrderQuantity ?? 1;

                                return (
                                    <tr key={product.id} className="hover:bg-blue-50/10 transition-colors">
                                        <td className="px-4 py-3.5">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-lg bg-gray-50 border border-gray-100 overflow-hidden flex-shrink-0">
                                                    <img src={product.image} className="w-full h-full object-contain p-1" alt="" />
                                                </div>
                                                <div className="min-w-0">
                                                    <h4 className="text-sm font-black text-gray-800 truncate max-w-[240px]">{product.name}</h4>
                                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.14em]">{product.brand || 'No Brand'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3.5">
                                            <span className="inline-flex text-[11px] font-bold text-gray-600 px-2 py-1 bg-gray-100 rounded-md">
                                                {product.category}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3.5 text-center">
                                            <span className="text-sm font-black text-blue-600">{Number(product.stock) || 0}</span>
                                        </td>
                                        <td className="px-4 py-3.5 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={effectiveValue}
                                                    onChange={(e) => handleLimitChange(product.id, e.target.value)}
                                                    className="w-24 px-2 py-1.5 text-center rounded-lg border-2 bg-white border-blue-100 focus:border-blue-500 text-gray-900 font-black text-sm transition-all outline-none"
                                                />
                                            </div>
                                            <p className="mt-1 text-[10px] text-gray-400 font-semibold uppercase">
                                                Default is 1
                                            </p>
                                        </td>
                                        <td className="px-4 py-3.5 text-right">
                                            <button
                                                onClick={() => updateLimit(product)}
                                                disabled={draftValue === undefined}
                                                className={`p-2 rounded-lg transition-all shadow-sm border ${
                                                    draftValue !== undefined
                                                        ? 'bg-blue-600 text-white border-blue-700 hover:scale-105 active:scale-95'
                                                        : 'bg-gray-50 text-gray-300 border-transparent cursor-not-allowed'
                                                }`}
                                                title="Save max quantity"
                                            >
                                                <MdSave size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {filteredProducts.length === 0 && (
                    <div className="p-20 text-center space-y-4">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto">
                            <MdSearch size={32} className="text-gray-300" />
                        </div>
                        <div>
                            <p className="text-gray-900 font-black tracking-tight">No products found</p>
                            <p className="text-sm text-gray-500 font-medium">Try adjusting your search terms</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MaxSellingQuantityManager;
