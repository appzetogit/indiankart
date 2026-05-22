import mongoose from 'mongoose';

const portalSessionSchema = mongoose.Schema({
    sessionId: { type: String, required: true, unique: true, index: true, trim: true },
    userId: { type: String, required: true, index: true, trim: true },
    userRole: { type: String, default: 'user', trim: true },
    authMethod: { type: String, default: 'unknown', trim: true },
    loginAt: { type: Date, default: Date.now, index: true },
    lastSeenAt: { type: Date, default: Date.now, index: true },
    logoutAt: { type: Date, default: null, index: true },
    isActive: { type: Boolean, default: true, index: true },
    state: { type: String, default: 'Unknown', trim: true },
    pagesVisited: [{
        path: { type: String, required: true },
        visitedAt: { type: Date, default: Date.now }
    }]
}, {
    timestamps: true
});

portalSessionSchema.index({ isActive: 1, lastSeenAt: -1 });

const PortalSession = mongoose.model('PortalSession', portalSessionSchema);

export default PortalSession;
