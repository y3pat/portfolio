import { fetchJSON, renderProjects } from '../global.js';

const projects = await fetchJSON('../lib/projects.json');

const projectsContainer = document.querySelector('.projects');
console.log("Projects container:", projectsContainer);

if (!projectsContainer) {
    throw new Error("Projects container not found in the DOM!");
}

const projectsTitle = document.querySelector('.projects-title');
projectsTitle.textContent = `Projects (${projects.length})`;


renderProjects(projects, projectsContainer, 'h2');

