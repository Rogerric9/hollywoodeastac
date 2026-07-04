const categoryDropdown = document.getElementById("category-dropdown");

const categoryMap = new Map();

inventory.forEach(product => {
  const category = product.category?.trim();
  const isAvailable =
    !product.status || product.status.trim().toLowerCase() !== "sold";
  const isAutograph =
    product.type && product.type.trim().toLowerCase() === "autograph";

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