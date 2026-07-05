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
const productDescription = document.getElementById("product-description");
const productAuthentication = document.getElementById("product-authentication");
const productCondition = document.getElementById("product-condition");
const productMiscellaneous = document.getElementById("product-miscellaneous");
const addToCartButton = document.getElementById("add-to-cart-button");

if (!product) {
  productName.textContent = "Product Not Found";
  productDescription.innerHTML = "<p>Sorry, this product could not be found.</p>";
  addToCartButton.style.display = "none";
} else {
  productName.textContent = product.name;
  productNumber.textContent = `Product No. ${product.product_id}`;
  productPrice.textContent = `$${product.price}`;

  const photoList =
    details &&
    details.product_images &&
    details.product_images.length > 0
      ? details.product_images
      : ["images/no-image-available.jpg"];

  let currentPhotoIndex = 0;

  function showCurrentPhoto() {
    const currentPhoto = photoList[currentPhotoIndex];

    mainProductImage.src = `../${currentPhoto}`;
    mainProductImage.alt = product.name;

    previousImageButton.style.display =
      currentPhotoIndex === 0 ? "none" : "inline-block";

    nextImageButton.style.display =
      currentPhotoIndex === photoList.length - 1 ? "none" : "inline-block";
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

  if (details && details.full_description) {
    const descriptionParagraphs = Array.isArray(details.full_description)
      ? details.full_description
      : [details.full_description];

    productDescription.innerHTML = "<h3>Description</h3>";

    descriptionParagraphs.forEach(paragraph => {
      productDescription.innerHTML += `<p>${paragraph}</p>`;
    });
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

  if (details && details.miscellaneous) {
    productMiscellaneous.innerHTML = `
      <h3>Miscellaneous</h3>
      <p>${details.miscellaneous}</p>
    `;
  }

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
        return;
      }
    } else {
      cart.push({
        product_id: product.product_id,
        name: product.name,
        price: product.price,
        quantity: 1
      });

      alert(`${product.name} has been added to your cart.`);
    }

    localStorage.setItem("cart", JSON.stringify(cart));
  });
}