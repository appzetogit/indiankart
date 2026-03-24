import { create } from 'zustand';
import API from '../../../services/api';
import toast from 'react-hot-toast';

const useCategoryStore = create((set, get) => ({
    categories: [],
    isLoading: false,
    error: null,

    // Selectors
    getAllCategoriesFlat: () => {
        const categories = get().categories;
        const flatten = (cats, level = 0) => {
            let result = [];
            for (const cat of cats) {
                result.push({ ...cat, level });
                if (cat.children && Array.isArray(cat.children) && cat.children.length > 0) {
                    result = result.concat(flatten(cat.children, level + 1));
                }
            }
            return result;
        };
        return flatten(categories);
    },

    sortByNewestFirst: (cats = []) => {
        const sorted = [...cats].sort((a, b) => {
            const aTime = new Date(a.createdAt || 0).getTime() || Number(a.id) || 0;
            const bTime = new Date(b.createdAt || 0).getTime() || Number(b.id) || 0;
            return bTime - aTime;
        });

        return sorted.map((cat) => ({
            ...cat,
            children: cat.children ? get().sortByNewestFirst(cat.children) : cat.children
        }));
    },

    // Actions
    fetchCategories: async () => {
        set({ isLoading: true });
        try {
            const { data } = await API.get('/categories?all=true');
            set({ categories: get().sortByNewestFirst(data), isLoading: false });
        } catch (error) {
            set({
                error: error.response?.data?.message || error.message,
                isLoading: false
            });
        }
    },

    fetchCategoryById: async (id) => {
        set({ isLoading: true });
        try {
            const { data } = await API.get(`/categories/${id}`);
            set({ isLoading: false });
            return data;
        } catch (error) {
            set({
                error: error.response?.data?.message || error.message,
                isLoading: false
            });
            throw error;
        }
    },

    addCategory: async (categoryData) => {
        set({ isLoading: true });
        try {
            const { data } = await API.post('/categories', categoryData);
            await get().fetchCategories();
            return data;
        } catch (error) {
            set({
                error: error.response?.data?.message || error.message,
                isLoading: false
            });
            throw error;
        }
    },

    updateCategory: async (id, updatedData) => {
        set({ isLoading: true });
        try {
            const { data } = await API.put(`/categories/${id}`, updatedData);
            await get().fetchCategories();
            return data;
        } catch (error) {
            set({
                error: error.response?.data?.message || error.message,
                isLoading: false
            });
            throw error;
        }
    },

    deleteCategory: async (id) => {
        set({ isLoading: true });
        try {
            await API.delete(`/categories/${id}`);
            set((state) => ({
                categories: state.categories.filter((c) => c.id !== id),
                isLoading: false
            }));
            toast.dismiss();
            const toastId = toast.success('Category deleted successfully', { duration: 700 });
            setTimeout(() => toast.remove(toastId), 900);
        } catch (error) {
            set({
                error: error.response?.data?.message || error.message,
                isLoading: false
            });
            toast.dismiss();
            toast.error(error.response?.data?.message || 'Failed to delete category', { duration: 1400 });
            throw error;
        }
    },

    toggleCategoryStatus: async (id) => {
        set({ isLoading: true });
        try {
            const findCategory = (cats) => {
                if (!cats || !Array.isArray(cats)) return null;
                for (const cat of cats) {
                    if (cat.id === id || cat._id === id) return cat;
                    const children = cat.children || cat.subCategories || cat.items;
                    if (children && Array.isArray(children) && children.length > 0) {
                        const found = findCategory(children);
                        if (found) return found;
                    }
                }
                return null;
            };

            const currentCat = findCategory(get().categories);
            const currentStatus = currentCat?.active ?? true;

            const isSubCategory = typeof id === 'string';
            const endpoint = isSubCategory ? `/subcategories/${id}` : `/categories/${id}`;
            const payload = isSubCategory ? { isActive: !currentStatus } : { active: !currentStatus };

            const { data } = await API.put(endpoint, payload);

            const transformedData = isSubCategory
                ? { ...data, id: data._id, active: data.isActive }
                : data;

            const updateRecursive = (cats) => {
                return cats.map((cat) => {
                    if (cat.id === id || cat._id === id) return transformedData;
                    if (cat.children) return { ...cat, children: updateRecursive(cat.children) };
                    return cat;
                });
            };

            set((state) => ({
                categories: get().sortByNewestFirst(updateRecursive(state.categories)),
                isLoading: false
            }));
        } catch (error) {
            set({
                error: error.response?.data?.message || error.message,
                isLoading: false
            });
        }
    }
}));

export default useCategoryStore;
