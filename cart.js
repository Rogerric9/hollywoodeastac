let cart = JSON.parse(localStorage.getItem("cart")) || [];

const cartItems = document.getElementById("cart-items");
const cartTotal = document.getElementById("cart-total");
const checkoutButton = document.getElementById("checkout-button");

function displayCart() {
  cartItems.innerHTML = "";

  if (cart.length === 0) {
    cartItems.innerHTML = "<p>Your cart is empty.</p>";
    cartTotal.textContent = "0.00";
    checkoutButton.disabled = true;
    return;
  }

  checkoutButton.disabled = false;

  let total = 0;

  cart.forEach(productId => {
    const product = inventory.find(item => item.product_id === productId);

    if (product) {
      cartItems.innerHTML += `
        <p>
          ${product.name} — $${product.price}
          <button class="remove-item" data-product-id="${product.product_id}">
            Remove
          </button>
        </p>
      `;

      total += Number(product.price);
    }
  });

  cartTotal.textContent = total.toFixed(2);

  document.querySelectorAll(".remove-item").forEach(button => {
    button.addEventListener("click", () => {
      const productId = button.dataset.productId;

      cart = cart.filter(id => id !== productId);
      localStorage.setItem("cart", JSON.stringify(cart));

      displayCart();
    });
  });
}

displayCart();