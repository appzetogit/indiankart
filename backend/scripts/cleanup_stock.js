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

async function cleanup() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected.');

        const products = await Product.find({
            $or: [
                { stock: { $lt: 0 } },
                { 'skus.stock': { $lt: 0 } }
            ]
        });

        console.log(`Found ${products.length} products with negative stock.`);

        for (const product of products) {
            console.log(`Fixing ${product.name} (Stock: ${product.stock})...`);
            
            if (product.stock < 0) {
                product.stock = 0;
            }

            if (product.skus && product.skus.length > 0) {
                product.skus.forEach(sku => {
                    if (sku.stock < 0) {
                        sku.stock = 0;
                    }
                });
            }

            // Using updateOne to bypass schema validation for this fix
            await Product.updateOne(
                { _id: product._id },
                { 
                    $set: { 
                        stock: product.stock,
                        skus: product.skus 
                    } 
                }
            );
        }

        console.log('Cleanup complete.');
        process.exit(0);
    } catch (error) {
        console.error('Error during cleanup:', error);
        process.exit(1);
    }
}

cleanup();
