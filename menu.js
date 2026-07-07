(function () {
  const menuCategoryDropdown = document.getElementById("category-dropdown");
  const menuCartCount = document.getElementById("cart-count");

  function updateMenuCartCount() {
    if (!menuCartCount) {
      return;
    }

    const cart = JSON.parse(localStorage.getItem("cart")) || [];

    const count = cart.reduce((total, cartItem) => {
      if (typeof cartItem === "string") {
        return total + 1;
      }

      return total + Number(cartItem.quantity || 1);
    }, 0);

    menuCartCount.textContent = count;
  }

  function buildAutographCategoryMenu() {
    if (!menuCategoryDropdown) {
      return;
    }

    if (typeof inventory === "undefined") {
      return;
    }

    const menuCategoryMap = new Map();

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

          if (!menuCategoryMap.has(key)) {
            const displayCategory = category.replace(/\b\w/g, letter =>
              letter.toUpperCase()
            );

            menuCategoryMap.set(key, displayCategory);
          }
        });
      }
    });

    const menuCategories = [...menuCategoryMap.values()];

    menuCategories.sort((a, b) =>
      a.localeCompare(b, undefined, { sensitivity: "base" })
    );

    menuCategoryDropdown.innerHTML = `
      <a href="catalog.html?type=autograph">All Autographs</a>
    `;

    menuCategories.forEach(category => {
      menuCategoryDropdown.innerHTML += `
        <a href="catalog.html?type=autograph&category=${encodeURIComponent(category)}">
          ${category}
        </a>
      `;
    });
  }

  updateMenuCartCount();
  buildAutographCategoryMenu();
})();