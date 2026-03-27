import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MdAdd, MdSearch, MdEdit, MdDelete, MdFilterList, MdImage, MdVisibility, MdChevronLeft, MdChevronRight, MdClose } from 'react-icons/md';
import useProductStore from '../../store/productStore';
import Pagination from '../../../../components/Pagination';
import API from '../../../../services/api'; import toast from 'react-hot-toast';
import useCategoryStore from '../../store/categoryStore';
import { confirmToast } from '../../../../utils/toastUtils.jsx';

const getCategoryLabel = (product) => {
    const rawCategory = product?.category;
    if (!rawCategory) return 'Uncategorized';
    if (typeof rawCategory === 'string') return rawCategory;
    return rawCategory.name || 'Uncategorized';
};

const getSubCategoryLabel = (product) => {
    const multi = product?.subCategories;
    if (Array.isArray(multi) && multi.length > 0) {
        const names = multi
            .map((item) => (typeof item === 'string' ? item : item?.name))
            .filter(Boolean);
        if (names.length > 0) return names.join(', ');
    }

    const single = product?.subCategory;
    if (!single) return '';
    if (typeof single === 'string') return single;
    return single.name || '';
};

const ProductManager = () => {
    const navigate = useNavigate();
    const { deleteProduct } = useProductStore();
    const { categories, fetchCategories } = useCategoryStore();
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('All');
    const [selectedProduct, setSelectedProduct] = useState(null);

    // Server-side Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalProducts, setTotalProducts] = useState(0);
    const itemsPerPage = 12;

    const [localProducts, setLocalProducts] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        let active = true;
        const fetchPaginatedProducts = async () => {
            setLoading(true);
            try {
                const params = {
                    pageNumber: currentPage,
                    limit: itemsPerPage,
                    all: 'true'
                };

                if (filterCategory !== 'All') {
                    params.category = filterCategory;
                }
                const searchText = searchTerm.trim();
                if (searchText) {
                    params.search = searchText;
                }

                const { data } = await API.get('/products', { params });

                if (!active) return;
                if (data.products) {
                    setLocalProducts(data.products);
                    setTotalPages(data.pages);
                    setTotalProducts(data.total);
                } else {
                    // Fallback if backend returns array (backward compat)
                    setLocalProducts(data);
                    setTotalPages(1);
                    setTotalProducts(Array.isArray(data) ? data.length : 0);
                }
            } catch (error) {
                console.error(error);
                if (active) toast.error('Failed to fetch products');
            } finally {
                if (active) setLoading(false);
            }
        };

        const timer = setTimeout(fetchPaginatedProducts, 250);
        return () => {
            active = false;
            clearTimeout(timer);
        };
    }, [currentPage, filterCategory, searchTerm]);

    useEffect(() => {
        fetchCategories();
    }, []);

    // Update handleDelete to refresh list
    const handleDelete = async (id) => {
        confirmToast({
            message: 'Are you sure you want to delete this product?',
            type: 'danger',
            icon: 'delete_forever',
            confirmText: 'Delete Product',
            onConfirm: async () => {
                await deleteProduct(id); // Store action
                // Refresh local list
                const searchText = searchTerm.trim();
                const { data } = await API.get('/products', {
                    params: {
                        pageNumber: currentPage,
                        limit: itemsPerPage,
                        all: 'true',
                        category: filterCategory !== 'All' ? filterCategory : undefined,
                        search: searchText || undefined
                    }
                });
                if (data.products) {
                    setLocalProducts(data.products);
                    setTotalPages(data.pages);
                    setTotalProducts(data.total);
                }
            }
        });
    };

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };


    return (
        <div className="space-y-2 md:space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 md:gap-4">
                <div>
                    <h1 className="text-lg md:text-2xl font-bold text-gray-800">Product Management</h1>
                    <p className="text-gray-500 text-xs md:text-sm">Manage inventory, prices, and product details ({totalProducts} total)</p>
                </div>
                <button
                    onClick={() => navigate('/admin/products/new')}
                    className="flex items-center justify-center gap-1 md:gap-2 bg-blue-600 text-white px-3 py-2 md:px-4 md:py-2 rounded-lg hover:bg-blue-700 transition shadow-sm font-medium w-full md:w-auto text-xs md:text-base"
                >
                    <MdAdd size={20} className="w-4 h-4 md:w-5 md:h-5" /> Add Product
                </button>
            </div>

            {/* Filters */}
            {/* Filters */}
            <div className="bg-white p-3 md:p-4 rounded-xl md:rounded-3xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-3 md:gap-4 items-center justify-between">
                <div className="relative flex-1 w-full">
                    <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search products by name or brand..."
                        className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-transparent rounded-xl md:rounded-2xl focus:bg-white focus:border-blue-500 outline-none transition-all text-sm text-gray-900 placeholder:text-gray-900 font-bold"
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setCurrentPage(1);
                        }}
                    />
                </div>
                <div className="flex items-center gap-2 md:gap-3 w-full md:w-auto">
                    <MdFilterList className="text-gray-400" size={20} />
                    <select
                        className="px-4 py-2 md:px-6 md:py-3 bg-gray-50 border border-transparent rounded-xl md:rounded-2xl outline-none focus:bg-white focus:border-blue-500 text-sm font-black text-gray-900 min-w-[120px] md:min-w-[150px]"
                        value={filterCategory}
                        onChange={(e) => {
                            setFilterCategory(e.target.value);
                            setCurrentPage(1);
                        }}
                    >
                        <option value="All">All Categories</option>
                        {categories.map(cat => (
                            <option key={cat.id || cat._id || cat} value={cat.name || cat}>{cat.name || cat}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Product Table */}
            {localProducts.length === 0 ? (
                <div className="bg-white p-12 text-center rounded-xl border border-dashed border-gray-300">
                    <p className="text-gray-500">No products found matching your criteria.</p>
                </div>
            ) : (
                <div className="relative -mx-4 md:mx-0">
                    <div className="bg-white md:rounded-2xl border-y md:border border-gray-200 shadow-sm">
                        <div className="overflow-x-auto overflow-y-visible" style={{ WebkitOverflowScrolling: 'touch', maxWidth: '100vw' }}>
                            <table className="w-full min-w-max text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50/50 border-b border-gray-100">
                                        <th className="whitespace-nowrap md:whitespace-normal px-2 py-2 md:px-4 md:py-3 text-[10px] md:text-xs font-black text-gray-900 uppercase tracking-widest">Product Details</th>
                                        <th className="whitespace-nowrap md:whitespace-normal px-2 py-2 md:px-4 md:py-3 text-[10px] md:text-xs font-black text-gray-900 uppercase tracking-widest text-center">Category</th>
                                        <th className="whitespace-nowrap md:whitespace-normal px-2 py-2 md:px-4 md:py-3 text-[10px] md:text-xs font-black text-gray-900 uppercase tracking-widest text-center">Subcategory</th>
                                        <th className="whitespace-nowrap md:whitespace-normal px-2 py-2 md:px-4 md:py-3 text-[10px] md:text-xs font-black text-gray-900 uppercase tracking-widest text-center">Stock Status</th>
                                        <th className="whitespace-nowrap md:whitespace-normal px-2 py-2 md:px-4 md:py-3 text-[10px] md:text-xs font-black text-gray-900 uppercase tracking-widest text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {localProducts.map(product => (
                                        <tr key={product.id} className="hover:bg-blue-50/10 transition-colors group">
                                            <td className="whitespace-nowrap md:whitespace-normal px-2 py-1.5 md:px-4 md:py-2.5">
                                                <div className="flex items-center gap-2 md:gap-3">
                                                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-gray-50 border border-gray-100 overflow-hidden flex-shrink-0">
                                                        {product.image ? (
                                                            <img src={product.image} className="w-full h-full object-contain p-1" alt="" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-gray-200">
                                                                <MdImage size={24} className="w-4 h-4 md:w-6 md:h-6" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest truncate">{product.brand || 'No Brand'}</p>
                                                        <h3 className="text-xs font-bold text-gray-800 truncate max-w-[150px] md:max-w-[200px]" title={product.name}>{product.name}</h3>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="whitespace-nowrap md:whitespace-normal px-2 py-1.5 md:px-4 md:py-2.5 text-center">
                                                <div className="flex flex-col items-center">
                                                    <span className="inline-block px-2.5 py-1 rounded-full bg-blue-50 text-[10px] font-black text-blue-600 uppercase">
                                                        {getCategoryLabel(product)}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="whitespace-nowrap md:whitespace-normal px-2 py-1.5 md:px-4 md:py-2.5 text-center">
                                                {getSubCategoryLabel(product) ? (
                                                    <span className="inline-block px-2.5 py-1 rounded-full bg-gray-100 text-[9px] font-bold text-gray-500 uppercase">
                                                        {getSubCategoryLabel(product)}
                                                    </span>
                                                ) : (
                                                    <span className="text-[10px] font-bold text-gray-400 uppercase">N/A</span>
                                                )}
                                            </td>
                                            <td className="whitespace-nowrap md:whitespace-normal px-2 py-1.5 md:px-4 md:py-2.5 text-center">
                                                <div className="flex flex-col items-center">
                                                    <span className={`text-[11px] font-black uppercase tracking-widest ${(product.stock || 0) <= 5 ? 'text-amber-500 animate-pulse' : 'text-blue-600'}`}>
                                                        {product.stock || 0} Units
                                                    </span>
                                                    <div className="w-16 h-1 bg-gray-100 rounded-full mt-1.5 overflow-hidden">
                                                        <div
                                                            className={`h-full transition-all duration-1000 ${(product.stock || 0) <= 5 ? 'bg-amber-500' : 'bg-blue-600'}`}
                                                            style={{ width: `${Math.min(100, (product.stock || 0) * 2)}%` }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="whitespace-nowrap md:whitespace-normal px-2 py-1.5 md:px-4 md:py-2.5 text-right">
                                                <div className="flex items-center justify-end gap-1 md:gap-2">
                                                    <button
                                                        onClick={() => setSelectedProduct(product)}
                                                        className="w-7 h-7 md:w-9 md:h-9 flex items-center justify-center bg-gray-50 hover:bg-green-600 text-gray-400 hover:text-white rounded-lg md:rounded-xl transition-all shadow-sm border border-transparent hover:border-green-700"
                                                        title="Quick View"
                                                    >
                                                        <MdVisibility size={14} className="md:w-[18px] md:h-[18px]" />
                                                    </button>
                                                    <button
                                                        onClick={() => navigate(`/admin/products/edit/${product.id}`)}
                                                        className="w-7 h-7 md:w-9 md:h-9 flex items-center justify-center bg-gray-50 hover:bg-blue-600 text-gray-400 hover:text-white rounded-lg md:rounded-xl transition-all shadow-sm border border-transparent hover:border-blue-700"
                                                        title="Edit Product"
                                                    >
                                                        <MdEdit size={14} className="md:w-[18px] md:h-[18px]" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(product.id)}
                                                        className="w-7 h-7 md:w-9 md:h-9 flex items-center justify-center bg-gray-50 hover:bg-red-600 text-gray-400 hover:text-white rounded-lg md:rounded-xl transition-all shadow-sm border border-transparent hover:border-red-700"
                                                        title="Delete Product"
                                                    >
                                                        <MdDelete size={14} className="md:w-[18px] md:h-[18px]" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Pagination UI */}
                    {totalPages > 1 && (
                        <Pagination
                            page={currentPage}
                            pages={totalPages}
                            changePage={handlePageChange}
                        />
                    )}
                </div>
            )}

            {/* Quick View Modal */}
            {selectedProduct && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-2xl rounded-2xl md:rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="relative p-4 md:p-8">
                            <button
                                onClick={() => setSelectedProduct(null)}
                                className="absolute top-3 right-3 md:top-6 md:right-6 p-1 md:p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400"
                            >
                                <MdClose size={20} className="md:w-6 md:h-6" />
                            </button>

                            <div className="flex flex-col md:flex-row gap-4 md:gap-8">
                                <div className="w-full h-48 md:w-64 md:h-64 bg-gray-50 rounded-2xl border border-gray-100 p-4 flex-shrink-0">
                                    <img src={selectedProduct.image} className="w-full h-full object-contain" alt="" />
                                </div>
                                <div className="flex-1 space-y-4">
                                    <div>
                                        <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">{selectedProduct.brand}</p>
                                        <h3 className="text-2xl font-black text-gray-900 leading-tight">{selectedProduct.name}</h3>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <div className="text-2xl font-black text-gray-900">₹{selectedProduct.price.toLocaleString()}</div>
                                        {selectedProduct.originalPrice > selectedProduct.price && (
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm text-gray-400 line-through">₹{selectedProduct.originalPrice.toLocaleString()}</span>
                                                <span className="text-sm font-bold text-green-500">{selectedProduct.discount}</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                                            <p className="text-xs font-bold text-gray-800">Category: {getCategoryLabel(selectedProduct)}</p>
                                            <p className="text-[11px] font-semibold text-gray-500 mt-1">
                                                Subcategory: {getSubCategoryLabel(selectedProduct) || 'N/A'}
                                            </p>
                                        </div>
                                        <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                                            <p className="text-[9px] font-black text-gray-400 uppercase mb-1">Stock Level</p>
                                            <p className={`text-xs font-bold ${selectedProduct.stock <= 5 ? 'text-amber-500' : 'text-gray-800'}`}>{selectedProduct.stock || 0} Units</p>
                                        </div>
                                    </div>

                                    <div className="pt-4 flex gap-3">
                                        <button
                                            onClick={() => {
                                                navigate(`/product/${selectedProduct.id}`);
                                                setSelectedProduct(null);
                                            }}
                                            className="flex-1 py-3 bg-blue-600 text-white font-black text-xs uppercase tracking-widest rounded-xl hover:bg-blue-700 transition shadow-lg shadow-blue-100"
                                        >
                                            View on Website
                                        </button>
                                        <button
                                            onClick={() => {
                                                navigate(`/admin/products/edit/${selectedProduct.id}`);
                                                setSelectedProduct(null);
                                            }}
                                            className="flex-1 py-3 bg-gray-100 text-gray-600 font-black text-xs uppercase tracking-widest rounded-xl hover:bg-gray-200 transition"
                                        >
                                            Edit Details
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProductManager;



