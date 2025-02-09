import { fetchJSON, renderProjects } from '../js/global.js';
import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm";

const projects = await fetchJSON('../lib/projects.json');
const projectsContainer = document.querySelector('.projects');
const searchInput = document.querySelector('.searchBar');

let currentSearchQuery = ''; // ✅ Track search input
let currentSelectedYear = null; // ✅ Track selected year
let labels = []; // ✅ Store available years

// ✅ Render Initial Project List
renderProjects(projects, projectsContainer, 'h2');

// ✅ Update Project Title Count
const projectsTitle = document.querySelector('.projects-title');
if (projectsTitle) {
    projectsTitle.textContent = `${projects.length} Projects`;
}

// ✅ Function to Get Yearly Project Data
function getProjectData(projectsList) {
    let rolledData = d3.rollups(
        projectsList,
        (v) => v.length,
        (d) => d.year
    );

    labels = rolledData.map(([year]) => year); // ✅ Store year labels

    return rolledData.map(([year, count]) => ({
        value: count,
        label: year
    }));
}

// ✅ Function to Filter Projects Based on Search + Year Selection
function filterProjects() {
    let filteredProjects = projects.filter((project) => {
        let matchesSearchQuery = Object.values(project).join('\n').toLowerCase().includes(currentSearchQuery);
        let matchesSelectedYear = currentSelectedYear ? project.year === currentSelectedYear : true;
        return matchesSearchQuery && matchesSelectedYear;
    });

    renderProjects(filteredProjects, projectsContainer, 'h2');
    renderPieChart(filteredProjects);
}

// ✅ Function to Render Pie Chart
function renderPieChart(projectsList) {
    let data = getProjectData(projectsList);

    let svg = d3.select("#projects-plot");
    svg.selectAll("*").remove(); // ✅ Clear previous chart

    const pie = d3.pie().value(d => d.value);
    const arcData = pie(data);

    const arcGenerator = d3.arc()
        .innerRadius(0)
        .outerRadius(50);
    let arc = arcGenerator({
            startAngle: 0,
            endAngle: 2 * Math.PI,
          });

    const colors = d3.scaleOrdinal(d3.schemeTableau10);

    let g = svg.append("g").attr("transform", "translate(0,0)");

    // ✅ Append Pie Chart Slices with Click Events
    g.selectAll("path")
        .data(arcData)
        .enter()
        .append("path")
        .attr("d", arcGenerator)
        .attr("fill", (d, i) => colors(i))
        .attr("data-year", d => d.data.label) // ✅ Set data attribute for filtering
        .on("click", function (_, d) {
            currentSelectedYear = currentSelectedYear === d.data.label ? null : d.data.label; // ✅ Toggle selection
            filterProjects(); // ✅ Apply updated filter logic
        });

    updateLegend(data, colors);
}

// ✅ Function to Update Legend with Click Events
function updateLegend(data, colors) {
    let legend = d3.select('.legend');
    legend.selectAll("*").remove(); // ✅ Clear previous legend

    data.forEach((d, i) => {
        legend.append('li')
            .attr('style', `--color: ${colors(i)}`)
            .attr('class', currentSelectedYear === d.label ? "selected" : "")
            .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`)
            .on("click", function () {
                currentSelectedYear = currentSelectedYear === d.label ? null : d.label; // ✅ Toggle selection
                filterProjects(); // ✅ Apply updated filter logic
            });
    });
}

// ✅ Render the Pie Chart Initially
renderPieChart(projects);

// ✅ Implement Search Filtering (Sync with Pie Selection)
searchInput.addEventListener('input', (event) => {
    currentSearchQuery = event.target.value.toLowerCase();
    filterProjects();
});