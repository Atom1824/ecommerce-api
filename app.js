import express from "express";
import http from "http";
import { Server } from "socket.io";
import ProductManager from "./ProductManager.js";
import path from "path";
import { fileURLToPath } from "url";
import exphbs from "express-handlebars";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

app.engine("handlebars", exphbs.engine({ extname: ".handlebars", defaultLayout: "main" }));
app.set("view engine", "handlebars");
app.set("views", path.join(__dirname, "src", "views"));

const productManager = new ProductManager("./products.json");

app.get("/realtimeProducts", async (req, res) => {
  const products = await productManager.getProducts();
  res.render("realtimeProducts", { products });
});

io.on("connection", async (socket) => {
  console.log("🟢 Nuevo cliente conectado");

  socket.emit("products", await productManager.getProducts());

  socket.on("createProduct", async (product) => {
    await productManager.addProduct(product);
    io.emit("products", await productManager.getProducts());
  });

  socket.on("deleteProduct", async (id) => {
    await productManager.deleteProduct(id);
    io.emit("products", await productManager.getProducts());
  });
});

server.listen(3000, () => console.log("✅ Server listening on port 3000"));
