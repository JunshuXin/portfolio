<script src="https://d3js.org/d3.v7.min.js"></script>

let selectedCommits = [];


let data = [];
let commits = [];
let brushSelection = null;
let xScale, yScale, rScale; // Declare scales globally
let commitProgress = 100;
let timeScale = d3.scaleTime([d3.min(commits, d => d.datetime), d3.max(commits, d => d.datetime)], [0, 100]);
let commitMaxTime = timeScale.invert(commitProgress);
let NUM_ITEMS = 100; // Adjust to match commit history length
let ITEM_HEIGHT = 30;
let VISIBLE_COUNT = 10;
let totalHeight = (NUM_ITEMS - 1) * ITEM_HEIGHT;

const scrollContainer = d3.select("#scroll-container");
const spacer = d3.select("#spacer");

spacer.style("height", `${totalHeight}px`);

const itemsContainer = d3.select("#items-container");


async function loadData() {
    console.log("📊 Loading CSV data...");

    try {
        data = await d3.csv('loc.csv', (row) => {
            const datetime = new Date(row.datetime);
            return {
                ...row,
                line: Number(row.line),
                depth: Number(row.depth),
                length: Number(row.length),
                file: row.file,
                commit: row.commit,
                datetime: datetime,
                hourFrac: datetime.getHours() + datetime.getMinutes() / 60,
                url: `https://github.com/YOUR_REPO/commit/${row.commit}`,
                author: row.author,
                totalLines: Number(row.lines_edited) || 0,
                language: row.language || "Other"
            };
        });

        console.log("✅ Data Loaded:", data.length, "rows");

        processCommits();
        displayStats();
        createScatterplot();

    } catch (error) {
        console.error("❌ Error loading data:", error);
    }
}

function processCommits() {
    console.log("🔄 Processing commits...");

    commits = d3.groups(data, (d) => d.commit).map(([commit, lines]) => {
        let first = lines[0];
        return {
            id: commit,
            datetime: first.datetime,
            hourFrac: first.hourFrac,
            author: first.author,
            totalLines: d3.sum(lines, d => d.totalLines),
            url: first.url,
            language: first.language,
            lines: lines // Preserve for language breakdown
        };
    });

    console.log("✅ Commits Processed:", commits.length);
}

function displayStats() {
    console.log("📊 Displaying Stats...");

    const statsContainer = d3.select("#stats");
    statsContainer.html("");

    const totalCommits = commits.length;
    const totalFiles = d3.groups(data, d => d.file).length;
    const totalLOC = data.length;
    const maxDepth = d3.max(data, d => d.depth);
    const longestLine = d3.max(data, d => d.length);
    const maxLines = d3.max(commits, d => d.totalLines);

    const stats = [
        { label: "COMMITS", value: totalCommits },
        { label: "FILES", value: totalFiles },
        { label: "TOTAL LOC", value: totalLOC },
        { label: "MAX DEPTH", value: maxDepth },
        { label: "LONGEST LINE", value: longestLine },
        { label: "MAX LINES", value: maxLines }
    ];

    statsContainer.append("div")
        .attr("class", "stats-grid")
        .selectAll("div")
        .data(stats)
        .enter()
        .append("div")
        .attr("class", "stats-item")
        .html(d => `<label>${d.label}</label><span class="stat-value">${d.value}</span>`);

    console.log("✅ Stats successfully displayed.");
}


function updateTimeDisplay() {
    commitProgress = Number(timeSlider.value); // ✅ Convert slider value to a number

    // ✅ Convert slider progress to actual commit datetime
    commitMaxTime = timeScale.invert(commitProgress);
    
    // ✅ Update displayed time dynamically
    commitTime.textContent = commitMaxTime.toLocaleString();
    selectedTime.textContent = commitMaxTime.toLocaleString();

    console.log("🔄 Commit Progress:", commitProgress);
    console.log("📅 Filtering commits before:", commitMaxTime);

    // ✅ Get the filtered commits
    filterCommitsByTime();
    filteredCommits = commits.filter(d => d.datetime <= commitMaxTime);
    console.log(`✅ Filtered ${filteredCommits.length} commits.`);
}

