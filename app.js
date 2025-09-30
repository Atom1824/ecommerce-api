import express from "express";
import productRoutes from "./src/routes/products.routes.js";
import cartsRoutes from "./src/routes/carts.routes.js";

const app = express();
const PORT = 8080;

app.use(express.json());

// Rutas
app.use("/api/products", productRoutes);
app.use("/api/carts", cartsRoutes);

app.listen(PORT, () => console.log(`Servidor escuchando en puerto ${PORT}`));
