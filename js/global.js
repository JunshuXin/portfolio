console.log('IT’S ALIVE!');

function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}

let pages = [
  { url: '/portfolio/', title: 'Home' },
  { url: '/portfolio/projects/index.html', title: 'Projects' },
  { url: '/portfolio/contact/index.html', title: 'Contact' },
  { url: '/portfolio/resume/index.html', title: 'Resume' },
  { url: 'https://github.com/JunshuXin', title: 'Profile' },
];


let navContainer = document.createElement('div');
navContainer.classList.add('nav-container');

let nav = document.createElement('nav');
navContainer.appendChild(nav);

let themeLabel = document.createElement('label');
themeLabel.classList.add('color-scheme');
themeLabel.innerHTML = `
  Theme:
  <select id="theme-switch">
    <option value="light dark" selected>Automatic</option>
    <option value="light">Light</option>
    <option value="dark">Dark</option>
  </select>
`;
navContainer.appendChild(themeLabel);

// Add the navContainer to the document
document.body.prepend(navContainer);


const ARE_WE_HOME = document.documentElement.classList.contains('home') || location.pathname === '/';

for (let p of pages) {
  let url = p.url;
  let title = p.title;

  // Adjust the URL if not on the home page and the URL is not absolute
  url = url.startsWith('http') 
  ? url 
  : new URL(url, window.location.origin).pathname;

  // Create a new <a> element
  let a = document.createElement('a');
  a.href = url;
  a.textContent = title;

  // Highlight the current page
  a.classList.toggle(
    'current',
    a.host === location.host && a.pathname === location.pathname
  );

  // Open external links in a new tab
  if (url.startsWith('http')) {
    a.target = '_blank'; // Use explicit check for absolute URLs
  }

  // Append the link to the <nav>
  nav.append(a);
}

// Add the dark mode switch
document.body.insertAdjacentHTML(
  'afterbegin',
  `
  <label class="color-scheme">
    Theme:
    <select id="theme-switch">
      <option value="light dark" selected>Automatic</option>
      <option value="light">Light</option>
      <option value="dark">Dark</option>
    </select>
  </label>`
);

// Get the <select> element
const themeSwitch = document.getElementById('theme-switch');

// Event listener for theme changes
themeSwitch.addEventListener('input', (event) => {
  const value = event.target.value;

  // Set the color-scheme property on the root element
  document.documentElement.style.setProperty('color-scheme', value);

  // Save the user's preference to localStorage
  localStorage.setItem('colorScheme', value);
});

// Apply the saved theme preference on page load
const savedTheme = localStorage.getItem('colorScheme');
if (savedTheme) {
  document.documentElement.style.setProperty('color-scheme', savedTheme);
  themeSwitch.value = savedTheme;
}
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
export function renderProjects(projects, containerElement, headingLevel = 'h2') {
  containerElement.innerHTML = ''; // Clear existing content

  projects.forEach(project => {
    const article = document.createElement('article');
    article.innerHTML = `
      <${headingLevel}>${project.title}</${headingLevel}>
      <img src="${project.image}" alt="${project.title}">
      <p>${project.description}</p>
      ${project.link ? `<a href="${project.link}" target="_blank" class="project-link">View Project</a>` : ''}
      ${project.year ? `<p class="project-year">c. ${project.year}</p>` : ''} <!-- Add year -->
    `;
    containerElement.appendChild(article);
  });
}


export async function fetchGitHubData(username) {
  return fetchJSON(`https://api.github.com/users/${username}`);
}



document.addEventListener('DOMContentLoaded', () => {
  const navLinks = document.querySelectorAll('nav a');

  navLinks.forEach(link => {
    link.addEventListener('click', (event) => {
      let target = link.getAttribute('href');
      let absoluteTarget = new URL(target, window.location.origin).pathname;

      // Allow external links to open in a new tab
      if (link.target === '_blank') {
        return;
      }

      // Prevent navigation if already on the same page
      if (window.location.pathname === absoluteTarget) {
        event.preventDefault();
        return;
      }

      // Ensure portfolio is in the path
      if (!absoluteTarget.startsWith('/portfolio')) {
        absoluteTarget = '/portfolio' + absoluteTarget;
      }

      // Prevent duplicate portfolio/project/project error
      absoluteTarget = absoluteTarget.replace(/\/portfolio\/portfolio\//, '/portfolio/');

      event.preventDefault();
      window.location.href = absoluteTarget;
    });
  });
});
