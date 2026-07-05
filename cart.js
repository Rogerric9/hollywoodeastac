let cart = JSON.parse(localStorage.getItem("cart")) || [];

const cartItems = document.getElementById("cart-items");
const cartTotal = document.getElementById("cart-total");
const paypalButtonContainer = document.getElementById("paypal-button-container");

function calculateCartTotal() {
  let total = 0;

  cart.forEach(cartItem => {
    total += Number(cartItem.price) * Number(cartItem.quantity);
  });

  return total;
}

function displayCart() {
  cartItems.innerHTML = "";

  if (cart.length === 0) {
    cartItems.innerHTML = "<p>Your cart is empty.</p>";
    cartTotal.textContent = "0.00";
    paypalButtonContainer.style.display = "none";
    return;
  }

  paypalButtonContainer.style.display = "block";

  cart.forEach(cartItem => {
    cartItems.innerHTML += `
      <p>
        ${cartItem.name} — $${cartItem.price} 
        Quantity: ${cartItem.quantity}

        <button class="remove-item" data-product-id="${cartItem.product_id}">
          Remove
        </button>
      </p>
    `;
  });

  cartTotal.textContent = calculateCartTotal().toFixed(2);

  document.querySelectorAll(".remove-item").forEach(button => {
    button.addEventListener("click", () => {
      const productId = button.dataset.productId;

      cart = cart.filter(cartItem => cartItem.product_id !== productId);
      localStorage.setItem("cart", JSON.stringify(cart));

      displayCart();
    });
  });
}

displayCart();

if (window.paypal) {
  paypal.Buttons({
    createOrder: function(data, actions) {
      const total = calculateCartTotal();

      if (total <= 0) {
        alert("Your cart is empty.");
        return;
      }

      return actions.order.create({
        purchase_units: [
          {
            amount: {
              value: total.toFixed(2)
            }
          }
        ]
      });
    },

    onApprove: function(data, actions) {
      console.log("PayPal payment approved.");

      return actions.order.capture().then(function(details) {
        console.log("PayPal payment captured.", details);

        alert("Payment completed. Thank you!");

        cart = [];
        localStorage.removeItem("cart");

        displayCart();

        document.getElementById("paypal-button-container").innerHTML = "";
      });
    }
  }).render("#paypal-button-container");
} else {
  console.error("PayPal SDK did not load.");
}