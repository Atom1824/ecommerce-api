import CartModel from "../../dao/models/cart.model.js";
import ProductModel from "../../dao/models/product.model.js"; 

class CartManager {
    constructor() {
        this.model = CartModel;
    }

    async addProductToCart(cartId, productId, quantity = 1) {
        try {
            const cart = await this.model.findById(cartId);
            if (!cart) {
                throw new Error(`Cart with ID ${cartId} not found.`);
            }

            const pid = productId.toString();
            const productIndex = cart.products.findIndex(
                item => item.product.toString() === pid
            );

            if (productIndex !== -1) {
                cart.products[productIndex].quantity += quantity;
            } else {
                cart.products.push({
                    product: productId, 
                    quantity: quantity
                });
            }

            await cart.save();
            return cart;
        } catch (error) {
            console.error('Error in addProductToCart:', error.message);
            throw error; 
        }
    }

    async removeProductFromCart(cartId, productId, quantity = null) {
        try {
            const cart = await this.model.findById(cartId);
            if (!cart) {
                throw new Error(`Cart with ID ${cartId} not found.`);
            }

            const pid = productId.toString();
            const productIndex = cart.products.findIndex(
                item => item.product.toString() === pid
            );

            if (productIndex === -1) {
                throw new Error(`Product with ID ${productId} not found in cart.`);
            }

            if (quantity === null) {
                cart.products.splice(productIndex, 1);
            } else {
                const currentQty = cart.products[productIndex].quantity || 0;
                if (quantity >= currentQty) {
                    cart.products.splice(productIndex, 1);
                } else {
                    cart.products[productIndex].quantity = currentQty - quantity;
                }
            }

            await cart.save();
            return cart;
        } catch (error) {
            console.error('Error in removeProductFromCart:', error.message || error);
            throw error;
        }
    }

    async updateProductQuantity(cartId, productId, quantity) {
        try {
            if (quantity < 1) {
                throw new Error("La cantidad debe ser mayor o igual a 1.");
            }

            const cart = await this.model.findById(cartId);
            if (!cart) {
                throw new Error(`Cart with ID ${cartId} not found.`);
            }

            const pid = productId.toString();
            const productIndex = cart.products.findIndex(
                item => item.product.toString() === pid
            );

            if (productIndex === -1) {
                throw new Error(`Product with ID ${productId} not found in cart.`);
            }

            cart.products[productIndex].quantity = quantity;
            await cart.save();
            return cart;
        } catch (error) {
            console.error('Error in updateProductQuantity:', error.message || error);
            throw error;
        }
    }

    async clearCart(cartId) {
        try {
            const cart = await this.model.findById(cartId);
            if (!cart) {
                throw new Error(`Cart with ID ${cartId} not found.`);
            }

            cart.products = [];
            await cart.save();
            return cart;
        } catch (error) {
            console.error('Error in clearCart:', error.message || error);
            throw error;
        }
    }

    async getCartSummary(cartId) {
        try {
            const cart = await this.model.findById(cartId).populate('products.product');
            if (!cart) {
                throw new Error(`Cart with ID ${cartId} not found.`);
            }

            const items = cart.products.map(item => ({
                product: item.product,
                quantity: item.quantity,
                subtotal: item.product.price * item.quantity
            }));

            const total = items.reduce((sum, item) => sum + item.subtotal, 0);

            return {
                items,
                total
            };
        } catch (error) {
            console.error('Error in getCartSummary:', error.message || error);
            throw error;
        }
    }
}

export default CartManager;

