import express from "express";
import http from "http";
import { Server } from "socket.io";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import ProductManager from "./src/managers/ProductManager.js";
import productsRouter from "./src/routes/products.routes.js";
import cartsRouter from "./src/routes/carts.routes.js";
import { engine } from "express-handlebars";
import multer from "multer";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const productManager = new ProductManager();

const MONGO_URL = "mongodb+srv://Atom1824:Mimusica1824--@e-commer.jo7ap1u.mongodb.net/?appName=E-Commer";
mongoose.connect(MONGO_URL)
  .then(() => console.log("✅ Conectado a MongoDB Atlas"))
  .catch((err) => console.error("❌ Error MongoDB:", err));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "src", "public")));

app.engine("handlebars", engine({
  extname: ".handlebars",
  defaultLayout: "main",
  helpers: {
    eq: (a, b) => a === b,
  },
}));
app.set("view engine", "handlebars");
app.set("views", path.join(__dirname, "src", "views"));

app.use("/api/products", productsRouter);
app.use("/api/carts", cartsRouter);

const upload = multer({ storage: multer.memoryStorage() });

app.post("/api/products/upload", upload.single("image"), async (req, res) => {
  try {
    const db = mongoose.connection.db;
    if (!db) return res.status(500).send("DB no disponible");

    let fileId = null;
    if (req.file) {
      const bucket = new mongoose.mongo.GridFSBucket(db, { bucketName: "images" });
      const uploadStream = bucket.openUploadStream(req.file.originalname, {
        contentType: req.file.mimetype,
      });
      uploadStream.end(req.file.buffer);
      await new Promise((resolve, reject) => {
        uploadStream.on("finish", () => {
          fileId = uploadStream.id;
          resolve();
        });
        uploadStream.on("error", reject);
      });
    }

    const newProduct = {
      title: req.body.title,
      description: req.body.description,
      price: parseFloat(req.body.price),
      code: req.body.code,
      stock: parseInt(req.body.stock),
      category: req.body.category,
      thumbnail: fileId ? String(fileId) : null,
    };

    await productManager.addProduct(newProduct);
    const updatedProducts = await productManager.getProducts({ limit: 100 });
    io.emit("products", updatedProducts.docs);

    res.redirect("/");
  } catch (err) {
    console.error("❌ Error al subir producto:", err);
    res.status(500).send("Error interno");
  }
});

app.get("/images/:id", async (req, res) => {
  try {
    const db = mongoose.connection.db;
    if (!db) return res.status(500).send("DB no disponible");
    const bucket = new mongoose.mongo.GridFSBucket(db, { bucketName: "images" });
    const _id = new mongoose.Types.ObjectId(req.params.id);
    const stream = bucket.openDownloadStream(_id);
    stream.on("error", () => res.status(404).send("Imagen no encontrada"));
    stream.pipe(res);
  } catch {
    res.status(500).send("Error al servir imagen");
  }
});

app.get("/", async (req, res) => {
  try {
    const { search = "", sort = "", page = 1 } = req.query;

    const params = {
      limit: 8,
      page: parseInt(page),
      sort,
      name: search, // se usa "name" para la búsqueda en ProductManager
    };

    const productsResult = await productManager.getProducts(params);

    res.render("products", {
      products: productsResult.docs,
      search,
      sort,
      page: productsResult.page,
      totalPages: productsResult.totalPages,
      hasPrevPage: productsResult.hasPrevPage,
      hasNextPage: productsResult.hasNextPage,
      prevPage: productsResult.prevPage,
      nextPage: productsResult.nextPage,
    });
  } catch (error) {
    console.error("❌ Error en GET /:", error);
    res.status(500).send("Error interno del servidor");
  }
});

app.get("/realtimeProducts", async (req, res) => {
  try {
    const productsResult = await productManager.getProducts({ limit: 100 });
    res.render("realTimeProducts", {
      products: productsResult.docs || productsResult,
    });
  } catch (error) {
    console.error("❌ Error en /realtimeProducts:", error);
    res.status(500).send("Error al cargar la vista de productos en tiempo real");
  }
});

app.get("/cart", async (req, res) => {
  try {
    res.render("cart", {
      title: "Tu carrito de compras",
    });
  } catch (error) {
    console.error("❌ Error en /cart:", error);
    res.status(500).send("Error al cargar el carrito");
  }
});


io.on("connection", async (socket) => {
  console.log("🟢 Cliente conectado");
  const products = await productManager.getProducts({ limit: 100 });
  socket.emit("products", products.docs);
});

app.get("/cart", (req, res) => {
  res.render("cart");
});


const PORT = 3001;
server.listen(PORT, () => console.log(`✅ Servidor en http://localhost:${PORT}`));


