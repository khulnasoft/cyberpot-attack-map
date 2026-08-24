/**
 * Map Visualization Enhancements
 * Adds gradient intensity, visualization modes, and enhanced animations
 * to the CyberPot Attack Map
 */

// Visualization mode system
const visualizationModes = {
    HEATMAP: 'heatmap',
    ARC: 'arc',
    NODE: 'node'
};

let currentVisualizationMode = visualizationModes.ARC; // Default to arc mode

// Attack density tracking for heatmap mode
const attackDensityGrid = {};
const GRID_SIZE = 50; // Size of grid cells for density calculation

/**
 * Get grid cell key for a given latitude/longitude
 * Used to aggregate attacks into heatmap cells
 */
function getGridCellKey(lat, lng) {
    const cellLat = Math.floor(lat / GRID_SIZE) * GRID_SIZE;
    const cellLng = Math.floor(lng / GRID_SIZE) * GRID_SIZE;
    return `${cellLat},${cellLng}`;
}

/**
 * Update attack density for heatmap visualization
 */
function updateAttackDensity(lat, lng, intensity = 1) {
    const cellKey = getGridCellKey(lat, lng);
    if (!attackDensityGrid[cellKey]) {
        attackDensityGrid[cellKey] = 0;
    }
    attackDensityGrid[cellKey] += intensity;
}

/**
 * Calculate gradient color based on attack intensity
 * Returns CSS color value representing attack severity
 */
function getIntensityColor(intensity, maxIntensity = 100) {
    // Normalize intensity to 0-1 range
    const normalized = Math.min(intensity / maxIntensity, 1);
    
    // Create gradient from cyan (low) to red (high)
    // Using CSS HSL for smooth color transitions
    if (normalized < 0.33) {
        // Cyan to teal
        const t = normalized / 0.33;
        return `hsl(180, ${100 - (t * 30)}%, ${60 - (t * 15)}%)`;
    } else if (normalized < 0.67) {
        // Teal to yellow
        const t = (normalized - 0.33) / 0.33;
        return `hsl(${180 - (t * 60)}, ${70 - (t * 20)}%, ${45 + (t * 10)}%)`;
    } else {
        // Yellow to red
        const t = (normalized - 0.67) / 0.33;
        return `hsl(${120 - (t * 120)}, ${50 + (t * 50)}%, ${55 - (t * 15)}%)`;
    }
}

/**
 * Enhanced circle visualization with intensity-based styling
 */
function createIntensityCircle(latLng, intensity, maxIntensity, baseRadius = 15) {
    const normalizedIntensity = Math.min(intensity / maxIntensity, 1);
    
    // Scale radius based on intensity
    const radius = baseRadius + (normalizedIntensity * 20);
    
    // Get intensity color
    const color = getIntensityColor(intensity, maxIntensity);
    
    return L.circleMarker(latLng, {
        radius: radius,
        fillColor: color,
        color: 'rgba(0, 217, 255, 0.8)',
        weight: 2,
        opacity: 0.7 + (normalizedIntensity * 0.3),
        fillOpacity: 0.5 + (normalizedIntensity * 0.3),
        className: 'intensity-marker glow-element'
    });
}

/**
 * Create a heatmap layer for attack density visualization
 */
function createHeatmapLayer() {
    const heatmapPoints = [];
    let maxDensity = 0;
    
    // Calculate max density for normalization
    Object.values(attackDensityGrid).forEach(density => {
        maxDensity = Math.max(maxDensity, density);
    });
    
    // Create markers for each grid cell with density
    Object.entries(attackDensityGrid).forEach(([cellKey, density]) => {
        const [lat, lng] = cellKey.split(',').map(Number);
        const latLng = L.latLng(lat + GRID_SIZE / 2, lng + GRID_SIZE / 2);
        heatmapPoints.push({
            latLng,
            density,
            maxDensity
        });
    });
    
    return heatmapPoints;
}

/**
 * Enhanced particle animation with glow effect
 */
function handleParticleEnhanced(color, srcPoint, intensity = 1) {
    // Skip animation if tab is not visible
    if (document.hidden || isWakingUp) return;
    
    const x = srcPoint['x'];
    const y = srcPoint['y'];
    const maxRadius = 50 + (intensity * 20);
    const opacity = Math.min(intensity * 0.3, 1);
    
    // Create pulsing circle with glow
    svg.append('circle')
        .attr('cx', x)
        .attr('cy', y)
        .attr('r', 0)
        .style('fill', 'none')
        .style('stroke', color)
        .style('stroke-opacity', opacity)
        .style('stroke-width', 2 + (intensity * 2))
        .style('filter', `drop-shadow(0 0 ${3 + (intensity * 3)}px ${color})`)
        .transition()
        .duration(700)
        .ease(d3.easeCircleIn)
        .attr('r', maxRadius)
        .style('stroke-opacity', 0)
        .remove();
}

/**
 * Enhanced traffic/arc animation with smooth flow
 */
