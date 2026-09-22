(function () {
  const menuCategoryDropdown = document.getElementById("category-dropdown");
  const menuCartCount = document.getElementById("cart-count");
  const catalogMenuLink = document.getElementById("catalog-menu-link");
  const catalogMenu = catalogMenuLink
    ? catalogMenuLink.closest(".catalog-menu")
    : null;
  const collectiblesCategoryDropdown = document.getElementById(
    "collectibles-category-dropdown"
  );

  const collectiblesMenuLink = document.getElementById(
    "collectibles-menu-link"
  );

  const collectiblesMenu = collectiblesMenuLink
    ? collectiblesMenuLink.closest(".collectibles-menu")
    : null;

  const specialtyMenuLink = document.getElementById(
    "specialty-menu-link"
  );

  const specialtyMenu = specialtyMenuLink
    ? specialtyMenuLink.closest(".specialty-menu")
    : null;

  function enableTouchOpenMenu(menuLink, menu) {
    if (!menuLink || !menu) {
      return;
    }

    menuLink.addEventListener("click", event => {
      const isTouchDevice = window.matchMedia("(hover: none)").matches;

      if (isTouchDevice && !menu.classList.contains("open")) {
        event.preventDefault();
        menu.classList.add("open");
      }
    });

    document.addEventListener("click", event => {
      if (!menu.contains(event.target)) {
        menu.classList.remove("open");
      }
    });
  }

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

function buildCollectibleCategoryMenu() {
  if (!collectiblesCategoryDropdown) {
    return;
  }

  if (typeof inventory === "undefined") {
    return;
  }

  const collectibleCategoryMap = new Map();

  inventory.forEach(product => {
    const isAvailable =
      !product.status || product.status.trim().toLowerCase() !== "sold";

    const productType = product.type
      ? product.type.trim().toLowerCase()
      : "autograph";

    const isCollectible = productType === "collectible";

    const categoryList = [
      product.category,
      product.category2
    ]
      .filter(category => category)
      .map(category => category.trim())
      .filter(category => category);

    if (isAvailable && isCollectible) {
      categoryList.forEach(category => {
        const key = category.toLowerCase();

        if (!collectibleCategoryMap.has(key)) {
          const displayCategory = category.replace(/\b\w/g, letter =>
            letter.toUpperCase()
          );

          collectibleCategoryMap.set(key, displayCategory);
        }
      });
    }
  });

  const collectibleCategories = [
    ...collectibleCategoryMap.values()
  ];

  collectibleCategories.sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: "base" })
  );

  collectiblesCategoryDropdown.innerHTML = `
    <a href="catalog.html?type=collectible">All Collectibles</a>
  `;

  collectibleCategories.forEach(category => {
    collectiblesCategoryDropdown.innerHTML += `
      <a href="catalog.html?type=collectible&category=${encodeURIComponent(category)}">
        ${category}
      </a>
    `;
  });
}

  window.updateMenuCartCount = updateMenuCartCount;

  enableTouchOpenMenu(catalogMenuLink, catalogMenu);
  enableTouchOpenMenu(collectiblesMenuLink, collectiblesMenu);
  enableTouchOpenMenu(specialtyMenuLink, specialtyMenu);

  updateMenuCartCount();
  buildAutographCategoryMenu();
  buildCollectibleCategoryMenu();

  const isProductionSite =
    window.location.hostname === "hollywoodeastac.com" ||
    window.location.hostname === "www.hollywoodeastac.com";

  const isD1TestPage =
    window.location.pathname.includes("d1-test");

  if (isProductionSite && !isD1TestPage) {
    const cloudflareAnalytics = document.createElement("script");

    cloudflareAnalytics.type = "module";
    cloudflareAnalytics.src =
      "https://static.cloudflareinsights.com/beacon.min.js";

    cloudflareAnalytics.setAttribute(
      "data-cf-beacon",
      '{"token":"abfe50921978482ea5b66347f24e6c17"}'
    );

    document.head.appendChild(cloudflareAnalytics);
  }
})();