async function loadCSV() {
    const response = await fetch("loc.csv");
    const csvText = await response.text();
    
    const rows = csvText.split("\n").map(row => row.split(","));
    const tableBody = document.querySelector("#loc-table tbody");

    rows.slice(1).forEach(row => {  // Skip header
        if (row.length < 2) return;
        const tr = document.createElement("tr");
        tr.innerHTML = `<td>${row[0]}</td><td>${row[1]}</td>`;
        tableBody.appendChild(tr);
    });
}

loadCSV();
