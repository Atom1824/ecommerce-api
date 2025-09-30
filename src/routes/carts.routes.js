import { Router } from "express";
import { CartManager } from "../managers/CartManager.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const cartsPath = path.join(__dirname, "../data/carts.json");
const cartManager = new CartManager(cartsPath);

const router = Router();

router.get("/", async (req, res) => {
  const carts = await cartManager.getCarts();
  res.json(carts);
});

router.post("/", async (req, res) => {
  const newCart = await cartManager.addCart();
  res.status(201).json(newCart);
});

export default router;
