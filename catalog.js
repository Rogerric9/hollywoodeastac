const productGrid = document.getElementById("product-grid");

const catalogCategoryDropdown = document.getElementById("category-dropdown");
const categoryHeading = document.getElementById("category-heading");
const catalogDescription = document.getElementById("catalog-description");
const catalogSearchInput = document.getElementById("catalog-search");
const catalogSearchButton = document.getElementById("catalog-search-button");
const catalogGridButton = document.getElementById("catalog-grid-button");

const urlParameters = new URLSearchParams(window.location.search);
const selectedType = urlParameters.get("type") || "autograph";
const selectedCategory = urlParameters.get("category");

const selectedTypeLower = selectedType.trim().toLowerCase();
const selectedCategoryLower = selectedCategory
  ? selectedCategory.trim().toLowerCase()
  : "";

const typeHeading =
  selectedTypeLower === "collectible" ? "Collectibles" : "Autographs";

let currentSearchText = "";
let isGridView = false;

/* Page heading and description */
if (categoryHeading) {
  categoryHeading.textContent = selectedCategory
    ? selectedCategory.replace(/\b\w/g, letter => letter.toUpperCase())
    : `All ${typeHeading}`;
}

if (catalogDescription) {
  catalogDescription.textContent =
    selectedTypeLower === "collectible"
      ? "Browse our growing selection of collectibles."
      : "Browse our growing selection of authentic autographs.";
}

/* Build category dropdown for autographs only */
const categoryMap = new Map();

inventory.forEach(product => {
  const isAvailable =
    !product.status || product.status.trim().toLowerCase() !== "sold";

  const productType = product.type
    ? product.type.trim().toLowerCase()
    : "autograph";

  const isAutograph = productType === "autograph";

  const categoryList = [
    product.category,
    product.category2
  ]
    .filter(category => category)
    .map(category => category.trim())
    .filter(category => category);

  if (isAvailable && isAutograph) {
    categoryList.forEach(category => {
      const key = category.toLowerCase();

      if (!categoryMap.has(key)) {
        const displayCategory = category.replace(/\b\w/g, letter =>
          letter.toUpperCase()
        );

        categoryMap.set(key, displayCategory);
      }
    });
  }
});

const categories = [...categoryMap.values()];

categories.sort((a, b) =>
  a.localeCompare(b, undefined, { sensitivity: "base" })
);

if (catalogCategoryDropdown) {
  catalogCategoryDropdown.innerHTML = `
    <a href="catalog.html?type=autograph">All Autographs</a>
  `;

  categories.forEach(category => {
    catalogCategoryDropdown.innerHTML += `
      <a href="catalog.html?type=autograph&category=${encodeURIComponent(category)}">
        ${category}
      </a>
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

/* Filter products */
function getAvailableProducts() {
  const searchTextLower = currentSearchText.trim().toLowerCase();

  return inventory.filter(product => {
    const isAvailable =
      !product.status || product.status.trim().toLowerCase() !== "sold";

    const productType = product.type
      ? product.type.trim().toLowerCase()
      : "autograph";

    const matchesType = productType === selectedTypeLower;

    const productCategories = [
      product.category,
      product.category2
    ]
      .filter(category => category)
      .map(category => category.trim().toLowerCase())
      .filter(category => category);

    const matchesCategory =
      !selectedCategoryLower ||
      productCategories.includes(selectedCategoryLower);

    const productName = product.name
      ? product.name.trim().toLowerCase()
      : "";

    const matchesSearch = productName.includes(searchTextLower);

    if (searchTextLower) {
      return isAvailable && matchesType && matchesSearch;
    }

    return isAvailable && matchesType && matchesCategory;
  });
}

/* Build product cards */
function displayProducts() {
  const availableProducts = getAvailableProducts();

  if (!productGrid) {
    return;
  }

  productGrid.innerHTML = "";

  if (availableProducts.length === 0) {
    productGrid.innerHTML = `
      <p>No item found with that name.</p>
    `;

    return;
  }

  if (isGridView) {
  const sortedProducts = [...availableProducts].sort((a, b) => {
    const nameA = a.name ? a.name.trim() : "";
    const nameB = b.name ? b.name.trim() : "";

    return nameA.localeCompare(nameB, undefined, {
      sensitivity: "base"
    });
  });

  productGrid.innerHTML = `
    <table class="catalog-product-table">
      <thead>
        <tr>
          <th>Select</th>
          <th>Product Name</th>
          <th>Description</th>
          <th>Price</th>        </tr>
      </thead>

      <tbody>
        ${sortedProducts.map(product => `
          <tr
            class="catalog-product-row"
            data-product-id="${product.product_id}"
          >
            <td>
              <span class="catalog-select-label">Select</span>
            </td>
            <td>${product.name}</td>
            <td>${product.description}</td>
            <td>$${product.price}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;

  return;
}

  availableProducts.forEach(product => {
    const details = productDetails.find(
      item => item.product_id === product.product_id
    );

    const mainImage =
      details && details.product_images && details.product_images.length > 0
        ? details.product_images[0]
        : "images/no-image-available.jpg";

    productGrid.innerHTML += `
      <div class="product-card">
        
      <a
        href="products/product.html?id=${product.product_id}"
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

        <p>${product.description}</p>

        <p class="price">$${product.price}</p>

        <a class="button" href="products/product.html?id=${product.product_id}">
            View Details
        </a>

        <button class="add-to-cart" data-product-id="${product.product_id}">
          Add to Cart
        </button>
      </div>
    `;
  });

  updateAddToCartButtons();
}

/* Search controls */
function runCatalogSearch() {
  if (!catalogSearchInput) {
    return;
  }

  currentSearchText = catalogSearchInput.value;
  displayProducts();
}

if (catalogSearchButton) {
  catalogSearchButton.addEventListener("click", runCatalogSearch);
}

if (catalogGridButton) {
  catalogGridButton.addEventListener("click", () => {
    isGridView = !isGridView;

    catalogGridButton.textContent = isGridView
      ? "See as Cards"
      : "See in Grid";

    displayProducts();
  });
}
if (catalogSearchInput) {
  catalogSearchInput.addEventListener("keydown", event => {
    if (event.key === "Enter") {
      runCatalogSearch();
    }
  });
}

/* Start page */
normalizeCart();
updateCartCount();
displayProducts();

document.addEventListener("click", event => {
  const productRow = event.target.closest(".catalog-product-row");

  if (productRow) {
    const productId = productRow.dataset.productId;

    window.location.href =
      `products/product.html?id=${encodeURIComponent(productId)}`;

    return;
  }

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
      price: product.price,
      quantity: 1,
      shipping_class: product.shipping_class || "standard",
      shipping_charge: product.shipping_charge || ""
    });
    alert(`${product.name} has been added to your cart.`);
  }

  localStorage.setItem("cart", JSON.stringify(cart));
  updateCartCount();
  updateAddToCartButtons();

  console.log("Cart:", cart);
});