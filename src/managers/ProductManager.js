import ProductModel from "../../dao/models/product.model.js"; // CAMBIO DE RUTA
import mongoose from "mongoose";

export default class ProductManager {
    // El constructor ya no necesita una ruta de archivo
    constructor() {
        console.log("ProductManager inicializado con Mongoose.");
    }
    // --- Criterio: Productos (Paginación, Filtros, Ordenamiento) ---
    async getProducts(query = {}, options = {}) {
        try {
            // Implementa paginación, filtros y ordenamiento usando Mongoose
            const products = await ProductModel.paginate(query, options);
            return products;
        } catch (error) {
            // Manejo de errores para evitar la caída del servidor
            console.error("Error al leer productos (Mongoose):", error);
            // Devuelve un error para ser manejado en la capa de rutas
            throw new Error("Error interno al obtener productos.");
        }
    }

    async getProductById(id) {
        try {
            // 1. Validar el formato del ID (opcional pero recomendado)
            if (!mongoose.Types.ObjectId.isValid(id)) {
                return null; // O lanzar un error específico
            }
            
            // Buscar el producto por ID
            const product = await ProductModel.findById(id).lean();
            return product; // Mongoose devuelve null si no lo encuentra
        } catch (error) {
            console.error("Error al buscar producto por ID:", error);
            throw new Error("Error interno al buscar el producto.");
        }
    }

    // --- Criterio: Validaciones (Datos faltantes/incorrectos) ---
    async addProduct(product) {
        // Validación de campos requeridos
        const requiredFields = ['title', 'description', 'price', 'code', 'stock', 'category'];
        for (const field of requiredFields) {
            if (!product[field]) {
                // Devolver un error específico para la capa de rutas
                throw new Error(`El campo '${field}' es obligatorio.`);
            }
        }
        // Normalizar/convertir la categoría si viene como código numérico
        // Permite enviar categorías como 1,2,3,4 desde el cliente y mapearlas a los valores esperados por el esquema
        const categoryMap = {
            '1': 'electrónica',
            '2': 'ropa',
            '3': 'hogar',
            '4': 'otros'
        };
        if (product.category !== undefined) {
            // Si viene como número, convertir a string
            if (typeof product.category === 'number') product.category = String(product.category);
            // Si es un código conocido, mapear al valor de enum
            if (categoryMap[product.category]) {
                product.category = categoryMap[product.category];
            } else {
                // Normalizar string (trim y lower case) para reducir problemas de formato
                product.category = String(product.category).trim().toLowerCase();
            }
        }
        
        try {
            console.log('ProductManager.addProduct: intentando crear producto ->', product);
            // Verificar si el código ya existe
            const existingProduct = await ProductModel.findOne({ code: product.code });
            if (existingProduct) {
                throw new Error(`El código ${product.code} ya está en uso.`);
            }

            // Mongoose manejará el auto-ID (_id) y el campo 'status'
            const newProduct = {
                status: true, // Asigna status por defecto si no viene
                ...product
            };

            const createdProduct = await ProductModel.create(newProduct);
            console.log('ProductManager.addProduct: producto creado ->', createdProduct._id);
            return createdProduct;
        } catch (error) {
            // Captura errores de base de datos o de validación de esquema
            console.error("ProductManager.addProduct - Error al añadir producto:", error);
            throw new Error(`Error al crear producto: ${error.message}`);
        }
    }

    async updateProduct(id, data) {
        try {
            // 1. Validar el formato del ID
            if (!mongoose.Types.ObjectId.isValid(id)) {
                throw new Error("ID de producto inválido.");
            }
            
            // Evitar que se actualice el ID
            delete data._id; 
            
            // Buscar y actualizar. 'new: true' devuelve el documento actualizado
            const updatedProduct = await ProductModel.findByIdAndUpdate(
                id, 
                { $set: data }, 
                { new: true, runValidators: true } // 'runValidators' ejecuta las validaciones del esquema
            ).lean();

            if (!updatedProduct) {
                return null; // Producto no encontrado
            }
            return updatedProduct;
        } catch (error) {
            console.error("Error al actualizar producto:", error);
            throw new Error(`Error al actualizar producto: ${error.message}`);
        }
    }

    async deleteProduct(id) {
        try {
            // 1. Validar el formato del ID
            if (!mongoose.Types.ObjectId.isValid(id)) {
                throw new Error("ID de producto inválido.");
            }
            
            const result = await ProductModel.deleteOne({ _id: id });

            // result.deletedCount es 1 si se borró algo, 0 si no se encontró
            return result.deletedCount > 0; 
        } catch (error) {
            console.error("Error al eliminar producto:", error);
            throw new Error("Error interno al eliminar el producto.");
        }
    }
}