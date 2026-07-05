const urlParameters = new URLSearchParams(window.location.search);
const productId = urlParameters.get("id") || document.body.dataset.productId;

console.log("Product ID:", productId);

const product = inventory.find(item => item.product_id === productId);
const details = productDetails.find(item => item.product_id === productId);

console.log("Inventory record:", product);
console.log("Detail record:", details);

const productImageArea = document.querySelector(".product-image");
const extraDetails = document.getElementById("extra-product-details");

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

    productImageArea.innerHTML = `
      <div class="photo-viewer">
        <button id="previous-photo" class="photo-arrow photo-arrow-left">
          &#10094;
        </button>

        <img src="../${currentPhoto}" alt="${product.name}" id="current-product-photo">

        <button id="next-photo" class="photo-arrow photo-arrow-right">
          &#10095;
        </button>
      </div>

      <p class="photo-counter">
        Photo ${currentPhotoIndex + 1} of ${photoList.length}
      </p>
    `;

    const previousButton = document.getElementById("previous-photo");
    const nextButton = document.getElementById("next-photo");

    if (currentPhotoIndex === 0) {
      previousButton.style.display = "none";
    }

    if (currentPhotoIndex === photoList.length - 1) {
      nextButton.style.display = "none";
    }

    previousButton.addEventListener("click", () => {
      if (currentPhotoIndex > 0) {
        currentPhotoIndex--;
        showCurrentPhoto();
      }
    });

    nextButton.addEventListener("click", () => {
      if (currentPhotoIndex < photoList.length - 1) {
        currentPhotoIndex++;
        showCurrentPhoto();
      }
    });
  }

  if (photoList.length > 0) {
    showCurrentPhoto();
  }
}

if (details && details.full_description) {
  const descriptionParagraphs = Array.isArray(details.full_description)
    ? details.full_description
    : [details.full_description];

  if (descriptionParagraphs.length > 0) {
    extraDetails.innerHTML += `
      <h3>Additional Information</h3>
    `;

    descriptionParagraphs.forEach(paragraph => {
      extraDetails.innerHTML += `
        <p>${paragraph}</p>
      `;
    });
  }
}
if (details && details.authentication_info) {
  extraDetails.innerHTML += `
    <h3>Authentication</h3>
    <p>${details.authentication_info}</p>
  `;
}

if (details && details.condition_notes) {
  extraDetails.innerHTML += `
    <h3>Condition</h3>
    <p>${details.condition_notes}</p>
  `;
}

if (details && details.miscellaneous) {
  extraDetails.innerHTML += `
    <h3>Miscellaneous</h3>
    <p>${details.miscellaneous}</p>
  `;
}