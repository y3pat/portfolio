import { fetchJSON, renderProjects } from '../global.js';
import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm";

let selectedIndex = -1;
let query = '';

const projects = await fetchJSON('../lib/projects.json');

const projectsContainer = document.querySelector('.projects');
if (!projectsContainer) {
    throw new Error("Projects container not found in the DOM!");
}

const projectsTitle = document.querySelector('.projects-title');
projectsTitle.textContent = `Projects (${projects.length})`;

renderProjects(projects, projectsContainer, 'h2');
renderPieChart(projects);

function renderLegend(newData, colors) {
    const legend = d3.select(".legend").html("");
    newData.forEach((d, idx) => {
        legend.append("li")
            .attr("style", `--color:${colors(idx)}`)
            .attr("class", idx === selectedIndex ? "selected" : "")
            .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`)
            .on("click", () => {
                selectedIndex = selectedIndex === idx ? -1 : idx;
                filterProjectsBySelection();
            });
    });
}

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
    newSVG.selectAll("path").remove();

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
                filterProjectsBySelection();
            });
    });

    d3.select(".legend").html("");
    renderLegend(newData, colors);
}

function filterProjectsBySelection() {
    let filteredProjects = projects;

    if (query.trim() !== "") {
        filteredProjects = filteredProjects.filter((project) => {
            let values = Object.values(project).join('\n').toLowerCase();
            return values.includes(query.toLowerCase());
        });
    }

    renderPieChart(filteredProjects);

    if (selectedIndex !== -1) {
        
        let filteredData = d3.rollups(filteredProjects, (v) => v.length, (d) => d.year);
        if (filteredData.length > selectedIndex) {
            let selectedYear = filteredData[selectedIndex][0];
            filteredProjects = filteredProjects.filter((p) => p.year === selectedYear);
        } else {
            selectedIndex = -1;
        }
    }

    renderProjects(filteredProjects, projectsContainer, "h2");
}

let searchInput = document.querySelector('.searchBar');
searchInput.addEventListener("input", (event) => {
    query = event.target.value.toLowerCase();
    filterProjectsBySelection();
    // let filteredProjects = projects.filter((project) => project.title.includes(query));
    let filteredProjects = projects.filter((project) => {
        let values = Object.values(project).join('\n').toLowerCase();
        return values.includes(query);
    });

    renderProjects(filteredProjects, projectsContainer, 'h2');
    renderPieChart(filteredProjects);
});
