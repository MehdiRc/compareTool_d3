function resetScoreMinMax() {
    if (globalMin["Score"] !== undefined) {
        globalMin["Score"] = undefined;
        for (let i = 0; i < tableList.length; i++) {
            tableList[i].minVal["Score"] = undefined;
        }
    }
    if (globalMax["Score"] !== undefined) {
        globalMax["Score"] = undefined;
        for (let i = 0; i < tableList.length; i++) {
            tableList[i].maxVal["Score"] = undefined;
        }
    }
}

function updateScores(table) {
    table.rows.each(function(row) {
        let totalWeightedScore = 0;
        let totalWeight = 0;

        // Calculate weighted scores for each column
        for (let column in row) {
            if (column !== "Score" && includedColumns[column]) {
                const value = row[column];
                const weight = priorities[column];
                
                let columnScore = 0;
                if (!isNaN(parseFloat(value)) && isFinite(value)) {
                    // Numeric values
                    const distance = Math.abs(parseFloat(value) - idealValues[column]);
                    const maxDistance = Math.max(
                        Math.abs(globalMax[column] - idealValues[column]),
                        Math.abs(globalMin[column] - idealValues[column])
                    );
                    columnScore = maxDistance !== 0 ? 1 - (distance / maxDistance) : 0;
                } else if (categoricalMappings[column]?.[value] !== undefined) {
                    // Categorical values
                    const mappedValue = categoricalMappings[column][value];
                    const distance = Math.abs(mappedValue - 100);
                    columnScore = 1 - (distance / 200); // 200 is max distance (0 to 100 * 2)
                }

                totalWeightedScore += columnScore * weight;
                totalWeight += weight;
            }
        }

        // Calculate final score (0 to 1 range)
        row["Score"] = activateScores ? 
            (totalWeight === 0 ? 0 : totalWeightedScore / totalWeight) : 0;

        // Update global min/max
        if (globalMin["Score"] === undefined || row["Score"] < globalMin["Score"]) {
            globalMin["Score"] = row["Score"];
            table.minVal["Score"] = row["Score"];
        }
        if (globalMax["Score"] === undefined || row["Score"] > globalMax["Score"]) {
            globalMax["Score"] = row["Score"];
            table.maxVal["Score"] = row["Score"];
        }

        // Update table min/max
        if (table.minVal["Score"] === undefined || row["Score"] < table.minVal["Score"]) {
            table.minVal["Score"] = row["Score"];
        }
        if (table.maxVal["Score"] === undefined || row["Score"] > table.maxVal["Score"]) {
            table.maxVal["Score"] = row["Score"];
        }

        // Update display
        d3.select(this).selectAll("td").filter(":last-child")
            .classed("score", true)
            .each(function(d) { d.value = row["Score"]; })
            .text(activateScores ? row["Score"].toFixed(2) : "X");
    });

    if (table.sortColumn === "Score" && table.sortOrder !== 0) {
        sortScore(table);
    }

    calculateColumnMeans(table);
}

function updateColumnState(tableList) {
    const column = this.name;
    includedColumns[column] = this.checked;

    sliderTbody.selectAll("tr").selectAll("td").each(function(d) {
        if (d === column) {
            d3.select(this).selectAll("input").classed("disabled", !includedColumns[column]);
        }
    });

    resetScoreMinMax();
    
    for (let i = 0; i < tableList.length; i++) {
        updateScores(tableList[i]);
        updateColors(tableList[i]);
    }
} 