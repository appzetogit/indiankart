import { create } from 'zustand';
import API from '../../../services/api';
import toast from 'react-hot-toast';

const usePinCodeStore = create((set, get) => ({
    pinCodes: [],
    isLoading: false,
    currentPage: 1,
    pageSize: 25,
    totalCount: 0,
    totalPages: 1,
    
    fetchPinCodes: async (page = get().currentPage) => {
        set({ isLoading: true });
        try {
            const limit = get().pageSize;
            const { data } = await API.get(`/pincodes?page=${page}&limit=${limit}`);
            set({
                pinCodes: data.items || [],
                currentPage: data.pagination?.page || page,
                pageSize: data.pagination?.limit || limit,
                totalCount: data.pagination?.totalCount || 0,
                totalPages: data.pagination?.totalPages || 1,
                isLoading: false
            });
        } catch (error) {
            set({ isLoading: false });
            console.error(error);
            toast.error('Failed to load PIN codes');
        }
    },

    addPinCode: async (pinData) => {
        set({ isLoading: true });
        try {
            await API.post('/pincodes', pinData);
            await get().fetchPinCodes(1);
            toast.success('PIN Code added successfully');
            return true;
        } catch (error) {
            set({ isLoading: false });
            const message = error.response?.data?.message || 'Failed to add PIN code';
            toast.error(message);
            return false;
        }
    },

    deletePinCode: async (id) => {
        if (!window.confirm('Are you sure you want to delete this PIN Code?')) return;
        
        try {
            await API.delete(`/pincodes/${id}`);
            const { currentPage, pinCodes } = get();
            const nextPage = pinCodes.length === 1 && currentPage > 1 ? currentPage - 1 : currentPage;
            await get().fetchPinCodes(nextPage);
            toast.success('PIN Code deleted');
        } catch (error) {
            toast.error('Failed to delete PIN Code');
        }
    },

    updatePinCode: async (id, updateData) => {
        try {
            const { data } = await API.put(`/pincodes/${id}`, updateData);
            set(state => ({
                pinCodes: state.pinCodes.map(p => p._id === id ? data : p)
            }));
            toast.success('PIN Code updated');
            return true;
        } catch (error) {
            toast.error('Failed to update PIN Code');
            console.error(error);
            return false;
        }
    },

    setCurrentPage: async (page) => {
        await get().fetchPinCodes(page);
    },

    bulkImportPinCodes: async (file) => {
        try {
            const formData = new FormData();
            formData.append('file', file);
            
            const { data } = await API.post('/pincodes/bulk-import', formData);
            
            // Refresh the pincode list
            await get().fetchPinCodes(1);

            const summary = {
                status: data.results?.errors?.length
                    ? (data.results?.successful > 0 ? 'partial' : 'error')
                    : 'success',
                message: data.message || 'Bulk import completed',
                ...data.results,
                meta: data.meta || null
            };

            if (summary.status === 'success') {
                toast.success(`Import complete: ${summary.successful} added, ${summary.updated || 0} updated`);
            } else if (summary.status === 'partial') {
                toast.success(`Import partially complete: ${summary.successful} added, ${summary.updated || 0} updated, ${summary.skipped} skipped`);
            } else {
                toast.error(summary.message);
            }

            return summary;
        } catch (error) {
            const message = error.response?.data?.message || 'Failed to import Excel file';
            const results = error.response?.data?.results;
            toast.error(message);
            return {
                status: 'error',
                message,
                total: results?.total || 0,
                successful: results?.successful || 0,
                updated: results?.updated || 0,
                skipped: results?.skipped || 0,
                errors: results?.errors || []
            };
        }
    }
}));

export default usePinCodeStore;
