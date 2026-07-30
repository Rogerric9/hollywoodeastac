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

function addProductFromUrl() {
  const urlParameters = new URLSearchParams(window.location.search);
  const productId = urlParameters.get("add");

  if (!productId) {
    return;
  }

  const product = inventory.find(
    item => item.product_id.toLowerCase() === productId.toLowerCase()
  );

  if (!product) {
    alert("The requested item could not be found.");
    return;
  }

  if (
    product.status === "sold" ||
    product.status === "not-for-sale" ||
    Number(product.quantity_available) < 1
  ) {
    alert("The requested item is no longer available.");
    return;
  }

  const existingCartItem = cart.find(
    item => item.product_id === product.product_id
  );

  if (!existingCartItem) {
    cart.push({
      product_id: product.product_id,
      name: product.name,
      price: product.price,
      quantity: 1,
      shipping_class: product.shipping_class || "standard",
      shipping_charge: Number(product.shipping_charge) || 0
    });

    localStorage.setItem("cart", JSON.stringify(cart));
  }

  window.history.replaceState(
    {},
    document.title,
    window.location.pathname
  );
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
  addProductFromUrl();

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
    createOrder: async function() {
      if (!Array.isArray(cart) || cart.length === 0) {
        alert("Your cart is empty.");
        throw new Error("The cart is empty.");
      }

      const checkoutItems = cart.map(cartItem => {
        return {
          product_id: cartItem.product_id,
          quantity: Number(cartItem.quantity)
        };
      });

      const response = await fetch(
        "https://hollywood-east-checkout.steve-kanski.workers.dev/create-paypal-order",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            items: checkoutItems
          })
        }
      );

      const result = await response.json();

      if (
        !response.ok ||
        !result.success ||
        !result.order_id
      ) {
        const message =
          result.message ||
          "The PayPal order could not be created.";

        alert(message);
        throw new Error(message);
      }

      console.log(
        "Secure PayPal order created.",
        result
      );

      return result.order_id;
    },

    onApprove: async function(data) {
      console.log("PayPal payment approved.");

      const response = await fetch(
        "https://hollywood-east-checkout.steve-kanski.workers.dev/capture-paypal-order",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            order_id: data.orderID
          })
        }
      );

      const result = await response.json();

      console.log(
        "Secure PayPal capture result.",
        result
      );

      if (
        !response.ok ||
        !result.success ||
        result.status !== "COMPLETED"
      ) {
        if (
          result.status === "PENDING" &&
          result.pending_reason === "PENDING_REVIEW"
        ) {
          alert(
            "PayPal is reviewing this payment. " +
            "Your order is not complete yet, and your cart " +
            "will remain available. Please do not retry the " +
            "payment or submit another order. Hollywood East " +
            "will wait for PayPal to complete its review."
          );

          return;
        }

        alert(
          result.message ||
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
    },
    onCancel: async function(data) {
      console.log(
        "PayPal checkout canceled.",
        data.orderID
      );

      try {
        const response = await fetch(
          "https://hollywood-east-checkout.steve-kanski.workers.dev/release-paypal-reservation",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              order_id: data.orderID
            })
          }
        );

        const result = await response.json();

        console.log(
          "PayPal reservation release result.",
          result
        );

        if (!response.ok || !result.success) {
          console.error(
            "The canceled checkout reservation could not be released.",
            result
          );
        }
      } catch (error) {
        console.error(
          "The canceled checkout reservation could not be released.",
          error
        );
      }
    },

    onError: function(error) {
      console.error(
        "Secure PayPal checkout error.",
        error
      );
    }
  }).render("#paypal-button-container");
} else {
  console.error("PayPal SDK did not load.");
}