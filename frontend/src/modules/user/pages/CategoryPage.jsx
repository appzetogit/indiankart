import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MdArrowBack } from 'react-icons/md';
import API from '../../../services/api';
import { useCategories } from '../../../hooks/useData';
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
    const { categories, loading: categoriesLoading } = useCategories();
    const [products, setProducts] = useState([]);
    const [productsLoading, setProductsLoading] = useState(true);

    const [categoryData, setCategoryData] = useState(null);
    const [breadcrumbs, setBreadcrumbs] = useState([]);
    const [categoryProducts, setCategoryProducts] = useState([]);
    const [sortedProducts, setSortedProducts] = useState([]);
    const [showSortModal, setShowSortModal] = useState(false);
    const [showFilterModal, setShowFilterModal] = useState(false);
    const [sortBy, setSortBy] = useState('popularity'); // popularity, price-low, price-high, rating
    // Price Range Filter State
    const [filterRange, setFilterRange] = useState([0, 1000000]); // High default
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
        // React Router sets history.state.idx for in-app entries.
        if (window.history.state?.idx > 0) {
            navigate(-1);
            return;
        }
        navigate('/');
    };

    useEffect(() => {
        let active = true;

        const fetchCategoryProducts = async () => {
            setProductsLoading(true);
            setFetchError('');

            try {
                const params = new URLSearchParams();
                if (categoryName) {
                    params.set('category', decodeURIComponent(categoryName));
                }

                const segments = String(subPath || '').split('/').filter(Boolean);
                const leafSubCategory = segments.length > 0 ? decodeURIComponent(segments[segments.length - 1]) : '';
                if (leafSubCategory) {
                    params.set('subcategory', leafSubCategory);
                }

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

        return () => {
            active = false;
        };
    }, [categoryName, subPath]);

    useEffect(() => {
        // Reset transient filters on route change so previous category filters
        // don't hide results on a new category/subcategory page.
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
    }, [categoryName, subPath]);

    useEffect(() => {
        window.scrollTo(0, 0);

        if (productsLoading || categoriesLoading) return;

        const result = resolveCategoryPath(categories, products, categoryName, subPath);
        const explicitSubPath = String(subPath || '').split('/').filter(Boolean).length > 0;

        if (result && result.data) {
            setCategoryData(result.data);
            setBreadcrumbs(result.breadcrumbs || []);

            // For explicit sub-path routes like /category/Mobiles/VIVO, products are
            // already filtered by backend query. Avoid re-filtering through resolver
            // (which can be stricter for mixed legacy product shapes).
            const routeProducts = explicitSubPath ? products : result.products;

            setCategoryProducts(routeProducts);
            setSortedProducts(routeProducts);

            // Calculate price range from products
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

    useEffect(() => {
        let updated = [...categoryProducts];

        // Apply Price Filter (first variant price if variants exist)
        updated = updated.filter((p) => {
            const { price } = getEffectivePricing(p);
            return price >= filterRange[0] && price <= filterRange[1];
        });

        // Apply Sorting
        if (sortBy === 'price-low') {
            updated.sort((a, b) => getEffectivePricing(a).price - getEffectivePricing(b).price);
        } else if (sortBy === 'price-high') {
            updated.sort((a, b) => getEffectivePricing(b).price - getEffectivePricing(a).price);
        } else if (sortBy === 'rating') {
            updated.sort((a, b) => b.rating - a.rating);
        }

        // Apply Category Filter (now filtering by subcategories from tags)
        if (selectedCategories.length > 0) {
            updated = updated.filter(p =>
                Array.isArray(p.tags) && p.tags.some((tag) =>
                    selectedCategories.some((selected) => normalizeText(selected) === normalizeText(tag))
                )
            );
        }

        // Apply Brand Filter
        if (selectedBrands.length > 0) {
            updated = updated.filter((p) =>
                p.brand && selectedBrands.some((brand) => normalizeText(brand) === normalizeText(p.brand))
            );
        }

        // Apply RAM Filter
        if (selectedRam.length > 0) {
            updated = updated.filter((p) =>
                p.ram && selectedRam.some((ram) => normalizeText(ram) === normalizeText(p.ram))
            );
        }

        // Apply Discount Filter
        if (selectedDiscount) {
            updated = updated.filter((p) => {
                const { discountPercent } = getEffectivePricing(p);
                return discountPercent >= selectedDiscount;
            });
        }

        setSortedProducts(updated);
    }, [sortBy, filterRange, selectedBrands, selectedRam, selectedCategories, selectedDiscount, categoryProducts]);

    useEffect(() => {
        setCurrentPage(1);
    }, [categoryName, subPath, sortBy, filterRange, selectedBrands, selectedRam, selectedCategories, selectedDiscount, categoryProducts]);

    // Unique Brands, RAM, and Subcategories from tags
    const availableBrands = [...new Set(categoryProducts.map(p => String(p.brand || '').trim()).filter(Boolean))];
    const availableRam = [...new Set(categoryProducts.map(p => String(p.ram || '').trim()).filter(Boolean))];

    // Extract subcategories from tags, excluding the main category name
    const availableCategories = [...new Set(
        categoryProducts
            .flatMap(p => p.tags || [])
            .map((tag) => String(tag || '').trim())
            .filter(tag => normalizeText(tag) !== normalizeText(categoryData?.name)) // Exclude main category
            .filter(Boolean)
    )];

    const toggleBrand = (brand) => {
        setSelectedBrands(prev => prev.includes(brand) ? prev.filter(b => b !== brand) : [...prev, brand]);
    };

    const toggleRam = (ram) => {
        setSelectedRam(prev => prev.includes(ram) ? prev.filter(r => r !== ram) : [...prev, ram]);
    };

    const toggleCategory = (category) => {
        setSelectedCategories(prev => prev.includes(category) ? prev.filter(c => c !== category) : [...prev, category]);
    };

    const toggleSection = (section) => {
        setCollapsedSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

    // Filter brands by search
    const filteredBrands = availableBrands.filter(brand =>
        brand.toLowerCase().includes(brandSearch.toLowerCase())
    );

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

    // Show limited items
    const displayedBrands = showAllBrands ? filteredBrands : filteredBrands.slice(0, 6);
    const displayedRam = showAllRam ? availableRam : availableRam.slice(0, 6);
    const displayedCategories = showAllCategories ? availableCategories : availableCategories.slice(0, 6);
    const hasExplicitSubPath = String(subPath || '').split('/').filter(Boolean).length > 0;
    const totalPages = Math.max(1, Math.ceil(sortedProducts.length / PAGE_SIZE));
    const safeCurrentPage = Math.min(currentPage, totalPages);
    const startIndex = (safeCurrentPage - 1) * PAGE_SIZE;
    const endIndex = startIndex + PAGE_SIZE;
    const currentPageProducts = sortedProducts.slice(startIndex, endIndex);

    const pageStartLabel = sortedProducts.length > 0 ? startIndex + 1 : 0;
    const pageEndLabel = Math.min(endIndex, sortedProducts.length);

    if (productsLoading || categoriesLoading) {
        return <CategoryPageSkeleton />;
    }

    if (fetchError) {
        return <div className="p-10 text-center text-red-500">{fetchError}</div>;
    }

    if (!categoryData) {
        return <div className="p-10 text-center">Category not found</div>;
    }

    const isSubCategoryLandingView = !hasExplicitSubPath && breadcrumbs.length === 1;
    return (
        <div className="bg-white min-h-screen pb-36 md:pb-10">
            {/* Header / Breadcrumbs Section */}
            <div className="bg-white shadow-sm border-b border-gray-200 md:sticky md:top-[116px] z-40">
                <div className="max-w-[1440px] mx-auto px-4 pt-3 pb-3 md:pt-3 md:pb-3">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleBackNavigation}
                            className="bg-gray-50 p-2 rounded-full hover:bg-gray-100 transition-colors group"
                        >
                            <MdArrowBack className="text-xl text-gray-700" />
                        </button>

                        <h1 className="text-base md:text-2xl font-bold md:font-black text-gray-900 capitalize tracking-tight">
                            {categoryData.name}
                        </h1>
                    </div>
                </div>
            </div>

            <div className="max-w-[1440px] mx-auto md:px-4 pt-1 pb-4 md:py-4 min-h-[calc(100vh-160px)] md:min-h-[calc(100vh-144px)] flex flex-col">
                <div className="flex flex-col lg:flex-row gap-4 h-full relative">

                    {/* LEFT SIDEBAR (Desktop) */}
                    {!isSubCategoryLandingView && (
                        <aside className="hidden lg:block w-[280px] shrink-0 h-full overflow-hidden bg-white rounded-lg border border-gray-200 shadow-sm flex flex-col sticky top-[116px]">
                        <div className="px-4 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50 shrink-0 z-10">
                            <h3 className="font-black text-gray-900 text-sm uppercase tracking-widest">Filters</h3>
                            <button
                                onClick={resetAllFilters}
                                className="text-[11px] font-black text-blue-600 hover:text-blue-700 uppercase tracking-wider"
                            >
                                Clear All
                            </button>
                        </div>

                        <div className="divide-y divide-gray-50 overflow-y-auto custom-scrollbar flex-1">
                            {/* Price Slider Section */}
                            <div className="px-4 py-5">
                                <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-4">Price Range</h4>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="flex-1 bg-gray-50 border border-gray-200 rounded p-1.5 focus-within:border-blue-500 transition-colors">
                                            <span className="text-[9px] text-gray-400 block uppercase font-bold">Min</span>
                                            <div className="flex items-center gap-0.5">
                                                <span className="text-xs font-black text-gray-900">₹</span>
                                                <input
                                                    type="number"
                                                    value={filterRange[0]}
                                                    onChange={(e) => handlePriceInputChange(0, e.target.value)}
                                                    className="w-full bg-transparent text-xs font-black text-gray-900 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                />
                                            </div>
                                        </div>
                                        <div className="w-2 h-[1px] bg-gray-300"></div>
                                        <div className="flex-1 bg-gray-50 border border-gray-200 rounded p-1.5 focus-within:border-blue-500 transition-colors">
                                            <span className="text-[9px] text-gray-400 block uppercase font-bold">Max</span>
                                            <div className="flex items-center gap-0.5">
                                                <span className="text-xs font-black text-gray-900">₹</span>
                                                <input
                                                    type="number"
                                                    value={filterRange[1]}
                                                    onChange={(e) => handlePriceInputChange(1, e.target.value)}
                                                    className="w-full bg-transparent text-xs font-black text-gray-900 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap gap-1.5">
                                        {[
                                            { label: '< ₹5k', range: [0, 5000] },
                                            { label: '₹5k-15k', range: [5000, 15000] },
                                            { label: '₹15k-30k', range: [15000, 30000] },
                                            { label: '30k+', range: [30000, 1000000] }
                                        ].map(r => (
                                            <button
                                                key={r.label}
                                                onClick={() => setFilterRange(r.range)}
                                                className={`px-2 py-1 text-[10px] font-bold rounded border transition-all ${JSON.stringify(filterRange) === JSON.stringify(r.range)
                                                    ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-100'
                                                    : 'bg-white border-gray-200 text-gray-600 hover:border-blue-400'
                                                    }`}
                                            >
                                                {r.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Category Specific Filters (e.g. Brands) */}
                            {availableBrands.length > 0 && (
                                <div className="px-4 py-5">
                                    <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-3">Brand</h4>
                                    <div className="relative mb-3">
                                        <span className="material-icons absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-sm">search</span>
                                        <input
                                            type="text"
                                            placeholder="Search Brand"
                                            value={brandSearch}
                                            onChange={(e) => setBrandSearch(e.target.value)}
                                            className="w-full pl-8 pr-3 py-1.5 text-[12px] bg-gray-50 border border-gray-100 rounded focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                                        />
                                    </div>
                                    <div className="space-y-2 max-h-48 overflow-y-auto no-scrollbar">
                                        {displayedBrands.map(brand => (
                                            <label key={brand} className="flex items-center gap-3 cursor-pointer group">
                                                <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${selectedBrands.includes(brand) ? 'bg-blue-600 border-blue-600' : 'border-gray-300 bg-white group-hover:border-blue-400'
                                                    }`}>
                                                    {selectedBrands.includes(brand) && <span className="material-icons text-white text-[12px] font-bold">check</span>}
                                                    <input
                                                        type="checkbox"
                                                        className="hidden"
                                                        checked={selectedBrands.includes(brand)}
                                                        onChange={() => toggleBrand(brand)}
                                                    />
                                                </div>
                                                <span className={`text-[13px] font-medium transition-colors ${selectedBrands.includes(brand) ? 'text-blue-600 font-bold' : 'text-gray-600'}`}>
                                                    {brand}
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                    {filteredBrands.length > 6 && (
                                        <button
                                            onClick={() => setShowAllBrands(!showAllBrands)}
                                            className="mt-3 text-[10px] font-black text-blue-600 uppercase tracking-wider flex items-center gap-1 hover:gap-2 transition-all"
                                        >
                                            {showAllBrands ? 'Show Less' : `+${filteredBrands.length - 6} More`}
                                        </button>
                                    )}
                                </div>
                            )}

                            {/* Discount Section */}
                            <div className="px-4 py-5">
                                <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-3">Discount</h4>
                                <div className="space-y-2.5">
                                    {[20, 30, 40, 50].map(val => (
                                        <label key={val} className="flex items-center gap-3 cursor-pointer group">
                                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${selectedDiscount === val ? 'border-blue-600 border-[5px]' : 'border-gray-300 bg-white group-hover:border-blue-400'
                                                }`}>
                                                <input
                                                    type="radio"
                                                    name="discount"
                                                    className="hidden"
                                                    checked={selectedDiscount === val}
                                                    onChange={() => setSelectedDiscount(val)}
                                                />
                                            </div>
                                            <span className={`text-[13px] font-medium ${selectedDiscount === val ? 'text-blue-600 font-bold' : 'text-gray-600'}`}>
                                                {val}% or more
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>
                        </aside>
                    )}

                    {/* MAIN CONTENT AREA */}
                    <main className={`flex-1 min-w-0 h-full overflow-y-auto no-scrollbar ${isSubCategoryLandingView ? '' : 'md:pr-2'}`}>
                        {isSubCategoryLandingView ? (
                            <div className="md:rounded-lg md:overflow-hidden">
                                <SubCategoryList
                                    subCategories={categoryData.subCategories}
                                    categoryName={breadcrumbs[0]?.name}
                                    smallBanners={breadcrumbs[0]?.smallBanners || categoryData.smallBanners || []}
                                    secondaryBannerTitle={breadcrumbs[0]?.secondaryBannerTitle || categoryData.secondaryBannerTitle || ''}
                                    secondaryBanners={breadcrumbs[0]?.secondaryBanners || categoryData.secondaryBanners || []}
                                />
                            </div>
                        ) : (
                            <>
                                {/* Highlights / Subcategories */}
                                {categoryData.subCategories?.length > 0 && (
                            <div className="bg-white md:rounded-lg md:shadow-sm border border-gray-100 mb-4">
                                <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between">
                                    <h2 className="text-[13px] font-black text-gray-900 uppercase tracking-[2px]">Shop by Department</h2>
                                    <span className="material-icons text-gray-300">chevron_right</span>
                                </div>
                                    <SubCategoryList
                                        subCategories={categoryData.subCategories}
                                        categoryName={breadcrumbs[0]?.name}
                                        smallBanners={breadcrumbs[0]?.smallBanners || []}
                                        secondaryBannerTitle={breadcrumbs[0]?.secondaryBannerTitle || ''}
                                        secondaryBanners={breadcrumbs[0]?.secondaryBanners || []}
                                    />
                            </div>
                                )}

                                {/* Product Grid Area */}
                                <div className="bg-white md:rounded-lg md:shadow-sm border border-gray-100 p-3 md:p-6 min-h-[600px]">
                            {/* Product Header */}
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
                                    Product List
                                    <div className="h-1.5 w-1.5 rounded-full bg-blue-600"></div>
                                </h2>
                                <div className="hidden md:flex items-center gap-2">
                                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Results for {categoryData.name}</span>
                                </div>
                            </div>

                            {sortedProducts.length > 0 ? (
                                <>
                                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-5">
                                    {currentPageProducts.map((product) => {
                                        const pricing = getEffectivePricing(product);
                                        return (
                                            <div key={product.id || product._id} className="h-full">
                                                <ProductCard
                                                    product={{
                                                        ...product,
                                                        price: pricing.price,
                                                        originalPrice: pricing.originalPrice,
                                                        discount: pricing.discountPercent > 0
                                                            ? `${pricing.discountPercent}% OFF`
                                                            : product.discount
                                                    }}
                                                />
                                            </div>
                                        );
                                    })}
                                </div>
                                {totalPages > 1 && (
                                    <div className="mt-8 flex flex-col items-center gap-3">
                                        <p className="text-xs text-gray-500 font-semibold">
                                            Showing {pageStartLabel}-{pageEndLabel} of {sortedProducts.length} products
                                        </p>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                                                disabled={safeCurrentPage === 1}
                                                className="px-3 py-2 text-xs font-bold rounded-lg border border-gray-200 text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                                            >
                                                Prev
                                            </button>
                                            <span className="px-3 py-2 text-xs font-black bg-blue-50 text-blue-600 rounded-lg border border-blue-100">
                                                {safeCurrentPage} / {totalPages}
                                            </span>
                                            <button
                                                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                                                disabled={safeCurrentPage === totalPages}
                                                className="px-3 py-2 text-xs font-bold rounded-lg border border-gray-200 text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                                            >
                                                Next
                                            </button>
                                        </div>
                                    </div>
                                )}
                                </>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-24 text-center">
                                    <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mb-6">
                                        <span className="material-icons text-blue-200 text-5xl">inventory_2</span>
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900 mb-2">No products found</h3>
                                    <p className="text-gray-500 text-sm max-w-xs mb-8">Try adjusting your filters or search terms to find what you're looking for.</p>
                                    <button
                                        onClick={resetAllFilters}
                                        className="bg-blue-600 text-white px-8 py-3 rounded-lg font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-100 hover:scale-105 active:scale-95 transition-all"
                                    >
                                        Clear All Filters
                                    </button>
                                </div>
                            )}
                        </div>
                            </>
                        )}
                    </main>
                </div>
            </div>

            {/* Sticky Mobile Sort/Filter Bar */}
            {!isSubCategoryLandingView && (
                <div className="lg:hidden fixed bottom-[calc(76px+env(safe-area-inset-bottom))] left-0 right-0 bg-white border-t border-gray-200 h-14 flex z-40 shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
                    <button
                        onClick={() => setShowSortModal(true)}
                        className="flex-1 flex items-center justify-center gap-2.5 border-r border-gray-100 group active:bg-gray-50 transition-colors"
                    >
                        <span className="material-icons text-[20px] text-gray-400 group-hover:text-blue-600 transition-colors">sort</span>
                        <span className="text-xs font-black text-gray-700 uppercase tracking-widest">Sort By</span>
                    </button>
                    <button
                        onClick={() => setShowFilterModal(true)}
                        className="flex-1 flex items-center justify-center gap-2.5 group active:bg-gray-50 transition-colors"
                    >
                        <span className="material-icons text-[20px] text-gray-400 group-hover:text-blue-600 transition-colors">tune</span>
                        <span className="text-xs font-black text-gray-700 uppercase tracking-widest">Filters</span>
                    </button>
                </div>
            )}

            <BottomNav />

            {/* Mobile Modals (Sort & Filter) - Consistent with the new aesthetic */}
            {!isSubCategoryLandingView && showSortModal && (
                <div className="fixed inset-0 z-[100] flex items-end justify-center">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" onClick={() => setShowSortModal(false)}></div>
                    <div className="relative w-full bg-white rounded-t-3xl shadow-2xl animate-in slide-in-from-bottom duration-300">
                        <div className="h-1.5 w-12 bg-gray-200 rounded-full mx-auto mt-3 mb-1"></div>
                        <div className="px-6 py-4 flex items-center justify-between border-b border-gray-50">
                            <h3 className="font-black text-gray-900 uppercase text-[11px] tracking-[2px]">Sort Options</h3>
                            <button onClick={() => setShowSortModal(false)} className="material-icons text-gray-300">close</button>
                        </div>
                        <div className="p-4 space-y-1">
                            {[
                                { id: 'popularity', label: 'Popularity', desc: 'Highest rated first' },
                                { id: 'price-low', label: 'Price: Low to High', desc: 'Budget friendly first' },
                                { id: 'price-high', label: 'Price: High to Low', desc: 'Premium first' },
                                { id: 'rating', label: 'Customer Rating', desc: 'Trust verified first' }
                            ].map((opt) => (
                                <button
                                    key={opt.id}
                                    onClick={() => { setSortBy(opt.id); setShowSortModal(false); }}
                                    className={`w-full flex items-center justify-between p-4 rounded-xl transition-all ${sortBy === opt.id ? 'bg-blue-50 text-blue-600' : 'active:bg-gray-50 text-gray-700'
                                        }`}
                                >
                                    <div className="text-left">
                                        <p className="font-bold text-sm tracking-tight">{opt.label}</p>
                                        <p className={`text-[10px] font-medium ${sortBy === opt.id ? 'text-blue-400' : 'text-gray-400'}`}>{opt.desc}</p>
                                    </div>
                                    {sortBy === opt.id && <span className="material-icons text-xl">check_circle</span>}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Filter Modal Mobile */}
            {!isSubCategoryLandingView && showFilterModal && (
                <div className="fixed inset-0 z-[100] bg-white animate-in slide-in-from-right duration-300">
                    <div className="h-full flex flex-col">
                        <div className="px-5 py-4 border-b flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <button onClick={() => setShowFilterModal(false)} className="material-icons text-gray-900">arrow_back</button>
                                <h3 className="font-black text-gray-900 uppercase text-xs tracking-widest">Filters</h3>
                            </div>
                            <button
                                onClick={resetAllFilters}
                                className="text-[11px] font-black text-blue-600 uppercase"
                            >
                                Clear all
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto bg-gray-50/50">
                            {/* Price */}
                            <div className="bg-white p-5 mb-2">
                                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Price Range</h4>
                                <div className="grid grid-cols-2 gap-3 mb-6">
                                    <div className="bg-gray-50 px-4 py-2 border border-gray-100 rounded-lg focus-within:border-blue-500">
                                        <span className="text-[9px] text-gray-400 block uppercase font-bold">Minimum</span>
                                        <div className="flex items-center gap-0.5">
                                            <span className="font-black text-sm">₹</span>
                                            <input
                                                type="number"
                                                value={filterRange[0]}
                                                onChange={(e) => handlePriceInputChange(0, e.target.value)}
                                                className="w-full bg-transparent font-black text-sm focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                            />
                                        </div>
                                    </div>
                                    <div className="bg-gray-50 px-4 py-2 border border-gray-100 rounded-lg focus-within:border-blue-500">
                                        <span className="text-[9px] text-gray-400 block uppercase font-bold">Maximum</span>
                                        <div className="flex items-center gap-0.5">
                                            <span className="font-black text-sm">₹</span>
                                            <input
                                                type="number"
                                                value={filterRange[1]}
                                                onChange={(e) => handlePriceInputChange(1, e.target.value)}
                                                className="w-full bg-transparent font-black text-sm focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {[
                                        { label: 'Under ₹5k', range: [0, 5000] },
                                        { label: '₹5k - ₹15k', range: [5000, 15000] },
                                        { label: '₹15k - ₹30k', range: [15000, 30000] },
                                        { label: 'Above ₹30k', range: [30000, 1000000] }
                                    ].map(r => (
                                        <button
                                            key={r.label}
                                            onClick={() => setFilterRange(r.range)}
                                            className={`px-4 py-2 rounded-full border text-[11px] font-bold transition-all ${JSON.stringify(filterRange) === JSON.stringify(r.range)
                                                ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-100'
                                                : 'bg-white border-gray-200 text-gray-600'
                                                }`}
                                        >
                                            {r.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Brands Mobile */}
                            {availableBrands.length > 0 && (
                                <div className="bg-white p-5 mb-2">
                                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Brands</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {availableBrands.map(brand => (
                                            <button
                                                key={brand}
                                                onClick={() => toggleBrand(brand)}
                                                className={`px-4 py-2 rounded-lg border text-[11px] font-bold transition-all ${selectedBrands.includes(brand)
                                                    ? 'bg-blue-50 border-blue-600 text-blue-600'
                                                    : 'bg-white border-gray-100 text-gray-600'
                                                    }`}
                                            >
                                                {brand}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Discounts Mobile */}
                            <div className="bg-white p-5 mb-2">
                                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Discount Offers</h4>
                                <div className="space-y-3">
                                    {[20, 30, 40, 50].map(val => (
                                        <div
                                            key={val}
                                            onClick={() => setSelectedDiscount(val)}
                                            className="flex items-center justify-between p-4 border border-gray-50 rounded-xl active:bg-blue-50 transition-colors"
                                        >
                                            <span className="text-sm font-bold text-gray-700">{val}% or more</span>
                                            <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${selectedDiscount === val ? 'bg-blue-600 border-blue-600' : 'border-gray-200'
                                                }`}>
                                                {selectedDiscount === val && <span className="material-icons text-white text-xs">check</span>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="p-4 bg-white shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
                            <button
                                onClick={() => setShowFilterModal(false)}
                                className="w-full bg-[#fb641b] text-white py-4 rounded-xl font-black uppercase text-xs tracking-[2px] shadow-xl shadow-orange-100 active:scale-[0.98] transition-all"
                            >
                                Apply {sortedProducts.length} Products
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CategoryPage;
