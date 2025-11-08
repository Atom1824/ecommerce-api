import express from "express";
import http from "http";
import { Server } from "socket.io";
// Importaciones de helpers necesarias
import path from "path";
import { fileURLToPath } from "url"; 

// Importamos mongoose para la conexión a la base de datos
import mongoose from "mongoose"; 
// Importamos el nuevo ProductManager basado en Mongoose
// CORRECCIÓN 1: El Manager debe subir a la raíz (..) y bajar a 'managers/' desde 'routes/'
import ProductManager from "./src/managers/ProductManager.js";  

// CORRECCIÓN 2 y 3: Los routers están en la carpeta 'routes', NO en 'src/routes'.
import productsRouter from "./src/routes/products.routes.js"; 
import cartsRouter from "./src/routes/carts.routes.js";  

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// --- CONEXIÓN A MONGODB ---
// **IMPORTANTE**: Reemplaza 'TU_CADENA_DE_CONEXION' con tu URL real de MongoDB.
const MONGO_URL = "mongodb+srv://Atom1824:Mimusica1824--@e-commer.jo7ap1u.mongodb.net/?appName=E-Commer"; // Ejemplo Cloud (Atlas)

mongoose.connect(MONGO_URL)
    .then(() => console.log("✅ Conexión a MongoDB Atlas establecida con éxito"))
    .catch((error) => console.error("❌ Error al conectar a MongoDB:", error));

// ---------------------------

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Servir archivos estáticos desde `src/public` (donde están CSS/JS estáticos)
app.use(express.static(path.join(__dirname, "src", "public")));

// Asegúrate de tener exphbs importado si lo usas
import exphbs from "express-handlebars";

// Inicializamos express-handlebars
app.engine("handlebars", exphbs.engine({ extname: ".handlebars", defaultLayout: "main" }));
app.set("view engine", "handlebars");
// Las vistas están en `src/views` según la estructura del proyecto.
app.set("views", path.join(__dirname, "src", "views"));

app.use("/api/carts", cartsRouter);
app.use("/api/products", productsRouter);
import multer from 'multer';

// Inicializamos el ProductManager sin pasarle una ruta de archivo
const productManager = new ProductManager();

// Multer para recibir archivos en memoria (los subimos a GridFS)
const upload = multer({ storage: multer.memoryStorage() });

// Endpoint para subir producto con imagen (guardada en GridFS)
app.post('/api/products/upload', upload.single('image'), async (req, res) => {
	try {
		const db = mongoose.connection.db;
		if (!db) return res.status(500).send('DB no disponible');

		let fileId = null;
		if (req.file) {
			const bucket = new mongoose.mongo.GridFSBucket(db, { bucketName: 'images' });
			const uploadStream = bucket.openUploadStream(req.file.originalname, { contentType: req.file.mimetype });
			uploadStream.end(req.file.buffer);
			await new Promise((resolve, reject) => {
				uploadStream.on('finish', () => {
					fileId = uploadStream.id;
					resolve();
				});
				uploadStream.on('error', reject);
			});
		}

		const productData = {
			title: req.body.title,
			description: req.body.description,
			price: parseFloat(req.body.price),
			code: req.body.code,
			stock: parseInt(req.body.stock),
			category: req.body.category,
		};
		if (fileId) productData.thumbnail = String(fileId);

		const created = await productManager.addProduct(productData);
		const updatedProducts = await productManager.getProducts({ limit: 100 });
		io.emit('products', updatedProducts.docs);
		res.status(201).json({ status: 'success', payload: created });
	} catch (error) {
		console.error('POST /api/products/upload error:', error);
		res.status(500).send(error.message || 'Error interno');
	}
});

// Endpoint para servir imágenes guardadas en GridFS
app.get('/images/:id', async (req, res) => {
	try {
		const db = mongoose.connection.db;
		if (!db) return res.status(500).send('DB no disponible');
		const bucket = new mongoose.mongo.GridFSBucket(db, { bucketName: 'images' });
		const _id = new mongoose.Types.ObjectId(req.params.id);
		const downloadStream = bucket.openDownloadStream(_id);
		downloadStream.on('error', () => res.status(404).send('Imagen no encontrada'));
		res.setHeader('Cache-Control', 'public, max-age=31536000');
		downloadStream.pipe(res);
	} catch (error) {
		console.error('GET /images/:id error', error);
		res.status(500).send('Error al servir la imagen');
	}
});

app.get("/realtimeProducts", async (_req, res) => {
    try {
        // Usamos el nuevo método getProducts que maneja paginación/filtros
        const productsResult = await productManager.getProducts(); 
        res.render("realtimeProducts", { products: productsResult.docs }); // Enviamos solo los documentos
    } catch (error) {
        console.error("Error al obtener productos para vista:", error);
        res.status(500).send("Error interno del servidor.");
    }
});

// Página principal: lista de productos (tienda)
app.get('/', async (_req, res) => {
	try {
		const productsResult = await productManager.getProducts({}, { limit: 1000, page: 1, lean: true });
		res.render('products', { products: productsResult.docs });
	} catch (error) {
		console.error('Error en GET /:', error);
		res.status(500).send('Error interno');
	}
});

// Mostrar carrito (si se proporciona cid en query o localStorage)
app.get('/cart', async (req, res) => {
	try {
		// Obtener cid desde query ?cid=... o mostrar vacío
		const cid = req.query.cid;
		if (!cid) return res.render('cart', { cart: null });
		const CartModel = (await import('./dao/models/cart.model.js')).default;
		const cart = await CartModel.findById(cid).populate('products.product').lean();
		if (cart && cart.products) {
			let total = 0;
			cart.products = cart.products.map(item => {
				const price = item.product ? (item.product.price || 0) : 0;
				const subtotal = price * (item.quantity || 0);
				total += subtotal;
				return { ...item, subtotal };
			});
			res.render('cart', { cart, total });
		} else {
			res.render('cart', { cart: null });
		}
	} catch (error) {
		console.error('Error en GET /cart:', error);
		res.status(500).send('Error interno');
	}
});

io.on("connection", async (socket) => {
    console.log("🟢 Nuevo cliente conectado");

    // Enviamos los productos iniciales usando el nuevo Manager
    const initialProducts = await productManager.getProducts({ limit: 100 }); // Puedes ajustar el límite
    socket.emit("products", initialProducts.docs); 

	socket.on("createProduct", async (product) => {
	try {
			console.log('Socket: createProduct recibido ->', product);
			const created = await productManager.addProduct(product);
			console.log('Socket: producto creado, id ->', created?._id);
			// Volvemos a emitir la lista actualizada
			const updatedProducts = await productManager.getProducts({ limit: 100 });
			io.emit("products", updatedProducts.docs);
		} catch (error) {
			// Manejo de errores de validación de Mongoose/Manager
			console.error("Socket: Error al crear producto:", error);
			socket.emit('productError', error.message || String(error)); 
		}
    });

    socket.on("deleteProduct", async (id) => {
        try {
            await productManager.deleteProduct(id);
            // Volvemos a emitir la lista actualizada
            const updatedProducts = await productManager.getProducts({ limit: 100 });
            io.emit("products", updatedProducts.docs);
        } catch (error) {
             console.error("Error al eliminar producto por Socket:", error.message);
             socket.emit('productError', error.message);
        }
    });
});

// Usar variable de entorno PORT si está definida, por defecto 3001
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`✅ Server listening on port ${PORT}`));
