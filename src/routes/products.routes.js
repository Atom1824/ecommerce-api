import { Router } from "express";
import { ProductManager } from "../managers/ProductManager.js";
import path from "path";
import { fileURLToPath } from "url";

// Configurar __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ruta absoluta al JSON
const productsPath = path.join(__dirname, "../data/products.json");
const productManager = new ProductManager(productsPath);

const router = Router();

// GET todos
router.get("/", async (req, res) => {
  const products = await productManager.getProducts();
  res.json(products);
});

// POST producto
router.post("/", async (req, res) => {
  const newProduct = await productManager.addProduct(req.body);
  res.status(201).json(newProduct);
});

// GET por ID
router.get("/:pid", async (req, res) => {
  const product = await productManager.getProductById(Number(req.params.pid));
  if (!product) return res.status(404).json({ error: "Producto no encontrado" });
  res.json(product);
});

// PUT producto
router.put("/:pid", async (req, res) => {
  const updatedProduct = await productManager.updateProduct(Number(req.params.pid), req.body);
  if (!updatedProduct) return res.status(404).json({ error: "Producto no encontrado" });
  res.json(updatedProduct);
});

// DELETE producto
router.delete("/:pid", async (req, res) => {
  await productManager.deleteProduct(Number(req.params.pid));
  res.json({ message: "Producto eliminado" });
});

export default router;
