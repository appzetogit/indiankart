import { create } from 'zustand';
import API from '../../../services/api';

const useProductStore = create((set) => ({
    products: [],
    isLoading: false,
    error: null,

    // Fetch all products
    fetchProducts: async () => {
        set({ isLoading: true });
        try {
            const { data } = await API.get('/products?all=true');
            set({ products: data, isLoading: false });
        } catch (error) {
            set({ 
                error: error.response?.data?.message || error.message, 
                isLoading: false 
            });
        }
    },

    // Actions
    addProduct: async (productData) => {
        set({ isLoading: true });
        try {
            const { data } = await API.post('/products', productData);
            set((state) => ({
                products: [data, ...state.products],
                isLoading: false
            }));
            return data;
        } catch (error) {
            set({ 
                error: error.response?.data?.message || error.message, 
                isLoading: false 
            });
            throw error;
        }
    },

    updateProduct: async (id, updatedData) => {
        set({ isLoading: true });
        try {
            const { data } = await API.put(`/products/${id}`, updatedData);
            set((state) => ({
                products: state.products.map(p => p.id === id ? data : p),
                isLoading: false
            }));
            return data;
        } catch (error) {
            set({ 
                error: error.response?.data?.message || error.message, 
                isLoading: false 
            });
            throw error;
        }
    },

    deleteProduct: async (id) => {
        set({ isLoading: true });
        try {
            await API.delete(`/products/${id}`);
            set((state) => ({
                products: state.products.filter(p => p.id !== id),
                isLoading: false
            }));
        } catch (error) {
            set({ 
                error: error.response?.data?.message || error.message, 
                isLoading: false 
            });
            throw error;
        }
    },

    // Helper to get formatted product for editing (Client-side find from store)
    getProductById: (id) => {
        return (state) => state.products.find(p => p.id === id);
    },

    // Fetch single product
    fetchProduct: async (id) => {
        set({ isLoading: true });
        try {
            const { data } = await API.get(`/products/${id}?all=true`);
             // Check if already in store, if so replace, else add
             set((state) => {
                const exists = state.products.find(p => p.id === parseInt(id));
                if (exists) {
                     return {
                        products: state.products.map(p => p.id === parseInt(id) ? data : p),
                        isLoading: false
                     };
                } else {
                     return {
                        products: [...state.products, data],
                        isLoading: false
                     };
                }
             });
             return data;
        } catch (error) {
            set({ 
                error: error.response?.data?.message || error.message, 
                isLoading: false 
            });
            throw error;
        }
    }
}));

export default useProductStore;
