function onData(data, i) {
    var newTable = {
        // Data properties
        index: i,
        name: fileNames[i],
        keys: d3.keys(data[0]),
        data: data,
        originalData: JSON.parse(JSON.stringify(data)),
        numericValues: {},
        minVal: {},
        maxVal: {},
        columnMeans: {},
        position: {
            "top": 200 + 150*i + "px",
            "left": 100 + 150*i + "px",
            "z-index": 0
        },

        // Sorting properties
        sortOrder: 0,
        sortColumn: null,
        resizeMode: 'both',
        pin: false,

        // Visual elements (initialized as null)
        mydiv: null,
        mydivheader: null,
        scrolldiv: null,
        resizer: null,
        dataTable: null,
        headers: null,
        dataThead: null,
        histogramRow: null,
        dataTbody: null,
        rows: null,
        cells: null
    };

    // Process numeric values and update global min/max
    for (let i = 0; i < newTable.keys.length; i++) {
        const key = newTable.keys[i];
        newTable.numericValues[key] = data
            .map(row => parseFloat(row[key]))
            .filter(val => !isNaN(val));

        newTable.minVal[key] = d3.min(newTable.numericValues[key]);
        newTable.maxVal[key] = d3.max(newTable.numericValues[key]);

        if (!(key in globalMin) || globalMin[key] > newTable.minVal[key]) {
            globalMin[key] = newTable.minVal[key];
        }
        if (!(key in globalMax) || globalMax[key] < newTable.maxVal[key]) {
            globalMax[key] = newTable.maxVal[key];
        }
    }

    newTable.minVal["Score"] = 0;
    newTable.maxVal["Score"] = 0;

    tableList.push(newTable);
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