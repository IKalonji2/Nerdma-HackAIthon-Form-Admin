let applicationsData = []; // Global variable to store applications data
let sessionToken = ''; // Global variable to store session token

function authenticate() {
  const accessCode = document.getElementById("access-code").value;
  fetch("https://squid-app-mdj7h.ondigitalocean.app/authenticate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ access_code: accessCode }),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.session_uuid) {
        sessionToken = data.session_uuid; // Store session token globally
        document.getElementById("auth-section").style.display = "none";
        document.getElementById("applications-section").style.display = "flex";
        document.getElementById("auth-message").textContent = "Access granted!";
        fetchApplications();
        fetchParticipationUpdates();
      } else {
        document.getElementById("auth-message").textContent =
          "Invalid access code. Please try again.";
      }
    })
    .catch((error) => {
      console.error("Error:", error);
      document.getElementById("auth-message").textContent =
        "An error occurred. Please try again.";
    });
}

function fetchApplications() {
  fetch("https://squid-app-mdj7h.ondigitalocean.app/applications/v1", {
    headers: {
      Authorization: sessionToken,
    },
  })
    .then((response) => response.json())
    .then((data) => {
      applicationsData = data; // Store applications data globally
      const applicationsContainer = document.getElementById("applications");
      const tableContainer = document.getElementById("applications-table");
      const applicantCount = document.getElementById("applicant-count");

      applicationsContainer.innerHTML = ""; // Clear previous content
      tableContainer.innerHTML = ""; // Clear previous content

      if (data.length > 0) {
        applicantCount.textContent = `${data.length} applications received`;

        const table = document.createElement("table");
        const headerRow = document.createElement("tr");
        const headers = [
          "First Name",
          "Last Name",
          "Phone Number",
          "Email",
          "Company",
          "Experience Level",
          "Track",
          "Team",
          "Participation Mode",
          "Source" // Added Source to the headers
        ];
        headers.forEach((header) => {
          const th = document.createElement("th");
          th.textContent = header;
          headerRow.appendChild(th);
        });
        table.appendChild(headerRow);

        data.forEach((app) => {
          // Create collapsible container for each applicant
          const appDiv = document.createElement("div");
          appDiv.className = "applicant-container";
          appDiv.onclick = () => toggleContent(appDiv);

          appDiv.innerHTML = `
            <h3>${app.first_name} ${app.last_name}</h3>
            <div class="applicant-content">
              <p>Phone Number: ${app.phone_number}</p>
              <p>Email: ${app.email}</p>
              <p>Company: ${app.company}</p>
              <p>Experience Level: ${app.experience_level}</p>
              <p>Track: ${app.track}</p>
              <p>Team: ${app.team}</p>
              <p>Participation Mode: ${app.participation_mode}</p>
              <p>Source: ${app.source}</p> <!-- Added Source to the collapsible content -->
            </div>
          `;
          applicationsContainer.appendChild(appDiv);

          // Create table row for each applicant
          const row = document.createElement("tr");
          headers.forEach((header) => {
            const td = document.createElement("td");
            td.textContent = app[header.toLowerCase().replace(" ", "_")];
            row.appendChild(td);
          });
          table.appendChild(row);
        });
        tableContainer.appendChild(table);
        createCharts(data); // Create the charts
      } else {
        applicantCount.textContent = "0 applications received";
        applicationsContainer.textContent = "No applicants";
        tableContainer.textContent = "No applicants";
      }
    })
    .catch((error) => {
      console.error("Error:", error);
      document.getElementById("applications-section").textContent =
        "Failed to fetch applications.";
    });
}

