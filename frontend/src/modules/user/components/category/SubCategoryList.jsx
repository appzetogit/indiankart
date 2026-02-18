import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const SubCategoryList = ({ subCategories }) => {
    const location = useLocation();
    if (!subCategories || subCategories.length === 0) return null;

    return (
        <>
            {/* MOBILE VIEW: Identical to original 2-row grid - COMPACT */}
            <div className="lg:hidden bg-white py-2 mb-1">
                <div className="flex overflow-x-auto gap-x-3 gap-y-2 px-3 no-scrollbar pb-2 min-h-max">
                    {subCategories.map((sub, index) => {
                        const currentPath = location.pathname.endsWith('/') ? location.pathname.slice(0, -1) : location.pathname;
                        const targetPath = `${currentPath}/${encodeURIComponent(sub.name)}`;

                        return (
                            <Link key={index} to={targetPath} className="flex flex-col items-center cursor-pointer hover:opacity-80 shrink-0 w-[64px]">
                                <div className="w-[50px] h-[50px] bg-blue-50/50 rounded-2xl border border-blue-100/50 flex items-center justify-center overflow-hidden mb-1.5 transition-transform active:scale-95 shadow-sm">
                                    <img
                                        src={sub.image}
                                        alt={sub.name}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            e.target.onerror = null;
                                            e.target.src = 'https://images.unsplash.com/photo-1560393464-5c69a73c5770?q=80&w=150&auto=format&fit=crop';
                                        }}
                                    />
                                </div>
                                <span className="text-[9px] font-black text-center text-gray-900 leading-tight w-full line-clamp-2 tracking-tight px-0.5">
                                    {sub.name}
                                </span>
                            </Link>
                        );
                    })}
                </div>
            </div>

            {/* DESKTOP VIEW: New responsive layout */}
            <div className="hidden lg:block bg-white py-4">
                <div className="flex flex-wrap justify-start gap-8 px-4 no-scrollbar">
                    {subCategories.map((sub, index) => {
                        const currentPath = location.pathname.endsWith('/') ? location.pathname.slice(0, -1) : location.pathname;
                        const targetPath = `${currentPath}/${encodeURIComponent(sub.name)}`;

                        return (
                            <Link key={index} to={targetPath} className="flex flex-col items-center cursor-pointer group shrink-0">
                                <div className="w-24 h-24 bg-[#f8f9fb] rounded-full border border-gray-100 flex items-center justify-center overflow-hidden mb-2 transition-all duration-300 group-hover:scale-105 group-hover:shadow-lg group-hover:border-blue-400">
                                    <img
                                        src={sub.image}
                                        alt={sub.name}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            e.target.onerror = null;
                                            e.target.src = 'https://images.unsplash.com/photo-1560393464-5c69a73c5770?q=80&w=150&auto=format&fit=crop';
                                        }}
                                    />
                                </div>
                                <span className="text-sm font-bold text-center text-gray-700 leading-tight w-28 line-clamp-1 tracking-tight group-hover:text-blue-600 transition-colors">
                                    {sub.name}
                                </span>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </>
    );
};

export default SubCategoryList;
