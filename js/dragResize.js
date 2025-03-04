// Global variables for resize function
var startX, startY, startWidth, startHeight, startLeft;
// Declare resizeFunction only once and make it a window property
window.resizeFunction = null;
window.currentResizeDirection = null;

// Global variable for dragElement function
window.dragElement = function(elmnt, headerId, table) {
    var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    var header = document.getElementById(headerId);
    
    if (header) {
        header.onmousedown = dragMouseDown.bind(this, table);
    } else {
        elmnt.onmousedown = dragMouseDown.bind(this, table);
    }

    function dragMouseDown(table, e) {
        e = e || window.event;
        e.preventDefault();
        pos3 = e.clientX;
        pos4 = e.clientY;
        document.onmouseup = closeDragElement;
        document.onmousemove = elementDrag.bind(this, table);
        
        // Bring elmnt to the front
        var highestZIndex = Math.max(...Array.from(document.querySelectorAll('*'))
            .map(elem => parseFloat(getComputedStyle(elem).zIndex) || 0));
        elmnt.style.zIndex = highestZIndex + 1;
        table.position["z-index"] = highestZIndex + 1;
    }

    function elementDrag(table, e) {
        e = e || window.event;
        e.preventDefault();
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;
        elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
        elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
        table.position["top"] = elmnt.style.top;
        table.position["left"] = elmnt.style.left;
    }

    function closeDragElement() {
        document.onmouseup = null;
        document.onmousemove = null;
    }
};

// Global variable for disableDragElement function
window.disableDragElement = function(elmnt, headerId) {
    var header = document.getElementById(headerId);
    if (header) {
        header.onmousedown = null;
    } else {
        elmnt.onmousedown = null;
    }
};

// Global variable for setupResize function
window.setupResize = function(table) {
    // Bottom-right corner resizer
    table.resizerBR = table.mydiv.append('div')
        .attr("id", "resizerBR" + table.index)
        .style('width', '10px')
        .style('height', '10px')
        .style('background-color', 'black')
        .style('position', 'absolute')
        .style('right', '0')
        .style('bottom', '0')
        .style('cursor', 'se-resize')
        .style('z-index', '10');
    
    // Bottom edge resizer
    table.resizerB = table.mydiv.append('div')
        .attr("id", "resizerB" + table.index)
        .style('width', 'calc(100% - 20px)')
        .style('height', '4px')
        .style('background-color', 'transparent')
        .style('position', 'absolute')
        .style('left', '10px')
        .style('bottom', '0')
        .style('cursor', 's-resize')
        .style('z-index', '9');
    
    // Right edge resizer
    table.resizerR = table.mydiv.append('div')
        .attr("id", "resizerR" + table.index)
        .style('width', '4px')
        .style('height', 'calc(100% - 20px)')
        .style('background-color', 'transparent')
        .style('position', 'absolute')
        .style('right', '0')
        .style('top', '10px')
        .style('cursor', 'e-resize')
        .style('z-index', '9');
    
    // Left edge resizer
    table.resizerL = table.mydiv.append('div')
        .attr("id", "resizerL" + table.index)
        .style('width', '4px')
        .style('height', 'calc(100% - 20px)')
        .style('background-color', 'transparent')
        .style('position', 'absolute')
        .style('left', '0')
        .style('top', '10px')
        .style('cursor', 'w-resize')
        .style('z-index', '9');
    
    // Bottom-left corner resizer
    table.resizerBL = table.mydiv.append('div')
        .attr("id", "resizerBL" + table.index)
        .style('width', '10px')
        .style('height', '10px')
        .style('background-color', 'black')
        .style('position', 'absolute')
        .style('left', '0')
        .style('bottom', '0')
        .style('cursor', 'sw-resize')
        .style('z-index', '10');

    // Setup resize handlers
    setupResizeHandler(table.resizerBR, table, 'both');
    setupResizeHandler(table.resizerB, table, 'bottom');
    setupResizeHandler(table.resizerR, table, 'right');
    setupResizeHandler(table.resizerL, table, 'left');
    setupResizeHandler(table.resizerBL, table, 'bottomLeft');
};

