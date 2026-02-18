import { create } from 'zustand';
import API from '../../../services/api';

const usePlayStore = create((set) => ({
    reels: [],
    isLoading: false,

    fetchReels: async () => {
        set({ isLoading: true });
        try {
            const { data } = await API.get('/reels');
            set({ reels: data, isLoading: false });
        } catch (error) {
            set({ isLoading: false });
        }
    },

    addReel: async (reelData) => {
        try {
            const { data } = await API.post('/reels', reelData);
            set((state) => ({ reels: [...state.reels, data] }));
        } catch (error) { console.error(error); }
    },

    updateReel: async (id, updatedData) => {
        try {
            const { data } = await API.put(`/reels/${id}`, updatedData);
             set((state) => ({
                 reels: state.reels.map(r => r._id === id ? data : r)
             }));
        } catch (error) { console.error(error); }
    },

    deleteReel: async (id) => {
        try {
            await API.delete(`/reels/${id}`);
            set((state) => ({ reels: state.reels.filter(r => r._id !== id) }));
        } catch (error) { console.error(error); }
    },

    toggleReelStatus: async (id) => {
          // Find reel to get current status
          set(state => {
              const reel = state.reels.find(r => r._id === id);
              if(!reel) return state;
              API.put(`/reels/${id}`, { active: !reel.active }).then(({data}) => {
                   set(curr => ({
                       reels: curr.reels.map(r => r._id === id ? data : r)
                   }));
              });
              return state;
          });
    }
}));

export default usePlayStore;
