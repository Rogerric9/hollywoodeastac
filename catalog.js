const productGrid = document.getElementById("product-grid");
const categoryDropdown = document.getElementById("category-dropdown");
const categoryHeading = document.getElementById("category-heading");
const catalogDescription = document.getElementById("catalog-description");

const urlParameters = new URLSearchParams(window.location.search);
const selectedType = urlParameters.get("type") || "autograph";
const selectedCategory = urlParameters.get("category");

const selectedTypeLower = selectedType.trim().toLowerCase();

const typeHeading =
  selectedTypeLower === "collectible"
    ? "Collectibles"
    : "Autographs";

    categoryHeading.textContent = selectedCategory
    ? selectedCategory.replace(/\b\w/g, letter => letter.toUpperCase())
    : `All ${typeHeading}`;

    catalogDescription.textContent =
    selectedTypeLower === "collectible"
        ? "Browse our growing selection of collectibles."
        : "Browse our growing selection of authentic autographs.";
/* Build category dropdown for autographs only */

const categoryMap = new Map();

inventory.forEach(product => {
  const category = product.category?.trim();

  const isAvailable =
    !product.status || product.status.trim().toLowerCase() !== "sold";

  const productType = product.type
    ? product.type.trim().toLowerCase()
    : "autograph";

  const isAutograph = productType === "autograph";

  if (category && isAvailable && isAutograph) {
    const key = category.toLowerCase();

    if (!categoryMap.has(key)) {
      const displayCategory = category.replace(/\b\w/g, letter =>
        letter.toUpperCase()
      );

      categoryMap.set(key, displayCategory);
    }
  }
});

const categories = [...categoryMap.values()];

categories.sort((a, b) =>
  a.localeCompare(b, undefined, { sensitivity: "base" })
);

categoryDropdown.innerHTML = `
  <a href="catalog.html?type=autograph">All Autographs</a>
`;

categories.forEach(category => {
  categoryDropdown.innerHTML += `
    <a href="catalog.html?type=autograph&category=${encodeURIComponent(category)}">
      ${category}
    </a>
  `;
});

/* Filter products */

const availableProducts = inventory.filter(product => {
  const isAvailable =
    !product.status || product.status.trim().toLowerCase() !== "sold";

  const productType = product.type
    ? product.type.trim().toLowerCase()
    : "autograph";

  const matchesType = productType === selectedTypeLower;

  const matchesCategory =
    !selectedCategory ||
    product.category?.trim().toLowerCase() ===
      selectedCategory.trim().toLowerCase();

  return isAvailable && matchesType && matchesCategory;
});

/* Build product cards */

    productGrid.innerHTML = "";

    if (availableProducts.length === 0) {
    productGrid.innerHTML = `
        <p>No products are currently available in this section.</p>
    `;
    } else {
   availableProducts.forEach(product => {
  const details = productDetails.find(item => item.product_id === product.product_id);

    const mainImage =
    details &&
    details.product_images &&
    details.product_images.length > 0
        ? details.product_images[0]
        : "images/no-image-available.jpg";

  productGrid.innerHTML += `
    <div class="product-card">
      <img src="${mainImage}" alt="${product.name}">

      <h2>${product.name}</h2>

      <p>$${product.price}</p>

      <a class="view-button" href="${product.product_page}">
        View Details
      </a>

      <button class="add-to-cart" data-product-id="${product.product_id}">
        Add to Cart
      </button>
    </div>
  `;
});
    }

/* Shopping cart count and Add to Cart buttons */

let cart = JSON.parse(localStorage.getItem("cart")) || [];
const cartCount = document.getElementById("cart-count");

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

function updateCartCount() {
  if (cartCount) {
    cartCount.textContent = cart.reduce((total, cartItem) => {
      return total + Number(cartItem.quantity);
    }, 0);
  }
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

    if (existingCartItem && existingCartItem.quantity >= quantityAvailable) {
      button.textContent = "Already in Cart";
      button.disabled = true;
    } else {
      button.textContent = "Add to Cart";
      button.disabled = false;
    }
  });
}

normalizeCart();
updateCartCount();
updateAddToCartButtons();

document.querySelectorAll(".add-to-cart").forEach(button => {
  button.addEventListener("click", () => {
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
        price: product.price,
        quantity: 1
      });

      alert(`${product.name} has been added to your cart.`);
    }

    localStorage.setItem("cart", JSON.stringify(cart));

    updateCartCount();
    updateAddToCartButtons();

    console.log("Cart:", cart);
  });
});