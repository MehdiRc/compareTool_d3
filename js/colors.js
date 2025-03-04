const colorScale = d3.scaleLinear()
    .domain([0, 1])
    .range(["red", "green"]);

function updateColors(table) {
    // Update progress bar colors
    table.cells.selectAll('.progress-bar')
        .style("background-color", function(d) {
            if (!activateColors && !activateBars) return null;
            if (!activateColors && activateBars) return "Silver";

            return calculateColor(d, table);
        });

    // Update progress bar widths
    if (activateBars) {
        updateBars(table);
    } else {
        table.cells.selectAll('.progress-bar').style("width", "100%");
    }

    // Update cell opacity
    updateOpacity(table);

    // Update score colors
    updateScoreColors(table);

    // Update mean row colors
    updateMeanColors(table);

    // Update histogram colors
    if (activateHistograms) {
        updateHistogramColors(table);
    }
}

function calculateColor(d, table) {
    if (isNaN(parseFloat(d.value)) && includedColumns[d.column]) {
        return calculateCategoricalColor(d);
    }
    return calculateNumericalColor(d);
}

function calculateCategoricalColor(d) {
    if (!categoricalMappings[d.column] || categoricalMappings[d.column][d.value] === undefined) {
        return null;
    }

    const mappedValue = categoricalMappings[d.column][d.value];
    const distance = Math.abs(mappedValue - 100);
    const maxDistance = 200;

    switch (colorMetric) {
        case "Distance":
            return colorScale(1 - distance / maxDistance);
        case "Priority":
            return colorScale(priorities[d.column]/100);
        case "DistanceXPriority":
            return colorScale(1 - ((distance/maxDistance)*priorities[d.column])/100);
        default:
            return null;
    }
}

function calculateNumericalColor(d) {
    if (!includedColumns[d.column] || d.column === "Score") {
        return null;
    }

    const value = parseFloat(d.value);
    if (isNaN(value)) return null;

    const distance = Math.abs(value - idealValues[d.column]);
    const maxDistance = Math.max(
        Math.abs(globalMax[d.column] - idealValues[d.column]),
        Math.abs(globalMin[d.column] - idealValues[d.column])
    );

    switch (colorMetric) {
        case "Distance":
            return colorScale(maxDistance !== 0 ? 1 - distance / maxDistance : 0);
        case "Priority":
            return colorScale(priorities[d.column]/100);
        case "DistanceXPriority":
            return colorScale(maxDistance !== 0 ? 
                1 - ((distance/maxDistance)*priorities[d.column])/100 : 0);
        default:
            return null;
    }
}

function updateHistogramColors(table) {
    if (!activateHistograms || !table.histogramRow) return;

    // Get all histogram cells for this table's thead
    const histCells = d3.select(`#dataTable${table.index}`)
        .select("thead")
        .selectAll(`[id^='hist']`);

    // Update each histogram
    table.keys.concat(["Score"]).forEach((columnName, i) => {
        const cell = d3.select(`#hist${i}`);
        if (cell.empty()) return;

        const bars = cell.selectAll('rect.data');

        const colorScale = d => {
            if (!activateColors) return "steelblue";
            
            const midpoint = (d.x0 + d.x1) / 2;
            if (columnName === "Score") {
                const distance = Math.abs(midpoint - 1);
                const t = distance;
                return t < 0.5 ? 
                    d3.interpolate('green', 'white')(t * 2) : 
                    d3.interpolate('white', 'red')((t - 0.5) * 2);
            } else {
                const distance = Math.abs(midpoint - idealValues[columnName]);
                const maxDistance = Math.abs(globalMax[columnName] - globalMin[columnName]);
                const scaledDistance = maxDistance !== 0 ? distance / maxDistance : 1;
                return scaledDistance <= 0.5 ?
                    d3.interpolate('green', 'white')(scaledDistance * 2) :
                    d3.interpolate('white', 'red')((scaledDistance - 0.5) * 2);
            }
        };

        bars.style("fill", colorScale);

        // Update cursor visibility
        if (columnName !== "Score") {
            const cursor = cell.selectAll('.ideal-cursor, .ideal-cursor-arrow');
            cursor.style("opacity", activateColors ? 1 : 0.3);
        }
    });
}

