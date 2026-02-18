import { create } from 'zustand';

const useSupportStore = create((set) => ({
    supportRequests: [
        {
            id: 'RT1001',
            category: 'Order Delay',
            customerName: 'Aditi Sharma',
            contact: '9876543210',
            description: 'My order was supposed to be delivered yesterday but I haven\'t received it yet.',
            status: 'OPEN', // OPEN, IN_PROGRESS, RESOLVED
            date: '2024-01-25T10:00:00Z'
        },
        {
            id: 'RT1002',
            category: 'Payment/Refund Issue',
            customerName: 'Rahul Verma',
            contact: 'rahul.v@example.com',
            description: 'Money deducted but order showing as failed.',
            status: 'IN_PROGRESS',
            date: '2024-01-24T14:30:00Z'
        }
    ],

    addRequest: (request) => set((state) => ({
        supportRequests: [
            {
                ...request,
                id: `RT${Math.floor(Math.random() * 9000) + 1000}`,
                status: 'OPEN',
                date: new Date().toISOString()
            },
            ...state.supportRequests
        ]
    })),

    updateStatus: (id, newStatus) => set((state) => ({
        supportRequests: state.supportRequests.map(req =>
            req.id === id ? { ...req, status: newStatus } : req
        )
    })),

    deleteRequest: (id) => set((state) => ({
        supportRequests: state.supportRequests.filter(req => req.id !== id)
    }))
}));

export default useSupportStore;
