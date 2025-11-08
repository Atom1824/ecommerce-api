import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';


const productSchema = new mongoose.Schema({
    title: { 
        type: String, 
        required: true, 
        index: true 
    },
    description: { 
        type: String, 
        required: true 
    },
    price: { 
        type: Number, 
        required: true, 
        min: 0
    },
    thumbnail: { 
        type: String, 
        default: 'Sin imagen'
    },
    code: { 
        type: String, 
        required: true, 
        unique: true 
    },
    stock: { 
        type: Number, 
        required: true, 
        min: 0 
    },
    status: { 
        type: Boolean, 
        default: true 
    },
    category: { 
        type: String, 
        required: true,
        enum: ['electrónica', 'ropa', 'hogar', 'otros','videojuegos', 'Libros', 'Deportes', 'Salud', 'Belleza', 'Alimentos', 'Juguetes'] 
    }
}, {
    
    timestamps: true 
});


productSchema.plugin(mongoosePaginate);


const ProductModel = mongoose.model('Product', productSchema);

export default ProductModel;