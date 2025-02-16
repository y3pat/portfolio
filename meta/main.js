let data = [];
let commits = [];
const width = 1000;
const height = 600;
let xScale, yScale;

async function loadData() {
    data = await d3.csv('loc.csv', (row) => ({
        ...row,
        line: Number(row.line), // Convert to number
        depth: Number(row.depth),
        length: Number(row.length),
        date: new Date(row.date + 'T00:00' + row.timezone),
        datetime: new Date(row.datetime),
    }));
    processCommits();
    displayStats();
    createScatterplot();
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
      

    // Create the <dl> element
    const dl = d3.select('#stats').append('dl').attr('class', 'stats');

    // Add total LOC
    dl.append('dt').html('Total <abbr title="Lines of code">LOC</abbr>');
    dl.append('dd').text(data.length);

    // Add total commits
    dl.append('dt').text('Total commits');
    dl.append('dd').text(commits.length);

    // Add total number of files
    let totalFiles = d3.groups(data, (d) => d.file).length;
    dl.append('dt').text('Total files');
    dl.append('dd').text(totalFiles);

    // Add maximum file length
    let maxFileLength = d3.max(data, (d) => d.line);
    dl.append('dt').text('Longest file (LOC)');
    dl.append('dd').text(maxFileLength);

    // Add average file length
    let avgFileLength = d3.mean(data, (d) => d.line).toFixed(2);
    dl.append('dt').text('Average file length (LOC)');
    dl.append('dd').text(avgFileLength);
}


function createScatterplot() {
    const margin = { top: 10, right: 10, bottom: 30, left: 20 };

    const usableArea = {
        top: margin.top,
        right: width - margin.right,
        bottom: height - margin.bottom,
        left: margin.left,
        width: width - margin.left - margin.right,
        height: height - margin.top - margin.bottom,
    };

    const svg = d3
        .select('#chart')
        .append('svg')
        .attr('viewBox', `0 0 ${width} ${height}`)
        .style('overflow', 'visible');

    // Define Scales
    const xScale = d3
        .scaleTime()
        .domain(d3.extent(commits, (d) => d.datetime))
        .range([usableArea.left, usableArea.right])
        .nice();

    const yScale = d3
        .scaleLinear()
        .domain([0, 24])
        .range([usableArea.bottom, usableArea.top]);

    // Calculate min/max lines edited
    const [minLines, maxLines] = d3.extent(commits, (d) => d.totalLines);

    // Define Radius Scale (Fixed Area Perception)
    console.log("Min Lines Edited:", minLines, "Max Lines Edited:", maxLines);

    const rScale = d3.scaleLog().domain([minLines, maxLines]).range([2, 15]);

    // Add Gridlines
    const gridlines = svg
      .append('g')
      .attr('class', 'gridlines')
      .attr('transform', `translate(${usableArea.left}, 0)`);

    gridlines.call(d3.axisLeft(yScale).tickFormat('').tickSize(-usableArea.width));

    // Add Axes
    const xAxis = d3.axisBottom(xScale);
    const yAxis = d3.axisLeft(yScale).tickFormat((d) => String(d % 24).padStart(2, '0') + ':00');

    svg.append('g')
        .attr('transform', `translate(0, ${usableArea.bottom})`)
        .call(xAxis);

    svg.append('g')
        .attr('transform', `translate(${usableArea.left}, 0)`)
        .call(yAxis);

    // Sort commits so larger dots render first
    const sortedCommits = d3.sort(commits, (d) => -d.totalLines);

    // Draw Dots
    const dots = svg.append('g').attr('class', 'dots');

    dots
        .selectAll('circle')
        .data(sortedCommits) // Sorted for better interaction
        .join('circle')
        .attr('cx', (d) => xScale(d.datetime))
        .attr('cy', (d) => yScale(d.hourFrac))
        .attr('r', (d) => rScale(d.totalLines)) // Use rScale for size
        .style('fill-opacity', 0.7) // Transparency for overlapping dots
        .attr('fill', 'steelblue')
        .on('mouseenter', function (event, commit) {
            d3.select(event.currentTarget).style('fill-opacity', 1); // Highlight on hover
            updateTooltipContent(commit);
            updateTooltipVisibility(true);
            updateTooltipPosition(event);
        })
        .on('mouseleave', function () {
            d3.select(event.currentTarget).style('fill-opacity', 0.7); // Restore transparency
            updateTooltipContent({});
            updateTooltipVisibility(false);
        });
}


function updateTooltipContent(commit) {
    const link = document.getElementById('commit-link');
    const date = document.getElementById('commit-date');
    const time = document.getElementById('commit-time');
    const author = document.getElementById('commit-author');
    const lines = document.getElementById('commit-lines'); // Get lines edited element

    if (!commit || Object.keys(commit).length === 0) return;

    link.href = commit.url;
    link.textContent = commit.id;
    date.textContent = commit.datetime?.toLocaleString('en', { dateStyle: 'full' });
    time.textContent = commit.datetime?.toLocaleTimeString('en', { timeStyle: 'short' });
    author.textContent = commit.author || "Unknown";
    lines.textContent = commit.totalLines !== undefined ? commit.totalLines : "N/A"; // Fix this
}

function updateTooltipVisibility(isVisible) {
    const tooltip = document.getElementById('commit-tooltip');
    tooltip.hidden = !isVisible;
}

function updateTooltipPosition(event) {
    const tooltip = document.getElementById('commit-tooltip');
    tooltip.style.left = `${event.clientX}px`;
    tooltip.style.top = `${event.clientY}px`;
}



document.addEventListener('DOMContentLoaded', async () => {
    await loadData();
});

