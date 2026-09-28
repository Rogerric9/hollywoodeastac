let cart = JSON.parse(localStorage.getItem("cart")) || [];

const cartItems = document.getElementById("cart-items");
const cartTotal = document.getElementById("cart-total");
const shippingTotal = document.getElementById("shipping-total");
const orderTotal = document.getElementById("order-total");
const paypalButtonContainer = document.getElementById("paypal-button-container");
const expiredSaleNotice = document.getElementById("expired-sale-notice");

const SALE_BATCH_WORKER_URL =
  "https://hollywood-east-checkout.steve-kanski.workers.dev";

async function fetchCurrentSaleBatch() {
  try {
    const response = await fetch(
      `${SALE_BATCH_WORKER_URL}/current-sale-batch`
    );
    const result = await response.json();

    if (result && result.success && Array.isArray(result.items)) {
      return result.items;
    }
  } catch (error) {
    console.error("Could not check the current sale batch.", error);
  }

  return [];
}

function reconcileCartSalePrices(saleBatchItems) {
  const saleByProductId = {};

  saleBatchItems.forEach(item => {
    saleByProductId[item.product_id] = item;
  });

  const expiredItems = [];

  cart.forEach(cartItem => {
    if (!cartItem.is_sale_price) {
      return;
    }

    const activeSale = saleByProductId[cartItem.product_id];

    if (
      activeSale &&
      Number(activeSale.sale_price) === Number(cartItem.price)
    ) {
      cartItem.sale_expires_at = activeSale.batch_expires_at;
      return;
    }

    const product = inventory.find(
      item => item.product_id === cartItem.product_id
    );

    const newPrice = product
      ? Number(product.price)
      : Number(cartItem.regular_price) || Number(cartItem.price);

    expiredItems.push({
      name: cartItem.name,
      old_price: Number(cartItem.price),
      new_price: newPrice
    });

    cartItem.price = newPrice;
    cartItem.is_sale_price = false;
    delete cartItem.sale_expires_at;
  });

  if (expiredItems.length > 0) {
    localStorage.setItem("cart", JSON.stringify(cart));
  }

  return expiredItems;
}

function renderExpiredSaleNotice(expiredItems) {
  if (!expiredSaleNotice) {
    return;
  }

  if (expiredItems.length === 0) {
    expiredSaleNotice.style.display = "none";
    expiredSaleNotice.innerHTML = "";
    return;
  }

  const multiple = expiredItems.length > 1;

  const itemsListMarkup = expiredItems
    .map(
      item =>
        `<li>${item.name}: was $${item.old_price.toFixed(2)}, now $${item.new_price.toFixed(2)}</li>`
    )
    .join("");

  expiredSaleNotice.innerHTML = `
    <p><strong>Heads up:</strong> the sale price on the following item${multiple ? "s" : ""} in
    your cart ${multiple ? "have" : "has"} expired. ${multiple ? "They are" : "It is"} now shown
    at the regular price below. You're welcome to keep ${multiple ? "them" : "it"} at the new
    price, or use the Remove button to take ${multiple ? "them" : "it"} out of your cart.</p>
    <ul>${itemsListMarkup}</ul>
  `;
  expiredSaleNotice.style.display = "block";
}

function buildExpiredSaleMessage(expiredItems) {
  const multiple = expiredItems.length > 1;

  const lines = expiredItems.map(
    item =>
      `- ${item.name}: was $${item.old_price.toFixed(2)}, now $${item.new_price.toFixed(2)}`
  );

  return (
    `The sale price on the following item${multiple ? "s" : ""} in your cart ${multiple ? "have" : "has"} ` +
    `expired since you added ${multiple ? "them" : "it"}:\n\n` +
    lines.join("\n") +
    `\n\nClick OK to continue checkout at the new price${multiple ? "s" : ""} shown above, or ` +
    `Cancel to go back and review your cart.`
  );
}

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

async function displayCart() {
  normalizeCart();
  addProductFromUrl();

  const saleBatchItems = await fetchCurrentSaleBatch();
  const expiredItems = reconcileCartSalePrices(saleBatchItems);
  renderExpiredSaleNotice(expiredItems);

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

    const priceMarkup = cartItem.is_sale_price
      ? `<span class="cart-item-regular-price-crossed">$${cartItem.regular_price}</span> <span class="cart-item-sale-price">$${cartItem.price}</span>`
      : `$${cartItem.price}`;

    cartItems.innerHTML += `
      <div class="cart-item">
        <img class="cart-item-image" src="${cartImage}" alt="${cartItem.name}">

        <div class="cart-item-info">
          <p><strong>${cartItem.name}</strong></p>

          <p>Product No. ${cartItem.product_id}</p>

          <p>Price: ${priceMarkup}</p>

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

      const saleBatchItems = await fetchCurrentSaleBatch();
      const expiredItems = reconcileCartSalePrices(saleBatchItems);

      if (expiredItems.length > 0) {
        displayCart();

        const proceed = confirm(buildExpiredSaleMessage(expiredItems));

        if (!proceed) {
          throw new Error("Checkout canceled after a sale price expired.");
        }
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