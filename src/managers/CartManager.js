import fs from "fs";

export class CartManager {
  constructor(filePath) {
    this.path = filePath;
  }

  async getCarts() {
    if (!fs.existsSync(this.path)) return [];
    const data = await fs.promises.readFile(this.path, "utf-8");
    return JSON.parse(data);
  }

  async getCartById(id) {
    const carts = await this.getCarts();
    return carts.find(c => c.id === id);
  }

  async addCart(cart = { products: [] }) {
    const carts = await this.getCarts();
    const newCart = {
      id: carts.length > 0 ? carts[carts.length - 1].id + 1 : 1,
      ...cart
    };
    carts.push(newCart);
    await fs.promises.writeFile(this.path, JSON.stringify(carts, null, 2));
    return newCart;
  }

  async addProductToCart(cartId, product) {
    const carts = await this.getCarts();
    const index = carts.findIndex(c => c.id === cartId);
    if (index === -1) return null;

    carts[index].products.push(product);
    await fs.promises.writeFile(this.path, JSON.stringify(carts, null, 2));
    return carts[index];
  }

  async deleteCart(id) {
    const carts = await this.getCarts();
    const filtered = carts.filter(c => c.id !== id);
    await fs.promises.writeFile(this.path, JSON.stringify(filtered, null, 2));
    return true;
  }
}
