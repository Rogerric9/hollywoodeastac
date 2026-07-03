const productGrid = document.getElementById("product-grid");

const categoryDropdown = document.getElementById("category-dropdown");
const categoryHeading = document.getElementById("category-heading");

const categoryMap = new Map();

inventory.forEach(product => {
  const category = product.category?.trim();
  const isAvailable =
    !product.status || product.status.trim().toLowerCase() !== "sold";

  if (category && isAvailable) {
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
  <a href="catalog.html">All Categories</a>
`;

categories.forEach(category => {
  categoryDropdown.innerHTML += `
    <a href="catalog.html?category=${encodeURIComponent(category)}">
      ${category}
    </a>
  `;
});

    const urlParameters = new URLSearchParams(window.location.search);
    const selectedCategory = urlParameters.get("category");

    categoryHeading.textContent = selectedCategory
        ? selectedCategory.replace(/\b\w/g, letter => letter.toUpperCase())
        : "All Categories";
    const availableProducts = inventory.filter(product => {
    const isAvailable = product.status.toLowerCase() !== "sold";
    
    const matchesCategory =
    !selectedCategory ||
    product.category?.trim().toLowerCase() ===
        selectedCategory.trim().toLowerCase();

    return isAvailable && matchesCategory;
    });
productGrid.innerHTML = "";

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