let data = [];
let commits = [];

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
    // Process commits first
    processCommits();

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



document.addEventListener('DOMContentLoaded', async () => {
    await loadData();
});
