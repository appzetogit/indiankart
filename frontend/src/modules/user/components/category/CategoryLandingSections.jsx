import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MdArrowForward } from 'react-icons/md';
import CategoryQuickLinkGrid from './CategoryQuickLinkGrid';
import { useCategories, useSubCategoriesByCategory } from '../../../../hooks/useData';
import { getCategoryPageConfig, getCategoryStripItems, getOrderedCategorySubCategories } from '../../../../utils/categoryPageConfig';

const getSectionLayoutClass = (mediaDisplay) => {
    if (mediaDisplay === 'grid') return 'flex gap-3 overflow-x-auto no-scrollbar pb-1 md:grid md:[grid-template-columns:repeat(auto-fit,minmax(220px,1fr))]';
    if (mediaDisplay === 'single') return 'block';
    return 'flex gap-3 overflow-x-auto no-scrollbar pb-1';
};

const getCardWidthClass = (mediaDisplay) => {
    if (mediaDisplay === 'single') return 'w-full';
    if (mediaDisplay === 'grid') return 'w-[220px] shrink-0 md:w-auto';
    return 'w-[220px] shrink-0 md:w-[260px]';
};

const getImageHeightClass = (mediaDisplay) => {
    if (mediaDisplay === 'single') return 'h-[140px] md:h-[320px]';
    if (mediaDisplay === 'grid') return 'h-24 md:h-64 lg:h-72';
    return 'h-40 md:h-44';
};

const getImageFitClass = (mediaDisplay, itemType) => {
    if (itemType === 'image') return 'object-contain md:object-cover';
    if (mediaDisplay === 'single') return 'object-contain md:object-cover';
    return 'object-cover';
};

const getCardSurfaceClass = (itemType) => {
    if (itemType === 'image') return 'bg-transparent shadow-none md:bg-white/95 md:shadow-sm md:hover:shadow-md';
    return 'bg-white/95 shadow-sm hover:shadow-md';
};

const getImageFrameClass = (itemType) => {
    if (itemType === 'image') return 'bg-transparent md:bg-gray-100';
    return 'bg-gray-100';
};