function handleTrafficEnhanced(color, srcPoint, hqPoint, intensity = 1) {
    // Skip animation if tab is not visible
    if (document.hidden || isWakingUp) return;
    
    const fromX = srcPoint['x'];
    const fromY = srcPoint['y'];
    const toX = hqPoint['x'];
    const toY = hqPoint['y'];
    const bendArray = [true, false];
    const bend = bendArray[Math.floor(Math.random() * bendArray.length)];
    
    const lineData = [srcPoint, calcMidpoint(fromX, fromY, toX, toY, bend), hqPoint];
    const lineFunction = d3.line()
        .curve(d3.curveBasis)
        .x(d => d.x)
        .y(d => d.y);
    
    const opacity = 0.6 + (intensity * 0.2);
    const strokeWidth = 1.5 + (intensity * 1.5);
    
    const lineGraph = svg.append('path')
        .attr('d', lineFunction(lineData))
        .attr('opacity', opacity)
        .attr('stroke', color)
        .attr('stroke-width', strokeWidth)
        .attr('fill', 'none')
        .attr('class', 'arc-flow')
        .style('filter', `drop-shadow(0 0 ${2 + (intensity * 2)}px ${color})`);
    
    const circleRadius = 4 + (intensity * 2);
    
    // Animated dot following the line
    const dot = svg.append('circle')
        .attr('r', circleRadius)
        .attr('fill', color)
        .attr('class', 'attack-dot')
        .transition()
        .duration(700)
        .ease(d3.easeCircleIn)
        .attrTween('transform', translateAlong(lineGraph.node()))
        .on('end', function () {
            d3.select(this)
                .attr('fill', 'none')
                .attr('stroke', color)
                .attr('stroke-width', 2 + (intensity * 1))
                .transition()
                .duration(700)
                .ease(d3.easeCircleIn)
                .attr('r', 50 + (intensity * 10))
                .style('stroke-opacity', 0)
                .remove();
        });
    
    // Line animation with dash effect
    const length = lineGraph.node().getTotalLength();
    lineGraph.attr('stroke-dasharray', length + ' ' + length)
        .attr('stroke-dashoffset', length)
        .transition()
        .duration(700)
        .ease(d3.easeCircleIn)
        .attr('stroke-dashoffset', 0)
        .on('end', function () {
            d3.select(this)
                .transition()
                .duration(700)
                .style('opacity', 0)
                .remove();
        });
}

/**
 * Node-based visualization with ripple effect
 */
function createNodeVisualization(latLng, intensity, protocol = 'UNKNOWN') {
    const maxRadius = 25;
    const baseRadius = 8 + (intensity * 5);
    const color = getProtocolColor(protocol);
    
    // Create main node
    const node = L.circleMarker(latLng, {
        radius: baseRadius,
        fillColor: color,
        color: 'rgba(0, 217, 255, 0.9)',
        weight: 2,
        opacity: 0.8 + (intensity * 0.2),
        fillOpacity: 0.7 + (intensity * 0.3),
        className: 'node-marker attackPulse'
    });
    
    return node;
}

/**
 * Create ripple effect at attack source
 */
function createRippleEffect(latLng, color = 'rgba(0, 217, 255, 0.3)', maxRadius = 60) {
    const center = map.latLngToLayerPoint(latLng);
    
    // Create multiple concentric circles for ripple effect
    for (let i = 0; i < 3; i++) {
        const delay = i * 200;
        const radius = (maxRadius / 3) * (i + 1);
        
        setTimeout(() => {
            svg.append('circle')
                .attr('cx', center.x)
                .attr('cy', center.y)
                .attr('r', 0)
                .style('stroke', color)
                .style('stroke-width', 2)
                .style('fill', 'none')
                .style('stroke-opacity', 1)
                .transition()
                .duration(600)
                .ease(d3.easeLinear)
                .attr('r', radius)
                .style('stroke-opacity', 0)
                .remove();
        }, delay);
    }
}

/**
 * Set current visualization mode
 */
function setVisualizationMode(mode) {
    if (Object.values(visualizationModes).includes(mode)) {
        currentVisualizationMode = mode;
        updateMapVisualization();
        return true;
    }
    return false;
}

/**
 * Get current visualization mode
 */
function getVisualizationMode() {
    return currentVisualizationMode;
}

/**
 * Update map visualization based on current mode
 */
function updateMapVisualization() {
    // This function will be called by map.js to redraw visualizations
    // based on the current mode
    console.log('[VISUALIZATION] Mode changed to:', currentVisualizationMode);
    
    // Implementation will depend on existing visualization system
    // For now, this serves as a placeholder for the mode switching
}

/**
 * Export functions for use in map.js
 */
window.mapEnhancements = {
    getIntensityColor,
    createIntensityCircle,
    createHeatmapLayer,
    handleParticleEnhanced,
    handleTrafficEnhanced,
    createNodeVisualization,
    createRippleEffect,
    setVisualizationMode,
    getVisualizationMode,
    updateAttackDensity,
    visualizationModes,
    getGridCellKey
};
