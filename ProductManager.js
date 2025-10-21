import fs from "fs";

export default class ProductManager {
  constructor(filePath) {
    this.path = filePath;
  }

  async getProducts() {
    try {
      if (!fs.existsSync(this.path)) {
        await fs.promises.writeFile(this.path, "[]");
        return [];
      }
      const data = await fs.promises.readFile(this.path, "utf-8");
      return JSON.parse(data);
    } catch (error) {
      console.error("Error leyendo productos:", error);
      return [];
    }
  }

  async getProductById(id) {
    const products = await this.getProducts();
    return products.find(p => p.id === id.toString());
  }

  async addProduct(product) {
    const products = await this.getProducts();
    const newProduct = {
      id: (products.length > 0 ? parseInt(products[products.length - 1].id) + 1 : 1).toString(),
      status: true,
      ...product
    };
    products.push(newProduct);
    await fs.promises.writeFile(this.path, JSON.stringify(products, null, 2));
    return newProduct;
  }

  async updateProduct(id, data) {
    const products = await this.getProducts();
    const index = products.findIndex(p => p.id === id.toString());
    if (index === -1) return null;
    products[index] = { ...products[index], ...data, id: id.toString() };
    await fs.promises.writeFile(this.path, JSON.stringify(products, null, 2));
    return products[index];
  }

  async deleteProduct(id) {
    const products = await this.getProducts();
    const filtered = products.filter(p => p.id.toString() !== id.toString());
    await fs.promises.writeFile(this.path, JSON.stringify(filtered, null, 2));
    return true;
  }
}
