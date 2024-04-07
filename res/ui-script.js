// Adding in the search bar
async function searchbarCallback() {
  // This will be replaced dynamically with proper data
  // is of type Record<string, string[]>
  const path_index = {}
  const inputValue = document.getElementById("filterInput").value.toLowerCase();
  const lineItems = document.querySelectorAll("[data-route-ids]");
  for (const item of lineItems) {
    const linkedPage = item.getAttribute("href").split("/").at(-1)
    let stops = path_index[linkedPage]
    if (stops?.some(x => x.toLowerCase().includes(inputValue))) {
      item.style.display = "block"
      stops = stops.filter(x => x.toLowerCase().includes(inputValue))
      let stopList = item.querySelector("#stops-list")
      if (!stopList) {
        stopList = document.createElement("div")
        stopList.id = "stops-list"
        item.appendChild(stopList)
      }
      stopList.textContent = stops.toString()
    } else {
      item.style.display = "none"
    }
  }
}

const inputElement = document.createElement("input");
inputElement.id = "filterInput";
inputElement.type = "text";
inputElement.placeholder = "Filter by text...";
inputElement.addEventListener("input", searchbarCallback);

document.body.insertBefore(inputElement, document.body.firstChild);



// Add the checkbox
function checkboxCallback() {
  const isChecked = document.getElementById("filterCheckbox").checked;
  const lineItems = document.querySelectorAll("[data-route-ids]");
  for (const item of lineItems) {
    if (!isChecked) item.style.display = "block"
    else {
      const dayInfo = item.querySelector(".rounded-full");
      if (dayInfo) {
        const dayText = dayInfo.firstChild.textContent.trim();
        const today = new Date().getDay();
        let isValid = false
        switch (today) {
          case 0:  // Sunday
            isValid = dayText === "Sun"
            break;
          case 6:  // Saturday
            isValid = dayText === "Sat"
            break;
          default:  // Weekdays (1-5)
            isValid = dayText === "Mon-Fri"
        }
        item.style.display = isValid ? "block" : "none";
      }
    }
  }
}

const checkboxElement = document.createElement("input");
checkboxElement.id = "filterCheckbox";
checkboxElement.type = "checkbox";
checkboxElement.addEventListener("change", checkboxCallback);

const labelElement = document.createElement("label");
labelElement.htmlFor = "filterCheckbox";
labelElement.textContent = "Show lines active today";

document.body.insertBefore(document.createElement("br"), document.body.firstChild);
document.body.insertBefore(document.createElement("br"), document.body.firstChild);

document.body.insertBefore(checkboxElement, document.body.firstChild);
document.body.insertBefore(labelElement, document.body.firstChild);