import React, { useState } from 'react';
import { products } from '../data/mockData';
import { useCartStore } from '../store/cartStore';

const TopDeals = () => {
    const addToCart = useCartStore((state) => state.addToCart);
    const [filter, setFilter] = useState('All');

    const filters = ['All', 'Mobiles', 'Electronics', 'Fashion', 'Beauty', 'Home'];
    const filteredProducts = filter === 'All'
        ? products
        : products.filter(p => p.category === filter);

    return (
        <div className="bg-background-light dark:bg-background-dark min-h-screen pb-20">
            {/* Search Header Reflection (Placeholder or actual) */}
            <div className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-4 py-3 sticky top-[152px] z-30 shadow-sm">
                <div className="flex overflow-x-auto no-scrollbar gap-2">
                    {filters.map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${filter === f
                                    ? 'bg-primary text-white'
                                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                                }`}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            <div className="px-4 py-4">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold dark:text-white">Top Deals on {filter}</h3>
                    <div className="flex gap-2">
                        <button className="flex items-center gap-1 bg-white dark:bg-gray-800 px-3 py-1 rounded border border-gray-200 dark:border-gray-700 text-xs font-bold">
                            <span className="material-icons-outlined text-sm">sort</span> Sort
                        </button>
                        <button className="flex items-center gap-1 bg-white dark:bg-gray-800 px-3 py-1 rounded border border-gray-200 dark:border-gray-700 text-xs font-bold">
                            <span className="material-icons-outlined text-sm">filter_list</span> Filter
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    {filteredProducts.map((product) => (
                        <div
                            key={product.id}
                            className="bg-white dark:bg-gray-800 p-3 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 active:scale-95 transition-transform"
                            onClick={() => addToCart(product)}
                        >
                            <div className="relative aspect-square mb-2 bg-gray-50 dark:bg-gray-900 rounded-lg overflow-hidden flex items-center justify-center p-4">
                                <img alt={product.name} className="h-full object-contain" src={product.image} />
                                <div className="absolute top-2 left-2 bg-orange-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                                    {product.discount || 'Special'}
                                </div>
                                <div className="absolute bottom-1 right-1 bg-white/90 dark:bg-gray-800/90 px-1 rounded flex items-center gap-0.5 text-[10px] font-bold shadow-sm">
                                    {product.rating} <span className="material-icons-outlined text-[10px] text-green-600">star</span>
                                </div>
                            </div>
                            <p className="text-xs font-medium line-clamp-2 mb-1 dark:text-gray-200">{product.name}</p>
                            <div className="flex items-baseline gap-1">
                                <span className="text-sm font-bold">₹{product.price.toLocaleString()}</span>
                                <span className="text-[10px] text-gray-400 line-through">₹{product.originalPrice?.toLocaleString()}</span>
                            </div>
                            <button
                                className="w-full mt-3 py-1.5 bg-secondary text-white text-xs font-bold rounded"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    addToCart(product);
                                }}
                            >
                                ADD TO CART
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default TopDeals;
