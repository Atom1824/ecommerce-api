import { Router } from 'express';
import CartManager from "../managers/CartManager.js";
import CartModel from '../../dao/models/cart.model.js';

const cartsRouter = Router();
const cartManager = new CartManager();


cartsRouter.post('/', async (_req, res) => {
    try {
        const cart = await CartModel.create({ products: [] });
        return res.status(201).json({ status: 'success', cid: cart._id });
    } catch (error) {
        console.error('Error creating cart:', error);
        return res.status(500).json({ status: 'error', message: 'Could not create cart.' });
    }
});

cartsRouter.post('/:cid/products/:pid', async (req, res) => {
    const { cid, pid } = req.params;
    let { quantity } = req.body;
    quantity = quantity ? parseInt(quantity) : 1;
    if (isNaN(quantity) || quantity < 1) {
        return res.status(400).send({ status: 'error', message: 'Quantity must be a positive number.' });
    }
    try {
        const updatedCart = await cartManager.addProductToCart(cid, pid, quantity);
        return res.status(200).send({ status: 'success', message: 'Product added to cart successfully.', cart: updatedCart });
    } catch (error) {
        return res.status(404).send({ status: 'error', message: error.message });
    }
});

cartsRouter.get('/:cid', async (req, res) => {
    const { cid } = req.params;
    try {
        const cart = await CartModel.findById(cid).populate('products.product');
        if (!cart) return res.status(404).json({ status: 'error', message: 'Carrito no encontrado' });
        return res.json({ status: 'success', cart });
    } catch (error) {
        console.error('Error GET /api/carts/:cid', error);
        return res.status(500).json({ status: 'error', message: 'Error interno' });
    }
});

cartsRouter.delete('/:cid/products/:pid', async (req, res) => {
    const { cid, pid } = req.params;
    let quantity = req.query.quantity || req.body?.quantity;
    if (quantity !== undefined) {
        quantity = parseInt(quantity);
        if (isNaN(quantity) || quantity < 1) {
            return res.status(400).json({ status: 'error', message: 'Quantity must be a positive number.' });
        }
    } else {
        quantity = null; 
    }

    try {
        const updatedCart = await cartManager.removeProductFromCart(cid, pid, quantity);
        return res.status(200).json({ status: 'success', message: 'Product removed from cart.', cart: updatedCart });
    } catch (error) {
        return res.status(404).json({ status: 'error', message: error.message });
    }
});

cartsRouter.delete('/:cid', async (req, res) => {
    const { cid } = req.params;
    try {
        const clearedCart = await cartManager.clearCart(cid);
        return res.status(200).json({ status: 'success', message: 'Carrito vaciado correctamente', cart: clearedCart });
    } catch (error) {
        console.error('Error al vaciar el carrito:', error.message);
        return res.status(500).json({ status: 'error', message: error.message });
    }
});


export default cartsRouter;