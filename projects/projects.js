import { fetchJSON, renderProjects } from '../global.js';
import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm";

let selectedIndex = -1;

const projects = await fetchJSON('../lib/projects.json');

const projectsContainer = document.querySelector('.projects');
console.log("Projects container:", projectsContainer);

if (!projectsContainer) {
    throw new Error("Projects container not found in the DOM!");
}

const projectsTitle = document.querySelector('.projects-title');
projectsTitle.textContent = `Projects (${projects.length})`;


renderProjects(projects, projectsContainer, 'h2');


function renderPieChart(projectsGiven) {
    let newRolledData = d3.rollups(
        projectsGiven,
        (v) => v.length,
        (d) => d.year
    );

    let newData = newRolledData.map(([year, count]) => {
        return { value: count, label: year };
    });

    let newSVG = d3.select("#projects-pie-plot");
    newSVG.selectAll("path").remove(); // Clear old paths

    let colors = d3.scaleOrdinal(d3.schemeTableau10);
    let arcGenerator = d3.arc().innerRadius(0).outerRadius(50);
    let sliceGenerator = d3.pie().value((d) => d.value);
    let arcData = sliceGenerator(newData);

    arcData.forEach((d, idx) => {
        newSVG.append("path")
            .attr("d", arcGenerator(d))
            .attr("fill", colors(idx))
            .attr("class", idx === selectedIndex ? "selected" : "")
            .on("click", () => {
                selectedIndex = selectedIndex === idx ? -1 : idx;
                renderPieChart(projectsGiven);
                filterProjectsBySelection();
            });
    });

    d3.select(".legend").html(""); 
    renderLegend(newData, colors);
}


renderPieChart(projects);

function renderLegend(newData, colors) {
    const legend = d3.select(".legend").html(""); // Clear old content

    newData.forEach((d, idx) => {
        legend.append("li")
            .attr("style", `--color:${colors(idx)}`)
            .attr("class", idx === selectedIndex ? "selected" : "")
            .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`)
            .on("click", () => {
                selectedIndex = selectedIndex === idx ? -1 : idx;
                renderPieChart(projects);
                filterProjectsBySelection();
            });
    });
}
function filterProjectsBySelection() {
    let filteredProjects = projects;

    if (query.trim() !== "") {
        filteredProjects = filteredProjects.filter((project) => {
            let values = Object.values(project).join('\n').toLowerCase();
            return values.includes(query.toLowerCase());
        });
    }

    if (selectedIndex !== -1) {
        let selectedYear = d3.rollups(projects, (v) => v.length, (d) => d.year)[selectedIndex][0];
        filteredProjects = filteredProjects.filter((p) => p.year === selectedYear);
    }

    renderProjects(filteredProjects, projectsContainer, "h2");
}




// let rolledData = d3.rollups(
//     projects,
//     (v) => v.length,
//     (d) => d.year 
// );

// let data = rolledData.map(([year, count]) => {
//     return { value: count, label: year };
// });

// let svg = d3.select('#projects-pie-plot');


// let arcGenerator = d3.arc()
//     .innerRadius(0) 
//     .outerRadius(50); 

// // let sliceGenerator = d3.pie();
// let sliceGenerator = d3.pie().value((d) => d.value);

// let arcData = sliceGenerator(data);

// let colors = d3.scaleOrdinal(d3.schemeTableau10);

// arcData.forEach((d, idx) => {
//     svg.append('path')
//         .attr('d', arcGenerator(d))
//         .attr('fill', colors(idx));
// });
    
// let arc = arcGenerator({
//     startAngle: 0,
//     endAngle: 2 * Math.PI
// });


// svg.append('path')
//     .attr('d', arc) 
//     .attr('fill', 'red'); 



let query = '';
let searchInput = document.querySelector('.searchBar');

searchInput.addEventListener('input', (event) => {
    query = event.target.value.toLowerCase(); // Normalize case
    filterProjectsBySelection();

    // let filteredProjects = projects.filter((project) => project.title.includes(query));
    let filteredProjects = projects.filter((project) => {
        let values = Object.values(project).join('\n').toLowerCase();
        return values.includes(query);
    });

    renderProjects(filteredProjects, projectsContainer, 'h2');
    renderPieChart(filteredProjects);
});
