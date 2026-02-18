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
        } catch (error) { console.error(error); }
    },

    updateBanner: async (id, updatedData) => {
         try {
            const { data } = await API.put(`/banners/${id}`, updatedData);
             set((state) => ({
                 banners: state.banners.map(b => b._id === id ? data : b)
             }));
        } catch (error) { console.error(error); }
    },

    deleteBanner: async (id) => {
        try {
            await API.delete(`/banners/${id}`);
            set((state) => ({ banners: state.banners.filter(b => b._id !== id) }));
        } catch (error) { console.error(error); }
    },

    toggleBannerStatus: async (id) => {
         set(state => {
              const banner = state.banners.find(b => b._id === id);
              if(!banner) return state;
              API.put(`/banners/${id}`, { active: !banner.active }).then(({data}) => {
                   set(curr => ({
                       banners: curr.banners.map(b => b._id === id ? data : b)
                   }));
              });
              return state;
          });
    }
}));

export default useBannerStore;
