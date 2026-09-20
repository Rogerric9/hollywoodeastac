const productId = document.body.dataset.productId;

const product = inventory.find(item => item.product_id === productId);
const details = productDetails.find(item => item.product_id === productId);

const mainProductImage = document.getElementById("main-product-image");
const previousImageButton = document.getElementById("previous-image");
const nextImageButton = document.getElementById("next-image");
const addToCartButton = document.getElementById("add-to-cart-button");

if (product) {
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
