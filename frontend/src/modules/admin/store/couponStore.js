import { create } from 'zustand';
import API from '../../../services/api';

const useCouponStore = create((set) => ({
    coupons: [],
    offers: [],
    isLoading: false,

    fetchCoupons: async () => {
        set({ isLoading: true });
        try {
            const { data } = await API.get('/coupons');
            // Filter into coupons and offers based on isOffer flag or specific logic
            // Assuming 'isOffer' field in model, or implicit by type 'Bank Offer' etc.
            // Model has `type` which could be 'percentage'/'flat' (Coupons) or 'Bank Offer' etc (Offers)
            // Or `isOffer` boolean if added.
             
            // Map backend data to store structure
            const couponList = data.filter(c => !c.isOffer && (c.type === 'percentage' || c.type === 'flat'));
            const offerList = data.filter(c => c.isOffer || (c.type !== 'percentage' && c.type !== 'flat'));

            set({ coupons: couponList, offers: offerList, isLoading: false });
        } catch (error) {
            set({ isLoading: false });
        }
    },

    addCoupon: async (couponData) => {
        // Backend stores all in one collection
        const payload = { ...couponData, isOffer: false };
        try {
            const { data } = await API.post('/coupons', payload);
            set((state) => ({ coupons: [...state.coupons, data] }));
        } catch (error) {
            console.error(error);
        }
    },
    
    addOffer: async (offerData) => {
        const payload = { ...offerData, isOffer: true };
        try {
            const { data } = await API.post('/coupons', payload);
            set((state) => ({ offers: [...state.offers, data] }));
        } catch (error) {
             console.error(error);
        }
    },

    deleteCoupon: async (id) => {
        try {
            await API.delete(`/coupons/${id}`);
            set((state) => ({ coupons: state.coupons.filter(c => c._id !== id) }));
        } catch (error) { console.error(error); }
    },

    deleteOffer: async (id) => {
        try {
            await API.delete(`/coupons/${id}`);
             set((state) => ({ offers: state.offers.filter(o => o._id !== id) }));
        } catch (error) { console.error(error); }
    },

    toggleCouponStatus: async (id) => {
        // Need current status? Since toggle, assume backend handles or we invert local
         // Optimized: Update local first then sync? Or wait.
         // Let's find item first
         set(state => {
             const coupon = state.coupons.find(c => c._id === id);
             if(!coupon) return state;
             // Toggle logic via API
             API.put(`/coupons/${id}`, { active: !coupon.active }).then(({data}) => {
                  set(curr => ({
                      coupons: curr.coupons.map(c => c._id === id ? data : c)
                  }));
             });
             return state;
         });
    },

    toggleOfferStatus: async (id) => {
         set(state => {
             const offer = state.offers.find(o => o._id === id);
             if(!offer) return state;
             API.put(`/coupons/${id}`, { active: !offer.active }).then(({data}) => {
                  set(curr => ({
                      offers: curr.offers.map(o => o._id === id ? data : o)
                  }));
             });
             return state;
         });
    }
}));

export default useCouponStore;