function updateBars(table) {
    table.cells.selectAll('.progress-bar').style("width", function(d) {
        if (!includedColumns[d.column]) return "0%";
        if (d.column === "Score") return "100%";

        let result;
        if (isNaN(parseFloat(d.value))) {
            // Categorical bars
            const idealValue = 100;
            const distance = Math.abs(categoricalMappings[d.column][d.value] - idealValue);
            const maxDistance = 200;

            switch (barsMetric) {
                case "Distance":
                    result = maxDistance !== 0 ? (1 - distance / maxDistance)*100 : 0;
                    break;
                case "Priority":
                    result = priorities[d.column];
                    break;
                case "DistanceXPriority":
                    result = maxDistance !== 0 ? 
                        (((1-distance/maxDistance)*priorities[d.column])/100) * 100 : 100;
                    break;
                default:
                    result = 0;
            }
        } else {
            // Numerical bars
            const value = parseFloat(d.value);
            const distance = Math.abs(value - idealValues[d.column]);
            const maxDistance = Math.max(
                Math.abs(globalMax[d.column] - idealValues[d.column]),
                Math.abs(globalMin[d.column] - idealValues[d.column])
            );

            switch (barsMetric) {
                case "Distance":
                    result = maxDistance !== 0 ? (1 - distance / maxDistance)*100 : 0;
                    break;
                case "Priority":
                    result = priorities[d.column];
                    break;
                case "DistanceXPriority":
                    result = maxDistance !== 0 ? 
                        (((1-distance/maxDistance)*priorities[d.column])/100) * 100 : 100;
                    break;
                default:
                    result = 0;
            }
        }
        return result + "%";
    });
}

function updateOpacity(table) {
    if (!activateOpacity) {
        table.rows.selectAll("td").style("opacity", 1);
        return;
    }

    table.rows.selectAll("td").style("opacity", function(d) {
        if (d.column === "Score") return 1;
        if (!includedColumns[d.column]) return 0.20;

        let distance, maxDistance;
        if (isNaN(parseFloat(d.value))) {
            // Categorical opacity
            const idealValue = 100;
            distance = Math.abs(categoricalMappings[d.column][d.value] - idealValue);
            maxDistance = 200;
        } else {
            // Numerical opacity
            const value = parseFloat(d.value);
            distance = Math.abs(value - idealValues[d.column]);
            maxDistance = Math.max(
                Math.abs(globalMax[d.column] - idealValues[d.column]),
                Math.abs(globalMin[d.column] - idealValues[d.column])
            );
        }

        let result;
        switch (opacityMetric) {
            case "Distance":
                result = maxDistance !== 0 ? 0.75 * (1 - distance / maxDistance) + 0.25 : 0.25;
                break;
            case "Priority":
                result = 0.75 * (priorities[d.column] / 100) + 0.25;
                break;
            case "DistanceXPriority":
                result = maxDistance !== 0 ? 
                    0.75 * (1 - ((distance/maxDistance)*priorities[d.column])/100) + 0.25 : 0.25;
                break;
            default:
                result = 0.25;
        }
        return result;
    });
}

function updateScoreColors(table) {
    if (!activateColors) {
        table.rows.selectAll("td").filter(":last-child").style("background-color", null);
        return;
    }

    table.rows.selectAll("td").filter(":last-child")
        .style("background-color", d => colorScale(parseFloat(d.value)));
}

function updateMeanColors(table) {
    if (!activateColors) {
        table.dataTbody.selectAll("tr.mean-row").selectAll("td")
            .style("background-color", null);
        return;
    }

    table.dataTbody.selectAll("tr.mean-row").selectAll("td")
        .style("background-color", function(d, i) {
            const column = table.keys.concat(["Score"])[i];
            if (column === "Score" && !isNaN(parseFloat(d))) {
                return colorScale(parseFloat(d));
            } else if (includedColumns[column] && !isNaN(parseFloat(d))) {
                const distance = Math.abs(parseFloat(d) - idealValues[column]);
                const maxDistance = Math.max(
                    Math.abs(globalMax[column] - idealValues[column]),
                    Math.abs(globalMin[column] - idealValues[column])
                );
                return maxDistance !== 0 ? 
                    colorScale(1 - distance / maxDistance) : 
                    colorScale(0);
            }
            return null;
        });
}

// ... Additional helper functions for numerical colors, bars, opacity, etc. 