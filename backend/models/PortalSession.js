import mongoose from 'mongoose';

const portalSessionSchema = mongoose.Schema({
    sessionId: { type: String, required: true, unique: true, index: true, trim: true },
    userId: { type: String, default: '', index: true, trim: true },
    userRole: { type: String, default: 'guest', trim: true },
    authMethod: { type: String, default: 'guest', trim: true },
    loginAt: { type: Date, default: Date.now, index: true },
    lastSeenAt: { type: Date, default: Date.now, index: true },
    logoutAt: { type: Date, default: null, index: true },
    isActive: { type: Boolean, default: true, index: true },
    state: { type: String, default: 'Unknown', trim: true },
    referrer: { type: String, default: 'Direct', trim: true },
    pagesVisited: [{
        path: { type: String, required: true },
        visitedAt: { type: Date, default: Date.now }
    }]
}, {
    timestamps: true
});

portalSessionSchema.index({ isActive: 1, lastSeenAt: -1 });
// Admin analytics filters by activity window and role on every refresh.
portalSessionSchema.index({ userRole: 1, loginAt: -1 });
portalSessionSchema.index({ userRole: 1, logoutAt: -1 });

const PortalSession = mongoose.model('PortalSession', portalSessionSchema);

export default PortalSession;
