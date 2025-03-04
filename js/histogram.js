function createHistograms(table) {
    if (!activateHistograms || !table.container) return;

    // Create histogram row and store reference
    table.histogramRow = table.container.append("tr")
        .attr("id", "histogramRow" + table.index)
        .style("height", "55px"); // Increased from 45px to 55px

    // Create cells for each column
    table.keys.forEach((key, i) => {
        const cell = table.histogramRow.append("td")
            .style("padding", "1px 2px")
            .style("position", "relative")
            .style("vertical-align", "top")
            .style("border", "1px solid #ddd");
        createHistogramForColumn(key, table, cell, i);
    });

    // Add histogram for Score column
    const scoreCell = table.histogramRow.append("td")
        .style("padding", "1px 2px")
        .style("position", "relative")
        .style("vertical-align", "top")
        .style("border", "1px solid #ddd");
    createHistogramForColumn("Score", table, scoreCell, table.keys.length);
}

function createHistogramForColumn(column, table, cell, index) {
    // Handle both numeric and categorical data
    let values;
    if (column === "Score") {
        values = table.data.map(d => parseFloat(d[column])).filter(d => !isNaN(d));
    } else {
        values = table.data.map(d => {
            const val = d[column];
            if (!isNaN(parseFloat(val))) {
                return parseFloat(val);
            } else if (categoricalMappings[column]?.[val] !== undefined) {
                return categoricalMappings[column][val];
            }
            return NaN;
        }).filter(d => !isNaN(d));
    }

    if (values.length === 0) return;

    // Calculate total number of elements across all tables for this column
    const totalElements = tableList.reduce((sum, currentTable) => {
        const tableValues = currentTable.data.map(d => {
            const val = d[column];
            if (column === "Score") {
                return parseFloat(val);
            }
            if (!isNaN(parseFloat(val))) {
                return parseFloat(val);
            } else if (categoricalMappings[column]?.[val] !== undefined) {
                return categoricalMappings[column][val];
            }
            return NaN;
        }).filter(d => !isNaN(d));
        return sum + tableValues.length;
    }, 0);

    // Use column-specific min/max values and thresholds
    const minVal = column === "Score" ? 0 : globalMin[column];
    const maxVal = column === "Score" ? 1 : globalMax[column];
    
    // Special handling for Score column: always 10 bins
    const thresholds = column === "Score" ? 
        Array.from({length: 9}, (_, i) => (i + 1) * 0.1) : // 9 thresholds for 10 bins
        getBinThresholds(values, minVal, maxVal);

    // Create histogram bins with fixed domain
    const bins = d3.histogram()
        .domain([minVal, maxVal])
        .thresholds(thresholds)(values);

    // Rest of the visualization setup
    const margin = {top: 12, right: 2, bottom: 15, left: 2};
    const cellWidth = cell.node().getBoundingClientRect().width;
    const cellHeight = 53;
    const width = cellWidth - margin.left - margin.right;
    const height = cellHeight - margin.top - margin.bottom;

    // Create SVG container
    const svg = cell.append("svg")
        .attr("id", "hist" + index)
        .attr("width", cellWidth)
        .attr("height", cellHeight)
        .style("display", "block")
        .style("overflow", "visible")
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Add background rect with border
    svg.append("rect")
        .attr("class", "background")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", width)
        .attr("height", height)
        .style("fill", "white")
        .style("stroke", "#eee")
        .style("stroke-width", 0.5);

    // Create scales with fixed domains
    const x = d3.scaleLinear()
        .domain([minVal, maxVal])
        .range([0, width]);

    const y = d3.scaleLinear()
        .domain([0, totalElements]) // Use total elements as max height
        .range([height, 0]);

    // Draw histogram bars
    svg.selectAll("rect.data")
        .data(bins)
        .enter()
        .append("rect")
        .attr("class", "data")
        .attr("x", d => x(d.x0))
        .attr("width", d => Math.max(0, x(d.x1) - x(d.x0) - 0.3))
        .attr("y", d => y(d.length))
        .attr("height", d => height - y(d.length))
        .style("fill", d => {
            if (!activateColors) return "steelblue";
            const midpoint = (d.x0 + d.x1) / 2;
            if (column === "Score") {
                const distance = Math.abs(midpoint - 1);
                const t = distance;
                return t < 0.5 ? 
                    d3.interpolate('green', 'white')(t * 2) : 
                    d3.interpolate('white', 'red')((t - 0.5) * 2);
            } else {
                const distance = Math.abs(midpoint - idealValues[column]);
                const maxDistance = Math.abs(globalMax[column] - globalMin[column]);
                const scaledDistance = maxDistance !== 0 ? distance / maxDistance : 1;
                return scaledDistance <= 0.5 ?
                    d3.interpolate('green', 'white')(scaledDistance * 2) :
                    d3.interpolate('white', 'red')((scaledDistance - 0.5) * 2);
            }
        })
        .style("stroke", "#222")
        .style("stroke-width", 0.2);

    // Add ideal value cursor line
    if (column !== "Score") {
        const idealX = x(idealValues[column]);
        svg.append("line")
            .attr("class", "ideal-cursor")
            .attr("x1", idealX)
            .attr("x2", idealX)
            .attr("y1", 0)
            .attr("y2", height)
            .style("stroke", "black")
            .style("stroke-width", 1)
            .style("stroke-dasharray", "2,1");

        // Add small triangle at the top
        svg.append("path")
            .attr("class", "ideal-cursor-arrow")
            .attr("d", d3.symbol().type(d3.symbolTriangle).size(12))
            .attr("transform", `translate(${idealX},${-1})`)
            .style("fill", "black");
    }

    // Adjusted axis with smaller font
    svg.append("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x)
            .ticks(3)
            .tickSize(1.5)
            .tickPadding(1))
        .style("font-size", "6px"); // Smaller font for axis

    // Even smaller text with adjusted positions
    svg.append("text")
        .attr("class", "global-min-range")
        .attr("x", 0)
        .attr("y", -2)
        .style("font-size", "6px")
        .style("dominant-baseline", "text-after-edge");

    svg.append("text")
        .attr("class", "global-max-range")
        .attr("x", width)
        .attr("y", -2)
        .style("font-size", "6px")
        .style("text-anchor", "end")
        .style("dominant-baseline", "text-after-edge");

    svg.append("text")
        .attr("class", "min-range")
        .attr("x", 0)
        .attr("y", height + 10)
        .style("font-size", "6px")
        .style("dominant-baseline", "text-before-edge");

    svg.append("text")
        .attr("class", "max-range")
        .attr("x", width)
        .attr("y", height + 10)
        .style("font-size", "6px")
        .style("text-anchor", "end")
        .style("dominant-baseline", "text-before-edge");

    // Update colors
    updateHistogramColors(table);
}