// ✅ Tooltip Functions
function updateTooltipContent(commit) {
    document.getElementById('commit-link').href = commit.url;
    document.getElementById('commit-link').textContent = commit.id;
    document.getElementById('commit-date').textContent = commit.datetime.toLocaleDateString();
}

function updateTooltipVisibility(isVisible) {
    document.getElementById('commit-tooltip').hidden = !isVisible;
}
function updateScatterplot(filteredCommits) {
    console.log("📈 Updating scatterplot...");

    const margin = { top: 20, right: 30, bottom: 50, left: 50 };
    const width = 1000 - margin.left - margin.right;
    const height = 600 - margin.top - margin.bottom;

    // ✅ Clear previous SVG before redrawing
    d3.select("#chart").select("svg").remove();

    const svg = d3.select("#chart")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    if (!filteredCommits.length) {
        console.warn("⚠️ No commits match the selected time range.");
        return;
    }

    // ✅ Define scales dynamically based on filtered data
    xScale = d3.scaleTime()
        .domain(d3.extent(filteredCommits, d => d.datetime))
        .range([0, width])
        .nice();

    yScale = d3.scaleLinear()
        .domain([0, 24])
        .range([height, 0]);

    const [minLines, maxLines] = d3.extent(filteredCommits, d => d.totalLines);
    rScale = d3.scaleSqrt()
        .domain([minLines, maxLines])
        .range([3, 30]);

    // ✅ Color Scale for Time of Day
    const colorScale = d3.scaleLinear()
        .domain([0, 6, 12, 18, 24]) // Explicitly define day/night shifts
        .range(["#1E3A8A", "#2563EB", "#F59E0B", "#D97706", "#1E3A8A"]) // Deep blue → bright orange
        .interpolate(d3.interpolateRgb);

    const sortedCommits = [...filteredCommits].sort((a, b) => b.totalLines - a.totalLines);

    // ✅ Draw Axes
    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(xScale).ticks(d3.timeDay.every(2)).tickFormat(d3.timeFormat("%b %d")));

    svg.append("g")
        .call(d3.axisLeft(yScale).tickFormat(d => `${String(d).padStart(2, '0')}:00`));

    // ✅ Add Brushing
    const brush = d3.brush()
        .extent([[0, 0], [width, height]])
        .on("start brush end", brushed);

    svg.append("g")
        .attr("class", "brush")
        .call(brush);

    // ✅ Remove existing dots before redrawing
    svg.selectAll("g.dots").remove();

    // ✅ Create Dots for Each Commit
    const dots = svg.append("g").attr("class", "dots");

    dots.selectAll("circle")
        .data(sortedCommits)
        .join("circle")
        .attr("cx", d => xScale(d.datetime))
        .attr("cy", d => yScale(d.hourFrac))
        .attr("r", d => rScale(d.totalLines))
        .attr("fill", d => colorScale(d.hourFrac))
        .attr("opacity", 0.7)
        .on("mouseenter", function (event, d) {
            d3.select(event.currentTarget).style("fill-opacity", 1);
            updateTooltipContent(d);
            updateTooltipVisibility(true);
            updateTooltipPosition(event);
        })
        .on("mousemove", updateTooltipPosition)
        .on("mouseleave", function () {
            d3.select(this).style("fill-opacity", 0.7);
            updateTooltipContent({});
            updateTooltipVisibility(false);
        });

    console.log(`✅ Scatterplot updated with ${filteredCommits.length} commits.`);
}

function updateTooltipPosition(event) {
    const tooltip = document.getElementById('commit-tooltip');
    tooltip.style.left = `${event.clientX + 15}px`;
    tooltip.style.top = `${event.clientY + 15}px`;
}

// ✅ Update Selection Count
function updateSelectionCount() {
    const selectedCommits = brushSelection ? commits.filter(isCommitSelected) : [];
    document.getElementById('selection-count').textContent = `${selectedCommits.length || 'No'} commits selected`;
}

