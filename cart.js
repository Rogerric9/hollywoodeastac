let cart = JSON.parse(localStorage.getItem("cart")) || [];

const cartItems = document.getElementById("cart-items");
const cartTotal = document.getElementById("cart-total");
const shippingTotal = document.getElementById("shipping-total");
const orderTotal = document.getElementById("order-total");
const paypalButtonContainer = document.getElementById("paypal-button-container");

function normalizeCart() {
  cart = cart
    .map(cartItem => {
      if (typeof cartItem === "string") {
        const product = inventory.find(item => item.product_id === cartItem);

        if (!product) {
          return null;
        }

        return {
          product_id: product.product_id,
          name: product.name,
          price: product.price,
          quantity: 1
        };
      }

      return cartItem;
    })
    .filter(cartItem => cartItem !== null);

  localStorage.setItem("cart", JSON.stringify(cart));
}

function calculateMerchandiseSubtotal() {
  let subtotal = 0;

  cart.forEach(cartItem => {
    subtotal += Number(cartItem.price) * Number(cartItem.quantity);
  });

  return subtotal;
}

function calculateShippingTotal() {
  let standardQuantity = 0;
  let framedQuantity = 0;
  let plaqueQuantity = 0;
  let customShippingTotal = 0;

  cart.forEach(cartItem => {
    const quantity = Number(cartItem.quantity) || 0;
    const shippingClass =
      cartItem.shipping_class || "standard";

    if (shippingClass === "standard") {
      standardQuantity += quantity;
    } else if (shippingClass === "framed") {
      framedQuantity += quantity;
    } else if (shippingClass === "plaque") {
      plaqueQuantity += quantity;
    } else if (shippingClass === "custom") {
      customShippingTotal +=
        Number(cartItem.shipping_charge) * quantity;
    }
  });

  let shippingTotal = customShippingTotal;

  if (standardQuantity === 1) {
    shippingTotal += SHIPPING_CONFIG.standardSingle;
  } else if (standardQuantity >= 2) {
    shippingTotal += SHIPPING_CONFIG.standardMultiple;
  }

  if (framedQuantity >= 1) {
    shippingTotal += SHIPPING_CONFIG.framedFirst;

    shippingTotal +=
      (framedQuantity - 1) *
      SHIPPING_CONFIG.framedAdditional;
  }

  if (plaqueQuantity >= 1) {
    shippingTotal += SHIPPING_CONFIG.plaqueFirst;

    shippingTotal +=
      (plaqueQuantity - 1) *
      SHIPPING_CONFIG.plaqueAdditional;
  }

  return shippingTotal;
}

function displayCart() {
  normalizeCart();

  cartItems.innerHTML = "";

  if (cart.length === 0) {
    cartItems.innerHTML = "<p>Your cart is empty.</p>";
    cartTotal.textContent = "0.00";
    shippingTotal.textContent = "0.00";
    orderTotal.textContent = "0.00";
    paypalButtonContainer.style.display = "none";
    return;
  }

  paypalButtonContainer.style.display = "block";

  cart.forEach(cartItem => {
    const details = productDetails.find(item => item.product_id === cartItem.product_id);

    const cartImage =
      details &&
      details.product_images &&
      details.product_images.length > 0
        ? details.product_images[0]
        : "images/no-image-available.jpg";

    cartItems.innerHTML += `
      <div class="cart-item">
        <img class="cart-item-image" src="${cartImage}" alt="${cartItem.name}">

        <div class="cart-item-info">
          <p><strong>${cartItem.name}</strong></p>

          <p>Product No. ${cartItem.product_id}</p>

          <p>Price: $${cartItem.price}</p>

          <p>Quantity: ${cartItem.quantity}</p>

          <button class="remove-item" data-product-id="${cartItem.product_id}">
            Remove
          </button>
        </div>
      </div>
    `;
  });

const merchandiseSubtotal = calculateMerchandiseSubtotal();
const shippingAmount = calculateShippingTotal();
const finalOrderTotal = merchandiseSubtotal + shippingAmount;

cartTotal.textContent = merchandiseSubtotal.toFixed(2);
shippingTotal.textContent = shippingAmount.toFixed(2);
orderTotal.textContent = finalOrderTotal.toFixed(2);

document.querySelectorAll(".remove-item").forEach(button => {
  button.addEventListener("click", () => {
    const productId = button.dataset.productId;

    cart = cart.filter(cartItem => cartItem.product_id !== productId);
    localStorage.setItem("cart", JSON.stringify(cart));

    displayCart();
    window.updateMenuCartCount();
  });
});
}

displayCart();

if (window.paypal) {
  paypal.Buttons({
    createOrder: function(data, actions) {
      const merchandiseSubtotal =
        calculateMerchandiseSubtotal();

      const shippingAmount =
        calculateShippingTotal();

      const orderTotal =
        merchandiseSubtotal + shippingAmount;

      if (orderTotal <= 0) {
        alert("Your cart is empty.");
        return;
      }

      const paypalItems = cart.map(cartItem => {
        return {
          name: cartItem.name,
          sku: cartItem.product_id,
          quantity: String(cartItem.quantity),
          category: "PHYSICAL_GOODS",
          unit_amount: {
            currency_code: "USD",
            value: Number(cartItem.price).toFixed(2)
          }
        };
      });
      
      const invoiceNumber =
        `HE-${Date.now()}`;

      return actions.order.create({
        purchase_units: [
          {
            invoice_id: invoiceNumber,
            items: paypalItems,

            amount: {
              currency_code: "USD",
              value: orderTotal.toFixed(2),

              breakdown: {
                item_total: {
                  currency_code: "USD",
                  value: merchandiseSubtotal.toFixed(2)
                },

                shipping: {
                  currency_code: "USD",
                  value: shippingAmount.toFixed(2)
                }
              }
            }
          }
        ]
      });
    },

    onApprove: function(data, actions) {
      console.log("PayPal payment approved.");

      return actions.order.capture().then(function(details) {
        console.log("PayPal payment captured.", details);

        const expectedTotal =
          calculateMerchandiseSubtotal() +
          calculateShippingTotal();

        const capture =
          details.purchase_units?.[0]
            ?.payments?.captures?.[0];

        const capturedAmount = Number(
          capture?.amount?.value
        );

        const paymentStatus = capture?.status;

        if (
          paymentStatus !== "COMPLETED" ||
          capturedAmount !== Number(expectedTotal.toFixed(2))
        ) {
          alert(
            "Payment could not be verified. " +
            "Please contact Hollywood East before retrying."
          );
          return;
        }

        alert("Payment completed. Thank you!");

        cart = [];
        localStorage.removeItem("cart");

        displayCart();

        if (window.updateMenuCartCount) {
          window.updateMenuCartCount();
        }

        document.getElementById(
          "paypal-button-container"
        ).innerHTML = "";
      });
    }
  }).render("#paypal-button-container");
} else {
  console.error("PayPal SDK did not load.");
}