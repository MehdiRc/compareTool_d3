function toggleSettings() {
    this.classList.toggle("active");
    const content = this.nextElementSibling;
    
    if (content.style.maxHeight) {
        content.style.maxHeight = null;
        content.style.display = "none";
        this.innerText = "▼ Open Settings";
    } else {
        content.style.display = "block";
        content.style.maxHeight = content.scrollHeight + "px";
        this.innerText = "▲ Close Settings";
    }
}

function addSettingsControls(content) {
    // Create settings grid
    const settingsGrid = content.append("div")
        .attr("class", "settings-grid");

    // Visualization Controls
    const visualControls = settingsGrid.append("div")
        .attr("class", "settings-section");
    visualControls.append("h3").text("Visualization Controls");

    // Histograms
    addCheckbox(visualControls, "activateHistograms", "Activate Histograms", 
        checked => {
            activateHistograms = checked;
            if (!checked) {
                tableList.forEach(table => {
                    d3.selectAll("#histogramRow" + table.index).remove();
                });
            } else {
                tableList.forEach(createHistograms);
            }
        }, activateHistograms);

    // Colors
    addCheckbox(visualControls, "activateColors", "Activate Colors",
        checked => {
            activateColors = checked;
            // Update all tables and their histograms
            tableList.forEach(table => {
                updateColors(table);
            });
        }, activateColors);

    // Bars
    addCheckbox(visualControls, "activateBars", "Activate Bars",
        checked => {
            activateBars = checked;
            tableList.forEach(updateColors);
        }, activateBars);

    // Opacity
    addCheckbox(visualControls, "activateOpacity", "Activate Opacity",
        checked => {
            activateOpacity = checked;
            tableList.forEach(updateColors);
        }, activateOpacity);

    // Metric Controls
    const metricControls = settingsGrid.append("div")
        .attr("class", "settings-section");
    metricControls.append("h3").text("Metric Controls");

    // Color Metric
    addMetricDropdown(metricControls, "colorMetric", "Color Metric", value => {
        colorMetric = value;
        tableList.forEach(updateColors);
    }, colorMetric);

    // Bars Metric
    addMetricDropdown(metricControls, "barsMetric", "Bars Metric", value => {
        barsMetric = value;
        tableList.forEach(updateColors);
    }, barsMetric);

    // Opacity Metric
    addMetricDropdown(metricControls, "opacityMetric", "Opacity Metric", value => {
        opacityMetric = value;
        tableList.forEach(updateColors);
    }, opacityMetric);

    // Priority Controls
    const priorityControls = settingsGrid.append("div")
        .attr("class", "settings-section");
    priorityControls.append("h3").text("Priority Controls");

    // Priority
    addCheckbox(priorityControls, "activatePriority", "Activate Priority",
        checked => {
            activatePriority = checked;
            tableList.forEach(updateColors);
        }, activatePriority);

    // Priority Normalization
    addCheckbox(priorityControls, "activateTOffPriorityMode", "Activate priority normalization",
        checked => {
            activateTOffPriorityMode = checked;
        }, activateTOffPriorityMode);

    // Scores
    addCheckbox(priorityControls, "activateScores", "Activate Scores",
        checked => {
            activateScores = checked;
            resetScoreMinMax();
            tableList.forEach(table => {
                updateScores(table);
                updateHistogram(table);
            });
        }, activateScores);

    // Histogram Controls
    const histogramControls = settingsGrid.append("div")
        .attr("class", "settings-section");
    histogramControls.append("h3").text("Histogram Controls");

    // Binning Function
    addBinningDropdown(histogramControls, histBinFunction);
}

function addCheckbox(container, id, label, onChange, initialState = true) {
    const div = container.append("div")
        .style("margin", "5px 0");
    div.append("input")
        .attr("type", "checkbox")
        .attr("id", id)
        .attr("name", id)
        .property("checked", initialState)
        .on("change", function() {
            onChange(d3.select(this).property("checked"));
        });
    div.append("label")
        .attr("for", id)
        .text(label)
        .style("margin-left", "5px");
}

function addMetricDropdown(container, id, label, onChange, initialValue = "Distance") {
    const div = container.append("div")
        .style("margin", "5px 0");
    div.append("label")
        .attr("for", id)
        .text(label)
        .style("display", "block");

    const select = div.append("select")
        .attr("name", id + "Select")
        .style("width", "100%")
        .style("margin-top", "2px")
        .on("change", function() {
            onChange(this.value);
        });

    select.selectAll("option")
        .data(["Distance", "Priority", "DistanceXPriority"])
        .enter()
        .append("option")
        .attr("value", d => d)
        .text(d => d === "Distance" ? "Distance from ideal" : d)
        .property("selected", d => d === initialValue);
}

function addBinningDropdown(container, initialValue = "sturges") {
    const div = container.append("div")
        .style("margin", "5px 0");
    div.append("label")
        .attr("for", "histBinFunction")
        .text("Histogram Binning Function")
        .style("display", "block");

    const select = div.append("select")
        .attr("name", "histBinFunction")
        .style("width", "100%")
        .style("margin-top", "2px")
        .on("change", function() {
            histBinFunction = this.value;
            tableList.forEach(table => {
                d3.selectAll("#histogramRow" + table.index).remove();
                createHistograms(table);
            });
        });

    select.selectAll("option")
        .data(["sturges", "scott", "freedmanDiaconis"])
        .enter()
        .append("option")
        .attr("value", d => d)
        .text(d => d.charAt(0).toUpperCase() + d.slice(1))
        .property("selected", d => d === initialValue);
}

function updateUI() {
    // Update checkboxes
    d3.select("#activateHistograms").property("checked", activateHistograms);
    d3.select("#activatePriority").property("checked", activatePriority);
    d3.select("#activateTOffPriorityMode").property("checked", activateTOffPriorityMode);
    d3.select("#activateScores").property("checked", activateScores);
    d3.select("#activateColors").property("checked", activateColors);
    d3.select("#activateBars").property("checked", activateBars);
    d3.select("#activateOpacity").property("checked", activateOpacity);

    // Update dropdowns
    d3.select("[name='colorMetricSelect']").property("value", colorMetric);
    d3.select("[name='barsMetricSelect']").property("value", barsMetric);
    d3.select("[name='opacityMetricSelect']").property("value", opacityMetric);
    d3.select("[name='histBinFunction']").property("value", histBinFunction);

    // Update slider table
    updateSliderTable();
} 