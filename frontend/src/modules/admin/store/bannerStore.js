import { create } from 'zustand';
import API from '../../../services/api';

const useBannerStore = create((set) => ({
    banners: [],
    isLoading: false,

    fetchBanners: async () => {
        set({ isLoading: true });
        try {
            const { data } = await API.get('/banners?all=true');
            set({ banners: data, isLoading: false });
        } catch (error) {
            set({ isLoading: false });
        }
    },

    addBanner: async (bannerData) => {
        try {
            const { data } = await API.post('/banners', bannerData);
            set((state) => ({ banners: [...state.banners, data] }));
            return data;
        } catch (error) {
            console.error(error);
            throw error;
        }
    },

    updateBanner: async (id, updatedData) => {
         try {
            const { data } = await API.put(`/banners/${id}`, updatedData);
             set((state) => ({
                 banners: state.banners.map((b) => (String(b._id || b.id) === String(id) ? data : b))
             }));
            return data;
        } catch (error) {
            console.error(error);
            throw error;
        }
    },

    deleteBanner: async (id) => {
        try {
            await API.delete(`/banners/${id}`);
            set((state) => ({ banners: state.banners.filter((b) => String(b._id || b.id) !== String(id)) }));
        } catch (error) { console.error(error); }
    },

    toggleBannerStatus: async (id) => {
         set(state => {
              const banner = state.banners.find((b) => String(b._id || b.id) === String(id));
              if(!banner) return state;
              API.put(`/banners/${id}`, { active: !banner.active }).then(({data}) => {
                   set(curr => ({
                       banners: curr.banners.map((b) => (String(b._id || b.id) === String(id) ? data : b))
                   }));
              });
              return state;
          });
    }
}));

export default useBannerStore;
