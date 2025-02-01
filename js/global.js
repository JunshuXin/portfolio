
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
    let url = !ARE_WE_HOME && !p.url.startsWith('http') ? '../' + p.url : p.url;
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
