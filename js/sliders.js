function createSliderTable() {
    window.sliderTable = d3.select("body").append("table");
    var sliderThead = sliderTable.append("thead");
    window.sliderTbody = sliderTable.append("tbody");

    // Create headers with categorical mapping buttons
    var sliderHeaders = sliderThead.append("tr")
        .selectAll("th")
        .data(tableList[0].keys)
        .enter()
        .append("th")
        .attr("class", "sliderHeader")
        .text(d => d)
        .each(function(d) {
            if (isNaN(tableList[0].data[0][d])) {
                var categories = [...new Set(tableList.map(table => 
                    table.data.map(row => row[d])).flat())];

                if (!categoricalMappings[d]) {
                    categoricalMappings[d] = {};
                }
                categories.forEach(cat => categoricalMappings[d][cat] = 0);

                d3.select(this).append("button")
                    .text("Map Score")
                    .on("click", () => createMappingTable(d, tableList));
            }
        });

    // Add checkboxes
    sliderHeaders.append("input")
        .attr("type", "checkbox")
        .attr("id", d => "checkbox" + d)
        .attr("name", d => d)
        .property("checked", false)
        .on("change", function(d) {
            includedColumns[d] = this.checked;
            updateColumnState(tableList);
            tableList.forEach(updateHistogram);
        });

    // Add priority sliders
    createPrioritySliders();

    // Add ideal value sliders
    createIdealValueSliders();

    // Add header labels
    sliderThead.select("tr").insert("th", ":first-child").text("-");
    sliderTbody.select("tr:nth-child(1)").insert("td", ":first-child").text("Priority");
    sliderTbody.select("tr:nth-child(2)").insert("td", ":first-child").text("Ideal value");
}

function createPrioritySliders() {
    var priorityRow = sliderTbody.append("tr");
    priorityRow.selectAll("td")
        .data(d3.keys(tableList[0].data[0]))
        .enter()
        .append("td")
        .each(function(d) {
            priorities[d] = 50;  // Initial priority value
            includedColumns[d] = false;

            let updateScheduled = false;
            d3.select(this).append("input")
                .attr("type", "range")
                .attr("id", "prioritySlider" + d)
                .attr("min", 0)
                .attr("max", 100)
                .attr("value", priorities[d])
                .on("input", function() {
                    const newValue = parseFloat(this.value);
                    this.nextSibling.textContent = restrictedMode ? 
                        Math.floor(newValue) : 
                        newValue.toFixed(2);
                    
                    priorities[d] = newValue;

                    if (!updateScheduled) {
                        updateScheduled = true;
                        requestAnimationFrame(() => {
                            updateScheduled = false;
                            if (activateTOffPriorityMode) {
                                updateTOffPriorities(d);
                                updateSliderTable();
                            }
                            updateAllTables();
                        });
                    }
                });

            d3.select(this).append("span")
                .text(restrictedMode ? Math.floor(priorities[d]) : priorities[d].toFixed(2));
        });
}

function createIdealValueSliders() {
    var idealValueRow = sliderTbody.append("tr");
    idealValueRow.selectAll("td")
        .data(d3.keys(tableList[0].data[0]))
        .enter()
        .append("td")
        .each(function(d) {
            var minVal = globalMin[d];
            var maxVal = globalMax[d];

            if (minVal !== undefined && maxVal !== undefined) {
                idealValues[d] = minVal;

                let updateScheduled = false;
                d3.select(this).append("input")
                    .attr("type", "range")
                    .attr("id", "IdealSlider" + d)
                    .attr("min", minVal)
                    .attr("max", maxVal)
                    .attr("value", idealValues[d])
                    .on("input", function() {
                        this.nextSibling.textContent = this.value;
                        idealValues[d] = parseFloat(this.value);

                        if (!updateScheduled) {
                            updateScheduled = true;
                            requestAnimationFrame(() => {
                                updateScheduled = false;
                                updateAllTables();
                            });
                        }
                    });

                d3.select(this).append("span")
                    .text(restrictedMode ? Math.floor(idealValues[d]) : idealValues[d].toFixed(2));
            }
        });
}

function updateTOffPriorities(changedColumn) {
    if (!activateTOffPriorityMode || !includedColumns[changedColumn]) return;

    // Get sum of all priorities except the changed one
    const otherColumns = Object.keys(includedColumns)
        .filter(col => includedColumns[col] && col !== changedColumn);
    
    const changedValue = priorities[changedColumn];
    const remainingTotal = 100 - changedValue;
    
    // Calculate sum of other priorities for normalization
    const otherSum = otherColumns.reduce((sum, col) => sum + priorities[col], 0);

    // Adjust other priorities proportionally
    if (otherSum > 0) {  // Only adjust if there are other active priorities
        otherColumns.forEach(col => {
            priorities[col] = (priorities[col] / otherSum) * remainingTotal;
        });
    } else if (otherColumns.length > 0) {  // If other columns exist but sum is 0
        const equalShare = remainingTotal / otherColumns.length;
        otherColumns.forEach(col => {
            priorities[col] = equalShare;
        });
    }
}

function updateAllTables() {
    resetScoreMinMax();
    tableList.forEach(table => {
        updateScores(table);
        updateColors(table);
        updateHistogram(table);
    });
}

function updateSliderTable() {
    // Update checkboxes
    for (const column in includedColumns) {
        d3.select(`#checkbox${column}`).property("checked", includedColumns[column]);
    }

    // Update priority sliders
    for (const column in priorities) {
        const slider = d3.select(`#prioritySlider${column}`);
        if (!slider.empty()) {
            slider.property("value", priorities[column]);
            slider.node().nextSibling.textContent = restrictedMode ? 
                Math.floor(priorities[column]) : 
                priorities[column].toFixed(2);
        }
    }

    // Update ideal value sliders
    for (const column in idealValues) {
        const slider = d3.select(`#IdealSlider${column}`);
        if (!slider.empty()) {
            slider.property("value", idealValues[column]);
            slider.node().nextSibling.textContent = restrictedMode ? 
                Math.floor(idealValues[column]) : 
                idealValues[column].toFixed(2);
        }
    }
}

function updateColumnState(tableList) {
    sliderTbody.selectAll("tr").selectAll("td").each(function(d) {
        if (d === this.name) {
            d3.select(this).selectAll("input")
                .classed("disabled", !includedColumns[this.name]);
        }
    });

    resetScoreMinMax();
    for (let i = 0; i < tableList.length; i++) {
        updateScores(tableList[i]);
        updateColors(tableList[i]);
        updateHistogram(tableList[i]);
    }
} 