function d3thresholdSturges(values, min, max) {
    let binCount = Math.ceil(Math.log2(values.length) + 1);
    // Limit maximum number of bins
    binCount = Math.min(binCount, 50); // Limit to 50 bins maximum
    
    const step = (max - min) / binCount;
    const thresholds = [];
    for (let i = 1; i < binCount; i++) {
        thresholds.push(min + i * step);
    }
    return thresholds;
}

function d3thresholdScott(values, min, max) {
    const h = 3.5 * d3.deviation(values) * Math.pow(values.length, -1/3);
    
    // Add safeguards
    if (!h || h <= 0) return d3thresholdSturges(values, min, max);
    
    let binCount = Math.ceil((max - min) / h);
    // Limit maximum number of bins
    binCount = Math.min(binCount, 50); // Limit to 50 bins maximum
    
    const step = (max - min) / binCount;
    const thresholds = [];
    for (let i = 1; i < binCount; i++) {
        thresholds.push(min + i * step);
    }
    return thresholds;
}

function d3thresholdFreedmanDiaconis(values, min, max) {
    const iqr = d3.quantile(values, 0.75) - d3.quantile(values, 0.25);
    const h = 2 * iqr * Math.pow(values.length, -1/3);
    
    // Add safeguards
    if (!h || h <= 0) return d3thresholdSturges(values, min, max);
    
    let binCount = Math.ceil((max - min) / h);
    // Limit maximum number of bins
    binCount = Math.min(binCount, 50); // Limit to 50 bins maximum
    
    const step = (max - min) / binCount;
    const thresholds = [];
    for (let i = 1; i < binCount; i++) {
        thresholds.push(min + i * step);
    }
    return thresholds;
}

