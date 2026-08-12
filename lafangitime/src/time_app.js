// Empty array where our employees populated from config.json
let workerList = [];

// An object of arrays that provide the values for dropdown logic
// populated from config,json
let subjectObject = {};

function loadConfig(retries = 10) {
  fetch("http://localhost:3000/config")
    .then((response) => response.json())
    .then((config) => {
      workerList = config.workers;
      subjectObject = config.clients;
      initializeApp();
    })
    .catch((error) => {
      if (retries > 0) {
        setTimeout(() => loadConfig(retries -1), 500);
      } else {
        console.error("Failed to load config after retried: ", error);
        alert("Could not connect to the local server. Try restarting the app.")
      }
    });
}

// when the window loads, bring the values in fron config 
// only go on once they've been received or throw an error
window.addEventListener("load", function () {
  loadConfig();
});

// Default clock-in state
let clockInTime = null;
let clockOutTime = null;
let durationMinutes = null;

// called when you manually reset or submit
function clearEntry() {
  clockInTime = null;
  clockOutTime = null;
  durationMinutes = null;
  document.getElementById("timeInDisplay").textContent = "";
  document.getElementById("timeOutDisplay").textContent = "";
  document.getElementById("durationDisplay").textContent = "";
  document.getElementById("notes").value = "";
  document.getElementById("themst").selectedIndex = 0;
  document.getElementById("what").length = 1;
  document.getElementById("clockIn").disabled = false;
}

// Do a variety of setup tasks, called after the config loads
function initializeApp() {
  let whoSel = document.getElementById("whomst");
  let subjectSel = document.getElementById("themst");
  let jobSel = document.getElementById("what");
  const clockInBtn = document.getElementById("clockIn");
  const clockOutBtn = document.getElementById("clockOut");
  const resetBtn = document.getElementById("resetTime");
  const timeInDisplay = document.getElementById("timeInDisplay");
  const timeOutDisplay = document.getElementById("timeOutDisplay");
  const durationDisplay = document.getElementById("durationDisplay");

  for (const person of workerList) {
    whoSel.options[whoSel.options.length] = new Option(person, person);
  }

  for (const client of Object.keys(subjectObject)) {
    subjectSel.options[subjectSel.options.length] = new Option(client, client);
  }

  // Adjusts job options depending on client
  subjectSel.onchange = function () {
    jobSel.length = 1;
    for (var y of subjectObject[this.value]) {
      jobSel.options[jobSel.options.length] = new Option(y, y);
    }
  };

  // Attaches a Date Obj and displays time button clicked in local time
  clockInBtn.onclick = function () {
    clockInTime = new Date();
    timeInDisplay.textContent =
      "Clocked in at " + clockInTime.toLocaleTimeString();
    clockInBtn.disabled = true;
  };

  // Attaches a new Date obj, computes duration from difference with clock-in, messages if not clockedin
  clockOutBtn.onclick = function () {
    if (!clockInTime) {
      timeOutDisplay.textContent = "You haven't clocked in yet!";
      return;
    }
    clockOutTime = new Date();
    durationMinutes = Math.round((clockOutTime - clockInTime) / 60000);
    timeOutDisplay.textContent =
      "Clocked out at " + clockOutTime.toLocaleTimeString();
    durationDisplay.textContent =
      "Total work time " + durationMinutes + "minutes";
  };
  // Clears current time and task data
  resetBtn.onclick = function () {
    if (!confirm("This will clear the current entry. Are you sure?")) {
      return;
    }
    clearEntry();
  };
}
