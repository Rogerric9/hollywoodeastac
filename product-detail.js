const productId = document.body.dataset.productId;

console.log("Product ID:", productId);

const product = inventory.find(item => item.product_id === productId);
const details = productDetails.find(item => item.product_id === productId);

console.log("Inventory record:", product);
console.log("Detail record:", details);

const extraDetails = document.getElementById("extra-product-details");

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
const additionalImagesGallery = document.getElementById("additional-images-gallery");

if (details && details.additional_images && details.additional_images.length > 0) {
  additionalImagesGallery.innerHTML = `
    <h3>Additional Photos</h3>
  `;

  details.additional_images.forEach(imagePath => {
    additionalImagesGallery.innerHTML += `
      <img src="../${imagePath}" alt="${product.name}" class="additional-product-image">
    `;
  });
}