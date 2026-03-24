import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MdArrowBack } from 'react-icons/md';
import API from '../../../services/api';
import { useCategories, useSubCategoriesByCategory } from '../../../hooks/useData';
import { resolveCategoryPath } from '../../../utils/categoryUtils';
import SubCategoryList from '../components/category/SubCategoryList';
import ProductCard from '../components/product/ProductCard';
import BottomNav from '../components/layout/BottomNav';

const CategoryPageSkeleton = () => (
    <div className="bg-white min-h-screen pb-36 md:pb-10 animate-pulse">
        <div className="bg-white shadow-sm border-b border-gray-200">
            <div className="max-w-[1440px] mx-auto px-4 py-3">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gray-200" />
                    <div className="h-7 w-44 rounded bg-gray-200" />
                </div>
            </div>
        </div>
        <div className="max-w-[1440px] mx-auto md:px-4 pt-2 pb-4">
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-5 p-3 md:p-6">
                {Array.from({ length: 8 }).map((_, index) => (
                    <div key={index} className="space-y-2">
                        <div className="aspect-square rounded-xl bg-gray-200" />
                        <div className="h-3 rounded bg-gray-200 w-4/5" />
                        <div className="h-3 rounded bg-gray-200 w-2/3" />
                    </div>
                ))}
            </div>
        </div>
    </div>
);

