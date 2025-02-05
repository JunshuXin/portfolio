
function $$(selector, context = document) {
    return Array.from(context.querySelectorAll(selector));
}

// Define pages for navigation
let pages = [
    { url: '', title: 'Home' },
    { url: 'projects/', title: 'Projects' },
    { url: 'resume/', title: 'Resume' },
    { url: 'contact/', title: 'Contact' },
    { url: 'github/', title: 'GitHub' }
];

// Create a <nav> element and prepend it to the body
let nav = document.createElement('nav');
document.body.prepend(nav);

// Check if we are on the home page
const ARE_WE_HOME = document.documentElement.classList.contains('home');

// Add links to the navigation menu
for (let p of pages) {
    let url = !ARE_WE_HOME && !p.url.startsWith('http') ? '../' + p.url : './' + p.url;
    console.log(url)
    let title = p.title;

    // Create link and add it to the nav
    nav.insertAdjacentHTML('beforeend', `<a href="${url}">${title}</a>`);
}

// Automatically highlight the current page link
const navLinks = $$("nav a");
let currentLink = navLinks.find(
    (a) => a.host === location.host && a.pathname === location.pathname
);
if (currentLink) {
    currentLink.classList.add('current');
}

// Add the theme switcher
document.body.insertAdjacentHTML(
    'afterbegin',
    `
    <label class="color-scheme">
      Theme:
      <select id="theme-select">
        <option value="light dark">Automatic</option>
        <option value="light">Light</option>
        <option value="dark">Dark</option>
      </select>
    </label>
    `
);

// Get a reference to the <select> element
let select = document.querySelector('#theme-select');

// Add an input event listener to detect changes in the dropdown
select.addEventListener('input', function (event) {
    console.log('Color scheme changed to', event.target.value);

    // Set the color-scheme property on the root element
    document.documentElement.style.setProperty('color-scheme', event.target.value);

});

document.addEventListener("DOMContentLoaded", function () {
    // Fetch and display projects if on projects page
    if (document.querySelector(".projects")) {
        fetch("../lib/projects.json") // Ensure the file path is correct
            .then(response => response.json())
            .then(data => {
                const projectsContainer = document.querySelector(".projects");
                projectsContainer.innerHTML = ""; // Clear existing content
                
                // Update the projects count in the <h1> tag
                const projectTitle = document.querySelector(".projects-title");
                if (projectTitle) {
                    projectTitle.textContent = `Projects (${data.length})`;
                }

                data.forEach(project => {
                    const projectElement = document.createElement("article");
                    projectElement.innerHTML = `
                        <h2>${project.title}</h2>
                        <img src="${project.image}" alt="${project.title}">
                        <p>${project.description}</p>
                    `;
                    projectsContainer.appendChild(projectElement);
                });
            })
            .catch(error => console.error("Error loading projects:", error));
    }
});
export async function fetchJSON(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch projects: ${response.statusText}`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching or parsing JSON data:', error);
    }
}

// Render projects dynamically
export function renderProjects(projects, containerElement, headingLevel = 'h2') {
    if (!containerElement) {
        console.error("Invalid container element");
        return;
    }

    // Clear existing content
    containerElement.innerHTML = '';

    projects.forEach(project => {
        const article = document.createElement('article');
        article.innerHTML = `
            <${headingLevel}>${project.title}</${headingLevel}>
            <img src="${project.image}" alt="${project.title}">
            <p>${project.description}</p>
            <small>Year: ${project.year}</small>
        `;
        containerElement.appendChild(article);
    });
}

// Fetch GitHub Profile Data
export async function fetchGitHubData(username) {
    return fetchJSON(`https://api.github.com/users/JunshuXin`);
}
