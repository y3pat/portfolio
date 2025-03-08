let data = [];
let commits = [];
const width = 1000;
const height = 600;

// Define scales globally so they can be used across functions
let xScale, yScale, rScale;
let brushSelection = null;
let selectedCommits = [];
let commitProgress = 100;


let timeScale;
let commitMaxTime;


async function loadData() {
    data = await d3.csv('loc.csv', (row) => ({
        ...row,
        line: Number(row.line),
        depth: Number(row.depth),
        length: Number(row.length),
        date: new Date(row.date + 'T00:00' + row.timezone),
        datetime: new Date(row.datetime),
    }));

    processCommits();
    displayStats();
    let filteredCommits = commits.filter(d => d.datetime <= commitMaxTime);

    if (commits.length > 0) {
        timeScale = d3.scaleTime()
            .domain([d3.min(commits, d => d.datetime), d3.max(commits, d => d.datetime)])
            .range([0, 100]);

        commitMaxTime = timeScale.invert(commitProgress);
        updateSelectedTime();
    }


    updateScatterplot(filteredCommits);
}

function filterCommitsByTime() {
    filteredCommits = commits.filter(d => d.datetime <= commitMaxTime);
}
function updateTimeDisplay() {
    commitProgress = Number(document.getElementById("time-slider").value);
    commitMaxTime = timeScale.invert(commitProgress);

    const selectedTime = document.getElementById("selectedTime");
    selectedTime.textContent = commitMaxTime.toLocaleString('en', { dateStyle: "long", timeStyle: "short" });

    filterCommitsByTime();
    updateScatterplot(filteredCommits);
}



function processCommits() {
    commits = d3.groups(data, (d) => d.commit)
        .map(([commit, lines]) => {
            let first = lines[0];
            let { author, date, time, timezone, datetime } = first;

            let ret = {
                id: commit,
                url: 'https://github.com/YOUR_REPO/commit/' + commit, 
                author,
                date,
                time,
                timezone,
                datetime,
                hourFrac: datetime.getHours() + datetime.getMinutes() / 60,
                totalLines: lines.length,
            };

            Object.defineProperty(ret, 'lines', {
                value: lines,
                writable: false,
                enumerable: false,
                configurable: false 
            });

            return ret;
        });
}

function displayStats() {
    const dl = d3.select('#stats').append('dl').attr('class', 'stats');

    dl.append('dt').html('Total <abbr title="Lines of code">LOC</abbr>');
    dl.append('dd').text(data.length);

    dl.append('dt').text('Total commits');
    dl.append('dd').text(commits.length);

    let totalFiles = d3.groups(data, (d) => d.file).length;
    dl.append('dt').text('Total files');
    dl.append('dd').text(totalFiles);

    let maxFileLength = d3.max(data, (d) => d.line);
    dl.append('dt').text('Longest file (LOC)');
    dl.append('dd').text(maxFileLength);

    let avgFileLength = d3.mean(data, (d) => d.line).toFixed(2);
    dl.append('dt').text('Average file length (LOC)');
    dl.append('dd').text(avgFileLength);
}