function setupResizeHandler(resizer, table, direction) {
    resizer.on('mousedown', function() {
        d3.event.preventDefault();
        startX = d3.event.clientX;
        startY = d3.event.clientY;
        startWidth = parseInt(table.mydiv.style('width'), 10);
        startHeight = parseInt(table.mydiv.style('height'), 10);
        startLeft = parseInt(table.mydiv.style('left'), 10) || 
                   table.mydiv.node().getBoundingClientRect().left;

        window.currentResizeDirection = direction;
        window.resizeFunction = function(e) { window.doResize(e, table, direction); };
        document.documentElement.addEventListener('mousemove', window.resizeFunction, false);
        document.documentElement.addEventListener('mouseup', window.stopResize, false);
    });
}

// Global variable for doResize function
window.doResize = function(e, table, direction) {
    // Auto-scroll when near edges
    var scrollSpeed = 10;
    var edgeDistance = 100;

    if (e.clientY < edgeDistance) {
        window.scrollBy(0, -scrollSpeed);
    }
    if (window.innerHeight - e.clientY < edgeDistance) {
        window.scrollBy(0, scrollSpeed);
    }
    if (e.clientX < edgeDistance) {
        window.scrollBy(-scrollSpeed, 0);
    }
    if (window.innerWidth - e.clientX < edgeDistance) {
        window.scrollBy(scrollSpeed, 0);
    }

    // Get header height
    var mydivHeaderHeight = table.mydivheader.node().offsetHeight;
    
    // Initialize dimensions
    var width = startWidth;
    var height = startHeight;
    var left = startLeft;
    
    // Calculate dimensions based on direction
    if (direction === 'both' || direction === 'right') {
        // Right or bottom-right corner drag
        width = e.clientX - table.mydiv.node().getBoundingClientRect().left + window.scrollX;
    }
    
    if (direction === 'left' || direction === 'bottomLeft') {
        // Left or bottom-left corner drag
        var diffX = startX - e.clientX;
        width = startWidth + diffX;
        left = startLeft - diffX;
    }
    
    if (direction === 'both' || direction === 'bottom' || 
        direction === 'bottomLeft') {
        // Any bottom drag
        height = e.clientY - table.mydiv.node().getBoundingClientRect().top + window.scrollY;
    }
    
    // Calculate minimum table width based on columns
    var columnCount = table.keys ? table.keys.length + 1 : 5; // +1 for Score column
    var minColumnWidth = 120; // Minimum width per column
    var tableMinWidth = columnCount * minColumnWidth;
    
    // Make sure width and height are at least minimum values
    width = Math.max(width, tableMinWidth);
    height = Math.max(height, mydivHeaderHeight + 50);

    var tableHeight = height - mydivHeaderHeight;
    
    // Apply new dimensions
    table.mydiv.style('width', width + 'px');
    table.mydiv.style('height', height + 'px');
    
    // Only update left position if resizing from left edge
    if (direction === 'left' || direction === 'bottomLeft') {
        table.mydiv.style('left', left + 'px');
        table.position["left"] = left + 'px';
    }

    // Handle table display based on resize mode
    if (table.resizeMode === 'hide') {
        // Only resize width, height is just the header
        table.mydiv.style('height', mydivHeaderHeight + 'px');
        table.scrolldiv.style('width', '100%').style('height', '0px');
        table.dataTable.style('display', 'none');
    } else {
        // Full table display
        table.scrolldiv.style('width', '100%').style('height', tableHeight + 'px');
        table.dataTable.style('display', null).style('width', '100%').style('height', '100%');
    }
};

