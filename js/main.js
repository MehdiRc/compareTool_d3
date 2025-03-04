document.addEventListener('DOMContentLoaded', function() {
    const fileInput = d3.select("#csvFile");

    fileInput.on("change", async function () {
        try {
            const files = this.files;
            const csvFiles = Array.from(files).filter(file => file.name.endsWith('.csv'));
            const jsonFile = Array.from(files).filter(file => file.name.endsWith('.json'));

            // Update fileNames global variable
            fileNames.length = 0;
            fileNames.push(...csvFiles.map(file => file.name));

            // Load CSV files
            const texts = await readFiles(csvFiles);
            if (texts.length === 0) {
                alert("No CSV files selected");
                return;
            }

            // Process CSV data
            load(texts);

            // Load state if JSON file is present
            if (jsonFile.length === 1) {
                const stateTexts = await readFiles(jsonFile);
                loadState(stateTexts[0]);
            } else if (jsonFile.length > 1) {
                alert("Only one state JSON can be loaded at a time\nJSON files will be ignored");
            }

            // Update file input visibility
            fileInput.style("display", restrictedMode ? "none" : "block");

            // Store files for hot reload
            localStorage.setItem('files', JSON.stringify(texts));
        } catch (error) {
            console.error("Error loading files:", error);
            alert("Error loading files. Please check the console for details.");
        }
    });

    // Hot reload functionality
    const params = new URLSearchParams(document.location.search);
    const hotreload = params.get('hotreload');
    if (hotreload && localStorage.getItem('files')) {
        load(JSON.parse(localStorage.getItem('files')));
    }
});

function load(texts) {
    // Initialize state
    resetState();
    
    // Remove existing elements
    d3.selectAll("body > *:not(input[type='file'])").remove();
    
    // Process data
    for (let i = 0; i < texts.length; i++) {
        const data = d3.csvParse(texts[i]);
        onData(data, i);
    }

    // Create UI elements first
    createUI();
    
    // Update UI to reflect current state
    updateUI();
    
    // Create tables
    for (let i = 0; i < tableList.length; i++) {
        createDataTable(tableList[i]);
    }
} 