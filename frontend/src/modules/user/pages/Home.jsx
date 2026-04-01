import React from 'react';
import CategoryLandingSections from '../components/category/CategoryLandingSections';

const Home = () => {
    return (
        <div className="bg-white pt-2 flex-1 flex flex-col">
            <CategoryLandingSections categoryName="For You" />
        </div>
    );
};

export default Home;
