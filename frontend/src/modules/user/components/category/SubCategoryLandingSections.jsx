import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MdArrowForward } from 'react-icons/md';
import ProductCard from '../product/ProductCard';
import API from '../../../../services/api';
import { getPlaceholderImage, optimizeImage } from '../../../../utils/imageUtils';
import {
    mergeCategoryPageCatalogWithCategories,
    readCategoryPageCatalogAsync
} from '../../../../utils/subCategoryPageConfig';

const DESKTOP_BREAKPOINT = 768;
const normalizeText = (value) => String(value || '').trim();
const normalizeKey = (value) => normalizeText(value).toLowerCase();

const buildBrandRoute = (categoryName, subCategoryName, brandName) => {
    const categorySegment = encodeURIComponent(normalizeText(categoryName));
    const subCategorySegment = encodeURIComponent(normalizeText(subCategoryName));
    const brandSegment = encodeURIComponent(normalizeText(brandName));
    return `/category/${categorySegment}/${subCategorySegment}/${brandSegment}`;
};

const BrandQuickLinkGrid = ({ categoryName, subCategoryName, items = [] }) => {
    if (!categoryName || !subCategoryName || items.length === 0) return null;

    return (
        <div className="w-full">
            <div className="grid grid-cols-4 gap-x-1.5 gap-y-3 justify-items-start sm:grid-cols-5 sm:gap-x-2 sm:gap-y-4 md:grid-cols-8 md:gap-x-3 md:gap-y-6">
                {items.map((item) => (
                    <Link
                        key={item.id || item.name}
                        to={buildBrandRoute(categoryName, subCategoryName, item.name)}
                        className="flex w-full flex-col items-start text-left"
                    >
                        <div className="mb-1 flex h-[50px] w-[50px] items-center justify-center overflow-hidden rounded-[14px] bg-[#f0d1fb] shadow-[0_10px_20px_rgba(236,72,153,0.10)] sm:h-[58px] sm:w-[58px] sm:rounded-[18px] md:h-[108px] md:w-[108px] md:rounded-[22px]">
                            <img
                                src={optimizeImage(item.image || getPlaceholderImage(220, 220), { width: 220, quality: '80' })}
                                alt={item.name}
                                loading="lazy"
                                className="h-full w-full object-cover"
                                onError={(event) => {
                                    event.currentTarget.onerror = null;
                                    event.currentTarget.src = getPlaceholderImage(220, 220);
                                }}
                            />
                        </div>
                        <span className="line-clamp-2 text-[10px] font-medium leading-tight text-[#111827] sm:text-[11px] md:text-sm">
                            {item.name}
                        </span>
                    </Link>
                ))}
            </div>
        </div>
    );
};

const normalizeDesktopImageItemsPerRow = (value) => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return 0;
    const rounded = Math.round(parsed);
    if (rounded < 1) return 0;
    return Math.min(6, rounded);
};

const getSectionLayoutClass = (mediaDisplay, sectionKind) => {
    if (mediaDisplay === 'grid' && sectionKind === 'product') return 'grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-5 xl:grid-cols-4';
    if (mediaDisplay === 'grid') return 'grid grid-cols-2 gap-3';
    if (mediaDisplay === 'single') return 'block';
    return 'flex gap-3 overflow-x-auto no-scrollbar pb-1';
};

const getDesktopImageGridStyle = (section, isDesktop = false) => {
    if (!isDesktop) return undefined;
    if (section?.sectionKind !== 'image' || section?.mediaDisplay !== 'grid') return undefined;
    const desktopItemsPerRow = normalizeDesktopImageItemsPerRow(section?.desktopImageItemsPerRow);
    if (!desktopItemsPerRow) return undefined;
    return {
        display: 'inline-grid',
        gridTemplateColumns: `repeat(${desktopItemsPerRow}, max-content)`,
        justifyContent: 'start',
        maxWidth: '100%'
    };
};

const getCardWidthClass = (mediaDisplay) => {
    if (mediaDisplay === 'single') return 'w-full';
    if (mediaDisplay === 'grid') return 'w-full';
    return 'w-[120px] shrink-0';
};

