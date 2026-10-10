import mongoose from 'mongoose';

// One row per OTP SMS sent, kept for an hour. Used to limit how often a number
// (and an IP) can request codes, since each one is a paid SMS. Stored in the
// database rather than in memory so every backend instance sees the same count.
const otpSendLogSchema = new mongoose.Schema({
    mobile: { type: String, required: true },
    ip: { type: String, default: '' },
    createdAt: { type: Date, default: Date.now, expires: 60 * 60 },
});

otpSendLogSchema.index({ mobile: 1, createdAt: -1 });
otpSendLogSchema.index({ ip: 1, createdAt: -1 });

const OtpSendLog = mongoose.model('OtpSendLog', otpSendLogSchema);

export default OtpSendLog;