function updateScatterplot(filteredCommits) {
    const margin = { top: 10, right: 10, bottom: 30, left: 20 };

    const usableArea = {
        top: margin.top,
        right: width - margin.right,
        bottom: height - margin.bottom,
        left: margin.left,
        width: width - margin.left - margin.right,
        height: height - margin.top - margin.bottom,
    };

    let svg = d3.select("#chart").select("svg");
    if (svg.empty()) {
        svg = d3.select("#chart").append("svg")
            .attr("viewBox", `0 0 ${width} ${height}`)
            .style("overflow", "visible");
    } else {
        svg.selectAll(".dots").remove();
        svg.selectAll(".gridlines").remove();
        svg.selectAll(".x-axis").remove();
        svg.selectAll(".y-axis").remove();
    }

    xScale = d3
        .scaleTime()
        .domain(d3.extent(filteredCommits, (d) => d.datetime))
        .range([usableArea.left, usableArea.right])
        .nice();

    yScale = d3
        .scaleLinear()
        .domain([0, 24])
        .range([usableArea.bottom, usableArea.top]);

    const [minLines, maxLines] = d3.extent(filteredCommits, (d) => d.totalLines);
    rScale = d3.scaleLog().domain([minLines, maxLines]).range([2, 15]);

    const gridlines = svg
        .append("g")
        .attr("class", "gridlines")
        .attr("transform", `translate(${usableArea.left}, 0)`);

    gridlines.call(d3.axisLeft(yScale).tickFormat("").tickSize(-usableArea.width));

    const xAxis = d3.axisBottom(xScale);
    const yAxis = d3.axisLeft(yScale).tickFormat((d) => String(d % 24).padStart(2, "0") + ":00");

    svg.append("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(0, ${usableArea.bottom})`)
        .call(xAxis);

    svg.append("g")
        .attr("class", "y-axis")
        .attr("transform", `translate(${usableArea.left}, 0)`)
        .call(yAxis);

    const sortedCommits = d3.sort(filteredCommits, (d) => -d.totalLines);

    const dots = svg.append("g").attr("class", "dots");

    dots.selectAll("circle")
        .data(sortedCommits)
        .join("circle")
        .attr("cx", (d) => xScale(d.datetime))
        .attr("cy", (d) => yScale(d.hourFrac))
        .attr("r", (d) => rScale(d.totalLines))
        .style("fill-opacity", 0.7)
        .attr("fill", "steelblue")
        .on("mouseenter", function (event, commit) {
            d3.select(event.currentTarget).classed("selected", true);
            d3.select(event.currentTarget).style("fill-opacity", 1);
            updateTooltipContent(commit);
            updateTooltipVisibility(true);
            updateTooltipPosition(event);
        })
        .on("mouseleave", function () {
            d3.select(event.currentTarget).classed("selected", false);
            d3.select(event.currentTarget).style("fill-opacity", 0.7);
            updateTooltipContent({});
            updateTooltipVisibility(false);
        });

    brushSelector();
}


function updateTooltipContent(commit) {
    const link = document.getElementById('commit-link');
    const date = document.getElementById('commit-date');
    const time = document.getElementById('commit-time');
    const author = document.getElementById('commit-author');
    const lines = document.getElementById('commit-lines');

    if (!commit || Object.keys(commit).length === 0) return;

    link.href = commit.url;
    link.textContent = commit.id;
    date.textContent = commit.datetime?.toLocaleString('en', { dateStyle: 'full' });
    time.textContent = commit.datetime?.toLocaleTimeString('en', { timeStyle: 'short' });
    author.textContent = commit.author || "Unknown";
    lines.textContent = commit.totalLines !== undefined ? commit.totalLines : "N/A";
}

function updateTooltipVisibility(isVisible) {
    document.getElementById('commit-tooltip').hidden = !isVisible;
}

function updateTooltipPosition(event) {
    const tooltip = document.getElementById('commit-tooltip');
    tooltip.style.left = `${event.clientX}px`;
    tooltip.style.top = `${event.clientY}px`;
}

function brushSelector() {
    const svg = d3.select('#chart svg');
    svg.call(d3.brush().on('start brush end', brushed));

    // Raise dots again after brush
    svg.selectAll('.dots, .overlay ~ *').raise();
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
    updateSelection();
  }

function updateSelection() {
    d3.selectAll('circle').classed('selected', (d) => isCommitSelected(d));
    updateSelectionCount();
    updateLanguageBreakdown();
}

function isCommitSelected(commit) {
    return selectedCommits.includes(commit);
}

function updateSelectionCount() {
    // const selectedCommits = brushSelection ? commits.filter(isCommitSelected) : [];
    document.getElementById('selection-count').textContent = `${selectedCommits.length || 'No'} commits selected`;
}

function updateLanguageBreakdown() {
    // const selectedCommits = brushSelection ? commits.filter(isCommitSelected) : [];
    const container = document.getElementById('language-breakdown');

    if (selectedCommits.length === 0) {
        container.innerHTML = '';
        return;
    }

    const lines = selectedCommits.flatMap((d) => d.lines);
    const breakdown = d3.rollup(lines, (v) => v.length, (d) => d.type);
    container.innerHTML = '';

    for (const [language, count] of breakdown) {
        const proportion = count / lines.length;
        container.innerHTML += `<dt>${language}</dt><dd>${count} lines (${d3.format('.1~%')(proportion)})</dd>`;
    }
}
function updateSelectedTime() {
    const selectedTime = d3.select('#selectedTime');
    selectedTime.text(commitMaxTime.toLocaleString('en', { dateStyle: "long", timeStyle: "short" }));
}


document.addEventListener('DOMContentLoaded', () => {
    const timeSlider = document.getElementById('time-slider');

    timeSlider.addEventListener('input', function () {
        commitProgress = Number(this.value);
        commitMaxTime = timeScale.invert(commitProgress);
        updateSelectedTime();
    });
});

document.addEventListener('DOMContentLoaded', async () => {
    await loadData();
    document.getElementById("time-slider").addEventListener("input", updateTimeDisplay);

});
