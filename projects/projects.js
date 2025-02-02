import { fetchJSON, renderProjects } from '../js/global.js';

async function loadProjects() {
    const projects = await fetchJSON('../lib/projects.json');
    const projectsContainer = document.querySelector('.projects');
    
    if (projectsContainer) {
        renderProjects(projects, projectsContainer, 'h3');
    }
}

loadProjects();