// Global variable for updateResize function
window.updateResize = function(table) {
    if (!table.mydiv || !table.mydivheader || !table.dataTable || !table.scrolldiv) {
        return; // Exit if any element is missing
    }
    
    // Get header height
    var mydivHeaderHeight = table.mydivheader.node().offsetHeight;
    
    // Get current width and height
    var width = parseInt(table.mydiv.style('width'), 10) || 800;
    var height = parseInt(table.mydiv.style('height'), 10) || 500;
    
    // Calculate minimum table width based on columns
    var columnCount = table.keys ? table.keys.length + 1 : 5; // +1 for Score column
    var minColumnWidth = 120; // Minimum width per column
    var tableMinWidth = columnCount * minColumnWidth;
    
    // Ensure width is not less than minimum
    width = Math.max(width, tableMinWidth);
    
    var tableHeight = height - mydivHeaderHeight;

    // Apply resize based on mode
    if (table.resizeMode === 'hide') {
        // Only show header
        table.mydiv.style('width', width + 'px');
        table.mydiv.style('height', mydivHeaderHeight + 'px');
        table.scrolldiv.style('width', '100%').style('height', '0px');
        table.dataTable.style('display', 'none');
        
        // Hide bottom and bottom-corner resizers
        if (table.resizerB) table.resizerB.style('display', 'none');
        if (table.resizerBR) table.resizerBR.style('display', 'none');
        if (table.resizerBL) table.resizerBL.style('display', 'none');
        
        // Keep side resizers visible
        if (table.resizerL) table.resizerL.style('display', null).style('height', mydivHeaderHeight + 'px');
        if (table.resizerR) table.resizerR.style('display', null).style('height', mydivHeaderHeight + 'px');
    } else {
        // Full table display
        table.mydiv.style('width', width + 'px').style('height', height + 'px');
        table.scrolldiv.style('width', '100%').style('height', tableHeight + 'px');
        table.dataTable.style('display', null).style('width', '100%').style('height', '100%');
        
        // Show all resizers
        if (table.resizerB) table.resizerB.style('display', null);
        if (table.resizerBR) table.resizerBR.style('display', null);
        if (table.resizerBL) table.resizerBL.style('display', null);
        if (table.resizerL) table.resizerL.style('display', null).style('height', 'calc(100% - 20px)');
        if (table.resizerR) table.resizerR.style('display', null).style('height', 'calc(100% - 20px)');
    }
};

// Global variable for enableResize function
window.enableResize = function(table) {
    if (!table.resizerBR) return;
    
    // Enable all resizers
    table.resizerBR.style('cursor', 'se-resize').on('mousedown', function() {
        setupResizeStart(table, 'both');
    });
    
    table.resizerB.style('cursor', 's-resize').on('mousedown', function() {
        setupResizeStart(table, 'bottom');
    });
    
    table.resizerR.style('cursor', 'e-resize').on('mousedown', function() {
        setupResizeStart(table, 'right');
    });
    
    table.resizerL.style('cursor', 'w-resize').on('mousedown', function() {
        setupResizeStart(table, 'left');
    });
    
    table.resizerBL.style('cursor', 'sw-resize').on('mousedown', function() {
        setupResizeStart(table, 'bottomLeft');
    });
};

function setupResizeStart(table, direction) {
    d3.event.preventDefault();
    startX = d3.event.clientX;
    startY = d3.event.clientY;
    startWidth = parseInt(table.mydiv.style('width'), 10);
    startHeight = parseInt(table.mydiv.style('height'), 10);
    startLeft = parseInt(table.mydiv.style('left'), 10) || 
               table.mydiv.node().getBoundingClientRect().left;

    window.currentResizeDirection = direction;
    window.resizeFunction = function(e) { window.doResize(e, table, direction); };
    document.documentElement.addEventListener('mousemove', window.resizeFunction, false);
    document.documentElement.addEventListener('mouseup', window.stopResize, false);
}

// Global variable for disableResize function
window.disableResize = function(table) {
    if (!table.resizerBR) return;
    
    // Disable all resizers
    table.resizerBR.style('cursor', 'default').on('mousedown', null);
    table.resizerB.style('cursor', 'default').on('mousedown', null);
    table.resizerR.style('cursor', 'default').on('mousedown', null);
    table.resizerL.style('cursor', 'default').on('mousedown', null);
    table.resizerBL.style('cursor', 'default').on('mousedown', null);
};

// Global variable for stopResize function
window.stopResize = function() {
    window.currentResizeDirection = null;
    document.documentElement.removeEventListener('mousemove', window.resizeFunction, false);
    document.documentElement.removeEventListener('mouseup', window.stopResize, false);
}; 