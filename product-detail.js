const urlParameters = new URLSearchParams(window.location.search);
const productId = urlParameters.get("id");

const product = inventory.find(item => item.product_id === productId);
const details = productDetails.find(item => item.product_id === productId);

const mainProductImage = document.getElementById("main-product-image");
const previousImageButton = document.getElementById("previous-image");
const nextImageButton = document.getElementById("next-image");

const productName = document.getElementById("product-name");
const productNumber = document.getElementById("product-number");
const productPrice = document.getElementById("product-price");
const productShipping = document.getElementById("product-shipping");
const productDescription = document.getElementById("product-description");
const productAuthentication = document.getElementById("product-authentication");
const productCondition = document.getElementById("product-condition");
const productMiscellaneous = document.getElementById("product-miscellaneous");
const addToCartButton = document.getElementById("add-to-cart-button");

if (!product) {
  document.title =
    "Product Not Found | Hollywood East Autographs & Collectibles";

  const metaDescription = document.querySelector(
    'meta[name="description"]'
  );

  if (metaDescription) {
    metaDescription.setAttribute(
      "content",
      "The requested Hollywood East product could not be found."
    );
  }

  productName.textContent = "Product Not Found";
  productDescription.innerHTML =
    "<p>Sorry, this product could not be found.</p>";
  addToCartButton.style.display = "none";
} else {
  document.title =
    `${product.name} | Hollywood East Autographs & Collectibles`;

  const metaDescription = document.querySelector(
    'meta[name="description"]'
  );

  if (metaDescription) {
    const descriptionText =
      product.description ||
      (
        details &&
        details.full_description
          ? (
              Array.isArray(details.full_description)
                ? details.full_description.join(" ")
                : details.full_description
            )
          : ""
      );

    const cleanedDescription = String(descriptionText)
      .replace(/\s+/g, " ")
      .trim();

    const finalDescription = cleanedDescription
      ? `${product.name}. ${cleanedDescription}`
      : `View ${product.name} from Hollywood East Autographs & Collectibles.`;

    metaDescription.setAttribute(
      "content",
      finalDescription.slice(0, 160)
    );
  }

  productName.textContent = product.name;
  productNumber.textContent = `Product No. ${product.product_id}`;
  productPrice.textContent = `$${product.price}`;
  let shippingAmount = 0;

  if (product.shipping_class === "standard") {
    shippingAmount = SHIPPING_CONFIG.standardSingle;
  } else if (product.shipping_class === "framed") {
    shippingAmount = SHIPPING_CONFIG.framedFirst;
  } else if (product.shipping_class === "plaque") {
    shippingAmount = SHIPPING_CONFIG.plaqueFirst;
  } else if (product.shipping_class === "custom") {
    shippingAmount = Number(product.shipping_charge);
  }

  productShipping.textContent =
    `Shipping: $${shippingAmount.toFixed(2)}`;

  const photoList =
    details &&
    details.product_images &&
    details.product_images.length > 0
      ? details.product_images
      : ["images/no-image-available.jpg"];

  let currentPhotoIndex = 0;

  function showCurrentPhoto() {
    const currentPhoto = photoList[currentPhotoIndex];

    mainProductImage.onerror = function () {
      this.onerror = null;
      this.src = "../images/no-image-available.jpg";

      previousImageButton.style.display = "none";
      nextImageButton.style.display = "none";
    };

    mainProductImage.src = `../${currentPhoto}`;
    mainProductImage.alt = product.name;

    previousImageButton.style.display =
      photoList.length <= 1 || currentPhotoIndex === 0
        ? "none"
        : "inline-block";

    nextImageButton.style.display =
      photoList.length <= 1 || currentPhotoIndex === photoList.length - 1
        ? "none"
        : "inline-block";
  }

  previousImageButton.addEventListener("click", () => {
    if (currentPhotoIndex > 0) {
      currentPhotoIndex--;
      showCurrentPhoto();
    }
  });

  nextImageButton.addEventListener("click", () => {
    if (currentPhotoIndex < photoList.length - 1) {
      currentPhotoIndex++;
      showCurrentPhoto();
    }
  });

  showCurrentPhoto();

productDescription.innerHTML = "";

if (product.description) {
  productDescription.innerHTML += `
    <h3>Description</h3>
    <p>${product.description}</p>
  `;
}


if (details && details.full_description) {
  const fullDescriptionParagraphs = Array.isArray(
    details.full_description
  )
    ? details.full_description
    : [details.full_description];

  productDescription.innerHTML += `
    <div class="full-description-section">
      <h3>Full Description</h3>

      <div class="full-description-scroll">
        ${fullDescriptionParagraphs
          .map(paragraph => `<p>${paragraph}</p>`)
          .join("")}
      </div>
    </div>
  `;
}

  if (details && details.authentication_info) {
    productAuthentication.innerHTML = `
      <h3>Authentication</h3>
      <p>${details.authentication_info}</p>
    `;
  }

  if (details && details.condition_notes) {
    productCondition.innerHTML = `
      <h3>Condition</h3>
      <p>${details.condition_notes}</p>
    `;
  }

  if (
    details &&
    details.miscellaneous &&
    String(details.miscellaneous).trim() !== ""
  ) {
    const miscellaneousParagraphs = Array.isArray(
      details.miscellaneous
    )
      ? details.miscellaneous
      : [details.miscellaneous];

    productMiscellaneous.innerHTML = `
      <h3>Miscellaneous</h3>

      <div class="full-description-scroll">
        ${miscellaneousParagraphs
          .map(paragraph => `<p>${paragraph}</p>`)
          .join("")}
      </div>
    `;
  } else {
    productMiscellaneous.innerHTML = "";
  }

   function updateAddToCartButton() {
    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    const quantityAvailable = product.quantity_available || 1;

    const existingCartItem = cart.find(item => item.product_id === product.product_id);

    const productStatus = product.status
    ? product.status.trim().toLowerCase()
    : "";

    if (productStatus === "not-for-sale") {
        addToCartButton.textContent = "Not For Sale";
        addToCartButton.disabled = true;
    } else if (existingCartItem && existingCartItem.quantity >= quantityAvailable) {
        addToCartButton.textContent = "Already in Cart";
        addToCartButton.disabled = true;
    } else {
        addToCartButton.textContent = "Add to Cart";
        addToCartButton.disabled = false;
    }
  }

  updateAddToCartButton();

  addToCartButton.addEventListener("click", () => {
    let cart = JSON.parse(localStorage.getItem("cart")) || [];

    const quantityAvailable = product.quantity_available || 1;

    const existingCartItem = cart.find(item => item.product_id === product.product_id);

    if (existingCartItem) {
      if (existingCartItem.quantity < quantityAvailable) {
        existingCartItem.quantity += 1;
        alert(`${product.name} has been added to your cart.`);
      } else {
        alert("This item is already in your cart.");
        updateAddToCartButton();
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

    if (window.updateMenuCartCount) {
      window.updateMenuCartCount();
    }

    updateAddToCartButton();
  });
}