const CategoryLandingSections = ({ categoryName }) => {
    const navigate = useNavigate();
    const { categories = [] } = useCategories({ lite: true });
    const [version, setVersion] = useState(0);

    useEffect(() => {
        const handleStorage = () => setVersion((current) => current + 1);
        window.addEventListener('storage', handleStorage);
        return () => window.removeEventListener('storage', handleStorage);
    }, []);

    const categoryConfig = useMemo(
        () => getCategoryPageConfig(categoryName, categories),
        [categoryName, categories, version]
    );
    const categoryDbId = categoryConfig?.dbId || categoryConfig?._id || '';
    const { subCategories: detailedSubCategories = [] } = useSubCategoriesByCategory(categoryDbId);
    const orderedSubCategories = useMemo(
        () => getOrderedCategorySubCategories(categoryConfig, detailedSubCategories),
        [categoryConfig, detailedSubCategories]
    );

    const quickLinks = useMemo(
        () => {
            const baseLinks = getCategoryStripItems(categoryConfig);
            if (!baseLinks.length) return [];
            if (!orderedSubCategories.length) return baseLinks;
            const orderedById = new Map(orderedSubCategories.map((item) => [String(item?.id || ''), item]));
            const orderedByName = new Map(orderedSubCategories.map((item) => [String(item?.name || '').trim().toLowerCase(), item]));

            return baseLinks.map((item) => {
                const detailed = orderedById.get(String(item.id))
                    || orderedByName.get(String(item.name || '').trim().toLowerCase());

                return {
                    ...item,
                    image: detailed?.image || item.image || ''
                };
            });
        },
        [categoryConfig, orderedSubCategories]
    );

    const sections = useMemo(
        () => (Array.isArray(categoryConfig?.pageSections) ? categoryConfig.pageSections : [])
            .filter((section) => section?.isActive !== false)
            .sort((a, b) => (a.order || 0) - (b.order || 0)),
        [categoryConfig]
    );
    const hasSubcategoriesSection = sections.some((section) => section.sectionKind === 'subcategories');

    if (!categoryConfig) return null;

    const openLink = (link) => {
        if (!link) return;
        navigate(link);
    };

    return (
        <div className="w-full">
            <div className="max-w-[1360px] mx-auto px-3 py-2 md:px-5 md:py-4">
                {sections.map((section) => {
                    if (section.sectionKind === 'subcategories') {
                        if (orderedSubCategories.length === 0) return null;

                        return (
                            <section key={section.id} className="mb-3 rounded-2xl bg-white p-2 md:mb-5 md:p-4">
                                {(section.title || section.description) && (
                                    <div className="mb-2 md:mb-4">
                                        {section.title ? <h3 className="text-xl font-bold tracking-tight text-gray-900 md:text-2xl">{section.title}</h3> : null}
                                        {section.description ? <p className="mt-1 text-sm text-gray-600">{section.description}</p> : null}
                                    </div>
                                )}
                                <CategoryQuickLinkGrid
                                    categoryName={categoryName}
                                    items={orderedSubCategories.map((item) => ({
                                        id: item.id,
                                        name: item.name,
                                        image: item.image,
                                        targetName: item.name
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
                            className="mb-3 overflow-hidden rounded-2xl p-2 md:mb-5 md:p-4"
                            style={{
                                backgroundColor: backgroundType === 'color' ? (section.backgroundColor || '#ffffff') : '#ffffff',
                                backgroundImage: backgroundType === 'image' && section.backgroundImage ? `url(${section.backgroundImage})` : undefined,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center'
                            }}
                        >
                            {(section.title || section.description || section.showArrow) && (
                                <div className="mb-2 md:mb-4 flex items-start justify-between gap-3">
                                    <div>
                                        {section.title ? <h3 className="text-xl font-bold tracking-tight text-gray-900 md:text-2xl">{section.title}</h3> : null}
                                        {section.description ? <p className="mt-1 text-sm text-gray-600">{section.description}</p> : null}
                                    </div>
                                    {section.showArrow && section.sectionLink ? (
                                        <button
                                            type="button"
                                            onClick={() => openLink(section.sectionLink)}
                                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white shadow-sm"
                                            aria-label={`Open ${section.title || categoryName}`}
                                        >
                                            <MdArrowForward size={18} />
                                        </button>
                                    ) : null}
                                </div>
                            )}

                            <div className={getSectionLayoutClass(section.mediaDisplay)}>
                                {sectionItems.map((item) => {
                                    const product = item.itemType === 'product' ? item.productSnapshot : null;
                                    const image = item.itemType === 'product' ? product?.image : item.image;
                                    const title = item.title || product?.name;
                                    const description = item.description || product?.subtitle;
                                    const link = item.link || item.sectionLink || section.sectionLink;

                                    return (
                                        <button
                                            key={item.id}
                                            type="button"
                                            onClick={() => openLink(link)}
                                            className={`${getCardWidthClass(section.mediaDisplay)} ${getCardSurfaceClass(item.itemType)} overflow-hidden rounded-2xl text-left transition`}
                                        >
                                            <div className={`overflow-hidden ${getImageFrameClass(item.itemType)}`}>
                                                {image ? (
                                                    <img
                                                        src={image}
                                                        alt={title || section.title || categoryName}
                                                        className={`${getImageHeightClass(section.mediaDisplay)} ${getImageFitClass(section.mediaDisplay, item.itemType)} w-full`}
                                                    />
                                                ) : (
                                                    <div className={`${getImageHeightClass(section.mediaDisplay)} w-full bg-gray-100`} />
                                                )}
                                            </div>
                                            {(title || description) && (
                                                <div className="p-3">
                                                    {title ? <div className="text-sm font-semibold text-gray-900 md:text-base">{title}</div> : null}
                                                    {description ? <div className="mt-1 text-xs text-gray-500 md:text-sm">{description}</div> : null}
                                                </div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </section>
                    );
                })}

                {quickLinks.length > 0 && !hasSubcategoriesSection && (
                    <div className="mt-3 md:mt-6">
                        <CategoryQuickLinkGrid categoryName={categoryName} items={quickLinks} />
                    </div>
                )}
            </div>
        </div>
    );
};

export default CategoryLandingSections;