const getProductCardWrapClass = (mediaDisplay) => {
    if (mediaDisplay === 'grid') return 'w-full min-w-0';
    return 'w-[calc((100%-0.75rem)/2)] min-w-[calc((100%-0.75rem)/2)] shrink-0 md:w-[calc((100%-2.5rem)/3)] md:min-w-[calc((100%-2.5rem)/3)] xl:w-[calc((100%-3.75rem)/4)] xl:min-w-[calc((100%-3.75rem)/4)]';
};

const normalizeImageRatio = (value) => {
    const normalized = String(value || '').trim().toLowerCase();
    if (['square', 'portrait', 'banner', 'auto'].includes(normalized)) return normalized;
    return 'square';
};

const parsePositiveNumber = (value) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
};

const getSectionCustomWidth = (section) => parsePositiveNumber(section?.imageWidth);

const getSectionAspectRatio = (section) => {
    const width = getSectionCustomWidth(section);
    if (width > 0) return '';
    const ratio = normalizeImageRatio(section?.imageRatio);
    if (ratio === 'portrait') return '3 / 4';
    if (ratio === 'banner') return '16 / 5';
    if (ratio === 'square') return '1 / 1';
    return '';
};

const getImageCardStyle = (section, mediaDisplay, itemType, isDesktop = false) => {
    if (itemType !== 'image') return undefined;
    const width = getSectionCustomWidth(section);
    if (isDesktop && width > 0) {
        if (mediaDisplay === 'scroll') {
            if (section?.sectionKind === 'banner') {
                return {
                    width: `min(${width}px, 100%)`
                };
            }
            return {
                width: `${width}px`
            };
        }
        if (mediaDisplay === 'grid') {
            if (section?.sectionKind === 'image' && normalizeDesktopImageItemsPerRow(section?.desktopImageItemsPerRow)) {
                return {
                    width: `${width}px`,
                    justifySelf: 'start'
                };
            }
            return {
                width: '100%',
                maxWidth: `min(${width}px, 100%)`,
                justifySelf: 'center'
            };
        }
    }
    if (mediaDisplay === 'scroll' && width > 0) {
        if (section?.sectionKind === 'banner') {
            return {
                width: `min(${width}px, calc((100vw - 3rem) / 1.35))`
            };
        }
        return {
            width: `min(${width}px, calc((100vw - 4rem) / 2), 180px)`
        };
    }
    if (mediaDisplay === 'scroll') {
        return { width: 'calc((100vw - 4rem) / 2)' };
    }
    if (width > 0 && mediaDisplay === 'grid') {
        return {
            width: '100%',
            maxWidth: `min(${width}px, calc((100vw - 4rem) / 2))`,
            justifySelf: 'center'
        };
    }
    return undefined;
};

const getImageFrameStyle = (section, itemType, mediaDisplay) => {
    if (itemType !== 'image') return undefined;
    if (mediaDisplay === 'single' || mediaDisplay === 'carousel') return undefined;
    return undefined;
};

const getImageHeightClass = (mediaDisplay, itemType, imageRatio = 'square') => {
    if (itemType === 'image') {
        const ratio = normalizeImageRatio(imageRatio);
        if (ratio === 'auto') return 'h-auto';
        if (ratio === 'portrait') return 'aspect-[3/4]';
        if (ratio === 'banner') return 'aspect-[16/5]';
        return 'aspect-square';
    }
    if (mediaDisplay === 'single') return 'aspect-[16/7]';
    return 'aspect-square';
};

const getImageFitClass = (mediaDisplay, itemType, imageRatio = 'square') => {
    if (itemType === 'image') {
        return 'object-contain';
    }
    if (mediaDisplay === 'single') return 'object-cover';
    if (mediaDisplay === 'carousel') return 'object-contain';
    return 'object-cover';
};

const getCardSurfaceClass = (itemType) => {
    if (itemType === 'image') return 'bg-white/95 shadow-sm hover:shadow-md';
    return 'bg-white/95 shadow-sm hover:shadow-md';
};

const getImageFrameClass = (itemType) => {
    if (itemType === 'image') return 'bg-gray-100';
    return 'bg-gray-100';
};

const getProductId = (product) => String(product?.id || product?._id || '').trim();

