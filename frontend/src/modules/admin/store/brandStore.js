import { create } from 'zustand';
import toast from 'react-hot-toast';
import API from '../../../services/api';

const BRAND_CACHE_TTL_MS = 2 * 60 * 1000;
let brandsFetchPromise = null;
let brandsFetchedAt = 0;

const useBrandStore = create((set, get) => ({
    brands: [],
    isLoading: false,
    error: null,

    sortByNewestFirst: (items = []) => {
        return [...items].sort((a, b) => {
            const aTime = new Date(a.createdAt || 0).getTime();
            const bTime = new Date(b.createdAt || 0).getTime();
            return bTime - aTime;
        });
    },

    fetchBrands: async (force = false) => {
        const hasFreshCache =
            !force &&
            get().brands.length > 0 &&
            (Date.now() - brandsFetchedAt) < BRAND_CACHE_TTL_MS;

        if (hasFreshCache) {
            return get().brands;
        }

        if (brandsFetchPromise) {
            return brandsFetchPromise;
        }

        set({ isLoading: true, error: null });

        brandsFetchPromise = (async () => {
            try {
                const { data } = await API.get('/brands');
                const sortedBrands = get().sortByNewestFirst(data);
                brandsFetchedAt = Date.now();
                set({ brands: sortedBrands, isLoading: false, error: null });
                return sortedBrands;
            } catch (error) {
                set({
                    isLoading: false,
                    error: error.response?.data?.message || error.message || 'Failed to fetch brands'
                });
                toast.dismiss();
                const toastId = toast.error('Failed to fetch brands', { duration: 1400 });
                setTimeout(() => toast.remove(toastId), 1700);
                throw error;
            } finally {
                brandsFetchPromise = null;
            }
        })();

        return brandsFetchPromise;
    },

    addBrand: async (brandData) => {
        set({ isLoading: true });
        try {
            const { data } = await API.post('/brands', brandData);
            brandsFetchedAt = Date.now();
            set((state) => ({
                brands: get().sortByNewestFirst([data, ...state.brands]),
                isLoading: false,
                error: null
            }));
            toast.dismiss();
            const toastId = toast.success('Brand added successfully', { duration: 1000 });
            setTimeout(() => toast.remove(toastId), 1300);
            return true;
        } catch (error) {
            set({
                isLoading: false,
                error: error.response?.data?.message || error.message || 'Failed to add brand'
            });
            toast.dismiss();
            const toastId = toast.error(error.response?.data?.message || 'Failed to add brand', { duration: 1400 });
            setTimeout(() => toast.remove(toastId), 1700);
            return false;
        }
    },

    updateBrand: async (id, brandData) => {
        set({ isLoading: true });
        try {
            const { data } = await API.put(`/brands/${id}`, brandData);
            brandsFetchedAt = Date.now();
            set((state) => ({
                brands: get().sortByNewestFirst(
                    state.brands.map((item) => (String(item?._id || item?.id) === String(id) ? data : item))
                ),
                isLoading: false,
                error: null
            }));
            toast.dismiss();
            const toastId = toast.success('Brand updated successfully', { duration: 1000 });
            setTimeout(() => toast.remove(toastId), 1300);
            return true;
        } catch (error) {
            set({
                isLoading: false,
                error: error.response?.data?.message || error.message || 'Failed to update brand'
            });
            toast.dismiss();
            const toastId = toast.error(error.response?.data?.message || 'Failed to update brand', { duration: 1400 });
            setTimeout(() => toast.remove(toastId), 1700);
            return false;
        }
    },

    deleteBrand: async (id) => {
        set({ isLoading: true });
        try {
            await API.delete(`/brands/${id}`);
            brandsFetchedAt = Date.now();
            set((state) => ({
                brands: state.brands.filter((item) => String(item?._id || item?.id) !== String(id)),
                isLoading: false,
                error: null
            }));
            toast.dismiss();
            const toastId = toast.success('Brand deleted successfully', { duration: 900 });
            setTimeout(() => toast.remove(toastId), 1200);
        } catch (error) {
            set({
                isLoading: false,
                error: error.response?.data?.message || error.message || 'Failed to delete brand'
            });
            toast.dismiss();
            const toastId = toast.error(error.response?.data?.message || 'Failed to delete brand', { duration: 1400 });
            setTimeout(() => toast.remove(toastId), 1700);
        }
    }
}));

export default useBrandStore;
