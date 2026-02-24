import { create } from 'zustand';
import API from '../../../services/api';
import toast from 'react-hot-toast';

const useSubCategoryStore = create((set, get) => ({
    subCategories: [],
    isLoading: false,
    error: null,

    sortByNewestFirst: (items = []) => {
        return [...items].sort((a, b) => {
            const aTime = new Date(a.createdAt || 0).getTime();
            const bTime = new Date(b.createdAt || 0).getTime();
            return bTime - aTime;
        });
    },

    fetchSubCategories: async () => {
        set({ isLoading: true });
        try {
            const { data } = await API.get('/subcategories');
            set({ subCategories: get().sortByNewestFirst(data), isLoading: false, error: null });
        } catch (error) {
            set({
                error: error.response?.data?.message || error.message,
                isLoading: false
            });
            toast.dismiss();
            const toastId = toast.error('Failed to fetch subcategories', { duration: 1400 });
            setTimeout(() => toast.remove(toastId), 1700);
        }
    },

    addSubCategory: async (subCategoryData) => {
        set({ isLoading: true });
        try {
            const { data } = await API.post('/subcategories', subCategoryData);
            set((state) => ({
                subCategories: get().sortByNewestFirst([data, ...state.subCategories]),
                isLoading: false
            }));
            toast.dismiss();
            const toastId = toast.success('Subcategory added successfully', { duration: 1000 });
            setTimeout(() => toast.remove(toastId), 1300);
            return true;
        } catch (error) {
            set({
                error: error.response?.data?.message || error.message,
                isLoading: false
            });
            toast.dismiss();
            const toastId = toast.error(error.response?.data?.message || 'Failed to add subcategory', { duration: 1400 });
            setTimeout(() => toast.remove(toastId), 1700);
            return false;
        }
    },

    updateSubCategory: async (id, subCategoryData) => {
        set({ isLoading: true });
        try {
            const { data } = await API.put(`/subcategories/${id}`, subCategoryData);
            set((state) => ({
                subCategories: get().sortByNewestFirst(
                    state.subCategories.map((sub) => (sub._id === id ? data : sub))
                ),
                isLoading: false
            }));
            toast.dismiss();
            const toastId = toast.success('Subcategory updated successfully', { duration: 1000 });
            setTimeout(() => toast.remove(toastId), 1300);
            return true;
        } catch (error) {
            set({
                error: error.response?.data?.message || error.message,
                isLoading: false
            });
            toast.dismiss();
            const toastId = toast.error('Failed to update subcategory', { duration: 1400 });
            setTimeout(() => toast.remove(toastId), 1700);
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
            toast.dismiss();
            const toastId = toast.success('Subcategory deleted successfully', { duration: 900 });
            setTimeout(() => toast.remove(toastId), 1200);
        } catch (error) {
            set({
                error: error.response?.data?.message || error.message,
                isLoading: false
            });
            toast.dismiss();
            const toastId = toast.error('Failed to delete subcategory', { duration: 1400 });
            setTimeout(() => toast.remove(toastId), 1700);
        }
    }
}));

export default useSubCategoryStore;
