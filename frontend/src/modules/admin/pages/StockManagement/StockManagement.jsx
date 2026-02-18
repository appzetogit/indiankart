import React, { useState, useEffect } from 'react';
import { MdSearch, MdInventory, MdExpandMore, MdExpandLess, MdSave, MdRefresh } from 'react-icons/md';
import API from '../../../../services/api';
import { toast } from 'react-hot-toast';
import Loader from '../../../../components/common/Loader';

const StockManagement = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedProduct, setExpandedProduct] = useState(null);
    const [editingStock, setEditingStock] = useState({}); // { productId: value, "productId-skuIndex": value }

    const fetchProducts = async (showToast = false) => {
        try {
            setLoading(true);
            const { data } = await API.get('/products?all=true');
            setProducts(data);
            if (showToast) toast.success('Inventory synced successfully');
        } catch (error) {
            console.error('Fetch products error:', error);
            toast.error('Failed to fetch products');
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = () => {
        setSearchTerm('');
        setEditingStock({});
        setExpandedProduct(null);
        fetchProducts(true);
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    const handleStockChange = (id, value) => {
        setEditingStock(prev => ({ ...prev, [id]: value }));
    };

    const updateStock = async (product, isSku = false, skuIndex = null) => {
        try {
            const editKey = isSku ? `${product.id}-${skuIndex}` : product.id;
            const newValue = editingStock[editKey];

            if (newValue === undefined || newValue === "") {
                toast.error('Please enter a valid stock number');
                return;
            }

            const payload = {};
            if (isSku) {
                const updatedSkus = [...product.skus];
                updatedSkus[skuIndex] = { ...updatedSkus[skuIndex], stock: Number(newValue) };
                payload.skus = updatedSkus;
            } else {
                payload.stock = Number(newValue);
            }

            toast.loading('Updating stock...', { id: 'update-stock' });
            await API.put(`/products/${product.id}/stock`, payload);
            toast.success('Stock updated successfully!', { id: 'update-stock' });

            // Update local state instead of full refetch for better UX
            setProducts(prev => prev.map(p => {
                if (p.id === product.id) {
                    return { ...p, ...(isSku ? { skus: payload.skus } : { stock: payload.stock }) };
                }
                return p;
            }));

            // Clear editing state for this item
            const newEditing = { ...editingStock };
            delete newEditing[editKey];
            setEditingStock(newEditing);

        } catch (error) {
            console.error('Update stock error:', error);
            toast.error(error.response?.data?.message || 'Failed to update stock', { id: 'update-stock' });
        }
    };

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.brand?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading && products.length === 0) return <Loader fullPage message="Fetching inventory..." />;

    return (
        <div className="space-y-6 max-w-7xl mx-auto p-4 md:p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                        <MdInventory className="text-blue-600" /> Stock Management
                    </h1>
                    <p className="text-sm text-gray-500 font-medium">Update inventory levels for products and variants</p>
                </div>
                <button
                    onClick={handleRefresh}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-all font-bold text-sm shadow-sm"
                >
                    <MdRefresh size={20} className={loading ? 'animate-spin' : ''} /> Refresh
                </button>
            </div>

            {/* Controls */}
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

            {/* Product List */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-100">
                                <th className="px-6 py-4 text-[10px] md:text-xs font-black text-gray-900 uppercase tracking-widest">Product Info</th>
                                <th className="px-6 py-4 text-[10px] md:text-xs font-black text-gray-900 uppercase tracking-widest">Category</th>
                                <th className="px-6 py-4 text-[10px] md:text-xs font-black text-gray-900 uppercase tracking-widest text-center">Variants</th>
                                <th className="px-6 py-4 text-[10px] md:text-xs font-black text-gray-900 uppercase tracking-widest text-center">Remaining Stock</th>
                                <th className="px-6 py-4 text-[10px] md:text-xs font-black text-gray-900 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredProducts.map(product => (
                                <React.Fragment key={product.id}>
                                    <tr className={`hover:bg-blue-50/10 transition-colors group ${expandedProduct === product.id ? 'bg-blue-50/30' : ''}`}>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-xl bg-gray-50 border border-gray-100 overflow-hidden flex-shrink-0">
                                                    <img src={product.image} className="w-full h-full object-contain p-1" alt="" />
                                                </div>
                                                <div className="min-w-0">
                                                    <h4 className="text-sm font-black text-gray-800 truncate max-w-[250px]">{product.name}</h4>
                                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">{product.brand || 'No Brand'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className="text-xs font-bold text-gray-600 px-2 py-1 bg-gray-100 rounded-md">
                                                {product.category}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5 text-center">
                                            {product.skus && product.skus.length > 0 ? (
                                                <button
                                                    onClick={() => setExpandedProduct(expandedProduct === product.id ? null : product.id)}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-tighter hover:bg-blue-100 transition-all border border-blue-100 shadow-sm"
                                                >
                                                    {product.skus.length} variants
                                                    {expandedProduct === product.id ? <MdExpandLess /> : <MdExpandMore />}
                                                </button>
                                            ) : (
                                                <span className="text-[10px] font-black text-gray-300 uppercase italic tracking-widest">No Variants</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center justify-center gap-3">
                                                <input
                                                    type="number"
                                                    disabled={product.skus && product.skus.length > 0}
                                                    className={`w-20 px-3 py-2 text-center rounded-xl border-2 font-black text-sm transition-all outline-none ${product.skus && product.skus.length > 0
                                                            ? 'bg-gray-100 border-transparent text-gray-400 cursor-not-allowed'
                                                            : 'bg-white border-blue-50 focus:border-blue-500 text-gray-900 group-hover:shadow-lg'
                                                        }`}
                                                    value={
                                                        editingStock[product.id] ??
                                                        (product.skus && product.skus.length > 0
                                                            ? product.skus.reduce((acc, s) => acc + (Number(s.stock) || 0), 0)
                                                            : product.stock)
                                                    }
                                                    onChange={(e) => handleStockChange(product.id, e.target.value)}
                                                />
                                                {product.stock <= 5 && !product.skus?.length && (
                                                    <span className="flex h-2 w-2 rounded-full bg-red-500 animate-ping"></span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            {(!product.skus || product.skus.length === 0) && (
                                                <button
                                                    onClick={() => updateStock(product)}
                                                    disabled={editingStock[product.id] === undefined}
                                                    className={`p-2 rounded-xl transition-all shadow-sm border ${editingStock[product.id] !== undefined
                                                            ? 'bg-blue-600 text-white border-blue-700 hover:scale-105 active:scale-95'
                                                            : 'bg-gray-50 text-gray-300 border-transparent cursor-not-allowed'
                                                        }`}
                                                >
                                                    <MdSave size={20} />
                                                </button>
                                            )}
                                        </td>
                                    </tr>

                                    {/* Variant Rows */}
                                    {expandedProduct === product.id && product.skus?.map((sku, idx) => (
                                        <tr key={`${product.id}-${idx}`} className="bg-gray-50/80 animate-in slide-in-from-top-2 duration-300 border-l-4 border-blue-500">
                                            <td className="pl-16 pr-6 py-4" colSpan={2}>
                                                <div className="flex items-center gap-3">
                                                    <div className="flex gap-2">
                                                        {Object.entries(sku.combination).map(([key, value]) => (
                                                            <div key={key} className="flex flex-col">
                                                                <span className="text-[10px] font-bold text-gray-400 leading-none mb-1">{key}</span>
                                                                <span className="text-xs font-black text-gray-700 bg-white px-2 py-0.5 rounded border border-gray-100">{value}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </td>
                                            <td></td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-center gap-3">
                                                    <input
                                                        type="number"
                                                        className="w-20 px-3 py-2 text-center rounded-xl border-2 bg-white border-blue-100 focus:border-blue-500 text-gray-900 font-black text-sm transition-all outline-none"
                                                        value={editingStock[`${product.id}-${idx}`] ?? sku.stock}
                                                        onChange={(e) => handleStockChange(`${product.id}-${idx}`, e.target.value)}
                                                    />
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => updateStock(product, true, idx)}
                                                    disabled={editingStock[`${product.id}-${idx}`] === undefined}
                                                    className={`p-2 rounded-xl transition-all shadow-sm border ${editingStock[`${product.id}-${idx}`] !== undefined
                                                            ? 'bg-blue-600 text-white border-blue-700 hover:scale-105 active:scale-95'
                                                            : 'bg-gray-50 text-gray-300 border-transparent cursor-not-allowed'
                                                        }`}
                                                >
                                                    <MdSave size={20} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </React.Fragment>
                            ))}
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

export default StockManagement;