// ✅ Update Language Breakdown
function updateLanguageBreakdown() {
    const selectedCommits = brushSelection ? commits.filter(isCommitSelected) : [];
    const container = document.getElementById('language-breakdown');

    if (selectedCommits.length === 0) {
        container.innerHTML = '';
        return;
    }

    const breakdown = d3.rollup(
        selectedCommits.flatMap(d => d.lines),
        v => v.length,
        d => d.language
    );

    container.innerHTML = '';
    for (const [language, count] of breakdown) {
        container.innerHTML += `<dt>${language}</dt><dd>${count} lines</dd>`;
    }
}

// 📌 Load Data on Page Load
document.addEventListener("DOMContentLoaded", loadData);
document.addEventListener("DOMContentLoaded", () => {
    const commitSlider = document.getElementById("commitSlider");
    const commitTime = document.getElementById("commitTime");
    const selectedTime = document.getElementById("selectedTime"); // ✅ Select the new time element

    if (!commits.length) return; // Ensure commits exist before proceeding

    // ✅ Define the time scale dynamically based on commit history
    const timeScale = d3.scaleTime()
        .domain([d3.min(commits, d => d.datetime), d3.max(commits, d => d.datetime)])
        .range([0, 100]);

    let commitProgress = 100; // Default at max
    let commitMaxTime = timeScale.invert(commitProgress); // Convert progress to time

    // ✅ Display the initial time
    commitTime.textContent = commitMaxTime.toLocaleString();
    selectedTime.textContent = commitMaxTime.toLocaleString(); // ✅ Show formatted time

    // ✅ Update values when slider moves
    commitSlider.addEventListener("input", (event) => {
        commitProgress = event.target.value;
        commitMaxTime = timeScale.invert(commitProgress);

        commitTime.textContent = commitMaxTime.toLocaleString();
        selectedTime.textContent = commitMaxTime.toLocaleString(); // ✅ Update displayed time

        console.log("🔄 Commit Progress:", commitProgress);
        console.log("📅 Filter Commits Before:", commitMaxTime);
        const filteredCommits = commits.filter(d => d.datetime <= commitMaxTime);

        updateScatterplot(filteredCommits); // ✅ Ensure scatterplot updates when filtering
    });
});

// ✅ Improve selected commit filtering
function isCommitSelected(commit) {
    return selectedCommits.includes(commit);
}

function updateSelectedCommits() {
    selectedCommits = brushSelection ? commits.filter(isCommitSelected) : [];
}

