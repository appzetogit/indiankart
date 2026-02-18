import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const productSchema = mongoose.Schema({
    id: { type: Number },
    name: { type: String },
    stock: { type: Number },
    skus: [{
        combination: { type: Map, of: String },
        stock: { type: Number }
    }]
}, { strict: false });

const Product = mongoose.model('Product', productSchema);

async function checkStock() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const productsWithStock = await Product.find({ 
            $or: [
                { stock: { $gt: 0 } }, 
                { 'skus.stock': { $gt: 0 } }
            ] 
        });
        
        console.log('Products with stock > 0:');
        console.log(JSON.stringify(productsWithStock.map(p => ({ 
            id: p.id, 
            name: p.name, 
            stock: p.stock,
            skus: p.skus?.map(s => ({ combination: s.combination, stock: s.stock }))
        })), null, 2));

        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

checkStock();
