function createDataTable(table) {
    // Calculate minimum table width based on columns
    const columnCount = table.keys.length + 1; // +1 for Score column
    const minColumnWidth = 120; // Minimum width per column in pixels
    const initialWidth = Math.max(800, columnCount * minColumnWidth);
    
    // Create main container with initial dimensions
    table.mydiv = d3.select("body")
        .append("div")
        .attr("id", "mydiv" + table.index)
        .style("position", "absolute")
        .style("z-index", "9")
        .style("background-color", "#f1f1f1")
        .style("border", "1px solid #d3d3d3")
        .style("text-align", "center")
        .style("top", table.position["top"] || "50px")
        .style("left", table.position["left"] || "50px")
        .style("width", initialWidth + "px")  // Initial width based on columns
        .style("height", "400px"); // Initial height

    // Create the table structure
    createTableHeader(table);
    createTableBody(table);
    
    // Set up drag and resize
    table.resizeMode = 'both'; // Default resize mode
    setupDragAndResize(table);
    
    // Apply initial resize to ensure correct dimensions
    window.updateResize(table);
    
    // Create initial histograms if enabled
    if (activateHistograms) {
        createHistograms(table);
    }
    
    // Update table data
    updateScores(table);
    updateColors(table);
    calculateColumnMeans(table);
}

function createTableHeader(table) {
    // Create header
    table.mydivheader = table.mydiv.append("div")
        .attr("id", "mydivheader" + table.index)
        .style("cursor", "move")
        .style("background-color", "#2196F3")
        .style("color", "#fff")
        .text(table.name);

    // Add control buttons
    addHeaderButtons(table);
}

function addHeaderButtons(table) {
    // Minimize button
    table.mydivheader.append("button")
        .text("🗕")
        .attr("id", "hide-table" + table.index)
        .on("click", function() {
            // Set to hide mode (only header visible)
            table.resizeMode = 'hide';
            window.updateResize(table);
        });

    // Free resize button
    table.mydivheader.append("button")
        .text("⇲")
        .attr("id", "resize-free" + table.index)
        .on("click", function() {
            // Set to free resize mode
            table.resizeMode = 'free';
            window.updateResize(table);
        });

    // Both dimensions resize button
    table.mydivheader.append("button")
        .text("⛶")
        .attr("id", "resize-both" + table.index)
        .classed("active", true) // Default active
        .on("click", function() {
            // Set to both dimensions mode
            table.resizeMode = 'both';
            window.updateResize(table);
        });

    // Pin button
    table.mydivheader.append("button")
        .text(table.pin ? "📍" : "📌")
        .style("float", "right")
        .attr("id", "pin-table" + table.index)
        .on("click", () => toggleTablePin(table));
}

function createTableBody(table) {
    // Create scrollable container
    table.scrolldiv = table.mydiv.append("div")
        .attr("id", "dataTableScroll" + table.index)
        .style("overflow", "auto")
        .style("height", "100%")
        .style("width", "100%");

    // Calculate the number of columns and minimum table width
    const columnCount = table.keys.length + 1; // +1 for Score column
    const minColumnWidth = 120; // Minimum width per column in pixels
    const totalMinWidth = columnCount * minColumnWidth;

    // Create table with proper column widths
    table.dataTable = table.scrolldiv.append("table")
        .attr("id", "dataTable" + table.index)
        .attr('class', "mapping-table")
        .style('grid-template-columns', function() {
            return `repeat(${columnCount}, minmax(${minColumnWidth}px, 1fr))`;
        })
        .style('min-width', totalMinWidth + 'px'); // Set table min-width

    // Create table head
    table.dataThead = table.dataTable.append("thead");

    // Create header row
    const headerRow = table.dataThead.append("tr");
    
    // Use table.keys and add Score
    const databind = table.keys.concat(["Score"]);

    table.headers = headerRow
        .selectAll("th")
        .data(databind)
        .enter()
        .append("th")
        .text(d => d)
        .style("min-width", minColumnWidth + "px") // Set minimum width for headers
        .on("click", function(d) {
            if (!d3.event.defaultPrevented) {
                sortTable(d, this, table);
            }
            d3.event.preventDefault();
        });

    table.headers.attr("class", "headers" + table.index);

    // Set container property for histograms
    table.container = table.dataThead;

    // Create tbody and add data rows
    table.dataTbody = table.dataTable.append("tbody");
    createTableRows(table);
}

