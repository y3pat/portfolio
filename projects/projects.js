import { fetchJSON, renderProjects } from '../global.js';
import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm";

const projects = await fetchJSON('../lib/projects.json');

const projectsContainer = document.querySelector('.projects');
console.log("Projects container:", projectsContainer);

if (!projectsContainer) {
    throw new Error("Projects container not found in the DOM!");
}

const projectsTitle = document.querySelector('.projects-title');
projectsTitle.textContent = `Projects (${projects.length})`;


renderProjects(projects, projectsContainer, 'h2');



let rolledData = d3.rollups(
    projects,
    (v) => v.length,
    (d) => d.year 
);

let data = rolledData.map(([year, count]) => {
    return { value: count, label: year };
});

let svg = d3.select('#projects-pie-plot');


let arcGenerator = d3.arc()
    .innerRadius(0) 
    .outerRadius(50); 

// let sliceGenerator = d3.pie();
let sliceGenerator = d3.pie().value((d) => d.value);

let arcData = sliceGenerator(data);

let colors = d3.scaleOrdinal(d3.schemeTableau10);

arcData.forEach((d, idx) => {
    svg.append('path')
        .attr('d', arcGenerator(d))
        .attr('fill', colors(idx));
});
    
// let arc = arcGenerator({
//     startAngle: 0,
//     endAngle: 2 * Math.PI
// });


// svg.append('path')
//     .attr('d', arc) 
//     .attr('fill', 'red'); 

let legend = d3.select('.legend');

data.forEach((d, idx) => {
    legend.append('li')
          .attr('style', `--color:${colors(idx)}`)
          .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`);
});