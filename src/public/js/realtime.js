const socket = io();

function renderProducts(products) {
    const list = document.getElementById("productsList");
    list.innerHTML = "";
    products.forEach(p => {
        const li = document.createElement("li");
        li.dataset.id = p.id;
        li.innerHTML = `${p.title} - $${p.price} <button class="deleteBtn">Eliminar</button>`;
        list.appendChild(li);
    });
}

socket.on("products", products => renderProducts(products));

document.getElementById("productForm").addEventListener("submit", e => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const product = {
        title: formData.get("title"),
        price: parseFloat(formData.get("price"))
    };
    socket.emit("createProduct", product);
    e.target.reset();
});

document.getElementById("productsList").addEventListener("click", e => {
    if (e.target.classList.contains("deleteBtn")) {
        const id = e.target.parentElement.dataset.id;
        socket.emit("deleteProduct", parseInt(id));
    }
});
