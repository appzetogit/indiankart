import { create } from 'zustand';
import API from '../../../services/api';
import toast from 'react-hot-toast';

const useSubCategoryStore = create((set, get) => ({
    subCategories: [],
    isLoading: false,
    error: null,

    fetchSubCategories: async () => {
        set({ isLoading: true });
        try {
            const { data } = await API.get('/subcategories');
            set({ subCategories: data, isLoading: false, error: null });
        } catch (error) {
            set({
                error: error.response?.data?.message || error.message,
                isLoading: false
            });
            toast.error('Failed to fetch subcategories');
        }
    },

    addSubCategory: async (subCategoryData) => {
        set({ isLoading: true });
        try {
            const { data } = await API.post('/subcategories', subCategoryData);
            set((state) => ({
                subCategories: [...state.subCategories, data],
                isLoading: false
            }));
            toast.success('Subcategory added successfully');
            return true;
        } catch (error) {
            set({
                error: error.response?.data?.message || error.message,
                isLoading: false
            });
            toast.error(error.response?.data?.message || 'Failed to add subcategory');
            return false;
        }
    },

    updateSubCategory: async (id, subCategoryData) => {
        set({ isLoading: true });
        try {
            const { data } = await API.put(`/subcategories/${id}`, subCategoryData);
            set((state) => ({
                subCategories: state.subCategories.map((sub) => (sub._id === id ? data : sub)),
                isLoading: false
            }));
            toast.success('Subcategory updated successfully');
            return true;
        } catch (error) {
            set({
                error: error.response?.data?.message || error.message,
                isLoading: false
            });
            toast.error('Failed to update subcategory');
            return false;
        }
    },

    deleteSubCategory: async (id) => {
        set({ isLoading: true });
        try {
            await API.delete(`/subcategories/${id}`);
            set((state) => ({
                subCategories: state.subCategories.filter((sub) => sub._id !== id),
                isLoading: false
            }));
            toast.success('Subcategory deleted successfully');
        } catch (error) {
            set({
                error: error.response?.data?.message || error.message,
                isLoading: false
            });
            toast.error('Failed to delete subcategory');
        }
    },
}));

export default useSubCategoryStore;
