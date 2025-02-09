console.log('IT’S ALIVE!');

function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}

let pages = [
  { url: '', title: 'Home' },
  { url: '../projects/index.html', title: 'Projects' },
  { url: '../contact/index.html', title: 'Contact' },
  { url: '../resume/index.html', title: 'Resume' },
  { url: 'https://github.com/JunshuXin', title: 'Profile' },
];

let nav = document.createElement('nav');
document.body.prepend(nav);

const ARE_WE_HOME = document.documentElement.classList.contains('home') || location.pathname === '/';

for (let p of pages) {
  let url = p.url;
  let title = p.title;

  // Adjust the URL if not on the home page and the URL is not absolute
  url = !ARE_WE_HOME && !url.startsWith('http') ? '../' + url : url;

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
      const target = link.getAttribute('href');

      // Allow external links to open in a new tab
      if (link.target === '_blank') {
        return;  // Skip preventing the default behavior for external links
      }

      // For internal links, prevent default and navigate normally
      event.preventDefault();
      window.location.href = target;
    });
  });
});