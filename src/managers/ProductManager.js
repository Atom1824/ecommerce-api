import ProductModel from "../../dao/models/product.model.js";
import mongoose from "mongoose";

export default class ProductManager {
    constructor() {
        console.log("✅ ProductManager inicializado con Mongoose.");
    }

    async getProducts(queryParams = {}) {
        try {
            const { name, sort, category, page = 1, limit = 10 } = queryParams;

            const filter = {};

            if (name) {
                filter.title = { $regex: name, $options: "i" };
            }

            if (category) {
                filter.category = category.toLowerCase();
            }

            let sortOption = {};
            if (sort === "asc") {
                sortOption = { price: 1 };
            } else if (sort === "desc") {
                sortOption = { price: -1 };
            }

            const options = {
                page: parseInt(page),
                limit: parseInt(limit),
                sort: sortOption,
                lean: true,
            };

            const products = await ProductModel.paginate(filter, options);
            return products;
        } catch (error) {
            console.error("❌ Error al leer productos (Mongoose):", error);
            throw new Error("Error interno al obtener productos.");
        }
    }

    async getProductById(id) {
        try {
            if (!mongoose.Types.ObjectId.isValid(id)) return null;
            const product = await ProductModel.findById(id).lean();
            return product;
        } catch (error) {
            console.error("❌ Error al buscar producto por ID:", error);
            throw new Error("Error interno al buscar el producto.");
        }
    }

    async addProduct(product) {
        const requiredFields = ['title', 'description', 'price', 'code', 'stock', 'category'];
        for (const field of requiredFields) {
            if (!product[field]) {
                throw new Error(`El campo '${field}' es obligatorio.`);
            }
        }

        const categoryMap = {
            '1': 'electrónica',
            '2': 'ropa',
            '3': 'hogar',
            '4': 'otros'
        };

        if (product.category !== undefined) {
            if (typeof product.category === 'number') product.category = String(product.category);
            if (categoryMap[product.category]) {
                product.category = categoryMap[product.category];
            } else {
                product.category = String(product.category).trim().toLowerCase();
            }
        }

        try {
            const existingProduct = await ProductModel.findOne({ code: product.code });
            if (existingProduct) {
                throw new Error(`El código ${product.code} ya está en uso.`);
            }

            const newProduct = { status: true, ...product };
            const createdProduct = await ProductModel.create(newProduct);
            return createdProduct;
        } catch (error) {
            console.error("❌ Error al añadir producto:", error);
            throw new Error(`Error al crear producto: ${error.message}`);
        }
    }

    async updateProduct(id, data) {
        try {
            if (!mongoose.Types.ObjectId.isValid(id)) throw new Error("ID de producto inválido.");
            delete data._id;

            const updatedProduct = await ProductModel.findByIdAndUpdate(
                id,
                { $set: data },
                { new: true, runValidators: true, lean: true }
            );

            return updatedProduct;
        } catch (error) {
            console.error("❌ Error al actualizar producto:", error);
            throw new Error(`Error al actualizar producto: ${error.message}`);
        }
    }

    async deleteProduct(id) {
        try {
            if (!mongoose.Types.ObjectId.isValid(id)) throw new Error("ID de producto inválido.");
            const result = await ProductModel.deleteOne({ _id: id });
            return result.deletedCount > 0;
        } catch (error) {
            console.error("❌ Error al eliminar producto:", error);
            throw new Error("Error interno al eliminar el producto.");
        }
    }
}