function getBinThresholds(values, min, max) {
    try {
        switch (histBinFunction) {
            case "sturges":
                return d3thresholdSturges(values, min, max);
            case "scott":
                return d3thresholdScott(values, min, max);
            case "freedmanDiaconis":
                return d3thresholdFreedmanDiaconis(values, min, max);
            default:
                return d3thresholdSturges(values, min, max);
        }
    } catch (error) {
        console.warn("Error in bin calculation, falling back to Sturges:", error);
        return d3thresholdSturges(values, min, max);
    }
}

function updateRangeText(cell, minRange, maxRange, localminRange, localmaxRange) {
    // Update global range text
    const globalMinText = cell.select('text.global-min-range')
        .text(Number.isInteger(minRange) ? minRange : minRange.toFixed(1));
    const globalMaxText = cell.select('text.global-max-range')
        .text(Number.isInteger(maxRange) ? maxRange : maxRange.toFixed(1));

    const textWidth = globalMaxText.node().getBBox().width;
    globalMaxText.attr('x', 100 - textWidth);

    // Update local range text
    const scale = d3.scaleLinear()
        .domain([minRange, maxRange])
        .range([0, 100]);

    const minText = cell.select('text.min-range')
        .text(Number.isInteger(localminRange) ? localminRange : localminRange.toFixed(1));
    const maxText = cell.select('text.max-range')
        .text(Number.isInteger(localmaxRange) ? localmaxRange : localmaxRange.toFixed(1));

    const xMin = Math.max(0, Math.min(100 - textWidth, scale(localminRange)));
    const xMax = Math.max(0, Math.min(100 - textWidth, scale(localmaxRange)));

    minText.attr('x', xMin);
    maxText.attr('x', xMax);

    // Raise text elements
    globalMinText.raise();
    globalMaxText.raise();
    minText.raise();
    maxText.raise();
}

function updateScoreRangeText(cell, minRange, maxRange, localminRange, localmaxRange) {
    // Similar to updateRangeText but with score-specific formatting
    const globalMinText = cell.select('text.global-min-range')
        .text(Number.isInteger(minRange) ? minRange : Math.floor(minRange * 10) / 10);
    const globalMaxText = cell.select('text.global-max-range')
        .text(Number.isInteger(maxRange) ? maxRange : Math.floor(maxRange * 10) / 10);

    const textWidth = globalMaxText.node().getBBox().width;
    const xMinPos = Math.max(0, Math.min(100 - textWidth, Math.floor(minRange * 100)));
    const xMaxPos = Math.max(0, Math.min(100 - textWidth, Math.floor(maxRange * 100)));

    globalMinText.attr('x', xMinPos);
    globalMaxText.attr('x', xMaxPos);

    // Update local range text for scores
    const scale = d3.scaleLinear()
        .domain([minRange, maxRange])
        .range([0, 100]);

    const minText = cell.select('text.min-range')
        .text(Number.isInteger(localminRange) ? localminRange : Math.floor(localminRange * 10) / 10);
    const maxText = cell.select('text.max-range')
        .text(Number.isInteger(localmaxRange) ? localmaxRange : Math.floor(localmaxRange * 10) / 10);

    const xMin = Math.max(0, Math.min(100 - textWidth, scale(localminRange)));
    const xMax = Math.max(0, Math.min(100 - textWidth, scale(localmaxRange)));

    minText.attr('x', xMin);
    maxText.attr('x', xMax);

    // Raise all text elements
    globalMinText.raise();
    globalMaxText.raise();
    minText.raise();
    maxText.raise();
}

function updateHistogram(table) {
    if (!activateHistograms) {
        d3.selectAll("#histogramRow" + table.index).remove();
        return;
    }

    // Remove existing histograms
    d3.selectAll("#histogramRow" + table.index).remove();
    
    // Create new histograms
    createHistograms(table);
} 