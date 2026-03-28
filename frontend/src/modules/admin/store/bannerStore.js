import { create } from 'zustand';
import API from '../../../services/api';

const BANNER_CACHE_KEY = 'ik-cache-v1:banners';

const syncBannerCache = (banners) => {
    try {
        localStorage.setItem(
            BANNER_CACHE_KEY,
            JSON.stringify({
                data: Array.isArray(banners) ? banners.filter((banner) => banner?.active) : [],
                timestamp: Date.now()
            })
        );
    } catch (error) {
        console.error('Failed to sync banner cache:', error);
    }
};

const useBannerStore = create((set) => ({
    banners: [],
    isLoading: false,

    fetchBanners: async () => {
        set({ isLoading: true });
        try {
            const { data } = await API.get('/banners?all=true');
            syncBannerCache(data);
            set({ banners: data, isLoading: false });
        } catch (error) {
            set({ isLoading: false });
        }
    },

    addBanner: async (bannerData) => {
        try {
            const { data } = await API.post('/banners', bannerData);
            set((state) => {
                const banners = [...state.banners, data];
                syncBannerCache(banners);
                return { banners };
            });
            return data;
        } catch (error) {
            console.error(error);
            throw error;
        }
    },

    updateBanner: async (id, updatedData) => {
         try {
            const { data } = await API.put(`/banners/${id}`, updatedData);
             set((state) => {
                 const banners = state.banners.map((b) => (String(b._id || b.id) === String(id) ? data : b));
                 syncBannerCache(banners);
                 return { banners };
             });
            return data;
        } catch (error) {
            console.error(error);
            throw error;
        }
    },

    deleteBanner: async (id) => {
        try {
            await API.delete(`/banners/${id}`);
            set((state) => {
                const banners = state.banners.filter((b) => String(b._id || b.id) !== String(id));
                syncBannerCache(banners);
                return { banners };
            });
        } catch (error) { console.error(error); }
    },

    toggleBannerStatus: async (id) => {
         set(state => {
              const banner = state.banners.find((b) => String(b._id || b.id) === String(id));
              if(!banner) return state;
              API.put(`/banners/${id}`, { active: !banner.active }).then(({data}) => {
                   set(curr => {
                       const banners = curr.banners.map((b) => (String(b._id || b.id) === String(id) ? data : b));
                       syncBannerCache(banners);
                       return { banners };
                   });
              });
              return state;
          });
    }
}));

export default useBannerStore;
