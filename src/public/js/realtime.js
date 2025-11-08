const socket = io();

const form = document.getElementById('productForm');
const titleInput = document.getElementById('title');
const descriptionInput = document.getElementById('description');
const priceInput = document.getElementById('price');
const codeInput = document.getElementById('code');
const stockInput = document.getElementById('stock');
const categoryInput = document.getElementById('category');
const thumbnailInput = document.getElementById('thumbnail');
const productsList = document.getElementById('products-list');


form.addEventListener('submit', (e) => {
    e.preventDefault(); 

    const formData = new FormData();
    formData.append('title', titleInput.value);
    formData.append('description', descriptionInput.value);
    formData.append('price', priceInput.value);
    formData.append('code', codeInput.value);
    formData.append('stock', stockInput.value);
    formData.append('category', categoryInput.value);
    if (thumbnailInput && thumbnailInput.files && thumbnailInput.files[0]) {
        formData.append('image', thumbnailInput.files[0]);
    }

    fetch('/api/products/upload', {
        method: 'POST',
        body: formData
    }).then(async (res) => {
        if (!res.ok) {
            const txt = await res.text();
            alert('Error al crear producto: ' + txt);
            return;
        }
        
        form.reset();
    }).catch(err => {
        console.error('Fetch error al subir producto:', err);
        alert('Error al subir producto');
    });
});


socket.on('products', (products) => {
    let html = '<ul>';
    products.forEach(product => {
        html += `
            <li>
                ${product.thumbnail ? `<div><img src="/images/${product.thumbnail}" alt="${product.title}" style="max-width:150px;max-height:150px;"/></div>` : ''}
                <strong>${product.title}</strong> (ID: ${product._id}) - $${product.price}
                <p>Código: ${product.code} | Stock: ${product.stock}</p>
                <button onclick="deleteProduct('${product._id}')">Eliminar</button>
            </li>
        `;
    });
    html += '</ul>';
    
    productsList.innerHTML = html;
});


function deleteProduct(productId) {
    socket.emit('deleteProduct', productId);
}


socket.on('productError', (errorMessage) => {
    alert(`Error de validación: ${errorMessage}`);
    console.error('Error del servidor:', errorMessage);
});