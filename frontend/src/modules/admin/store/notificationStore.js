import { create } from 'zustand';
import API from '../../../services/api';

const useNotificationStore = create((set, get) => ({
    notifications: [],
    unreadCount: 0,
    isLoading: false,
    pushNotifications: [],
    filteredPushNotifications: [],

    fetchNotifications: async () => {
        set({ isLoading: true });
        try {
            const { data } = await API.get('/notifications');
            const unread = data.filter((notification) => !notification.isRead).length;
            set({
                notifications: data,
                pushNotifications: data,
                filteredPushNotifications: data,
                unreadCount: unread,
                isLoading: false
            });
        } catch (error) {
            console.error('Fetch notifications error:', error);
            set({ isLoading: false });
        }
    },

    addPushNotification: async (notification) => {
        set({ isLoading: true });
        try {
            const { data } = await API.post('/notifications/send', notification);
            set((state) => {
                const updated = [data, ...state.pushNotifications];
                return {
                    pushNotifications: updated,
                    filteredPushNotifications: updated,
                    isLoading: false
                };
            });
            return data;
        } catch (error) {
            console.error('Send push notification error:', error);
            set({ isLoading: false });
            throw error;
        }
    },

    deletePushNotification: async (id) => {
        try {
            await API.delete(`/notifications/${id}`);
            set((state) => {
                const updated = state.pushNotifications.filter((notification) => (notification.id || notification._id) !== id);
                return {
                    pushNotifications: updated,
                    filteredPushNotifications: updated
                };
            });
            return true;
        } catch (error) {
            console.error('Delete notification error:', error);
            throw error;
        }
    },

    deleteAllNotifications: async () => {
        try {
            await API.delete('/notifications');
            set({
                notifications: [],
                pushNotifications: [],
                filteredPushNotifications: [],
                unreadCount: 0
            });
            return true;
        } catch (error) {
            console.error('Delete all notifications error:', error);
            throw error;
        }
    },

    filterPushNotifications: (type, target) => {
        const { pushNotifications } = get();
        let filtered = [...pushNotifications];

        if (type && type !== 'All') {
            filtered = filtered.filter((notification) => notification.type === type);
        }

        if (target && target !== 'All') {
            filtered = filtered.filter((notification) => notification.targetAudience === target);
        }

        set({ filteredPushNotifications: filtered });
    },

    playSound: () => {
        try {
            const beep = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
            beep.volume = 0.5;
            beep.play().catch((error) => console.log('Audio play block:', error));
        } catch (error) {
            console.error('Sound error:', error);
        }
    },

    markAsRead: async (id) => {
        try {
            await API.put(`/notifications/${id}/read`);
            set((state) => {
                const updatedNotifications = state.notifications.map((notification) =>
                    notification._id === id ? { ...notification, isRead: true } : notification
                );
                return {
                    notifications: updatedNotifications,
                    unreadCount: updatedNotifications.filter((notification) => !notification.isRead).length
                };
            });
        } catch (error) {
            console.error('Mark as read error:', error);
        }
    },

    markAllAsRead: async () => {
        try {
            await API.put('/notifications/read-all');
            set((state) => ({
                notifications: state.notifications.map((notification) => ({ ...notification, isRead: true })),
                unreadCount: 0
            }));
        } catch (error) {
            console.error('Mark all read error:', error);
        }
    }
}));

export default useNotificationStore;
