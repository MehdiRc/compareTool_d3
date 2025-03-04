function saveState() {
    const state = {
        // Save table data with all necessary properties
        tableList: tableList.map(table => ({
            index: table.index,
            name: table.name,
            data: table.data,
            position: table.position,
            sortOrder: table.sortOrder,
            sortColumn: table.sortColumn,
            resizeMode: table.resizeMode,
            pin: table.pin,
            keys: table.keys,  // Add keys
            minVal: table.minVal,  // Add minVal
            maxVal: table.maxVal,  // Add maxVal
            numericValues: table.numericValues,  // Add numericValues
            columnMeans: table.columnMeans  // Add columnMeans
        })),
        // Save settings state
        settings: {
            activateHistograms,
            activateColors,
            activateBars,
            activateOpacity,
            activatePriority,
            activateScores,
            activateTOffPriorityMode,
            colorMetric,
            barsMetric,
            opacityMetric,
            histBinFunction
        },
        // Save column configurations
        columns: {
            priorities,
            idealValues,
            includedColumns,
            categoricalMappings
        },
        // Save range values
        ranges: {
            globalMin,
            globalMax,
            minRangeValues,
            maxRangeValues
        },
        fileNames
    };

    const stateJSON = JSON.stringify(state);
    downloadState(stateJSON);
}

function downloadState(stateJSON) {
    const blob = new Blob([stateJSON], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'state.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function loadState(stateJSON) {
    try {
        const state = JSON.parse(stateJSON);
        
        // Reset state first
        resetState();
        
        // Restore settings one by one to ensure they're set
        activateHistograms = state.settings.activateHistograms;
        activateColors = state.settings.activateColors;
        activateBars = state.settings.activateBars;
        activateOpacity = state.settings.activateOpacity;
        activatePriority = state.settings.activatePriority;
        activateScores = state.settings.activateScores;
        activateTOffPriorityMode = state.settings.activateTOffPriorityMode;
        colorMetric = state.settings.colorMetric;
        barsMetric = state.settings.barsMetric;
        opacityMetric = state.settings.opacityMetric;
        histBinFunction = state.settings.histBinFunction;

        // Restore column configurations one by one
        priorities = {...state.columns.priorities};
        idealValues = {...state.columns.idealValues};
        includedColumns = {...state.columns.includedColumns};
        categoricalMappings = {...state.columns.categoricalMappings};

        // Restore ranges one by one
        globalMin = {...state.ranges.globalMin};
        globalMax = {...state.ranges.globalMax};
        minRangeValues = {...state.ranges.minRangeValues};
        maxRangeValues = {...state.ranges.maxRangeValues};

        // Restore file names
        fileNames = [...state.fileNames];

        // Remove ALL existing tables from DOM
        d3.selectAll("[id^='mydiv']").remove();
        
        // Clear tableList before restoring
        tableList = [];
        
        // First create all table objects without rendering
        state.tableList.forEach(tableData => {
            const table = {
                index: tableData.index,
                name: tableData.name,
                data: [...tableData.data],
                position: {...tableData.position},
                sortOrder: tableData.sortOrder,
                sortColumn: tableData.sortColumn,
                resizeMode: tableData.resizeMode,
                pin: tableData.pin,
                keys: [...tableData.keys],
                minVal: {...tableData.minVal},
                maxVal: {...tableData.maxVal},
                numericValues: {...tableData.numericValues},
                columnMeans: {...tableData.columnMeans}
            };
            tableList.push(table);
        });

        // Now create all tables with proper histogram scales
        tableList.forEach(table => {
            createDataTable(table);
            
            // Restore sorting if needed
            if (table.sortColumn && table.sortOrder !== 0) {
                const columnIndex = table.keys.indexOf(table.sortColumn);
                const headerIndex = columnIndex === -1 ? 
                    table.keys.length : 
                    columnIndex;
                const header = d3.select(`#dataTable${table.index}`)
                    .select(`th:nth-child(${headerIndex + 1})`)
                    .node();
                sortTable(table.sortColumn, header, table);
            }
        });

        // Update UI to reflect loaded state
        updateUI();
        
        // Update slider table with loaded values
        updateSliderTable();
        
    } catch (error) {
        console.error("Error loading state:", error);
        alert("Error loading state file");
    }
}

function handleStateLoad(event) {
    if (!event) return;
    
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            loadState(e.target.result);
        };
        reader.readAsText(file);
    }
}

function resetState() {
    tableList = [];
    priorities = {};
    idealValues = {};
    includedColumns = {};
    categoricalMappings = {};
    globalMin = {};
    globalMax = {};

    activateHistograms = true;
    activateColors = true;
    activateBars = true;
    activateOpacity = true;
    activatePriority = true;
    activateScores = true;
    activateTOffPriorityMode = true;

    colorMetric = "Distance";
    barsMetric = "Priority";
    opacityMetric = "Priority";
    histBinFunction = "sturges";
} 