const productGrid = document.getElementById("product-grid");

const catalogSearchInput =
  document.getElementById("catalog-search");

const catalogSearchButton =
  document.getElementById("catalog-search-button");

const catalogGridButton =
  document.getElementById("catalog-grid-button");

const catalogGridNote =
  document.getElementById("catalog-grid-note");

const cartCount =
  document.getElementById("cart-count");

let cart =
  JSON.parse(localStorage.getItem("cart")) || [];

let isGridView = false;

const WORKER_URL =
  "http://127.0.0.1:8787";

const urlParameters =
  new URLSearchParams(window.location.search);

const selectedType =
  urlParameters.get("type") || "autograph";

const selectedCategory =
  urlParameters.get("category") || "";

async function loadD1Catalog() {
  if (!productGrid) {
    return;
  }

  productGrid.innerHTML = "<p>Loading D1 catalog...</p>";

  try {
    const queryParameters =
    new URLSearchParams({
        type: selectedType,
        limit: "100"
    });

    const searchText =
    catalogSearchInput
        ? catalogSearchInput.value.trim()
        : "";

    if (searchText) {
    queryParameters.set("search", searchText);
    }

    if (selectedCategory) {
    queryParameters.set(
        "category",
        selectedCategory
    );
    }

    const response = await fetch(
    `${WORKER_URL}/d1-test-catalog?${queryParameters.toString()}`
    );

    const data = await response.json();

    if (!data.success) {
      throw new Error(
        data.message || "Unable to load D1 catalog."
      );
    }

    productGrid.innerHTML = "";

    if (isGridView) {
      productGrid.innerHTML = `
        <table class="catalog-product-table">
          <thead>
            <tr>
              <th>View</th>
              <th>Product Name</th>
              <th>Description</th>
              <th>Price</th>
            </tr>
          </thead>

          <tbody>
            ${data.products.map(product => `
              <tr
                class="catalog-product-row"
                data-product-id="${product.product_id}"
              >
                <td>
                  <span class="catalog-select-label">View</span>
                </td>

                <td>${product.name}</td>

                <td>${product.description || ""}</td>

                <td>$${product.price}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      `;

      return;
    }

    data.products.forEach(product => {
      const mainImage =
        product.main_image ||
        "images/no-image-available.jpg";
        const existingCartItem =
            cart.find(
                item => item.product_id === product.product_id
            );

        const quantityAvailable =
        Number(product.quantity_available) || 0;

        const alreadyInCart =
        existingCartItem &&
        Number(existingCartItem.quantity) >= quantityAvailable;

      productGrid.innerHTML += `
        <div class="product-card">
          <a
            href="products/product.html?id=${product.product_id}"
            style="display:inline-block; padding:0; border:0; outline:0; box-shadow:none; background:none;"
          >
            <img
              src="${mainImage}"
              alt="${product.name}"
              style="display:block; border:1px solid black;"
              onerror="this.onerror=null; this.src='images/no-image-available.jpg';"
            >
          </a>

          <h3>${product.name}</h3>

          <p class="product-number">
            ${product.product_id}
          </p>

          <p>${product.description || ""}</p>

          <p class="price">
            $${product.price}
          </p>
        <button
            class="add-to-cart"
            data-product-id="${product.product_id}"
            ${
                !product.purchasable || alreadyInCart
                ? "disabled"
                : ""
            }
        >
            ${
                !product.purchasable
                ? "Not For Sale"
                : alreadyInCart
                    ? "Already in Cart"
                    : "Add to Cart"
            }
        </button>

        </div>
      `;
    });
  } catch (error) {
    console.error(error);

    productGrid.innerHTML = `
      <p>Unable to load the D1 test catalog.</p>
    `;
  }
}

if (catalogSearchButton) {
  catalogSearchButton.addEventListener(
    "click",
    loadD1Catalog
  );
}

if (catalogSearchInput) {
  catalogSearchInput.addEventListener(
    "keydown",
    event => {
      if (event.key === "Enter") {
        loadD1Catalog();
      }
    }
  );
}

if (catalogGridButton) {
  catalogGridButton.addEventListener(
    "click",
    () => {
      isGridView = !isGridView;

      catalogGridButton.textContent =
        isGridView
          ? "See as Cards"
          : "See in Grid";

      if (catalogGridNote) {
        catalogGridNote.style.display =
          isGridView ? "none" : "inline";
      }

      loadD1Catalog();
    }
  );
}

loadD1Catalog();

if (catalogSearchInput) {
  catalogSearchInput.addEventListener(
    "keydown",
    event => {
      if (event.key === "Enter") {
        loadD1Catalog();
      }
    }
  );
}

function updateCartCount() {
  if (cartCount) {
    cartCount.textContent = cart.reduce(
      (total, item) =>
        total + Number(item.quantity || 0),
      0
    );
  }
}

document.addEventListener("click", async event => {
  const productRow =
    event.target.closest(".catalog-product-row");

  if (productRow) {
    const productId =
      productRow.dataset.productId;

    window.location.href =
      `products/product.html?id=${encodeURIComponent(productId)}`;

    return;
  }

  if (!event.target.classList.contains("add-to-cart")) {
    return;
  }

  const button = event.target;
  const productId = button.dataset.productId;

  const response = await fetch(
    `${WORKER_URL}/d1-test-product?id=${encodeURIComponent(productId)}`
  );

  const data = await response.json();

  if (!data.success || !data.product) {
    alert("This product is unavailable.");
    return;
  }

  const product = data.product;

  if (!product.purchasable) {
    alert("This product is not available for purchase.");
    return;
  }

  const quantityAvailable =
    Number(product.quantity_available) || 0;

  const existingCartItem =
    cart.find(
      item => item.product_id === productId
    );

  if (existingCartItem) {
    if (
      existingCartItem.quantity <
      quantityAvailable
    ) {
      existingCartItem.quantity += 1;

      alert(
        `${product.name} has been added to your cart.`
      );
    } else {
      alert(
        "This item is already in your cart."
      );

      return;
    }
  } else {
    cart.push({
      product_id: product.product_id,
      name: product.name,
      price: product.price,
      quantity: 1,
      shipping_class:
        product.shipping_class || "standard",
      shipping_charge:
        product.shipping_charge || ""
    });

    alert(
      `${product.name} has been added to your cart.`
    );
  }

    localStorage.setItem(
    "cart",
    JSON.stringify(cart)
    );

    updateCartCount();
    loadD1Catalog();
});

updateCartCount();
loadD1Catalog();