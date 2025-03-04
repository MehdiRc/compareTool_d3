function createUI() {
    const body = d3.select("body");
    
    // Create button container
    const buttonContainer = body.append("div")
        .style("display", "flex")
        .style("gap", "5px")
        .style("align-items", "center")
        .style("margin-bottom", "10px");

    // Move CSV file input to container
    const csvInput = d3.select("#csvFile")
        .style("display", "inline-block");
    buttonContainer.node().appendChild(csvInput.node());
    
    // Save state button
    buttonContainer.append("input")
        .attr("type", "button")
        .attr("id", "saveState")
        .attr("value", "Save State 💾")
        .style("display", restrictedMode ? "none" : "inline-block")
        .on("click", saveState);

    // Load state button and label
    buttonContainer.append("label")
        .attr("for", "loadState")
        .text("Load State ⮰")
        .style("display", "inline-block")
        .style("padding", "1px 5px")
        .style("font-size", "16px")
        .style("cursor", "pointer")
        .style("background-color", "#4CAF50")
        .style("color", "white")
        .style("border", "none")
        .style("text-align", "center")
        .style("text-decoration", "none")
        .style("display", restrictedMode ? "none" : "inline-block")
        .on("mouseover", function() {
            d3.select(this).style("background-color", "#45a049");
        })
        .on("mouseout", function() {
            d3.select(this).style("background-color", "#4CAF50");
        });

    // Hidden file input for load state
    buttonContainer.append("input")
        .attr("type", "file")
        .attr("id", "loadState")
        .attr("accept", ".json")
        .attr("multiple", null)
        .style("display", "none") // Always hide the actual file input
        .on("change", function(d, i, nodes) {
            const event = d3.event || window.event;
            handleStateLoad(event);
        });

    // Settings button
    body.append("button")
        .attr("type", "button")
        .attr("class", "collapsible")
        .text("▼ Open Settings")
        .style("display", restrictedMode ? "none" : "block")
        .on("click", toggleSettings);

    // Settings content
    const content = body.append("div")
        .attr("class", "content")
        .style("display", "block");

    addSettingsControls(content);
    createSliderTable();
}

// Additional UI helper functions... 