const getResolvedSectionProduct = (item, products = []) => {
    if (item?.itemType !== 'product') return null;
    const targetId = String(item?.productId || '').trim();
    return products.find((product) => getProductId(product) === targetId) || item?.productSnapshot || null;
};

/* ─── Single-view slideshow for carousel mode ─── */
const CarouselSlideshow = ({ section, sectionItems, categoryName, openLink, sectionProducts, isDesktop }) => {
    const [activeIndex, setActiveIndex] = useState(0);
    const [animating, setAnimating] = useState(false);
    const isPausedRef = useRef(false);
    const timerRef = useRef(null);
    const total = sectionItems.length;

    const goTo = useCallback((index) => {
        if (animating) return;
        setAnimating(true);
        setActiveIndex(index);
        setTimeout(() => setAnimating(false), 420);
    }, [animating]);

    // Auto-advance
    useEffect(() => {
        if (total <= 1) return;
        const tick = () => {
            if (!isPausedRef.current) {
                setActiveIndex((prev) => (prev + 1) % total);
            }
        };
        timerRef.current = window.setInterval(tick, 3000);
        return () => window.clearInterval(timerRef.current);
    }, [total]);

    const pause = () => { isPausedRef.current = true; };
    const resume = () => { isPausedRef.current = false; };

    const item = sectionItems[activeIndex];
    if (!item) return null;

    const product = getResolvedSectionProduct(item, sectionProducts);
    const image = item.itemType === 'product' ? product?.image : item.image;
    const title = item.title || product?.name;
    const description = item.description || product?.subtitle;
    const link = item.itemType === 'product' && getProductId(product)
        ? `/product/${encodeURIComponent(getProductId(product))}`
        : (item.link || item.sectionLink || section.sectionLink);

    return (
        <div
            className="relative w-full overflow-hidden rounded-2xl select-none"
            onMouseEnter={pause}
            onMouseLeave={resume}
            onTouchStart={pause}
            onTouchEnd={resume}
        >
            {/* Slide */}
            <div
                style={{
                    opacity: animating ? 0.85 : 1,
                    transition: 'opacity 0.38s ease'
                }}
            >
                {item.itemType === 'product' ? (
                    <div className={getProductCardWrapClass('scroll')}>
                        {product ? <ProductCard product={product} footerText={description || product?.subtitle || ''} /> : null}
                    </div>
                ) : (
                    <button
                        type="button"
                        onClick={() => openLink(link)}
                        className="block w-full text-left"
                    >
                        <div className="overflow-hidden rounded-2xl bg-gray-100">
                            {image ? (
                                <img
                                    src={image}
                                    alt={title || section.title || categoryName}
                                    className="w-full h-auto object-contain"
                                    style={{ transition: 'opacity 0.38s ease' }}
                                />
                            ) : (
                                <div
                                    className="w-full min-h-[120px] bg-gray-100"
                                />
                            )}
                        </div>
                        {(title || description) && (
                            <div className="p-3">
                                {title ? <div className="text-sm font-semibold text-gray-900">{title}</div> : null}
                                {description ? <div className="mt-1 text-xs text-gray-500">{description}</div> : null}
                            </div>
                        )}
                    </button>
                )}
            </div>

            {/* Prev / Next arrows — only if >1 item */}
            {/* Dot indicators */}
            {total > 1 && (
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {sectionItems.map((_, i) => (
                        <button
                            key={i}
                            type="button"
                            onClick={(e) => { e.stopPropagation(); goTo(i); }}
                            className="rounded-full transition-all"
                            style={{
                                width: i === activeIndex ? '20px' : '7px',
                                height: '7px',
                                backgroundColor: i === activeIndex ? '#ffffff' : 'rgba(255,255,255,0.5)',
                                transition: 'all 0.3s ease'
                            }}
                            aria-label={`Go to slide ${i + 1}`}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

const CategorySectionItems = ({ section, sectionItems, categoryName, openLink, sectionProducts, isDesktop }) => {
    const desktopImageGridStyle = getDesktopImageGridStyle(section, isDesktop);

    // Carousel: single-view slideshow
    if (section.mediaDisplay === 'carousel') {
        return (
            <CarouselSlideshow
                section={section}
                sectionItems={sectionItems}
                categoryName={categoryName}
                openLink={openLink}
                sectionProducts={sectionProducts}
                isDesktop={isDesktop}
            />
        );
    }

    // All other display modes unchanged
    return (
        <div
            className={getSectionLayoutClass(section.mediaDisplay, section.sectionKind)}
            style={section.mediaDisplay === 'scroll'
                ? { WebkitOverflowScrolling: 'touch' }
                : desktopImageGridStyle}
        >
            {sectionItems.map((item) => {
                const product = getResolvedSectionProduct(item, sectionProducts);
                const image = item.itemType === 'product' ? product?.image : item.image;
                const title = item.title || product?.name;
                const description = item.description || product?.subtitle;
                const link = item.itemType === 'product' && getProductId(product)
                    ? `/product/${encodeURIComponent(getProductId(product))}`
                    : (item.link || item.sectionLink || section.sectionLink);

                const customAspectRatio = (section.mediaDisplay === 'single' || section.mediaDisplay === 'carousel')
                    ? ''
                    : getSectionAspectRatio(section);
                const customCardStyle = getImageCardStyle(section, section.mediaDisplay, item.itemType, isDesktop);
                const customFrameStyle = getImageFrameStyle(section, item.itemType, section.mediaDisplay);
                const hasCustomFrameSize = Boolean(customFrameStyle);
                const useAutoImageSize = normalizeImageRatio(section?.imageRatio) === 'auto' && !customAspectRatio && !hasCustomFrameSize;
                const useWidthDrivenImage = item.itemType === 'image'
                    && ['grid', 'scroll'].includes(section.mediaDisplay)
                    && getSectionCustomWidth(section) > 0;
                const isSingleImageMode = section.mediaDisplay === 'single' && item.itemType === 'image';

                if (item.itemType === 'product') {
                    return (
                        <div key={item.id} className={getProductCardWrapClass(section.mediaDisplay)}>
                            {product ? <ProductCard product={product} footerText={description || product?.subtitle || ''} /> : null}
                        </div>
                    );
                }

                return (
                    <button
                        key={item.id}
                        type="button"
                        data-carousel-card="true"
                        onClick={() => openLink(link)}
                        className={`${getCardWidthClass(section.mediaDisplay)} ${getCardSurfaceClass(item.itemType)} overflow-hidden rounded-2xl text-left transition`}
                        style={customCardStyle}
                    >
                        <div className={`overflow-hidden ${getImageFrameClass(item.itemType)}`}>
                            {image ? (
                                isSingleImageMode ? (
                                    <img
                                        src={image}
                                        alt={title || section.title || categoryName}
                                        className="w-full h-auto object-contain"
                                    />
                                ) : (useAutoImageSize || useWidthDrivenImage) && item.itemType === 'image' ? (
                                    <img
                                        src={image}
                                        alt={title || section.title || categoryName}
                                        className="w-full h-auto object-contain"
                                    />
                                ) : (
                                    <div
                                        className={`w-full ${section.mediaDisplay === 'single' ? '' : 'flex items-center justify-center'} ${hasCustomFrameSize ? '' : getImageHeightClass(section.mediaDisplay, item.itemType, section?.imageRatio)}`}
                                        style={customFrameStyle || (item.itemType === 'image' && customAspectRatio ? { aspectRatio: customAspectRatio } : undefined)}
                                    >
                                        <img
                                            src={image}
                                            alt={title || section.title || categoryName}
                                            className={`h-full w-full ${getImageFitClass(section.mediaDisplay, item.itemType, section?.imageRatio)}`}
                                        />
                                    </div>
                                )
                            ) : (
                                <div
                                    className={`${isSingleImageMode ? 'w-full min-h-[140px]' : (useAutoImageSize || useWidthDrivenImage) && item.itemType === 'image' ? 'w-full min-h-[120px]' : `${hasCustomFrameSize ? '' : getImageHeightClass(section.mediaDisplay, item.itemType, section?.imageRatio)} w-full`} bg-gray-100`}
                                    style={customFrameStyle || (item.itemType === 'image' && customAspectRatio ? { aspectRatio: customAspectRatio } : undefined)}
                                />
                            )}
                        </div>
                        {(title || description) && (
                            <div className="p-2">
                                {title ? <div className="text-xs font-semibold text-gray-900">{title}</div> : null}
                                {description ? <div className="mt-1 text-[10px] text-gray-500">{description}</div> : null}
                            </div>
                        )}
                    </button>
                );
            })}
        </div>
    );
};

const SubCategoryLandingSections = ({ categoryName, subCategoryName }) => {
    const navigate = useNavigate();
    const [catalog, setCatalog] = useState([]);
    const [allSubCategories, setAllSubCategories] = useState([]);
    const [allBrands, setAllBrands] = useState([]);
    const [version, setVersion] = useState(0);
    const [isDesktop, setIsDesktop] = useState(() => {
        if (typeof window === 'undefined') return false;
        return window.innerWidth >= DESKTOP_BREAKPOINT;
    });

    useEffect(() => {
        const handleStorage = () => setVersion((current) => current + 1);
        const handleCategoryPageBuilderUpdate = () => setVersion((current) => current + 1);
        window.addEventListener('storage', handleStorage);
        window.addEventListener('subcategory-page-builder-updated', handleCategoryPageBuilderUpdate);
        return () => {
            window.removeEventListener('storage', handleStorage);
            window.removeEventListener('subcategory-page-builder-updated', handleCategoryPageBuilderUpdate);
        };
    }, []);

    useEffect(() => {
        let active = true;

        readCategoryPageCatalogAsync()
            .then((storedCatalog) => {
                if (!active) return;
                setCatalog(Array.isArray(storedCatalog) ? storedCatalog : []);
            })
            .catch(() => {
                if (!active) return;
                setCatalog([]);
            });

        return () => {
            active = false;
        };
    }, [version]);

    useEffect(() => {
        let active = true;

        const fetchMasterData = async () => {
            try {
                const [{ data: subData }, { data: brandData }] = await Promise.all([
                    API.get('/subcategories'),
                    API.get('/brands')
                ]);

                if (!active) return;
                setAllSubCategories(Array.isArray(subData) ? subData : []);
                setAllBrands(Array.isArray(brandData) ? brandData : []);
            } catch {
                if (!active) return;
                setAllSubCategories([]);
                setAllBrands([]);
            }
        };

        fetchMasterData();
        return () => { active = false; };
    }, [version]);

    useEffect(() => {
        if (typeof window === 'undefined') return undefined;

        const handleResize = () => {
            setIsDesktop(window.innerWidth >= DESKTOP_BREAKPOINT);
        };

        handleResize();
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    const normalizedSubCategoryEntries = useMemo(() => {
        const brandsBySub = new Map();
        (Array.isArray(allBrands) ? allBrands : []).forEach((brand) => {
            const subId = String(brand?.subcategory?._id || brand?.subcategory || '').trim();
            if (!subId || brand?.isActive === false) return;
            const list = brandsBySub.get(subId) || [];
            list.push({
                id: String(brand?._id || brand?.id || brand?.name || ''),
                name: normalizeText(brand?.name),
                image: normalizeText(brand?.image)
            });
            brandsBySub.set(subId, list);
        });

        return (Array.isArray(allSubCategories) ? allSubCategories : []).map((sub) => {
            const subId = String(sub?._id || sub?.id || '').trim();
            const subName = normalizeText(sub?.name);
            const parentName = normalizeText(sub?.category?.name);
            const displayName = parentName && subName ? `${parentName} / ${subName}` : subName;
            return {
                id: subId,
                _id: subId,
                dbId: subId,
                name: displayName || subId,
                subCategories: (brandsBySub.get(subId) || []).filter((entry) => entry.name),
                children: []
            };
        }).filter((entry) => entry.name);
    }, [allSubCategories, allBrands]);

    const selectedSubCategory = useMemo(() => {
        return (allSubCategories || []).find((sub) => (
            normalizeKey(sub?.name) === normalizeKey(subCategoryName) &&
            normalizeKey(sub?.category?.name) === normalizeKey(categoryName)
        )) || null;
    }, [allSubCategories, subCategoryName, categoryName]);

    const categoryConfig = useMemo(() => {
        const mergedCatalog = mergeCategoryPageCatalogWithCategories(catalog, normalizedSubCategoryEntries);
        const selectedId = String(selectedSubCategory?._id || selectedSubCategory?.id || '').trim();
        if (selectedId) {
            const byId = mergedCatalog.find((entry) => String(entry?.id || '').trim() === selectedId);
            if (byId) return byId;
        }

        const fallbackName = `${normalizeText(categoryName)} / ${normalizeText(subCategoryName)}`;
        return mergedCatalog.find((entry) => normalizeKey(entry?.name) === normalizeKey(fallbackName)) || null;
    }, [catalog, normalizedSubCategoryEntries, selectedSubCategory, categoryName, subCategoryName]);

    const brandsForSubCategory = useMemo(() => (
        Array.isArray(categoryConfig?.subCategories)
            ? categoryConfig.subCategories.filter((item) => normalizeText(item?.name))
            : []
    ), [categoryConfig]);

    const sections = useMemo(
        () => (Array.isArray(categoryConfig?.pageSections) ? categoryConfig.pageSections : [])
            .filter((section) => section?.isActive !== false)
            .sort((a, b) => (a.order || 0) - (b.order || 0)),
        [categoryConfig]
    );
    const hasBrandsSection = sections.some((section) => section.sectionKind === 'brands');

    if (!categoryConfig) return null;

    const openLink = (link) => {
        if (!link) return;
        navigate(link);
    };

    return (
        <div className="w-full">
            <div className="max-w-[1360px] mx-auto px-3 py-2">
                {sections.map((section) => {
                    if (section.sectionKind === 'brands') {
                        if (brandsForSubCategory.length === 0) return null;

                        return (
                            <section key={section.id} className="mb-3 rounded-2xl bg-white p-1.5">
                                <BrandQuickLinkGrid
                                    categoryName={categoryName}
                                    subCategoryName={subCategoryName}
                                    items={brandsForSubCategory.map((item) => ({
                                        id: item.id,
                                        name: item.name,
                                        image: item.image,
                                    }))}
                                />
                            </section>
                        );
                    }

                    const backgroundType = section.backgroundType || (section.backgroundImage ? 'image' : 'color');
                    const sectionItems = section.mediaDisplay === 'single'
                        ? (section.items || []).slice(0, 1)
                        : (section.items || []);

                    if (sectionItems.length === 0) return null;

                    return (
                        <section
                            key={section.id}
                            className="mb-3 overflow-hidden rounded-2xl p-2"
                            style={{
                                backgroundColor: backgroundType === 'color' ? (section.backgroundColor || '#ffffff') : '#ffffff',
                                backgroundImage: backgroundType === 'image' && section.backgroundImage ? `url(${section.backgroundImage})` : undefined,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center'
                            }}
                        >
                            {(section.title || section.description || section.showArrow) && (
                                <div className="mb-2 flex items-start justify-between gap-3">
                                    <div>
                                        {section.title ? <h3 className="text-lg font-bold tracking-tight text-gray-900 md:text-3xl">{section.title}</h3> : null}
                                        {section.description ? <p className="mt-1 text-sm text-gray-600">{section.description}</p> : null}
                                    </div>
                                    {section.showArrow && section.sectionLink ? (
                                        <button
                                            type="button"
                                            onClick={() => openLink(section.sectionLink)}
                                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-500 text-white shadow-sm transition hover:bg-blue-600"
                                            aria-label={`Open ${section.title || subCategoryName}`}
                                        >
                                            <MdArrowForward className="text-[18px]" />
                                        </button>
                                    ) : null}
                                </div>
                            )}

                            <CategorySectionItems
                                section={section}
                                sectionItems={sectionItems}
                                categoryName={subCategoryName}
                                openLink={openLink}
                                sectionProducts={categoryConfig?.products || []}
                                isDesktop={isDesktop}
                            />
                        </section>
                    );
                })}

                {brandsForSubCategory.length > 0 && !hasBrandsSection && (
                    <div className="mt-3">
                        <BrandQuickLinkGrid
                            categoryName={categoryName}
                            subCategoryName={subCategoryName}
                            items={brandsForSubCategory}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default SubCategoryLandingSections;

