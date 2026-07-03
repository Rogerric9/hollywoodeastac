const productGrid = document.getElementById("product-grid");

const availableProducts = inventory.filter(
  product => product.status.toLowerCase() !== "sold"
);

productGrid.innerHTML = "";

availableProducts.forEach(product => {
  productGrid.innerHTML += `
    <div class="product-card">
      <img src="images/${product.image_filename}" alt="${product.name}">
      <h2>${product.name}</h2>
      <p>$${product.price}</p>
      <a href="${product.product_page}">View Details</a>
      <button class="add-to-cart" data-product-id="${product.product_id}">
        Add to Cart
      </button>
    </div>
  `;
});
const cart = JSON.parse(localStorage.getItem("cart")) || [];
const cartCount = document.getElementById("cart-count");
cartCount.textContent = cart.length;
document.querySelectorAll(".add-to-cart").forEach(button => {
  const productId = button.dataset.productId;

  if (cart.includes(productId)) {
    button.textContent = "Added to Cart";
    button.disabled = true;
  }

  button.addEventListener("click", () => {
    if (cart.includes(productId)) {
      return;
    }

    cart.push(productId);
    localStorage.setItem("cart", JSON.stringify(cart));
    cartCount.textContent = cart.length;

    button.textContent = "Added to Cart";
    button.disabled = true;

    console.log("Cart:", cart);
  });
});