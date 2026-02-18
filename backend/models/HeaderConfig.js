import mongoose from 'mongoose';

const headerConfigSchema = new mongoose.Schema({
    categories: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category'
    }]
}, {
    timestamps: true
});

const HeaderConfig = mongoose.model('HeaderConfig', headerConfigSchema);

export default HeaderConfig;
