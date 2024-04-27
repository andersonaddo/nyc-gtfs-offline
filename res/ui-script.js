// This will be replaced dynamically with proper data
// is of type Record<string, string[]>
const path_index = {}

function determineDisplayOfLineItems() {
  //For the stop name searchbar
  const stopInputValue = document.getElementById("filterInput").value.toLowerCase();
  //For the line name searchbar
  const lineInputValue = document.getElementById("lineFilterInput").value.toLowerCase();
  // For the checkbox
  const dayInfoCheckboxChecked = document.getElementById("filterCheckbox").checked;

  const lineItems = document.querySelectorAll("[data-route-ids]");
  for (const item of lineItems) {
    const linkedPage = item.getAttribute("href").split("/").at(-1)
    let stops = path_index[linkedPage]
    const hasQueriedStopName = stops?.some(x => x.toLowerCase().includes(stopInputValue))

    const lineNameHolder = item.querySelector(".route-color-swatch");
    const dayText = lineNameHolder.textContent.toLowerCase().trim();
    const hasQueriedLineName = dayText.includes(lineInputValue)

    let hasQueriedDayInfo = true
    const dayInfo = item.querySelector(".rounded-full");
    if (dayInfo && dayInfoCheckboxChecked) {
      const dayText = dayInfo.firstChild.textContent.trim();
      const today = new Date().getDay();
      switch (today) {
        case 0:  // Sunday
          hasQueriedDayInfo = dayText === "Sun"
          break;
        case 6:  // Saturday
          hasQueriedDayInfo = dayText === "Sat"
          break;
        default:  // Weekdays (1-5)
          hasQueriedDayInfo = dayText === "Mon-Fri"
      }
    }


    if (hasQueriedDayInfo && hasQueriedStopName && hasQueriedLineName) {
      item.style.display = "block"
      stops = stops.filter(x => x.toLowerCase().includes(stopInputValue))
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

//Adding stop name search bar
const inputElement = document.createElement("input");
inputElement.id = "filterInput";
inputElement.type = "text";
inputElement.placeholder = "Filter by STOP name...";
inputElement.style.width = "100%"
inputElement.style.borderWidth = "1px"
inputElement.style.borderColor = "black"
inputElement.style.borderStyle = "solid"
inputElement.style.marginBottom = "16px"
inputElement.addEventListener("input", determineDisplayOfLineItems);
document.body.insertBefore(inputElement, document.body.firstChild);

//Adding line name search bar
const lineInputElement = document.createElement("input");
lineInputElement.id = "lineFilterInput";
lineInputElement.type = "text";
lineInputElement.placeholder = "Filter by LINE name...";
lineInputElement.style.width = "100%"
lineInputElement.style.borderWidth = "1px"
lineInputElement.style.borderColor = "blue"
lineInputElement.style.borderStyle = "solid"
lineInputElement.style.marginBottom = "16px"
lineInputElement.addEventListener("input", determineDisplayOfLineItems);
document.body.insertBefore(lineInputElement, document.body.firstChild);


//Adding Day info checkbox
const checkboxElement = document.createElement("input");
checkboxElement.id = "filterCheckbox";
checkboxElement.type = "checkbox";
checkboxElement.style.marginBottom = "16px"
checkboxElement.addEventListener("change", determineDisplayOfLineItems);

const labelElement = document.createElement("label");
labelElement.htmlFor = "filterCheckbox";
labelElement.textContent = "Show lines active today";

document.body.insertBefore(checkboxElement, document.body.firstChild);
document.body.insertBefore(labelElement, document.body.firstChild);

checkboxElement.checked = true
determineDisplayOfLineItems()

