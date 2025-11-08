async function renderCart() {
    const container = document.getElementById('cart-container');
    container.innerHTML = '<p class="loader">Cargando carrito...</p>';
    const cid = localStorage.getItem('cartId');
    if (!cid) {
        container.innerHTML = '<p>No hay carrito. Agrega productos desde la tienda.</p>';
        return;
    }
    try {
        const res = await fetch(`/api/carts/${cid}`);
        if (!res.ok) {
            container.innerHTML = '<p>No se pudo cargar el carrito.</p>';
            return;
        }
        const body = await res.json();
        const cart = body.cart;
        if (!cart || !cart.products || cart.products.length === 0) {
            container.innerHTML = '<p>Tu carrito está vacío.</p>';
            return;
        }

        let html = '<table border="1" cellpadding="8"><thead><tr><th>Producto</th><th>Precio</th><th>Cantidad</th><th>Subtotal</th><th>Acciones</th></tr></thead><tbody>';
        let total = 0;
        for (const item of cart.products) {
            const prod = item.product || {};
            const price = prod.price || 0;
            const qty = item.quantity || 0;
            const subtotal = price * qty;
            total += subtotal;
            const pid = prod._id || '';

            html += `<tr>
                <td>${prod.title || 'Producto desconocido'}</td>
                <td>$${price}</td>
                <td>${qty}</td>
                <td>$${subtotal}</td>
                <td>
                    <input type="number" min="1" max="${qty}" value="1" id="remove-qty-${pid}" style="width:60px;" />
                    <button class="remove-from-cart-btn" data-pid="${pid}">Quitar</button>
                </td>
            </tr>`;
        }
        html += `</tbody></table><h3>Total: $${total}</h3>`;
        html += `<button id="clear-cart-btn">Vaciar carrito</button>`;
        container.innerHTML = html;
    } catch (err) {
        console.error('Error fetching cart:', err);
        container.innerHTML = '<p>Error al cargar el carrito.</p>';
    }
}

window.addEventListener('DOMContentLoaded', () => {
    renderCart();

    document.addEventListener('click', async (e) => {
        const cid = localStorage.getItem('cartId');
        if (!cid) return;

        
        if (e.target.classList.contains('remove-from-cart-btn')) {
            const pid = e.target.dataset.pid;
            const qtyInput = document.getElementById(`remove-qty-${pid}`);
            const qty = parseInt(qtyInput?.value || '1');
            if (!pid || isNaN(qty)) return;

            try {
                const res = await fetch(`/api/carts/${cid}/products/${pid}?quantity=${qty}`, { method: 'DELETE' });
                const body = await res.json().catch(() => ({}));
                if (!res.ok) {
                    alert('Error al eliminar: ' + (body.message || res.statusText));
                    return;
                }
                alert('Producto eliminado correctamente');
                renderCart();
            } catch (err) {
                console.error('Error removing product from cart:', err);
                alert('Error al eliminar producto');
            }
        }

        if (e.target.id === 'clear-cart-btn') {
            if (!confirm('¿Estás seguro de que quieres vaciar el carrito?')) return;
            try {
                const res = await fetch(`/api/carts/${cid}`, { method: 'DELETE' });
                const body = await res.json().catch(() => ({}));
                if (!res.ok) {
                    alert('Error al vaciar carrito: ' + (body.message || res.statusText));
                    return;
                }
                alert('Carrito vaciado correctamente');
                renderCart();
            } catch (err) {
                console.error('Error clearing cart:', err);
                alert('Error al vaciar carrito');
            }
        }
    });
});

