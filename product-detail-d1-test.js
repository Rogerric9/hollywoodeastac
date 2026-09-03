const urlParameters =
  new URLSearchParams(window.location.search);

const productId =
  urlParameters.get("id");

const WORKER_URL =
  "http://127.0.0.1:8787";

const mainProductImage =
  document.getElementById("main-product-image");

const previousImageButton =
  document.getElementById("previous-image");

const nextImageButton =
  document.getElementById("next-image");

const productName =
  document.getElementById("product-name");

const productNumber =
  document.getElementById("product-number");

const productPrice =
  document.getElementById("product-price");

const productShipping =
  document.getElementById("product-shipping");

const productDescription =
  document.getElementById("product-description");

const productAuthentication =
  document.getElementById("product-authentication");

const productCondition =
  document.getElementById("product-condition");

const productMiscellaneous =
  document.getElementById("product-miscellaneous");

const addToCartButton =
  document.getElementById("add-to-cart-button");

async function loadD1Product() {
  if (!productId) {
    productName.textContent =
      "Product Not Found";

    addToCartButton.style.display =
      "none";

    return;
  }

  try {
    const response = await fetch(
      `${WORKER_URL}/d1-test-product?id=${encodeURIComponent(productId)}`
    );

    const data = await response.json();

    if (!data.success || !data.product) {
      throw new Error(
        data.message || "Product not found."
      );
    }

    const product = data.product;

    productName.textContent =
      product.name;

    productNumber.textContent =
      `Product No. ${product.product_id}`;

    productPrice.textContent =
      `$${product.price}`;

    let shippingAmount = 0;

    if (product.shipping_class === "standard") {
      shippingAmount =
        SHIPPING_CONFIG.standardSingle;
    } else if (product.shipping_class === "framed") {
      shippingAmount =
        SHIPPING_CONFIG.framedFirst;
    } else if (product.shipping_class === "plaque") {
      shippingAmount =
        SHIPPING_CONFIG.plaqueFirst;
    } else if (product.shipping_class === "custom") {
      shippingAmount =
        Number(product.shipping_charge);
    }

    productShipping.textContent =
      `Shipping: $${shippingAmount.toFixed(2)}`;

    productDescription.innerHTML = "";

    if (product.description) {
      productDescription.innerHTML += `
        <h3>Description</h3>
        <p>${product.description}</p>
      `;
    }

    if (product.full_description) {
      productDescription.innerHTML += `
        <div class="full-description-section">
          <h3>Full Description</h3>

          <div class="full-description-scroll">
            <p>${product.full_description}</p>
          </div>
        </div>
      `;
    }

    if (product.authentication_info) {
      productAuthentication.innerHTML = `
        <h3>Authentication</h3>
        <p>${product.authentication_info}</p>
      `;
    } else {
      productAuthentication.innerHTML = "";
    }

    if (product.condition_notes) {
      productCondition.innerHTML = `
        <h3>Condition</h3>
        <p>${product.condition_notes}</p>
      `;
    } else {
      productCondition.innerHTML = "";
    }

    if (
      product.miscellaneous &&
      String(product.miscellaneous).trim() !== ""
    ) {
      productMiscellaneous.innerHTML = `
        <h3>Miscellaneous</h3>

        <div class="full-description-scroll">
          <p>${product.miscellaneous}</p>
        </div>
      `;
    } else {
      productMiscellaneous.innerHTML = "";
    }

    const photoList =
      product.images &&
      product.images.length > 0
        ? product.images.map(
            image => image.image_path
          )
        : ["images/no-image-available.jpg"];

    let currentPhotoIndex = 0;

    function showCurrentPhoto() {
      const currentPhoto =
        photoList[currentPhotoIndex];

      mainProductImage.onerror =
        function () {
          this.onerror = null;
          this.src =
            "../images/no-image-available.jpg";

          previousImageButton.style.display =
            "none";

          nextImageButton.style.display =
            "none";
        };

      mainProductImage.src =
        `../${currentPhoto}`;

      mainProductImage.alt =
        product.name;

      previousImageButton.style.display =
        photoList.length <= 1 ||
        currentPhotoIndex === 0
          ? "none"
          : "inline-block";

      nextImageButton.style.display =
        photoList.length <= 1 ||
        currentPhotoIndex ===
          photoList.length - 1
          ? "none"
          : "inline-block";
    }

    previousImageButton.addEventListener(
      "click",
      () => {
        if (currentPhotoIndex > 0) {
          currentPhotoIndex--;
          showCurrentPhoto();
        }
      }
    );

    nextImageButton.addEventListener(
      "click",
      () => {
        if (
          currentPhotoIndex <
          photoList.length - 1
        ) {
          currentPhotoIndex++;
          showCurrentPhoto();
        }
      }
    );

    showCurrentPhoto();
  
    function updateAddToCartButton() {
      const cart =
        JSON.parse(localStorage.getItem("cart")) || [];

      const quantityAvailable =
        Number(product.quantity_available) || 0;

      const existingCartItem =
        cart.find(
          item =>
            item.product_id ===
            product.product_id
        );

      if (!product.purchasable) {
        addToCartButton.textContent =
          "Not For Sale";

        addToCartButton.disabled = true;

      } else if (
        existingCartItem &&
        Number(existingCartItem.quantity) >=
          quantityAvailable
      ) {
        addToCartButton.textContent =
          "Already in Cart";

        addToCartButton.disabled = true;

      } else {
        addToCartButton.textContent =
          "Add to Cart";

        addToCartButton.disabled = false;
      }
    }

    updateAddToCartButton();  

  } catch (error) {
    console.error(error);

    productName.textContent =
      "Product Not Found";

    productDescription.innerHTML =
      "<p>Sorry, this product could not be found.</p>";

    addToCartButton.style.display =
      "none";
  }
}

loadD1Product();