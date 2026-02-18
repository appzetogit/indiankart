import mongoose from 'mongoose';

const homeLayoutSchema = mongoose.Schema({
    isMain: { type: Boolean, default: true, unique: true }, // Singleton pattern enforcement
    items: [{
        type: { 
            type: String, 
            enum: ['section', 'banner'], 
            required: true 
        },
        referenceId: { 
            type: String, // Can be ObjectId (Banner) or Custom String ID (HomeSection)
            required: true 
        }
    }]
}, {
    timestamps: true,
});

const HomeLayout = mongoose.model('HomeLayout', homeLayoutSchema);
export default HomeLayout;