function fetchParticipationUpdates() {
  fetch("https://squid-app-mdj7h.ondigitalocean.app/participation-mode-updates/v1", {
    headers: {
      Authorization: sessionToken,
    },
  })
    .then((response) => response.json())
    .then((data) => {
      const updatesTableContainer = document.getElementById("updates-table");
      const uniqueEmailCount = document.getElementById("unique-email-count");
      updatesTableContainer.innerHTML = ""; // Clear previous content

      if (data.length > 0) {
        const uniqueEmails = new Set(data.map(update => update.email));
        uniqueEmailCount.textContent = `Unique Emails: ${uniqueEmails.size}`;

        const table = document.createElement("table");
        const headerRow = document.createElement("tr");
        const headers = [
          "Email",
          "Initial Participation Mode",
          "Current Participation Mode",
          "Updated At",
        ];
        headers.forEach((header) => {
          const th = document.createElement("th");
          th.textContent = header;
          headerRow.appendChild(th);
        });
        table.appendChild(headerRow);

        data.forEach((update) => {
          const row = document.createElement("tr");
          headers.forEach((header) => {
            const td = document.createElement("td");
            td.textContent = update[header.toLowerCase().replace(/ /g, "_")];
            row.appendChild(td);
          });
          table.appendChild(row);
        });
        updatesTableContainer.appendChild(table);
      } else {
        uniqueEmailCount.textContent = "0 unique emails";
        updatesTableContainer.textContent = "No participation mode updates.";
      }
    })
    .catch((error) => {
      console.error("Error:", error);
      document.getElementById("participation-updates").textContent =
        "Failed to fetch participation mode updates.";
    });
}

function toggleContent(element) {
  const content = element.querySelector(".applicant-content");
  if (content.style.display === "block") {
    content.style.display = "none";
  } else {
    content.style.display = "block";
  }
}

function downloadCSV() {
  if (applicationsData.length === 0) {
    alert("No data available to download.");
    return;
  }

  const headers = [
    "First Name",
    "Last Name",
    "Phone Number",
    "Email",
    "Company",
    "Experience Level",
    "Track",
    "Team",
    "Participation Mode",
    "Source" // Added Source to CSV headers
  ];
  const rows = applicationsData.map((app) => [
    app.first_name,
    app.last_name,
    app.phone_number,
    app.email,
    app.company,
    app.experience_level,
    app.track,
    app.team,
    app.participation_mode,
    app.source // Added Source to CSV data
  ]);

  let csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n";

  rows.forEach((rowArray) => {
    let row = rowArray.join(",");
    csvContent += row + "\n";
  });

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", "applications.csv");
  document.body.appendChild(link);

  link.click();
  document.body.removeChild(link);
}

function createCharts(data) {
  createPieChart("trackChart", "Applicants per Track", groupBy(data, "track"));
  createPieChart("teamChart", "Applicants per Team", groupBy(data, "team"));
  createPieChart(
    "participationModeChart",
    "Applicants per Participation Mode",
    groupBy(data, "participation_mode")
  );
}

function groupBy(data, key) {
  return data.reduce((result, app) => {
    result[app[key]] = (result[app[key]] || 0) + 1;
    return result;
  }, {});
}

function createPieChart(chartId, label, data) {
  const ctx = document.getElementById(chartId).getContext("2d");
  new Chart(ctx, {
    type: "pie",
    data: {
      labels: Object.keys(data),
      datasets: [
        {
          label: label,
          data: Object.values(data),
          backgroundColor: [
            "#8f1313e7",
            "rgba(139, 87, 87, 0.4)",
            "rgba(87, 87, 139, 0.4)",
            "rgba(87, 139, 87, 0.4)",
            "rgba(139, 87, 139, 0.4)",
          ],
          borderColor: [
            "rgba(139, 87, 87, 1)",
            "rgba(139, 87, 87, 1)",
            "rgba(87, 87, 139, 1)",
            "rgba(87, 139, 87, 1)",
            "rgba(139, 87, 139, 1)",
          ],
          borderWidth: 1,
        },
      ],
    },
    options: {
      plugins: {
        legend: {
          labels: {
            color: "#333", // Legend text color
          },
        },
      },
    },
  });
}
