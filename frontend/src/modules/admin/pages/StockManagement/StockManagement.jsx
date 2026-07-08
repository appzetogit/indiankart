import React, { useState, useEffect } from 'react';
import { MdSearch, MdInventory, MdExpandMore, MdExpandLess, MdSave, MdRefresh, MdFileDownload, MdFileUpload, MdClose, MdCheckCircle, MdWarning } from 'react-icons/md';
import API from '../../../../services/api';
import { toast } from 'react-hot-toast';
import Loader from '../../../../components/common/Loader';
import { AdminTableHead, AdminTableHeaderCell, AdminTableHeaderRow } from '../../components/common/AdminTable';
import { getAdminListCache, setAdminListCache } from '../../utils/adminListCache';

const STOCK_PRODUCTS_CACHE_KEY = 'admin-products:stock-lite';

const StockManagement = () => {
    const [products, setProducts] = useState(() => getAdminListCache(STOCK_PRODUCTS_CACHE_KEY) || []);
    const [loading, setLoading] = useState(() => !getAdminListCache(STOCK_PRODUCTS_CACHE_KEY));
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedProduct, setExpandedProduct] = useState(null);
    const [editingStock, setEditingStock] = useState({}); // { productId: value, "productId-skuIndex": value }
    const [exporting, setExporting] = useState(false);
    const [importing, setImporting] = useState(false);
    const [importResult, setImportResult] = useState(null);
    const [showResultModal, setShowResultModal] = useState(false);

    const fetchProducts = async (showToast = false) => {
        try {
            setLoading(products.length === 0);
            const { data } = await API.get('/products?all=true&lite=true');
            const nextProducts = Array.isArray(data) ? data : [];
            setAdminListCache(STOCK_PRODUCTS_CACHE_KEY, nextProducts);
            setProducts(nextProducts);
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
        setImportResult(null);
        fetchProducts(true);
    };

    const handleExport = async () => {
        try {
            setExporting(true);
            toast.loading('Generating Excel sheet...', { id: 'export-stock' });
            
            const response = await API.get('/products/stock/export', {
                responseType: 'blob'
            });
            
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `indiakart_stock_update_${new Date().toISOString().split('T')[0]}.xlsx`);
            document.body.appendChild(link);
            link.click();
            
            link.parentNode.removeChild(link);
            window.URL.revokeObjectURL(url);
            
            toast.success('Inventory sheet downloaded!', { id: 'export-stock' });
        } catch (error) {
            console.error('Export Stock Error:', error);
            toast.error('Failed to export stock sheet', { id: 'export-stock' });
        } finally {
            setExporting(false);
        }
    };

    const handleImport = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        e.target.value = null;

        const formData = new FormData();
        formData.append('file', file);

        try {
            setImporting(true);
            toast.loading('Uploading and importing stock...', { id: 'import-stock' });

            const { data } = await API.post('/products/stock/import', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            setImportResult(data);
            setShowResultModal(true);

            if (data.success) {
                toast.success('Stock import completed!', { id: 'import-stock' });
                fetchProducts(false);
            } else {
                toast.error('Stock import completed with errors.', { id: 'import-stock' });
            }
        } catch (error) {
            console.error('Import Stock Error:', error);
            const errMsg = error.response?.data?.message || 'Failed to upload and import stock file.';
            toast.error(errMsg, { id: 'import-stock' });
        } finally {
            setImporting(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    const handleStockChange = (id, value) => {
        setEditingStock(prev => ({ ...prev, [id]: value }));
    };

    const normalizeSearchValue = (value = '') => String(value).toLowerCase().replace(/\s+/g, '');

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

            setProducts(prev => {
                const nextProducts = prev.map(p => {
                    if (p.id === product.id) {
                        if (isSku) {
                            const derivedStock = payload.skus.reduce((sum, sku) => sum + (Number(sku.stock) || 0), 0);
                            return { ...p, skus: payload.skus, stock: derivedStock };
                        }
                        return { ...p, stock: payload.stock };
                    }
                    return p;
                });
                setAdminListCache(STOCK_PRODUCTS_CACHE_KEY, nextProducts);
                return nextProducts;
            });

            const newEditing = { ...editingStock };
            delete newEditing[editKey];
            setEditingStock(newEditing);

        } catch (error) {
            console.error('Update stock error:', error);
            toast.error(error.response?.data?.message || 'Failed to update stock', { id: 'update-stock' });
        }
    };

    const normalizedSearchTerm = normalizeSearchValue(searchTerm);
    const filteredProducts = products.filter((p) =>
        normalizeSearchValue(p.name).includes(normalizedSearchTerm) ||
        normalizeSearchValue(p.brand).includes(normalizedSearchTerm)
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
                <div className="flex flex-wrap items-center gap-3">
                    <button
                        type="button"
                        onClick={handleRefresh}
                        className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-all font-bold text-sm shadow-sm"
                    >
                        <MdRefresh size={20} className={loading ? 'animate-spin' : ''} /> Refresh
                    </button>
                    
                    <button
                        type="button"
                        onClick={handleExport}
                        disabled={exporting || loading}
                        className="flex items-center gap-2 px-4 py-2.5 bg-blue-50 text-blue-600 hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-all font-bold text-sm border border-blue-100 shadow-sm"
                    >
                        <MdFileDownload size={20} /> Export Excel
                    </button>

                    <label className="flex items-center gap-2 px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-all font-bold text-sm border border-emerald-100 shadow-sm cursor-pointer animate-none">
                        <MdFileUpload size={20} />
                        <span>Import Excel</span>
                        <input
                            type="file"
                            accept=".xlsx, .xls"
                            className="hidden"
                            onChange={handleImport}
                            disabled={importing || loading}
                        />
                    </label>
                </div>
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
                        <AdminTableHead>
                            <AdminTableHeaderRow>
                                <AdminTableHeaderCell compact>Product Info</AdminTableHeaderCell>
                                <AdminTableHeaderCell compact>Category</AdminTableHeaderCell>
                                <AdminTableHeaderCell compact className="text-center">Variants</AdminTableHeaderCell>
                                <AdminTableHeaderCell compact className="text-center">Remaining Stock</AdminTableHeaderCell>
                                <AdminTableHeaderCell compact className="text-right">Actions</AdminTableHeaderCell>
                            </AdminTableHeaderRow>
                        </AdminTableHead>
                        <tbody className="divide-y divide-gray-200">
                            {filteredProducts.map(product => (
                                <React.Fragment key={product.id}>
                                    <tr className={`hover:bg-blue-50/10 transition-colors group ${expandedProduct === product.id ? 'bg-blue-50/30' : ''}`}>
                                        <td className="px-4 py-3.5">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-lg bg-gray-50 border border-gray-100 overflow-hidden flex-shrink-0">
                                                    <img src={product.image} className="w-full h-full object-contain p-1" alt="" />
                                                </div>
                                                <div className="min-w-0">
                                                    <h4 className="text-sm font-black text-gray-800 truncate max-w-[220px]">{product.name}</h4>
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
                                            {product.skus && product.skus.length > 0 ? (
                                                <button
                                                    type="button"
                                                    onClick={() => setExpandedProduct(expandedProduct === product.id ? null : product.id)}
                                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-[0.14em] hover:bg-blue-100 transition-all border border-blue-100 shadow-sm"
                                                >
                                                    {product.skus.length} variants
                                                    {expandedProduct === product.id ? <MdExpandLess /> : <MdExpandMore />}
                                                </button>
                                            ) : (
                                                <span className="text-[10px] font-black text-gray-300 uppercase italic tracking-widest">No Variants</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3.5">
                                            <div className="flex items-center justify-center gap-2">
                                                <input
                                                    type="number"
                                                    disabled={product.skus && product.skus.length > 0}
                                                    className={`w-16 px-2 py-1.5 text-center rounded-lg border-2 font-black text-sm transition-all outline-none ${product.skus && product.skus.length > 0
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
                                        <td className="px-4 py-3.5 text-right">
                                            {(!product.skus || product.skus.length === 0) && (
                                                <button
                                                    type="button"
                                                    onClick={() => updateStock(product)}
                                                    disabled={editingStock[product.id] === undefined}
                                                    className={`p-2 rounded-lg transition-all shadow-sm border ${editingStock[product.id] !== undefined
                                                            ? 'bg-blue-600 text-white border-blue-700 hover:scale-105 active:scale-95'
                                                            : 'bg-gray-50 text-gray-300 border-transparent cursor-not-allowed'
                                                        }`}
                                                >
                                                    <MdSave size={18} />
                                                </button>
                                            )}
                                        </td>
                                    </tr>

                                    {/* Variant Rows */}
                                    {expandedProduct === product.id && product.skus?.map((sku, idx) => (
                                        <tr key={`${product.id}-${idx}`} className="bg-gray-50/80 animate-in slide-in-from-top-2 duration-300 border-l-4 border-blue-500">
                                            <td className="pl-14 pr-4 py-3" colSpan={2}>
                                                <div className="flex items-center gap-3">
                                                    <div className="flex flex-wrap gap-2">
                                                        {Object.entries(sku.combination).map(([key, value]) => (
                                                            <div key={key} className="flex flex-col">
                                                                <span className="text-[10px] font-bold text-gray-400 leading-none mb-1">{key}</span>
                                                                <span className="text-[11px] font-black text-gray-700 bg-white px-2 py-0.5 rounded border border-gray-100">{value}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </td>
                                            <td></td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center justify-center gap-2">
                                                    <input
                                                        type="number"
                                                        className="w-16 px-2 py-1.5 text-center rounded-lg border-2 bg-white border-blue-100 focus:border-blue-500 text-gray-900 font-black text-sm transition-all outline-none"
                                                        value={editingStock[`${product.id}-${idx}`] ?? sku.stock}
                                                        onChange={(e) => handleStockChange(`${product.id}-${idx}`, e.target.value)}
                                                    />
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <button
                                                    type="button"
                                                    onClick={() => updateStock(product, true, idx)}
                                                    disabled={editingStock[`${product.id}-${idx}`] === undefined}
                                                    className={`p-2 rounded-lg transition-all shadow-sm border ${editingStock[`${product.id}-${idx}`] !== undefined
                                                            ? 'bg-blue-600 text-white border-blue-700 hover:scale-105 active:scale-95'
                                                            : 'bg-gray-50 text-gray-300 border-transparent cursor-not-allowed'
                                                        }`}
                                                >
                                                    <MdSave size={18} />
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

            {/* Result Report Modal */}
            {showResultModal && importResult && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
                    <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-150">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                            <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
                                <MdInventory className="text-blue-600" /> Stock Import Report
                            </h3>
                            <button
                                onClick={() => setShowResultModal(false)}
                                className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <MdClose size={20} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 overflow-y-auto space-y-6">
                            {/* Summary Cards */}
                            <div className="grid grid-cols-3 gap-4">
                                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-center">
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider animate-none">Processed Rows</p>
                                    <p className="text-2xl font-black text-gray-800 mt-1">{importResult.summary?.totalRowsProcessed || 0}</p>
                                </div>
                                <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100 text-center">
                                    <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider animate-none">Updated Products</p>
                                    <p className="text-2xl font-black text-emerald-700 mt-1">{importResult.summary?.updatedProductsCount || 0}</p>
                                </div>
                                <div className={`p-4 rounded-xl text-center border ${
                                    (importResult.summary?.errorsCount || 0) > 0
                                        ? 'bg-red-50 border-red-100'
                                        : 'bg-gray-50 border-gray-100'
                                }`}>
                                    <p className={`text-xs font-bold uppercase tracking-wider animate-none ${
                                        (importResult.summary?.errorsCount || 0) > 0 ? 'text-red-500' : 'text-gray-400'
                                    }`}>Errors / Warnings</p>
                                    <p className={`text-2xl font-black mt-1 ${
                                        (importResult.summary?.errorsCount || 0) > 0 ? 'text-red-600' : 'text-gray-800'
                                    }`}>{importResult.summary?.errorsCount || 0}</p>
                                </div>
                            </div>

                            {/* Success Banner */}
                            {importResult.summary?.errorsCount === 0 && (
                                <div className="flex flex-col items-center justify-center py-6 px-4 bg-emerald-50 border border-emerald-100 rounded-2xl text-center space-y-2">
                                    <MdCheckCircle className="text-emerald-500 animate-bounce" size={48} />
                                    <h4 className="text-base font-black text-emerald-800">All Updates Applied Cleanly!</h4>
                                    <p className="text-sm text-emerald-600 font-medium max-w-md">
                                        The spreadsheet was successfully validated and processed. All changes are now live in the database.
                                    </p>
                                </div>
                            )}

                            {/* Warnings/Errors section */}
                            {importResult.summary?.errorsCount > 0 && (
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 text-amber-600">
                                        <MdWarning size={20} />
                                        <h4 className="text-sm font-black uppercase tracking-wider">Validation Warnings & Errors</h4>
                                    </div>
                                    <p className="text-xs font-medium text-gray-500">
                                        Some rows could not be updated. Please correct these issues in your spreadsheet and upload again.
                                    </p>
                                    <div className="max-h-60 overflow-y-auto border border-red-100 bg-red-50/20 rounded-xl divide-y divide-red-100/50">
                                        {importResult.summary.errors.map((err, idx) => (
                                            <div key={idx} className="p-3 text-xs font-semibold text-red-700 flex items-start gap-2">
                                                <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5"></span>
                                                <span>{err}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end">
                            <button
                                onClick={() => setShowResultModal(false)}
                                className="px-5 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-bold text-sm shadow-md transition-all active:scale-95"
                            >
                                Close Report
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StockManagement;
