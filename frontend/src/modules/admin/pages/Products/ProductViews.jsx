import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MdRefresh, MdSearch, MdVisibility, MdBarChart } from 'react-icons/md';
import { 
    BarChart, 
    Bar, 
    XAxis, 
    YAxis, 
    Tooltip, 
    ResponsiveContainer, 
    Cell,
    CartesianGrid 
} from 'recharts';
import { motion } from 'framer-motion';
import API from '../../../../services/api';
import toast from 'react-hot-toast';
import Pagination from '../../components/common/Pagination';

const getProductId = (product) => String(product?.id || product?._id || '');
const ITEMS_PER_PAGE = 20;
const isKnownState = (value) => String(value || '').trim().toLowerCase() !== 'unknown';

const ProductViews = () => {
    const navigate = useNavigate();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedInsights, setSelectedInsights] = useState(null);
    const [insightsLoading, setInsightsLoading] = useState(false);

    const fetchProducts = async (showToast = false) => {
        try {
            setLoading(true);
            const { data } = await API.get('/products', {
                params: { all: 'true', lite: 'true' }
            });
            const list = Array.isArray(data?.products) ? data.products : (Array.isArray(data) ? data : []);
            const sorted = [...list].sort((a, b) => Number(b.viewCount || 0) - Number(a.viewCount || 0));
            setProducts(sorted);
            if (showToast) toast.success('Views refreshed');
        } catch (error) {
            console.error('Error fetching product views:', error);
            toast.error('Failed to load product views');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    const filteredProducts = useMemo(() => {
        const query = searchTerm.trim().toLowerCase();
        if (!query) return products;

        return products.filter((product) =>
            String(product?.name || '').toLowerCase().includes(query) ||
            String(product?.brand || '').toLowerCase().includes(query) ||
            String(product?.category || '').toLowerCase().includes(query)
        );
    }, [products, searchTerm]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    const totalViews = filteredProducts.reduce((sum, product) => sum + Number(product?.viewCount || 0), 0);
    const totalPages = Math.max(1, Math.ceil(filteredProducts.length / ITEMS_PER_PAGE));
    const safeCurrentPage = Math.min(currentPage, totalPages);
    const startIndex = (safeCurrentPage - 1) * ITEMS_PER_PAGE;
    const paginatedProducts = filteredProducts.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    const handleViewInsights = (product) => {
        navigate(`/admin/product-views/${getProductId(product)}`);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight">Product Views</h1>
                    <p className="text-sm text-gray-500 font-medium italic">
                        Track how many times users opened each product page
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => fetchProducts(true)}
                    className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-700"
                >
                    <MdRefresh size={18} />
                    Refresh
                </button>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-gray-400">Tracked Products</p>
                    <p className="mt-2 text-3xl font-black text-gray-900">{filteredProducts.length}</p>
                </div>
                <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-gray-400">Total Views</p>
                    <p className="mt-2 text-3xl font-black text-gray-900">{totalViews.toLocaleString()}</p>
                </div>
                <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-gray-400">Top Product</p>
                    <p className="mt-2 line-clamp-2 text-lg font-black text-gray-900">
                        {filteredProducts[0]?.name || 'No data yet'}
                    </p>
                </div>
            </div>

            {/* Top Products Chart */}
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm"
            >
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-black text-gray-900">Popular Products</h3>
                        <p className="text-xs font-medium text-gray-400 uppercase tracking-widest mt-0.5">Top 10 most viewed items</p>
                    </div>
                    <MdBarChart className="text-blue-500" size={24} />
                </div>
                
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart 
                            data={filteredProducts.slice(0, 10).map(p => ({ 
                                name: p.name.length > 20 ? p.name.substring(0, 17) + '...' : p.name, 
                                views: p.viewCount || 0,
                                originalName: p.name 
                            }))} 
                            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                            layout="vertical"
                        >
                            <XAxis type="number" hide />
                            <YAxis 
                                dataKey="name" 
                                type="category" 
                                axisLine={false} 
                                tickLine={false} 
                                width={120}
                                tick={{ fontSize: 11, fontWeight: 700, fill: '#64748b' }}
                            />
                            <Tooltip 
                                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                cursor={{ fill: '#f8fafc' }}
                                formatter={(value) => [`${value} Views`, 'Views']}
                                labelStyle={{ display: 'none' }}
                            />
                            <Bar dataKey="views" radius={[0, 8, 8, 0]} barSize={20}>
                                {filteredProducts.slice(0, 10).map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={['#2563eb', '#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe'][index % 5]} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                <div className="mt-4 flex justify-end">
                    <button 
                        onClick={() => navigate(`/admin/product-views/${getProductId(filteredProducts[0])}`)}
                        className="text-xs font-black text-blue-600 uppercase tracking-widest hover:underline"
                    >
                        View Full Stats
                    </button>
                </div>
            </motion.div>

            <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                <div className="relative">
                    <MdSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search by product, brand, or category..."
                        className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-11 pr-4 text-sm text-gray-900 outline-none transition focus:border-blue-400 focus:bg-white"
                    />
                </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[760px]">
                        <thead className="bg-slate-900 text-white">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-widest">Product</th>
                                <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-widest">Brand</th>
                                <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-widest">Category</th>
                                <th className="px-4 py-3 text-center text-xs font-black uppercase tracking-widest">Details</th>
                                <th className="px-4 py-3 text-right text-xs font-black uppercase tracking-widest">Views</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan="5" className="px-4 py-10 text-center text-sm text-gray-400">Loading product views...</td>
                                </tr>
                            ) : filteredProducts.length > 0 ? (
                                paginatedProducts.map((product) => (
                                    <tr key={getProductId(product)} className="hover:bg-gray-50">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="h-11 w-11 overflow-hidden rounded-xl border border-gray-100 bg-gray-50">
                                                    {product?.image ? (
                                                        <img src={product.image} alt={product?.name || ''} className="h-full w-full object-contain p-1" />
                                                    ) : (
                                                        <div className="flex h-full w-full items-center justify-center text-gray-300">
                                                            <MdVisibility size={18} />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="truncate text-sm font-bold text-gray-900">{product?.name || 'Untitled product'}</p>
                                                    <p className="text-[11px] font-medium text-gray-400">ID: {product?.id || product?._id}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-sm font-semibold text-gray-700">{product?.brand || 'N/A'}</td>
                                        <td className="px-4 py-3 text-sm font-semibold text-gray-700">{product?.category || 'N/A'}</td>
                                        <td className="px-4 py-3 text-center">
                                            <button
                                                type="button"
                                                onClick={() => handleViewInsights(product)}
                                                className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-black uppercase tracking-wide text-blue-700 hover:bg-blue-100"
                                            >
                                                View
                                            </button>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-sm font-black text-blue-700">
                                                <MdVisibility size={16} />
                                                {Number(product?.viewCount || 0).toLocaleString()}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="px-4 py-10 text-center text-sm text-gray-400">No product views found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                {!loading && totalPages > 1 && (
                    <Pagination
                        currentPage={safeCurrentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                    />
                )}
            </div>

        </div>
    );
};

export default ProductViews;