const CategoryPage = () => {
    const PAGE_SIZE = 12;
    const navigate = useNavigate();
    const { categoryName, "*": subPath } = useParams();
    const routeSegments = String(subPath || '').split('/').filter(Boolean);
    const routeHasExplicitSubPath = routeSegments.length > 0;
    
    const { categories, loading: categoriesLoading } = useCategories({ lite: true });
    
    const [products, setProducts] = useState([]);
    const [productsLoading, setProductsLoading] = useState(true);

    const [categoryData, setCategoryData] = useState(null);
    const [breadcrumbs, setBreadcrumbs] = useState([]);
    const [categoryProducts, setCategoryProducts] = useState([]);
    const [sortedProducts, setSortedProducts] = useState([]);
    const [showSortModal, setShowSortModal] = useState(false);
    const [showFilterModal, setShowFilterModal] = useState(false);
    const [sortBy, setSortBy] = useState('popularity');
    
    const [filterRange, setFilterRange] = useState([0, 1000000]);
    const [priceRange, setPriceRange] = useState({ min: 0, max: 1000000 });
    const [selectedBrands, setSelectedBrands] = useState([]);
    const [selectedRam, setSelectedRam] = useState([]);
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [selectedDiscount, setSelectedDiscount] = useState(null);
    const [brandSearch, setBrandSearch] = useState('');
    const [showAllBrands, setShowAllBrands] = useState(false);
    const [showAllRam, setShowAllRam] = useState(false);
    const [showAllCategories, setShowAllCategories] = useState(false);
    const [collapsedSections, setCollapsedSections] = useState({});
    const [fetchError, setFetchError] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    
    const normalizeText = (value) => String(value || '').trim().toLowerCase();
    const parseAmount = (value, fallback = 0) => {
        const parsed = Number(String(value ?? '').replace(/[^0-9.]/g, ''));
        return Number.isFinite(parsed) ? parsed : fallback;
    };

    const getEffectivePricing = (product) => {
        const skus = Array.isArray(product?.skus) ? product.skus : [];
        const firstSku = skus.length > 0 ? skus[0] : null;
        const price = parseAmount(firstSku?.price ?? product?.price ?? 0, 0);
        const rawOriginalPrice = parseAmount(firstSku?.originalPrice ?? product?.originalPrice ?? price, price);
        const originalPrice = Math.max(rawOriginalPrice, price);
        const discountFromText = Number.parseInt(String(product?.discount || '').replace(/\D/g, ''), 10) || 0;
        const discountPercent = originalPrice > price
            ? Math.round(((originalPrice - price) / originalPrice) * 100)
            : discountFromText;
        return { price, originalPrice, discountPercent };
    };

    const handleBackNavigation = () => {
        if (window.history.state?.idx > 0) {
            navigate(-1);
            return;
        }
        navigate('/');
    };

    useEffect(() => {
        let active = true;
        const fetchCategoryProducts = async () => {
            if (!routeHasExplicitSubPath) {
                setProducts([]);
                setProductsLoading(false);
                setFetchError('');
                return;
            }
            setProductsLoading(true);
            setFetchError('');
            try {
                const params = new URLSearchParams();
                if (categoryName) params.set('category', decodeURIComponent(categoryName));
                const leafSubCategory = routeSegments.length > 0 ? decodeURIComponent(routeSegments[routeSegments.length - 1]) : '';
                if (leafSubCategory) params.set('subcategory', leafSubCategory);
                params.set('lite', 'true');
                const { data } = await API.get(`/products?${params.toString()}`);
                if (!active) return;
                setProducts(Array.isArray(data) ? data : (data?.products || []));
            } catch (error) {
                if (!active) return;
                setProducts([]);
                setFetchError(error?.response?.data?.message || 'Failed to load products');
            } finally {
                if (active) setProductsLoading(false);
            }
        };
        fetchCategoryProducts();
        return () => { active = false; };
    }, [categoryName, subPath, routeHasExplicitSubPath]);

    useEffect(() => {
        window.scrollTo(0, 0);
        if (productsLoading || categoriesLoading) return;
        const result = resolveCategoryPath(categories, products, categoryName, subPath);
        const explicitSubPath = String(subPath || '').split('/').filter(Boolean).length > 0;
        if (result && result.data) {
            setCategoryData(result.data);
            setBreadcrumbs(result.breadcrumbs || []);
            const routeProducts = explicitSubPath ? products : result.products;
            setCategoryProducts(routeProducts);
            setSortedProducts(routeProducts);
            if (routeProducts.length > 0) {
                const prices = routeProducts.map((p) => getEffectivePricing(p).price);
                const min = Math.min(...prices);
                const max = Math.max(...prices);
                setPriceRange({ min, max });
                setFilterRange([min, max]);
            }
        } else {
            setCategoryData(null);
            setBreadcrumbs([]);
        }
    }, [categoryName, subPath, products, categories, productsLoading, categoriesLoading]);

    // Integrate Cached Subcategories Hook
    const dbId = categoryData?._id || categoryData?.id;
    const { subCategories: detailedSubCategories, loading: subsLoading } = useSubCategoriesByCategory(dbId);

    useEffect(() => {
        setSortBy('popularity');
        setSelectedBrands([]);
        setSelectedRam([]);
        setSelectedCategories([]);
        setSelectedDiscount(null);
        setBrandSearch('');
        setShowAllBrands(false);
        setShowAllRam(false);
        setShowAllCategories(false);
        setCollapsedSections({});
        setFilterRange([0, 1000000]);
        setPriceRange({ min: 0, max: 1000000 });
        setCurrentPage(1);
    }, [categoryName, subPath]);

    useEffect(() => {
        let updated = [...categoryProducts];
        updated = updated.filter((p) => {
            const { price } = getEffectivePricing(p);
            return price >= filterRange[0] && price <= filterRange[1];
        });
        if (sortBy === 'price-low') {
            updated.sort((a, b) => getEffectivePricing(a).price - getEffectivePricing(b).price);
        } else if (sortBy === 'price-high') {
            updated.sort((a, b) => getEffectivePricing(b).price - getEffectivePricing(a).price);
        } else if (sortBy === 'rating') {
            updated.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        }
        if (selectedCategories.length > 0) {
            updated = updated.filter(p =>
                Array.isArray(p.tags) && p.tags.some((tag) =>
                    selectedCategories.some((selected) => normalizeText(selected) === normalizeText(tag))
                )
            );
        }
        if (selectedBrands.length > 0) {
            updated = updated.filter((p) =>
                p.brand && selectedBrands.some((brand) => normalizeText(brand) === normalizeText(p.brand))
            );
        }
        if (selectedRam.length > 0) {
            updated = updated.filter((p) =>
                p.ram && selectedRam.some((ram) => normalizeText(ram) === normalizeText(p.ram))
            );
        }
        if (selectedDiscount) {
            updated = updated.filter((p) => {
                const { discountPercent } = getEffectivePricing(p);
                return discountPercent >= selectedDiscount;
            });
        }
        setSortedProducts(updated);
        setCurrentPage(1);
    }, [sortBy, filterRange, selectedBrands, selectedRam, selectedCategories, selectedDiscount, categoryProducts]);

    const availableBrands = [...new Set(categoryProducts.map(p => String(p.brand || '').trim()).filter(Boolean))];
    const availableRam = [...new Set(categoryProducts.map(p => String(p.ram || '').trim()).filter(Boolean))];
    const availableCategories = [...new Set(
        categoryProducts
            .flatMap(p => p.tags || [])
            .map((tag) => String(tag || '').trim())
            .filter(tag => normalizeText(tag) !== normalizeText(categoryData?.name))
            .filter(Boolean)
    )];

    const toggleBrand = (brand) => setSelectedBrands(prev => prev.includes(brand) ? prev.filter(b => b !== brand) : [...prev, brand]);
    const toggleRam = (ram) => setSelectedRam(prev => prev.includes(ram) ? prev.filter(r => r !== ram) : [...prev, ram]);
    const toggleCategory = (category) => setSelectedCategories(prev => prev.includes(category) ? prev.filter(c => c !== category) : [...prev, category]);
    const toggleSection = (section) => setCollapsedSections(prev => ({ ...prev, [section]: !prev[section] }));
    const handlePriceInputChange = (index, value) => {
        const numValue = parseInt(value) || 0;
        const newRange = [...filterRange];
        newRange[index] = numValue;
        setFilterRange(newRange);
    };
    const resetAllFilters = () => {
        setFilterRange([priceRange.min, priceRange.max]);
        setSelectedBrands([]);
        setSelectedRam([]);
        setSelectedCategories([]);
        setSelectedDiscount(null);
    };

    const filteredBrands = availableBrands.filter(brand => brand.toLowerCase().includes(brandSearch.toLowerCase()));
    const displayedBrands = showAllBrands ? filteredBrands : filteredBrands.slice(0, 6);
    const displayedRam = showAllRam ? availableRam : availableRam.slice(0, 6);
    const displayedCategories = showAllCategories ? availableCategories : availableCategories.slice(0, 6);
    const totalPages = Math.max(1, Math.ceil(sortedProducts.length / PAGE_SIZE));
    const safeCurrentPage = Math.min(currentPage, totalPages);
    const startIndex = (safeCurrentPage - 1) * PAGE_SIZE;
    const endIndex = startIndex + PAGE_SIZE;
    const currentPageProducts = sortedProducts.slice(startIndex, endIndex);
    const pageStartLabel = sortedProducts.length > 0 ? startIndex + 1 : 0;
    const pageEndLabel = Math.min(endIndex, sortedProducts.length);

    if (productsLoading || categoriesLoading) return <CategoryPageSkeleton />;
    if (fetchError) return <div className="p-10 text-center text-red-500">{fetchError}</div>;
    if (!categoryData) return <div className="p-10 text-center">Category not found</div>;

    const isSubCategoryLandingView = !routeHasExplicitSubPath && breadcrumbs.length === 1;
    const gridSubCategories = detailedSubCategories.length > 0 ? detailedSubCategories : categoryData.subCategories || [];

    return (
        <div className="bg-white min-h-screen pb-36 md:pb-10">
            <div className="bg-white shadow-sm border-b border-gray-200 md:sticky md:top-[116px] z-40">
                <div className="max-w-[1440px] mx-auto px-4 pt-3 pb-3">
                    <div className="flex items-center gap-3">
                        <button onClick={handleBackNavigation} className="bg-gray-50 p-2 rounded-full hover:bg-gray-100 transition-colors"><MdArrowBack className="text-xl text-gray-700"/></button>
                        <h1 className="text-base md:text-2xl font-bold md:font-black text-gray-900 capitalize tracking-tight">{categoryData.name}</h1>
                    </div>
                </div>
            </div>

            <div className="max-w-[1440px] mx-auto md:px-4 pt-1 pb-4 md:py-4 flex flex-col min-h-[calc(100vh-160px)]">
                <div className="flex flex-col lg:flex-row gap-4 h-full relative">
                    {!isSubCategoryLandingView && (
                        <aside className="hidden lg:block w-[280px] shrink-0 bg-white rounded-lg border border-gray-200 shadow-sm flex flex-col sticky top-[116px] h-fit">
                            <div className="px-4 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                                <h3 className="font-black text-gray-900 text-sm uppercase tracking-widest">Filters</h3>
                                <button onClick={resetAllFilters} className="text-[11px] font-black text-blue-600 hover:text-blue-700 uppercase">Clear All</button>
                            </div>
                            <div className="divide-y divide-gray-50 overflow-y-auto no-scrollbar max-h-[70vh]">
                                <div className="px-4 py-5">
                                    <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-4">Price Range</h4>
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="flex-1 bg-gray-50 border border-gray-200 rounded p-1.5"><span className="text-[9px] text-gray-400 block uppercase font-bold">Min</span><div className="flex items-center gap-0.5"><span className="text-xs font-black text-gray-900">₹</span><input type="number" value={filterRange[0]} onChange={(e) => handlePriceInputChange(0, e.target.value)} className="w-full bg-transparent text-xs font-black focus:outline-none"/></div></div>
                                        <div className="w-2 h-[1px] bg-gray-300"></div>
                                        <div className="flex-1 bg-gray-50 border border-gray-200 rounded p-1.5"><span className="text-[9px] text-gray-400 block uppercase font-bold">Max</span><div className="flex items-center gap-0.5"><span className="text-xs font-black text-gray-900">₹</span><input type="number" value={filterRange[1]} onChange={(e) => handlePriceInputChange(1, e.target.value)} className="w-full bg-transparent text-xs font-black focus:outline-none"/></div></div>
                                    </div>
                                </div>
                            </div>
                        </aside>
                    )}

                    <main className={`flex-1 min-w-0 ${isSubCategoryLandingView ? '' : 'md:pr-2'}`}>
                        {isSubCategoryLandingView ? (
                            <div className="md:rounded-lg overflow-hidden relative">
                                <SubCategoryList
                                    subCategories={gridSubCategories}
                                    categoryName={breadcrumbs[0]?.name}
                                    smallBanners={breadcrumbs[0]?.smallBanners || categoryData.smallBanners || []}
                                    secondaryBannerTitle={breadcrumbs[0]?.secondaryBannerTitle || categoryData.secondaryBannerTitle || ''}
                                    secondaryBanners={breadcrumbs[0]?.secondaryBanners || categoryData.secondaryBanners || []}
                                />
                            </div>
                        ) : (
                            <div className="bg-white md:rounded-lg md:shadow-sm border border-gray-100 p-3 md:p-6 min-h-[600px]">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">Product List<div className="h-1.5 w-1.5 rounded-full bg-blue-600"></div></h2>
                                    <span className="text-[11px] font-bold text-gray-400 uppercase">Total {sortedProducts.length} Items</span>
                                </div>
                                {sortedProducts.length > 0 ? (
                                    <>
                                        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-5">
                                            {currentPageProducts.map((p) => <ProductCard key={p.id || p._id} product={p} />)}
                                        </div>
                                        {totalPages > 1 && (
                                            <div className="mt-8 flex flex-col items-center gap-3">
                                                <p className="text-xs text-gray-500 font-semibold">Showing {pageStartLabel}-{pageEndLabel} of {sortedProducts.length}</p>
                                                <div className="flex items-center gap-2">
                                                    <button onClick={() => setCurrentPage(p => Math.max(1, p-1))} disabled={safeCurrentPage === 1} className="px-3 py-2 border rounded-lg disabled:opacity-30">Prev</button>
                                                    <span className="px-3 py-2 bg-blue-50 text-blue-600 font-bold rounded-lg">{safeCurrentPage} / {totalPages}</span>
                                                    <button onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))} disabled={safeCurrentPage === totalPages} className="px-3 py-2 border rounded-lg disabled:opacity-30">Next</button>
                                                </div>
                                            </div>
                                        )}
                                    </>
                                ) : ( <div className="text-center py-24">No products found.</div> )}
                            </div>
                        )}
                    </main>
                </div>
            </div>

            {!isSubCategoryLandingView && (
                <div className="lg:hidden fixed bottom-[calc(76px+env(safe-area-inset-bottom))] left-0 right-0 bg-white border-t h-14 flex z-40">
                    <button onClick={() => setShowSortModal(true)} className="flex-1 border-r text-xs font-black uppercase tracking-widest">Sort By</button>
                    <button onClick={() => setShowFilterModal(true)} className="flex-1 text-xs font-black uppercase tracking-widest">Filters</button>
                </div>
            )}
            <BottomNav />

            {/* Mobile Modals (Sort & Filter) */}
            {showSortModal && (
                <div className="fixed inset-0 z-[100] flex items-end">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={() => setShowSortModal(false)}></div>
                    <div className="relative w-full bg-white rounded-t-2xl p-6 animate-in slide-in-from-bottom duration-300">
                        <div className="flex items-center justify-between mb-4 border-b pb-4"><h3 className="font-black text-gray-900 uppercase tracking-widest text-xs">Sort By</h3><button onClick={() => setShowSortModal(false)} className="material-icons text-gray-400">close</button></div>
                        <div className="space-y-1">
                            {['popularity', 'price-low', 'price-high', 'rating'].map(id => (
                                <button key={id} onClick={() => { setSortBy(id); setShowSortModal(false); }} className={`w-full text-left py-4 px-4 rounded-xl text-sm font-bold ${sortBy === id ? 'bg-blue-50 text-blue-600' : 'text-gray-600'}`}>{id.replace('-', ' ')}</button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
            {showFilterModal && (
                <div className="fixed inset-0 z-[100] bg-white animate-in slide-in-from-right duration-300">
                    <div className="h-full flex flex-col">
                        <div className="px-5 py-4 border-b flex items-center justify-between">
                            <div className="flex items-center gap-4"><button onClick={() => setShowFilterModal(false)} className="material-icons text-gray-900">arrow_back</button><h3 className="font-black text-gray-900 uppercase text-xs tracking-widest">Filters</h3></div>
                            <button onClick={resetAllFilters} className="text-[11px] font-black text-blue-600 uppercase">Clear all</button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-5"><h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Price Range</h4><div className="grid grid-cols-2 gap-4"><div className="bg-gray-50 p-3 rounded-lg border border-gray-100"><span className="text-[9px] text-gray-400 block uppercase font-bold">Min</span><div className="font-black text-sm">₹{filterRange[0]}</div></div><div className="bg-gray-50 p-3 rounded-lg border border-gray-100"><span className="text-[9px] text-gray-400 block uppercase font-bold">Max</span><div className="font-black text-sm">₹{filterRange[1]}</div></div></div></div>
                        <div className="p-4 border-t"><button onClick={() => setShowFilterModal(false)} className="w-full bg-blue-600 text-white py-4 rounded-xl font-black uppercase text-xs tracking-widest">Apply Filters</button></div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CategoryPage;
