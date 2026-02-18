import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { MdArrowBack } from 'react-icons/md';
import { useContentStore } from '../../admin/store/contentStore';
import API from '../../../services/api';

const InfoPage = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { privacyPolicy, aboutUs } = useContentStore();
    const type = searchParams.get('type'); // 'privacy', 'about', or 'dynamic'
    const pageKey = searchParams.get('key');
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchDynamicContent = async (key) => {
            setLoading(true);
            try {
                const { data } = await API.get(`/pages/${key}`);
                if (data) {
                    setTitle(getTitle(key));
                    setContent(data.content);
                } else {
                    renderError();
                }
            } catch (err) {
                renderError();
            } finally {
                setLoading(false);
            }
        };

        const renderError = () => {
            setTitle('Page Not Found');
            setContent('<p class="text-gray-500 italic">The requested information page could not be found.</p>');
        };

        const getTitle = (key) => {
            if (key === 'privacyPolicy') return 'Privacy Policy';
            if (key === 'aboutUs') return 'About Us';
            if (key === 'seoContent') return 'SEO Footer Text';
            // Humanize slug
            return key.replace(/-/g, ' ').replace(/(?:^|\s)\S/g, a => a.toUpperCase());
        };

        if (type === 'privacy') {
            setTitle('Privacy Policy');
            setContent(privacyPolicy);
        } else if (type === 'about') {
            setTitle('About Us');
            setContent(aboutUs);
        } else if (type === 'dynamic' && pageKey) {
            fetchDynamicContent(pageKey);
        } else {
            renderError();
        }
    }, [type, pageKey, privacyPolicy, aboutUs]);

    return (
        <div className="bg-white min-h-screen text-gray-900">
            {/* Header */}
            <div className="bg-white sticky top-0 z-10 border-b border-gray-100 px-8 py-6 flex items-center justify-center">
                <h1 className="text-2xl font-black text-gray-900 tracking-tight uppercase">
                    {title}
                </h1>
            </div>

            {/* Content Container */}
            <div className="max-w-4xl mx-auto px-6 py-12 md:py-20">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <div className="w-12 h-12 border-4 border-blue-50 border-t-blue-600 rounded-full animate-spin"></div>
                        <p className="text-gray-400 font-bold text-sm tracking-widest uppercase">Loading Content...</p>
                    </div>
                ) : (
                    <div 
                        className="prose prose-blue max-w-none 
                            prose-headings:font-black prose-headings:text-gray-900 prose-headings:tracking-tight
                            prose-p:text-gray-600 prose-p:leading-relaxed prose-p:text-lg
                            prose-li:text-gray-600 prose-li:text-lg
                            prose-h1:text-4xl prose-h1:mb-8
                            prose-h2:text-2xl prose-h2:mt-12 prose-h2:mb-4
                            prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-2
                            /* Manual Fallbacks */
                            [&_h1]:text-4xl [&_h1]:font-black [&_h1]:mb-8 [&_h1]:tracking-tight
                            [&_h2]:text-2xl [&_h2]:font-black [&_h2]:mt-12 [&_h2]:mb-4 [&_h2]:tracking-tight
                            [&_h3]:text-xl [&_h3]:font-black [&_h3]:mt-8 [&_h3]:mb-2
                            [&_p]:text-gray-600 [&_p]:leading-relaxed [&_p]:text-lg [&_p]:mb-4
                            [&_li]:text-gray-600 [&_li]:text-lg [&_li]:mb-1 [&_ul]:list-disc [&_ul]:ml-6 [&_ul]:mb-6"
                        dangerouslySetInnerHTML={{ __html: content || '<p class="text-gray-400 italic">This page has no content yet.</p>' }} 
                    />
                )}
            </div>

            {/* Simple Footer for Info Pages */}
            <div className="max-w-4xl mx-auto px-6 py-12 border-t border-gray-100 flex flex-col md:flex-row items-center justify-between gap-6">
                <p className="text-gray-400 text-sm font-medium">© {new Date().getFullYear()} YourStore. All rights reserved.</p>
                <div className="flex gap-6 text-sm font-bold text-gray-500">
                    <button onClick={() => navigate('/info?type=privacy')} className="hover:text-blue-600 transition-colors">Privacy Policy</button>
                    <button onClick={() => navigate('/info?type=about')} className="hover:text-blue-600 transition-colors">About Us</button>
                </div>
            </div>
        </div>
    );
};

export default InfoPage;
