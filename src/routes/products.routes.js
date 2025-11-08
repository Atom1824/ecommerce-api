import { Router } from "express";
import ProductManager from "../managers/ProductManager.js";


const router = Router();
const productManager = new ProductManager();

router.get("/", async (req, res) => {
  try {
const { limit = 10, page = 1, sort, category, status, search } = req.query;
const name = search || '';
    const productsResult = await productManager.getProducts({
      limit,
      page,
      sort,
      category,
      status,
      name, 
    });

    res.json({
      status: "success",
      payload: productsResult.docs, 
      totalPages: productsResult.totalPages,
      prevPage: productsResult.prevPage,
      nextPage: productsResult.nextPage,
      page: productsResult.page,
      hasPrevPage: productsResult.hasPrevPage,
      hasNextPage: productsResult.hasNextPage,
      prevLink: productsResult.hasPrevPage
        ? `/api/products?page=${productsResult.prevPage}`
        : null,
      nextLink: productsResult.hasNextPage
        ? `/api/products?page=${productsResult.nextPage}`
        : null,
    });
  } catch (error) {
    console.error("❌ Error en GET /api/products:", error.message);
    res.status(500).json({
      status: "error",
      error: "Error interno del servidor.",
    });
  }
});

router.post("/", async (req, res) => {
  try {
    const newProduct = await productManager.addProduct(req.body);
    res.status(201).json({ status: "success", payload: newProduct });
  } catch (error) {
    res.status(400).json({ status: "error", error: error.message });
  }
});

router.get("/:pid", async (req, res) => {
  try {
    const product = await productManager.getProductById(req.params.pid);
    if (!product)
      return res
        .status(404)
        .json({ status: "error", error: "Producto no encontrado o ID inválido." });

    res.json({ status: "success", payload: product });
  } catch (error) {
    res.status(400).json({ status: "error", error: "ID de producto inválido." });
  }
});

router.put("/:pid", async (req, res) => {
  try {
    const updatedProduct = await productManager.updateProduct(
      req.params.pid,
      req.body
    );
    if (!updatedProduct)
      return res
        .status(404)
        .json({ status: "error", error: "Producto no encontrado o ID inválido." });

    res.json({ status: "success", payload: updatedProduct });
  } catch (error) {
    res.status(400).json({ status: "error", error: error.message });
  }
});

router.delete("/:pid", async (req, res) => {
  try {
    const success = await productManager.deleteProduct(req.params.pid);
    if (!success)
      return res
        .status(404)
        .json({ status: "error", error: "Producto no encontrado o ID inválido." });

    res.json({ status: "success", message: "Producto eliminado con éxito." });
  } catch (error) {
    res.status(500).json({ status: "error", error: error.message });
  }
});

export default router;
