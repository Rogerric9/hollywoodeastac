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
        productGrid.innerHTML += `
        <div class="product-card">
            <img src="images/${product.image_filename}" alt="${product.name}">

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