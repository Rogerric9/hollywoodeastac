const SALE_BATCH_WORKER_URL =
  "https://hollywood-east-checkout.steve-kanski.workers.dev";

const saleGrid = document.getElementById("sale-grid");
const saleStatusMessage = document.getElementById("sale-status-message");

let cart = JSON.parse(localStorage.getItem("cart")) || [];

function formatSaleExpiry(isoString) {
  const expires = new Date(isoString);

  const datePart = expires.toLocaleDateString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric"
  });

  const timePart = expires.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit"
  });

  return `${datePart} at ${timePart}`;
}

function updateAddToCartButtons() {
  document.querySelectorAll(".add-to-cart").forEach(button => {
    const productId = button.dataset.productId;
    const product = inventory.find(item => item.product_id === productId);

    if (!product) {
      button.textContent = "Unavailable";
      button.disabled = true;
      return;
    }

    const quantityAvailable = product.quantity_available || 1;
    const existingCartItem = cart.find(item => item.product_id === productId);

    const productStatus = product.status
      ? product.status.trim().toLowerCase()
      : "";

    if (productStatus === "not-for-sale") {
      button.textContent = "Not For Sale";
      button.disabled = true;
    } else if (existingCartItem && existingCartItem.quantity >= quantityAvailable) {
      button.textContent = "Already in Cart";
      button.disabled = true;
    } else {
      button.textContent = "Add to Cart";
      button.disabled = false;
    }
  });
}

async function loadCurrentSaleBatch() {
  try {
    const response = await fetch(
      `${SALE_BATCH_WORKER_URL}/current-sale-batch`
    );
    const result = await response.json();

    if (!result || !result.success || !Array.isArray(result.items)) {
      saleStatusMessage.textContent =
        "The current sale items could not be loaded. Please try again later.";
      return;
    }

    if (result.items.length === 0) {
      saleStatusMessage.textContent =
        "Nothing is on sale at the moment. Check back soon — the sale " +
        "rotates to a new random selection every few days.";
      return;
    }

    const batchExpiresAt = result.items[0].batch_expires_at;

    saleStatusMessage.textContent =
      `These items are on sale until ${formatSaleExpiry(batchExpiresAt)}. ` +
      `The selection rotates automatically, so check back after that for new sale items.`;

    saleGrid.innerHTML = "";

    result.items.forEach(saleItem => {
      const product = inventory.find(
        item => item.product_id === saleItem.product_id
      );

      if (!product) {
        return;
      }

      const productStatus = product.status
        ? product.status.trim().toLowerCase()
        : "";

      if (productStatus === "sold" || productStatus === "not-for-sale") {
        return;
      }

      const details = productDetails.find(
        item => item.product_id === product.product_id
      );

      const mainImage =
        details && details.product_images && details.product_images.length > 0
          ? details.product_images[0]
          : "images/no-image-available.jpg";

      saleGrid.innerHTML += `
        <div class="product-card">

        <a
          href="products/${product.product_id.toLowerCase()}.html"
          style="display:inline-block; padding:0; border:0; outline:0; box-shadow:none; background:none;"
        >
          <img
            src="${mainImage}"
            alt="${product.name}"
            style="display:block; border:1px solid black; outline:0; box-shadow:none;"
            onerror="this.onerror=null; this.src='images/no-image-available.jpg';"
          >
        </a>

          <h3>${product.name}</h3>

          <p class="product-number">${product.product_id}</p>

          <p class="price">
            <span class="regular-price-crossed">$${saleItem.regular_price}</span>
            <span class="sale-price">$${saleItem.sale_price}</span>
          </p>

          <a class="button" href="products/${product.product_id.toLowerCase()}.html">
              View Details
          </a>

          <button
            class="add-to-cart"
            data-product-id="${product.product_id}"
            data-sale-price="${saleItem.sale_price}"
            data-regular-price="${saleItem.regular_price}"
            data-sale-expires-at="${saleItem.batch_expires_at}"
          >
            Add to Cart
          </button>
        </div>
      `;
    });

    updateAddToCartButtons();
  } catch (error) {
    console.error("Could not load the current sale batch.", error);
    saleStatusMessage.textContent =
      "The current sale items could not be loaded. Please try again later.";
  }
}

document.addEventListener("click", event => {
  if (!event.target.classList.contains("add-to-cart")) {
    return;
  }

  const button = event.target;
  const productId = button.dataset.productId;
  const product = inventory.find(item => item.product_id === productId);

  if (!product) {
    alert("This product is unavailable.");
    return;
  }

  const quantityAvailable = product.quantity_available || 1;
  const existingCartItem = cart.find(item => item.product_id === productId);

  if (existingCartItem) {
    if (existingCartItem.quantity < quantityAvailable) {
      existingCartItem.quantity += 1;
      alert(`${product.name} has been added to your cart.`);
    } else {
      alert("This item is already in your cart.");
      updateAddToCartButtons();
      return;
    }
  } else {
    cart.push({
      product_id: product.product_id,
      name: product.name,
      price: Number(button.dataset.salePrice),
      quantity: 1,
      shipping_class: product.shipping_class || "standard",
      shipping_charge: product.shipping_charge || "",
      is_sale_price: true,
      regular_price: Number(button.dataset.regularPrice),
      sale_expires_at: button.dataset.saleExpiresAt
    });
    alert(`${product.name} has been added to your cart.`);
  }

  localStorage.setItem("cart", JSON.stringify(cart));

  if (window.updateMenuCartCount) {
    window.updateMenuCartCount();
  }

  updateAddToCartButtons();
});

loadCurrentSaleBatch();