function setupDragAndResize(table) {
    // Set up drag functionality - explicitly use window.dragElement
    window.dragElement(table.mydiv.node(), "mydivheader" + table.index, table);
    
    // Set up resize functionality using our new function - explicitly use window.setupResize
    window.setupResize(table);
}

function toggleTablePin(table) {
    table.pin = !table.pin;
    
    // Update button text
    d3.select("#pin-table" + table.index)
        .text(table.pin ? "📍" : "📌");
    
    if (table.pin) {
        // Disable dragging and resizing
        table.mydivheader.style("background-color", "#808080");
        table.mydivheader.style("cursor", "default");
        window.disableDragElement(table.mydiv.node(), "mydivheader" + table.index);
        window.disableResize(table);
    } else {
        // Re-enable dragging and resizing
        table.mydivheader.style("background-color", "#2196F3");
        table.mydivheader.style("cursor", "move");
        window.dragElement(table.mydiv.node(), "mydivheader" + table.index, table);
        window.enableResize(table);
    }
}

function enableResize(table) {
    table.resizer
        .style('cursor', 'se-resize')
        .on('mousedown', function() {
            d3.event.preventDefault();
            startX = d3.event.clientX;
            startY = d3.event.clientY;
            startWidth = parseInt(table.mydiv.style('width'), 10);
            startHeight = parseInt(table.mydiv.style('height'), 10);

            resizeFunction = function(e) { doResize(e, table); };
            document.documentElement.addEventListener('mousemove', resizeFunction, false);
            document.documentElement.addEventListener('mouseup', stopResize, false);
        });
}

function disableResize(table) {
    table.resizer
        .on('mousedown', null)
        .style('cursor', 'default');
}

function createTableRows(table) {
    table.rows = table.dataTbody.selectAll("tr")
        .data(table.data)
        .enter()
        .append("tr")
        .attr("class", "rows" + table.index);

    // Create cells with proper data binding
    table.cells = table.rows.selectAll("td")
        .data(function(row) {
            // Map keys to column-value pairs
            const pairs = table.keys.map(column => ({
                column: column,
                value: row[column]
            }));
            
            // Add Score column if not already present
            if (!table.keys.includes("Score")) {
                pairs.push({
                    column: "Score",
                    value: row.Score || 0
                });
            }
            
            return pairs;
        })
        .enter()
        .append("td")
        .attr("class", "table-cell cells" + table.index);

    // Add cell label and progress bar
    table.cells.append("div")
        .attr("class", "cell-label")
        .text(d => d.value);
    
    table.cells.append("div")
        .attr("class", "progress-bar");
}

function calculateColumnMeans(table) {
    table.columnMeans = {};

    // Calculate means for each column
    table.keys.forEach(function(column) {
        let sum = 0;
        let count = 0;
        table.data.forEach(function(row) {
            const value = row[column];
            if (includedColumns[column]) {
                if (!isNaN(parseFloat(value)) && isFinite(value)) {
                    sum += parseFloat(value);
                    count++;
                } else if (categoricalMappings[column]?.[value] !== undefined) {
                    sum += categoricalMappings[column][value];
                    count++;
                }
            }
        });
        table.columnMeans[column] = count > 0 ? (sum / count).toFixed(2) : "N/A";
    });

    // Calculate Score mean
    if (table.data[0].Score !== undefined) {
        const scoreSum = table.data.reduce((sum, row) => sum + parseFloat(row.Score), 0);
        table.columnMeans["Score"] = (scoreSum / table.data.length).toFixed(2);
    }

    // Remove existing mean row
    table.dataTbody.selectAll("tr.mean-row").remove();

    // Add new mean row
    const meanRow = table.dataTbody.append("tr")
        .classed("mean-row", true);
    
    meanRow.selectAll("td")
        .data(d3.values(table.columnMeans))
        .enter()
        .append("td")
        .text(d => d);

    meanRow.selectAll("td").filter(":last-child")
        .classed("score", true);

    updateColors(table);
}

function updateAllTables() {
    resetScoreMinMax();
    tableList.forEach(table => {
        updateScores(table);
        updateColors(table);
        updateHistogram(table);
    });
}

// Additional helper functions... 