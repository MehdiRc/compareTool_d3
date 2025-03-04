function sortTable(column, header, table) {
    table.headers.text(function(d) { return d; });
    if (table.sortColumn !== column) table.sortOrder = 0;
    table.sortColumn = column;

    if (table.sortOrder === 0) {
        // Descending sort
        table.rows.sort(function(a, b) {
            if (!isNaN(a[column]) && !isNaN(b[column])) {
                return d3.descending(parseFloat(a[column]), parseFloat(b[column]));
            }
            return d3.descending(a[column], b[column]);
        });
        header.textContent += ' ▼';
        table.sortOrder++;
    } else if (table.sortOrder === 1) {
        // Ascending sort
        table.rows.sort(function(a, b) {
            if (!isNaN(a[column]) && !isNaN(b[column])) {
                return d3.ascending(parseFloat(a[column]), parseFloat(b[column]));
            }
            return d3.ascending(a[column], b[column]);
        });
        header.textContent += ' ▲';
        table.sortOrder++;
    } else {
        // Original order
        table.rows.sort(function(a, b) {
            return d3.ascending(table.data.indexOf(a), table.data.indexOf(b));
        });
        table.sortOrder = 0;
    }
}

function updateSort(table) {
    table.headers.text(function(d) { return d; });
    if (!table.sortColumn) return;

    const header = d3.selectAll(".headers" + table.index)
        .filter(function(d) { return d === table.sortColumn; })
        .node();

    if (table.sortOrder === 1) {
        table.rows.sort((a, b) => d3.descending(a[table.sortColumn], b[table.sortColumn]));
        header.textContent += ' ▼';
    } else if (table.sortOrder === 2) {
        table.rows.sort((a, b) => d3.ascending(a[table.sortColumn], b[table.sortColumn]));
        header.textContent += ' ▲';
    } else {
        table.rows.sort((a, b) => d3.ascending(table.data.indexOf(a), table.data.indexOf(b)));
    }
}

function sortScore(table) {
    if (table.sortOrder === 1) {
        table.rows.sort((a, b) => d3.descending(a["Score"], b["Score"]));
    } else if (table.sortOrder === 2) {
        table.rows.sort((a, b) => d3.ascending(a["Score"], b["Score"]));
    } else {
        table.rows.data(table.originalData).order();
        table.rows.sort((a, b) => d3.ascending(table.data.indexOf(a), table.data.indexOf(b)));
    }
} 