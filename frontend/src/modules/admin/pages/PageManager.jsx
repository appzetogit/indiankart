import React, { useState, useEffect, useMemo } from 'react';
import { useContentStore } from '../store/contentStore';
import { useFooterStore } from '../store/footerStore';
import { 
    MdSave, 
    MdDescription, 
    MdAdd, 
    MdLink, 
    MdInsertDriveFile,
    MdSettings
} from 'react-icons/md';
import RichTextEditor from '../components/RichTextEditor';

const PageManager = () => {
    const { pages, updateContent, fetchPages, isLoading: isContentLoading } = useContentStore();
    const { footerConfig, fetchFooterConfig, isLoading: isFooterLoading } = useFooterStore();
    const [selectedPageKey, setSelectedPageKey] = useState(null);
    const [editorContent, setEditorContent] = useState('');
    const [isSaved, setIsSaved] = useState(false);
    
    const isLoading = isContentLoading || isFooterLoading;

    // Modal State
    const [showModal, setShowModal] = useState(false);
    const [newPageTitle, setNewPageTitle] = useState('');
    const [newPageKey, setNewPageKey] = useState('');

    useEffect(() => {
        fetchPages();
        fetchFooterConfig();
    }, [fetchPages, fetchFooterConfig]);

    // Grouping Logic
    const { footerMappedPages, otherPages, systemPages } = useMemo(() => {
        if (!footerConfig) return { footerMappedPages: [], otherPages: [], systemPages: [] };

        // 1. Get all pageKeys defined in footer
        const footerLinks = [];
        footerConfig.sections.forEach(section => {
            section.links.forEach(link => {
                if (link.pageKey) {
                    footerLinks.push({
                        pageKey: link.pageKey,
                        label: link.label,
                        section: section.title
                    });
                }
            });
        });

        // Add special bottom bar links
        footerLinks.push({ 
            pageKey: footerConfig.advertisePageKey || 'advertise', 
            label: 'Advertise', 
            section: 'Bottom Bar' 
        });
        footerLinks.push({ 
            pageKey: footerConfig.giftCardsPageKey || 'gift-cards', 
            label: 'Gift Cards', 
            section: 'Bottom Bar' 
        });
        footerLinks.push({ 
            pageKey: footerConfig.helpCenterPageKey || 'help-center', 
            label: 'Help Center', 
            section: 'Bottom Bar' 
        });

        const systemKeys = ['privacyPolicy', 'aboutUs', 'seoContent', 'copyright'];
        
        // 2. Map pages to footer links
        const mapped = footerLinks.map(link => {
            const pageData = pages.find(p => p.pageKey === link.pageKey);
            return {
                ...link,
                exists: !!pageData,
                _id: pageData?._id
            };
        });

        // 3. Find other pages NOT in footer and NOT system
        const footerKeys = footerLinks.map(l => l.pageKey);
        const others = pages.filter(p => !footerKeys.includes(p.pageKey) && !systemKeys.includes(p.pageKey));

        // 4. System Pages
        const systems = systemKeys.map(key => ({
            pageKey: key,
            label: getTitle(key),
            exists: !!pages.find(p => p.pageKey === key)
        }));

        return { 
            footerMappedPages: mapped, 
            otherPages: others,
            systemPages: systems 
        };
    }, [pages, footerConfig]);

    useEffect(() => {
        if (selectedPageKey === null && systemPages.length > 0) {
            setSelectedPageKey(systemPages[0].pageKey);
        }
    }, [systemPages, selectedPageKey]);

    useEffect(() => {
        const page = pages.find(p => p.pageKey === selectedPageKey);
        if (page) {
            setEditorContent(page.content || '');
        } else {
            // Check if it's a footer link that doesn't exist yet
            const footerPage = footerMappedPages.find(p => p.pageKey === selectedPageKey);
            if (footerPage && !footerPage.exists) {
                setEditorContent(`<h1>${footerPage.label}</h1>\n<p>Content for ${footerPage.label} goes here...</p>`);
            } else if (selectedPageKey === 'privacyPolicy') {
                setEditorContent(useContentStore.getState().privacyPolicy || '');
            } else if (selectedPageKey === 'aboutUs') {
                setEditorContent(useContentStore.getState().aboutUs || '');
            } else if (selectedPageKey === 'seoContent') {
                setEditorContent(useContentStore.getState().seoContent || '');
            } else if (selectedPageKey === 'copyright') {
                const copyrightFromStore = useContentStore.getState().pages.find(p => p.pageKey === 'copyright')?.content;
                setEditorContent(copyrightFromStore || footerConfig?.copyrightText || '');
            }
        }
        setIsSaved(false);
    }, [selectedPageKey, pages, footerMappedPages]);

    const handleSave = () => {
        if (selectedPageKey) {
            updateContent(selectedPageKey, editorContent);
            setIsSaved(true);
            setTimeout(() => setIsSaved(false), 2000);
        }
    };

    const handleCreatePage = (e) => {
        e.preventDefault();
        if (!newPageKey || !newPageTitle) return;
        
        const finalKey = newPageKey.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        updateContent(finalKey, `<h1>${newPageTitle}</h1>\n<p>Start writing content for ${newPageTitle}...</p>`);
        setSelectedPageKey(finalKey);
        setShowModal(false);
        setNewPageTitle('');
        setNewPageKey('');
        setTimeout(fetchPages, 500); 
    };

    function getTitle(key) {
        if (key === 'privacyPolicy') return 'Privacy Policy';
        if (key === 'aboutUs') return 'About Us';
        if (key === 'seoContent') return 'SEO Footer Text';
        if (key === 'copyright') return 'Copyright Text';
        return key.replace(/-/g, ' ').replace(/(?:^|\s)\S/g, a => a.toUpperCase());
    }

    return (
        <div className="p-6 h-[calc(100vh-80px)] overflow-hidden flex flex-col bg-gray-50/50">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight">Content Management</h1>
                    <p className="text-gray-500 text-sm font-medium">Manage text for legal pages, footer links, and SEO.</p>
                </div>
                <button 
                    onClick={() => setShowModal(true)}
                    className="bg-white text-gray-900 border border-gray-200 px-5 py-2.5 rounded-2xl font-black flex items-center gap-2 hover:bg-gray-50 transition-all shadow-sm active:scale-95"
                >
                    <MdAdd size={20} className="text-blue-600" />
                    Create Custom Page
                </button>
            </div>

            <div className="flex-1 flex gap-6 overflow-hidden">
                {/* Sidebar List */}
                <div className="w-80 bg-white rounded-3xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
                    <div className="flex-1 overflow-y-auto p-3 space-y-6">
                        
                        {/* System Pages */}
                        <div className="space-y-1">
                            <h3 className="px-3 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                                <MdSettings /> Core Pages
                            </h3>
                            {systemPages.map(page => (
                                <button
                                    key={page.pageKey}
                                    onClick={() => setSelectedPageKey(page.pageKey)}
                                    className={`w-full text-left px-4 py-3 rounded-2xl text-sm font-bold transition-all border ${
                                        selectedPageKey === page.pageKey 
                                        ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-100' 
                                        : 'text-gray-600 border-transparent hover:bg-gray-50'
                                    }`}
                                >
                                    {page.label}
                                </button>
                            ))}
                        </div>

                        {/* Footer Mapped Links */}
                        <div className="space-y-1">
                            <h3 className="px-3 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                                <MdLink /> Footer Links
                            </h3>
                            {footerMappedPages.map(page => (
                                <button
                                    key={page.pageKey}
                                    onClick={() => setSelectedPageKey(page.pageKey)}
                                    className={`w-full text-left px-4 py-3 rounded-2xl transition-all border group ${
                                        selectedPageKey === page.pageKey 
                                        ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-100' 
                                        : 'text-gray-600 border-transparent hover:bg-gray-50'
                                    }`}
                                >
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold">{page.label}</span>
                                        <span className={`text-[10px] uppercase font-bold ${selectedPageKey === page.pageKey ? 'text-blue-100' : 'text-gray-400'}`}>
                                            Section: {page.section}
                                        </span>
                                    </div>
                                </button>
                            ))}
                            {footerMappedPages.length === 0 && !isFooterLoading && (
                                <p className="px-3 text-[10px] text-gray-400 italic">No dynamic links in footer.</p>
                            )}
                        </div>

                        {/* Other Custom Pages */}
                        {otherPages.length > 0 && (
                            <div className="space-y-1">
                                <h3 className="px-3 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                                    <MdInsertDriveFile /> Custom Pages
                                </h3>
                                {otherPages.map(page => (
                                    <button
                                        key={page.pageKey}
                                        onClick={() => setSelectedPageKey(page.pageKey)}
                                        className={`w-full text-left px-4 py-3 rounded-2xl text-sm font-bold transition-all border ${
                                            selectedPageKey === page.pageKey 
                                            ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-100' 
                                            : 'text-gray-600 border-transparent hover:bg-gray-50'
                                        }`}
                                    >
                                        {getTitle(page.pageKey)}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Editor Area */}
                <div className="flex-1 bg-white rounded-3xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
                    {selectedPageKey ? (
                        <>
                            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/30">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h2 className="font-black text-gray-900 text-lg">{getTitle(selectedPageKey)}</h2>
                                        {!pages.find(p => p.pageKey === selectedPageKey) && (
                                            <span className="bg-amber-100 text-amber-700 text-[9px] font-black px-2 py-0.5 rounded-full ring-1 ring-amber-200">UNINITIALIZED</span>
                                        )}
                                    </div>
                                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-0.5">Key: {selectedPageKey}</p>
                                </div>
                                <div className="flex items-center gap-4">
                                    {isSaved && (
                                        <span className="text-green-600 text-xs font-black flex items-center gap-1.5 animate-in fade-in slide-in-from-right-2">
                                            <span className="material-icons text-[16px]">check_circle</span>
                                            CHANGES SAVED
                                        </span>
                                    )}
                                    <button
                                        onClick={handleSave}
                                        disabled={isLoading}
                                        className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-black hover:bg-blue-700 active:scale-95 transition-all flex items-center gap-2 shadow-xl shadow-blue-100 disabled:opacity-50"
                                    >
                                        <MdSave size={20} />
                                        {isLoading ? 'SAVING...' : 'SAVE CONTENT'}
                                    </button>
                                </div>
                            </div>
                            
                            <div className="flex-1 p-0 relative group border-t border-gray-100">
                                <RichTextEditor 
                                    value={editorContent}
                                    onChange={(html) => {
                                        setEditorContent(html);
                                        setIsSaved(false);
                                    }}
                                    placeholder="Enter page content here..."
                                />
                                <div className="absolute bottom-6 right-6 text-[10px] font-black text-gray-300 bg-white/80 backdrop-blur-sm border border-gray-100 px-3 py-1.5 rounded-full z-10 uppercase tracking-widest pointer-events-none">
                                    {editorContent.replace(/<[^>]*>/g, '').length} characters
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-gray-400 flex-col gap-4">
                            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center">
                                <MdDescription size={40} className="text-gray-200" />
                            </div>
                            <p className="font-bold text-gray-400">Select a page from the list to start editing</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Create Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-[#212121]/40 z-50 flex items-center justify-center p-4 backdrop-blur-md">
                    <form onSubmit={handleCreatePage} className="bg-white rounded-[32px] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                            <h3 className="font-black text-gray-900 uppercase tracking-tight text-xl">Create Custom Page</h3>
                            <button type="button" onClick={() => setShowModal(false)} className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all">
                                <span className="material-icons">close</span>
                            </button>
                        </div>
                        <div className="p-8 space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Page Title</label>
                                <input 
                                    type="text" 
                                    required
                                    autoFocus
                                    placeholder="e.g. Careers" 
                                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 font-bold text-gray-900 transition-all translate-y-0"
                                    value={newPageTitle}
                                    onChange={e => {
                                        setNewPageTitle(e.target.value);
                                        if(!newPageKey) {
                                            setNewPageKey(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
                                        }
                                    }}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Page Key (URL Segment)</label>
                                <div className="flex items-center gap-3 bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 group focus-within:ring-4 focus-within:ring-blue-100 focus-within:border-blue-500 transition-all">
                                    <span className="text-gray-400 text-sm font-black italic">/info?key=</span>
                                    <input 
                                        type="text" 
                                        required
                                        placeholder="careers" 
                                        className="flex-1 bg-transparent border-none outline-none text-sm font-black text-gray-900"
                                        value={newPageKey}
                                        onChange={e => setNewPageKey(e.target.value)}
                                    />
                                </div>
                                <p className="text-[10px] text-gray-400 font-bold ml-1 italic">This will be the permanent ID used for development.</p>
                            </div>
                        </div>
                        <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-4">
                            <button 
                                type="button" 
                                onClick={() => setShowModal(false)}
                                className="px-6 py-3 text-sm font-black text-gray-500 hover:bg-gray-200 rounded-2xl transition-all"
                            >
                                CANCEL
                            </button>
                            <button 
                                type="submit" 
                                className="px-10 py-3 text-sm font-black text-white bg-blue-600 rounded-2xl hover:bg-blue-700 shadow-xl shadow-blue-100 active:scale-95 transition-all"
                            >
                                CREATE PAGE
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};

export default PageManager;

