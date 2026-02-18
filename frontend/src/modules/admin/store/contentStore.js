import { create } from 'zustand';
import API from '../../../services/api';

export const useContentStore = create((set, get) => ({
    homeSections: [],
    homeLayout: [], // { type: 'section' | 'banner', referenceId: string }
    pages: [], // Array of { pageKey, content, createdAt, ... }
    privacyPolicy: '',
    aboutUs: '',
    seoContent: '',
    copyright: '',
    isLoading: false,

    // --- Home Layout ---
    fetchHomeLayout: async () => {
        set({ isLoading: true });
        try {
            const { data } = await API.get('/home-layout');
            set({ homeLayout: data.items || [], isLoading: false });
        } catch (error) {
            set({ isLoading: false });
            console.error("Failed to fetch home layout:", error);
        }
    },

    updateHomeLayout: async (newLayoutItems) => {
        // Optimistic update
        set({ homeLayout: newLayoutItems });
        try {
            // Clean items: Only send valid _id if it's from MongoDB, otherwise strip it
            const cleanedItems = newLayoutItems.map(item => {
                const { _id, type, referenceId } = item;
                if (_id && String(_id).startsWith('temp-')) {
                    return { type, referenceId };
                }
                return { _id, type, referenceId };
            });
            await API.put('/home-layout', { items: cleanedItems });
            
            // Re-fetch to get real DB IDs for newly added items
            get().fetchHomeLayout();
        } catch (error) {
            console.error("Failed to update home layout:", error);
        }
    },

    // --- Home Sections ---
    fetchHomeSections: async () => {
        set({ isLoading: true });
        try {
            const { data } = await API.get('/home-sections?all=true');
            set({ homeSections: data, isLoading: false });
        } catch (error) {
            set({ isLoading: false });
        }
    },

    updateSectionTitle: async (id, newTitle) => {
        try {
            const { data } = await API.put(`/home-sections/${id}`, { title: newTitle });
            set((state) => ({
                homeSections: state.homeSections.map(s => s.id === id ? data : s)
            }));
        } catch (error) { console.error(error); }
    },

    updateHomeSection: async (oldId, sectionData) => {
        try {
            const { data } = await API.put(`/home-sections/${oldId}`, sectionData);
            set((state) => ({
                homeSections: state.homeSections.map(s => s.id === oldId ? data : s)
            }));
            return data;
        } catch (error) { 
            console.error(error);
            throw error;
        }
    },

    addProductToSection: async (sectionId, product) => {
        // Need to add product to the array on backend
        // We fetch current section, append, then save? Or specialized endpoint.
        // Using generic PUT logic
        const state = get();
        const section = state.homeSections.find(s => s.id === sectionId);
        if(!section) return;

        // Use _id for Mongoose References
        const currentIds = section.products.map(p => typeof p === 'string' ? String(p) : String(p._id));
        const newId = typeof product === 'string' ? String(product) : String(product._id);
        
        if (currentIds.includes(newId)) return; 

        const productIds = [...currentIds, newId]; 
        try {
            const { data } = await API.put(`/home-sections/${sectionId}`, { products: productIds });
             set((state) => ({
                homeSections: state.homeSections.map(s => s.id === sectionId ? data : s)
            }));
        } catch (error) { console.error(error); }
    },

    createHomeSection: async (sectionData) => { // { title: string, id: string }
        try {
            const { data } = await API.post('/home-sections', sectionData);
            set((state) => ({ homeSections: [...state.homeSections, data] }));
        } catch (error) { console.error(error); }
    },

    deleteHomeSection: async (id) => {
        try {
            await API.delete(`/home-sections/${id}`);
            set((state) => ({ homeSections: state.homeSections.filter(s => s.id !== id) }));
        } catch (error) { console.error(error); }
    },

    removeProductFromSection: async (sectionId, productId) => {
        const state = get();
        const section = state.homeSections.find(s => s.id === sectionId);
        if(!section) return;

        // Filter using String comparison
        const currentProducts = section.products;
        const targetId = String(productId); // productId passed here should be _id
        
        // Ensure we extract _id from objects
        const remainingIds = currentProducts
            .map(p => typeof p === 'string' ? String(p) : String(p._id)) 
            .filter(id => id !== targetId);

        try {
            const { data } = await API.put(`/home-sections/${sectionId}`, { products: remainingIds });
             set((state) => ({
                homeSections: state.homeSections.map(s => s.id === sectionId ? data : s)
            }));
        } catch (error) { console.error(error); }
    },

    // --- Content Pages ---
    fetchPages: async () => {
        set({ isLoading: true });
        try {
            const { data } = await API.get('/pages');
            set({ pages: data, isLoading: false });
            
            // Keep backward compatibility for now
            const pp = data.find(p => p.pageKey === 'privacyPolicy')?.content || '';
            const au = data.find(p => p.pageKey === 'aboutUs')?.content || '';
            const seo = data.find(p => p.pageKey === 'seoContent')?.content || '';
            const cr = data.find(p => p.pageKey === 'copyright')?.content || '';
            set({ privacyPolicy: pp, aboutUs: au, seoContent: seo, copyright: cr });
        } catch (error) { 
            console.error(error); 
            set({ isLoading: false });
        }
    },

    updateContent: async (key, content) => {
        // Optimistic update
        set(state => {
           const newPages = state.pages.map(p => p.pageKey === key ? { ...p, content } : p);
           // If it doesn't exist, we might be creating it via this specific call (legacy), so add it
           if (!newPages.find(p => p.pageKey === key)) {
               newPages.push({ pageKey: key, content });
           }
           return { 
               pages: newPages,
               // Update legacy keys too
               [key]: content 
           };
        });

        try {
            const { data } = await API.post('/pages', { pageKey: key, content });
            // Update with real data from server
             set(state => ({
                pages: state.pages.map(p => p.pageKey === key ? data : p)
            }));
        } catch (error) { console.error(error); }
    },

    deletePage: async (key) => {
        try {
            // Check if backend supports delete, if not we might just clear content
            // Assuming we added DELETE endpoint or reuse generalized logic
            // For now, let's assume we just remove it from list if backend had DELETE /api/pages/:key
            // But we don't have that yet, so let's stick to just updateContent(key, null)?
            // Actually, let's add delete support to backend later if needed. 
            // For now, we will just filter it out locally to simulate
             set(state => ({
                pages: state.pages.filter(p => p.pageKey !== key)
            }));
            // TODO: Implement backend delete
        } catch (error) { console.error(error); }
    }
}));
