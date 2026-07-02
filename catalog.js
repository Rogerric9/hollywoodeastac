fetch("inventory.csv")
  .then(response => response.text())
  .then(data => {
    console.log(data);
  })
  .catch(error => {
    console.error("Could not load inventory:", error);
  });