// ✅ Brushing logic update
function brushed(event) {
    brushSelection = event.selection;
    updateSelectedCommits();
}

  



  function brushed(evt) {
    let brushSelection = evt.selection;
    selectedCommits = !brushSelection
      ? []
      : commits.filter((commit) => {
          let min = { x: brushSelection[0][0], y: brushSelection[0][1] };
          let max = { x: brushSelection[1][0], y: brushSelection[1][1] };
          let x = xScale(commit.date);
          let y = yScale(commit.hourFrac);
  
          return x >= min.x && x <= max.x && y >= min.y && y <= max.y;
        });
  }

  d3.select(event.currentTarget).classed('selected', ...); // give it a corresponding boolean value
  let lines = filteredCommits.flatMap((d) => d.lines);
  let files = [];
  files = d3
    .groups(lines, (d) => d.file)
    .map(([name, lines]) => {
      return { name, lines };
    });

    function extractFileData() {
        let lines = filteredCommits.flatMap((d) => d.lines);
    
        let files = d3.groups(lines, (d) => d.file).map(([name, lines]) => ({
            name,
            lines,
        }));
    
        return files;
    }
    function displayCommitFiles() {
        const lines = filteredCommits.flatMap((d) => d.lines);
    
        let fileTypeColors = d3.scaleOrdinal(d3.schemeTableau10);
    
        let files = d3.groups(lines, (d) => d.file).map(([name, lines]) => ({
            name,
            lines,
        }));
    
        files = d3.sort(files, (d) => -d.lines.length);
    
        d3.select(".files").selectAll("div").remove();
    
        let filesContainer = d3
            .select(".files")
            .selectAll("div")
            .data(files)
            .enter()
            .append("div");
    
        filesContainer.append("dt").html(
            (d) => `<code>${d.name}</code><small>${d.lines.length} lines</small>`
        );
    
        filesContainer
            .append("dd")
            .selectAll("div")
            .data((d) => d.lines)
            .enter()
            .append("div")
            .attr("class", "line")
            .style("background", (d) => fileTypeColors(d.type));
    }
    files = d3.sort(files, (d) => -d.lines.length);
    let fileTypeColors = d3.scaleOrdinal(d3.schemeTableau10);
    .style("background", (d) => fileTypeColors(d.type));

    scrollContainer.on("scroll", () => {
        const scrollTop = scrollContainer.property("scrollTop");
    
        let startIndex = Math.floor(scrollTop / ITEM_HEIGHT);
        startIndex = Math.max(0, Math.min(startIndex, commits.length - VISIBLE_COUNT));
    
        renderItems(startIndex);
    });

    function renderItems(startIndex) {
        itemsContainer.selectAll("div").remove();
    
        const endIndex = Math.min(startIndex + VISIBLE_COUNT, commits.length);
        let newCommitSlice = commits.slice(startIndex, endIndex);
    
        itemsContainer
            .selectAll("div")
            .data(newCommitSlice)
            .enter()
            .append("div")
            .html(
                (commit, index) => `
                <p>
                    On ${commit.datetime.toLocaleString("en", { dateStyle: "full", timeStyle: "short" })}, I made 
                    <a href="${commit.url}" target="_blank">
                        ${index > 0 ? "another glorious commit" : "my first commit, and it was glorious"}
                    </a>. 
                    I edited ${commit.totalLines} lines across ${d3.rollups(commit.lines, D => D.length, d => d.file).length} files.
                </p>
            `
            )
            .style("position", "absolute")
            .style("top", (_, idx) => `${idx * ITEM_HEIGHT}px`);
    
        // ✅ Update scatterplot to match visible commits
        updateScatterplot(newCommitSlice);
    }

    const fileScrollContainer = d3.select("#file-scroll-container");
const fileSpacer = d3.select("#file-spacer");

fileSpacer.style("height", `${totalHeight}px`);

const fileItemsContainer = d3.select("#file-items-container");

fileScrollContainer.on("scroll", () => {
    const scrollTop = fileScrollContainer.property("scrollTop");

    let startIndex = Math.floor(scrollTop / ITEM_HEIGHT);
    startIndex = Math.max(0, Math.min(startIndex, filteredCommits.length - VISIBLE_COUNT));

    renderFileItems(startIndex);
});

function renderFileItems(startIndex) {
    fileItemsContainer.selectAll("div").remove();

    const endIndex = Math.min(startIndex + VISIBLE_COUNT, filteredCommits.length);
    let newFileSlice = filteredCommits.slice(startIndex, endIndex);

    fileItemsContainer
        .selectAll("div")
        .data(newFileSlice)
        .enter()
        .append("div")
        .html(
            (commit) => `
            <p>
                <b>${commit.name}</b> was modified in this commit.
                It now has ${commit.lines.length} lines.
            </p>
        `
        )
        .style("position", "absolute")
        .style("top", (_, idx) => `${idx * ITEM_HEIGHT}px`);

    // ✅ Update file visualization
    displayCommitFiles();
}

document.getElementById("commit-slider-container").remove();
function updateSummaryStats(newCommitSlice) {
    let totalCommits = newCommitSlice.length;
    let totalFiles = d3.groups(newCommitSlice, d => d.file).length;
    let totalLOC = d3.sum(newCommitSlice, d => d.lines.length);

    d3.select("#stats").html(`
        <p>Commits: ${totalCommits}</p>
        <p>Files Edited: ${totalFiles}</p>
        <p>Lines of Code: ${totalLOC}</p>
    `);
}



    