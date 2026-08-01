window.addEventListener("load", function () {
  const submitBtn = document.getElementById("submitTime");
  submitBtn.onclick = function () {
    // throws alert if insufficient data
    if (!clockInTime || !clockOutTime) {
      alert("You need both a clock in and clock out time before submitting.");
      return;
    }
    // Data to pass spreadsheet
    const rowData = [
      {
        Date: clockInTime.toLocaleDateString(),
        User: document.getElementById("whomst").value,
        Client: document.getElementById("themst").value,
        Job: document.getElementById("what").value,
        "Clock In": clockInTime.toLocaleTimeString(),
        "Clock Out": clockOutTime.toLocaleTimeString(),
        "Duration (min)": durationMinutes,
        Notes: document.getElementById("notes").value,
      },
    ];

    fetch("http://localhost:3000/submit-entry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(rowData),
    })
      .then((response) => response.json())
      .then((data) => {
        console.log(data);
        if (data.status === "success") {
          alert("Entry submitted!");
          clearEntry();
        } else {
          alert("Something went wrong: " + data.error_message);
        }
      })
      .catch((error) => {
        console.error(error);
        alert("Network error -- entry not submitted.");
      });
  };
});
