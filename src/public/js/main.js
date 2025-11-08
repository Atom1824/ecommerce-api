async function ensureCart() {
    let cid = localStorage.getItem('cartId');
    if (cid) return cid;

    const res = await fetch('/api/carts', { method: 'POST' });
    if (!res.ok) throw new Error('No se pudo crear el carrito');
    const body = await res.json();
    cid = body.cid;
    localStorage.setItem('cartId', cid);
    return cid;
}

async function addToCart(pid, quantity = 1, btn = null, stock = null) {
    if (quantity < 1) {
        alert('La cantidad debe ser mayor a cero');
        return;
    }
    if (stock !== null && quantity > stock) {
        alert(`Solo hay ${stock} unidades disponibles`);
        return;
    }

    if (btn) {
        btn.disabled = true;
        btn.innerHTML = 'Agregando...';
    }

    try {
        const cid = await ensureCart();
        const res = await fetch(`/api/carts/${cid}/products/${pid}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ quantity })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Error añadiendo al carrito');

        alert('Producto añadido al carrito');
        updateCartCounter(data.cart); 
    } catch (err) {
        console.error(err);
        alert('Error al añadir al carrito: ' + err.message);
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = 'Agregar al carrito';
        }
    }
}

function updateCartCounter(cart) {
    const counter = document.getElementById('cart-count');
    if (!counter || !cart || !cart.products) return;
    const totalItems = cart.products.reduce((sum, item) => sum + item.quantity, 0);
    counter.textContent = totalItems;
}

window.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const pid = btn.dataset.pid;
            const qtyInput = document.querySelector(`#qty-${pid}`);
            const q = qtyInput ? parseInt(qtyInput.value) || 1 : 1;
            const stock = parseInt(btn.dataset.stock || '0');
            addToCart(pid, q, btn, stock);
        });
    });
});
