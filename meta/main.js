<script src="https://d3js.org/d3.v7.min.js"></script>

let selectedCommits = [];
let data = [];
let commits = [];
let brushSelection = null;
let xScale, yScale, rScale;
let commitProgress = 100;
let commitMaxTime;
let timeScale;
let filteredCommits = [];
let NUM_ITEMS = 100;
let ITEM_HEIGHT = 30;
let VISIBLE_COUNT = 10;
let totalHeight = (NUM_ITEMS - 1) * ITEM_HEIGHT;

document.addEventListener("DOMContentLoaded", () => {
    const scrollContainer = d3.select("#scroll-container");
    const spacer = d3.select("#spacer");
    spacer.style("height", `${totalHeight}px`);

    const itemsContainer = d3.select("#items-container");

    scrollContainer.on("scroll", () => {
        const scrollTop = scrollContainer.property("scrollTop");
        let startIndex = Math.floor(scrollTop / ITEM_HEIGHT);
        startIndex = Math.max(0, Math.min(startIndex, commits.length - VISIBLE_COUNT));
        renderItems(startIndex);
    });

    // Remove commit slider once scrollytelling is implemented
    const sliderContainer = document.getElementById("commit-slider-container");
    if (sliderContainer) {
        sliderContainer.remove();
    }
});

// ✅ Load and Process Data
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
        updateScatterplot(commits); // ✅ Ensure scatterplot updates immediately

    } catch (error) {
        console.error("❌ Error loading data:", error);
    }
}

// ✅ Process Commits After Loading Data
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
            lines: lines
        };
    });

    console.log("✅ Commits Processed:", commits.length);

    // ✅ Define time scale dynamically based on data
    timeScale = d3.scaleTime()
        .domain([d3.min(commits, d => d.datetime), d3.max(commits, d => d.datetime)])
        .range([0, 100]);

    commitMaxTime = timeScale.invert(commitProgress);
}

// ✅ Update Scatterplot
function updateScatterplot(filteredCommits) {
    console.log("📈 Updating scatterplot...");

    const margin = { top: 20, right: 30, bottom: 50, left: 50 };
    const width = 1000 - margin.left - margin.right;
    const height = 600 - margin.top - margin.bottom;

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

    const colorScale = d3.scaleLinear()
        .domain([0, 6, 12, 18, 24])
        .range(["#1E3A8A", "#2563EB", "#F59E0B", "#D97706", "#1E3A8A"])
        .interpolate(d3.interpolateRgb);

    const sortedCommits = [...filteredCommits].sort((a, b) => b.totalLines - a.totalLines);

    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(xScale).ticks(d3.timeDay.every(2)).tickFormat(d3.timeFormat("%b %d")));

    svg.append("g")
        .call(d3.axisLeft(yScale).tickFormat(d => `${String(d).padStart(2, '0')}:00`));

    const dots = svg.append("g").attr("class", "dots");

    dots.selectAll("circle")
        .data(sortedCommits)
        .join("circle")
        .attr("cx", d => xScale(d.datetime))
        .attr("cy", d => yScale(d.hourFrac))
        .attr("r", d => rScale(d.totalLines))
        .attr("fill", d => colorScale(d.hourFrac))
        .attr("opacity", 0.7);
}

// ✅ Handle Time Filtering & Updates
function updateTimeDisplay() {
    commitProgress = Number(timeSlider.value);
    commitMaxTime = timeScale.invert(commitProgress);

    commitTime.textContent = commitMaxTime.toLocaleString();
    selectedTime.textContent = commitMaxTime.toLocaleString();

    console.log("🔄 Commit Progress:", commitProgress);
    console.log("📅 Filtering commits before:", commitMaxTime);

    filteredCommits = commits.filter(d => d.datetime <= commitMaxTime);
    console.log(`✅ Filtered ${filteredCommits.length} commits.`);

    updateScatterplot(filteredCommits);
}

// ✅ Render Commit Items for Scrollytelling
function renderItems(startIndex) {
    itemsContainer.selectAll("div").remove();

    const endIndex = Math.min(startIndex + VISIBLE_COUNT, commits.length);
    let newCommitSlice = commits.slice(startIndex, endIndex);

    itemsContainer
        .selectAll("div")
        .data(newCommitSlice)
        .enter()
        .append("div")
        .html(commit => `
            <p>
                On ${commit.datetime.toLocaleString("en", { dateStyle: "full", timeStyle: "short" })}, I made 
                <a href="${commit.url}" target="_blank">
                    ${commit.id}
                </a>. 
                I edited ${commit.totalLines} lines across ${commit.lines.length} files.
            </p>
        `)
        .style("position", "absolute")
        .style("top", (_, idx) => `${idx * ITEM_HEIGHT}px`);

    updateScatterplot(newCommitSlice);
}

// 📌 Load Data on Page Load
document.addEventListener("DOMContentLoaded", loadData);
