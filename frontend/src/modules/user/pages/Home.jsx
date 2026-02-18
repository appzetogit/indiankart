import React, { lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProducts, useHomeSections, useBanners, useHomeLayout } from '../../../hooks/useData';
import LazySection from '../components/common/LazySection';

// Lazy load components
const DealGrid = lazy(() => import('../components/home/DealGrid'));
const ProductSection = lazy(() => import('../components/home/ProductSection'));
const HomeBanner = lazy(() => import('../components/home/HomeBanner'));

// Skeletons
const BannerSkeleton = () => (
    <div className="w-full h-[200px] md:h-[400px] bg-gray-100 animate-pulse md:rounded-2xl mx-auto mb-6"></div>
);

const SectionSkeleton = () => (
    <div className="w-full h-[300px] bg-white animate-pulse md:rounded-2xl mx-auto mb-6 p-4">
        <div className="h-6 bg-gray-100 rounded w-1/4 mb-6"></div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
                <div key={i} className="aspect-square bg-gray-50 rounded-xl"></div>
            ))}
        </div>
    </div>
);

const Home = () => {
    const navigate = useNavigate();
    const { products, loading: productsLoading } = useProducts();
    const { sections, loading: sectionsLoading } = useHomeSections();
    const { banners, loading: bannersLoading } = useBanners();
    const { layout, loading: layoutLoading } = useHomeLayout();
    const isHomeLoading = sectionsLoading || bannersLoading || layoutLoading;

    const isLayoutLoading = layoutLoading && layout.length === 0;

    if (isLayoutLoading) {
        return (
            <div className="min-h-screen bg-white">
                <BannerSkeleton />
                <div className="max-w-[1440px] mx-auto space-y-8 p-4">
                    <SectionSkeleton />
                    <SectionSkeleton />
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gradient-to-b from-white to-blue-100 pt-2 flex-1 flex flex-col">
            <div className="w-full space-y-2 md:space-y-6 px-3 md:px-5 lg:px-6">

                {/* Dynamic Content Stream */}
                {layout.map((item, index) => {
                    const isFirstItem = index === 0;

                    if (item.type === 'banner') {
                        const banner = banners.find(b => String(b._id) === String(item.referenceId) || String(b.id) === String(item.referenceId));
                        if (!banner) return null;

                        const bannerComponent = (
                            <Suspense fallback={<BannerSkeleton />}>
                                <HomeBanner banner={banner} />
                            </Suspense>
                        );

                        return (
                            <div key={`${item.type}-${index}`} className="max-w-[1440px] mx-auto w-full">
                                {isFirstItem ? bannerComponent : (
                                    <LazySection placeholder={<BannerSkeleton />}>
                                        {bannerComponent}
                                    </LazySection>
                                )}
                            </div>
                        );
                    }

                    if (item.type === 'section') {
                        const section = sections.find(s => String(s.id) === String(item.referenceId));
                        if (!section) return null;

                        const isDeal = section.title.toLowerCase().includes('deal') || section.title.toLowerCase().includes('find');
                        const productCount = section.products?.length || 0;

                        const sectionContent = isDeal && productCount <= 4 ? (
                            <Suspense fallback={<SectionSkeleton />}>
                                <DealGrid
                                    title={section.title}
                                    items={section.products || []}
                                    bgColor="bg-white"
                                    darkBgColor=""
                                    titleKey="name"
                                    subtitleKey="price"
                                    containerClass="mt-0"
                                    showArrow={true}
                                />
                            </Suspense>
                        ) : (
                            <Suspense fallback={<SectionSkeleton />}>
                                <ProductSection
                                    title={section.title}
                                    subtitle={section.subtitle}
                                    products={section.products}
                                    containerClass="mt-0"
                                    onViewAll={() => navigate(`/products?search=${section.title}`)}
                                />
                            </Suspense>
                        );

                        return (
                            <div key={`${item.type}-${index}`} className="max-w-[1440px] mx-auto w-full">
                                {isFirstItem ? sectionContent : (
                                    <LazySection placeholder={<SectionSkeleton />}>
                                        {sectionContent}
                                    </LazySection>
                                )}
                            </div>
                        );
                    }

                    return null;
                })}

                {layout.length === 0 && !isHomeLoading && (
                    <div className="py-20 text-center text-gray-400">
                        <p>Welcome! Check back soon for amazing deals.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Home;
