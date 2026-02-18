import { create } from 'zustand';
import API from '../../../services/api';

const mockPushNotifications = [
    {
        id: 1,
        title: "⚡ Flash Sale Alert",
        message: "Flat 50% OFF on all electronics. Valid for today only!",
        type: "Promotional",
        targetAudience: "All Users",
        sentAt: "2024-02-13T10:00:00Z",
        status: "Sent"
    },
    {
        id: 2,
        title: "📦 Order Update",
        message: "Your recent order has been shipped and is on its way!",
        type: "Order Update",
        targetAudience: "Active Users",
        sentAt: "2024-02-12T15:30:00Z",
        status: "Sent"
    },
    {
        id: 3,
        title: "✨ New Arrival",
        message: "The latest fashion collection is now live. Shop now!",
        type: "New Arrival",
        targetAudience: "All Users",
        sentAt: "2024-02-11T09:15:00Z",
        status: "Sent"
    },
    {
        id: 4,
        title: "🛍️ Miss You!",
        message: "We haven't seen you in a while. Here is a special 20% coupon for you!",
        type: "General",
        targetAudience: "Inactive Users",
        sentAt: "2024-02-10T18:45:00Z",
        status: "Sent"
    }
];

const useNotificationStore = create((set, get) => ({
    // System Notifications (existing)
    notifications: [],
    unreadCount: 0,
    isLoading: false,

    // Push Notifications (Management)
    pushNotifications: [],
    filteredPushNotifications: [],
    showForm: false,

    fetchNotifications: async () => {
        set({ isLoading: true });
        try {
            const { data } = await API.get('/notifications');
            const unread = data.filter(n => !n.isRead).length;
            set({
                notifications: data,
                pushNotifications: data, // Using same history for now or separate depending on model
                filteredPushNotifications: data,
                unreadCount: unread,
                isLoading: false
            });
        } catch (error) {
            console.error('Fetch notifications error:', error);
            set({ isLoading: false });
        }
    },

    // Push Notification Actions
    toggleForm: () => set((state) => ({ showForm: !state.showForm })),

    addPushNotification: async (notification) => {
        set({ isLoading: true });
        try {
            const { data } = await API.post('/notifications/send', notification);
            console.log('📬 Notification API response:', data);
            set((state) => {
                const updated = [data, ...state.pushNotifications];
                return {
                    pushNotifications: updated,
                    filteredPushNotifications: updated,
                    showForm: false,
                    isLoading: false
                };
            });
            return data; // Return the actual data with firebaseSent and tokensTargeted
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
                const updated = state.pushNotifications.filter(n => (n.id || n._id) !== id);
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

    filterPushNotifications: (type, target) => {
        const { pushNotifications } = get();
        let filtered = [...pushNotifications];

        if (type && type !== 'All') {
            filtered = filtered.filter(n => n.type === type);
        }

        if (target && target !== 'All') {
            filtered = filtered.filter(n => n.targetAudience === target);
        }

        set({ filteredPushNotifications: filtered });
    },

    playSound: () => {
        try {
            const beep = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
            beep.volume = 0.5;
            beep.play().catch(e => console.log('Audio play block:', e));
        } catch (e) {
            console.error('Sound error:', e);
        }
    },

    markAsRead: async (id) => {
        try {
            await API.put(`/notifications/${id}/read`);
            set((state) => {
                const updatedNotifications = state.notifications.map(n =>
                    n._id === id ? { ...n, isRead: true } : n
                );
                return {
                    notifications: updatedNotifications,
                    unreadCount: updatedNotifications.filter(n => !n.isRead).length
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
                notifications: state.notifications.map(n => ({ ...n, isRead: true })),
                unreadCount: 0
            }));
        } catch (error) {
            console.error('Mark all read error:', error);
        }
    }
}));

export default useNotificationStore;
