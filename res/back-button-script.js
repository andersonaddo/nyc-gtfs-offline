const backButton = document.createElement("button");
backButton.textContent = "Go Back";
backButton.addEventListener("click", function () {
  window.location.href = "../index.html";
});
document.body.prepend(backButton);