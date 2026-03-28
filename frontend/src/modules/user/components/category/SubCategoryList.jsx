import React, { useMemo } from 'react';
import CategoryQuickLinkGrid from './CategoryQuickLinkGrid';

const SubCategoryList = ({
    subCategories,
    categoryName
}) => {
    if (!categoryName) return null;

    const normalizedSubCategories = Array.isArray(subCategories)
        ? subCategories.filter((sub) => sub?.name)
        : [];

    const displaySubCategories = useMemo(() => {
        return normalizedSubCategories.slice(0, 15).map((sub) => ({
            id: sub.id || sub._id || sub.name,
            name: sub.name,
            image: sub.image || '',
            targetName: sub.name
        }));
    }, [normalizedSubCategories]);

    return (
        <div className="w-full">
            <div className="max-w-[1360px] mx-auto px-4 md:px-5 py-3 md:py-4">
                {displaySubCategories.length > 0 && (
                    <div className="mt-5 md:mt-6">
                        <CategoryQuickLinkGrid categoryName={categoryName} items={displaySubCategories} />
                    </div>
                )}
            </div>
        </div>
    );
};

export default SubCategoryList;
