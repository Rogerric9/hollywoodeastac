const productId = document.body.dataset.productId;

const product = inventory.find(item => item.product_id === productId);
const details = productDetails.find(item => item.product_id === productId);

const mainProductImage = document.getElementById("main-product-image");
const previousImageButton = document.getElementById("previous-image");
const nextImageButton = document.getElementById("next-image");
const addToCartButton = document.getElementById("add-to-cart-button");
const viewCartLink = document.querySelector('a.back-link[href="../cart.html"]');

function updateViewCartLink() {
  if (!viewCartLink) {
    return;
  }

  const cart = JSON.parse(localStorage.getItem("cart")) || [];

  if (cart.length === 0) {
    viewCartLink.classList.add("disabled-link");
    viewCartLink.setAttribute("aria-disabled", "true");
    viewCartLink.removeAttribute("href");
  } else {
    viewCartLink.classList.remove("disabled-link");
    viewCartLink.removeAttribute("aria-disabled");
    viewCartLink.setAttribute("href", "../cart.html");
  }
}

updateViewCartLink();

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
    updateViewCartLink();
  });

  const OFFER_WORKER_URL =
    "https://hollywood-east-checkout.steve-kanski.workers.dev";

  const makeOfferSection = document.getElementById("make-offer-section");
  const makeOfferButton = document.getElementById("make-offer-button");
  const makeOfferForm = document.getElementById("make-offer-form");
  const offerBuyerEmailInput = document.getElementById("offer-buyer-email");
  const offerPriceInput = document.getElementById("offer-price-input");
  const submitOfferButton = document.getElementById("submit-offer-button");
  const cancelOfferButton = document.getElementById("cancel-offer-button");
  const offerStatusMessage = document.getElementById("offer-status-message");
  const offerPaypalButtonContainer = document.getElementById(
    "offer-paypal-button-container"
  );

  function renderOfferPaypalButtons(offerId) {
    if (!window.paypal || !offerPaypalButtonContainer) {
      console.error("PayPal SDK did not load.");
      return;
    }

    offerPaypalButtonContainer.style.display = "block";

    paypal.Buttons({
      createOrder: async function () {
        const response = await fetch(
          `${OFFER_WORKER_URL}/create-paypal-order`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              items: [
                {
                  product_id: product.product_id,
                  quantity: 1,
                  offer_id: offerId
                }
              ]
            })
          }
        );

        const result = await response.json();

        if (
          !response.ok ||
          !result.success ||
          !result.order_id
        ) {
          const message =
            result.message ||
            "The PayPal order could not be created.";

          alert(message);
          throw new Error(message);
        }

        return result.order_id;
      },

      onApprove: async function (data) {
        const response = await fetch(
          `${OFFER_WORKER_URL}/capture-paypal-order`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              order_id: data.orderID
            })
          }
        );

        const result = await response.json();

        if (
          !response.ok ||
          !result.success ||
          result.status !== "COMPLETED"
        ) {
          if (
            result.status === "PENDING" &&
            result.pending_reason === "PENDING_REVIEW"
          ) {
            alert(
              "PayPal is reviewing this payment. Your order is not " +
              "complete yet. Please do not retry the payment or " +
              "submit another order. Hollywood East will wait for " +
              "PayPal to complete its review."
            );

            return;
          }

          alert(
            result.message ||
            "Payment could not be verified. Please contact " +
            "Hollywood East before retrying."
          );

          return;
        }

        alert("Payment completed. Thank you!");

        offerPaypalButtonContainer.innerHTML = "";
        offerStatusMessage.textContent = "Payment completed. Thank you!";
      },

      onCancel: async function (data) {
        try {
          const response = await fetch(
            `${OFFER_WORKER_URL}/release-paypal-reservation`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json"
              },
              body: JSON.stringify({
                order_id: data.orderID
              })
            }
          );

          const result = await response.json();

          if (!response.ok || !result.success) {
            console.error(
              "The canceled offer reservation could not be released.",
              result
            );
          }
        } catch (error) {
          console.error(
            "The canceled offer reservation could not be released.",
            error
          );
        }
      },

      onError: function (error) {
        console.error("Offer PayPal checkout error.", error);
      }
    }).render("#offer-paypal-button-container");
  }

  const urlOfferId = new URLSearchParams(
    window.location.search
  ).get("offer_id");

  if (urlOfferId && makeOfferSection) {
    makeOfferSection.style.display = "block";

    if (makeOfferButton) {
      makeOfferButton.style.display = "none";
    }

    offerStatusMessage.textContent =
      "Your offer was accepted! You can check out below.";

    renderOfferPaypalButtons(urlOfferId);
  } else if (
    product.accepts_offers &&
    makeOfferSection
  ) {
    makeOfferSection.style.display = "block";
  }

  if (makeOfferButton && makeOfferForm) {
    makeOfferButton.addEventListener("click", () => {
      makeOfferForm.style.display = "flex";
      makeOfferButton.style.display = "none";
    });
  }

  if (cancelOfferButton && makeOfferForm && makeOfferButton) {
    cancelOfferButton.addEventListener("click", () => {
      makeOfferForm.style.display = "none";
      makeOfferButton.style.display = "inline-block";
      offerStatusMessage.textContent = "";
    });
  }

  if (submitOfferButton) {
    submitOfferButton.addEventListener("click", async () => {
      const buyerEmail = offerBuyerEmailInput.value.trim();
      const offerPrice = Number(offerPriceInput.value);

      if (!buyerEmail) {
        offerStatusMessage.textContent =
          "Please enter your email address.";
        return;
      }

      if (!Number.isFinite(offerPrice) || offerPrice <= 0) {
        offerStatusMessage.textContent =
          "Please enter a valid offer amount.";
        return;
      }

      submitOfferButton.disabled = true;
      offerStatusMessage.textContent = "Submitting your offer...";

      try {
        const response = await fetch(
          `${OFFER_WORKER_URL}/submit-offer`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              product_id: product.product_id,
              offer_price: offerPrice,
              buyer_email: buyerEmail
            })
          }
        );

        const result = await response.json();

        if (!response.ok || !result.success) {
          offerStatusMessage.textContent =
            result.message || "Your offer could not be submitted.";
          submitOfferButton.disabled = false;
          return;
        }

        offerStatusMessage.textContent = result.message || "";
        makeOfferForm.style.display = "none";

        if (result.status === "accepted") {
          renderOfferPaypalButtons(result.offer_id);
        } else {
          submitOfferButton.disabled = false;
          makeOfferButton.style.display = "inline-block";
        }
      } catch (error) {
        console.error("Offer submission failed.", error);
        offerStatusMessage.textContent =
          "Your offer could not be submitted. Please try again.";
        submitOfferButton.disabled = false;
      }
    });
  }
}
