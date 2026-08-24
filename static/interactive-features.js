/**
 * Interactive Features System
 * Provides filtering, search, and advanced map interactions for CyberPot
 */

/**
 * Filter System Manager
 * Handles multi-dimensional filtering of attack data
 */
class FilterSystemManager {
    constructor() {
        this.filters = {
            protocol: null,
            country: null,
            honeypot: null,
            severity: null,
            timeRange: null,
            ipAddress: null
        };
        this.listeners = [];
        this.activeFilters = {};
        this.init();
    }

    init() {
        this.setupFilterUI();
    }

    setupFilterUI() {
        // Initialize filter UI elements
        console.log('[FILTER-SYSTEM] Initializing filter UI');
    }

    /**
     * Apply a filter
     */
    applyFilter(filterType, filterValue) {
        if (filterValue === null || filterValue === '') {
            delete this.activeFilters[filterType];
        } else {
            this.activeFilters[filterType] = filterValue;
        }
        this.notifyListeners();
    }

    /**
     * Check if an event matches current filters
     */
    matchesFilters(event) {
        for (const [filterType, filterValue] of Object.entries(this.activeFilters)) {
            switch (filterType) {
                case 'protocol':
                    if (event.protocol !== filterValue) return false;
                    break;
                case 'country':
                    if (event.country !== filterValue) return false;
                    break;
                case 'honeypot':
                    if (event.honeypot !== filterValue) return false;
                    break;
                case 'severity':
                    if (!this.checkSeverity(event, filterValue)) return false;
                    break;
                case 'timeRange':
                    if (!this.checkTimeRange(event, filterValue)) return false;
                    break;
                case 'ipAddress':
                    if (event.src_ip !== filterValue && event.dst_ip !== filterValue) return false;
                    break;
            }
        }
        return true;
    }

    /**
     * Check severity level
     */
    checkSeverity(event, severity) {
        const highRiskProtocols = ['SSH', 'RDP', 'TELNET', 'SMB', 'SQL'];
        const mediumRiskProtocols = ['HTTP', 'HTTPS', 'FTP', 'SMTP'];
        
        const protocol = event.protocol || 'UNKNOWN';

        if (severity === 'high') {
            return highRiskProtocols.includes(protocol);
        } else if (severity === 'medium') {
            return mediumRiskProtocols.includes(protocol);
        } else if (severity === 'low') {
            return !highRiskProtocols.includes(protocol) && !mediumRiskProtocols.includes(protocol);
        }
        return true;
    }

    /**
     * Check if event falls within time range
     */
    checkTimeRange(event, timeRange) {
        if (!event.timestamp) return true;

        const eventTime = new Date(event.timestamp);
        const now = new Date();
        const diffMinutes = (now - eventTime) / (1000 * 60);

        switch (timeRange) {
            case 'last_1m':
                return diffMinutes <= 1;
            case 'last_5m':
                return diffMinutes <= 5;
            case 'last_10m':
                return diffMinutes <= 10;
            case 'last_1h':
                return diffMinutes <= 60;
            case 'last_24h':
                return diffMinutes <= 1440;
            default:
                return true;
        }
    }

    /**
     * Get all active filters
     */
    getActiveFilters() {
        return { ...this.activeFilters };
    }

    /**
     * Clear a specific filter
     */
    clearFilter(filterType) {
        delete this.activeFilters[filterType];
        this.notifyListeners();
    }

    /**
     * Clear all filters
     */
    clearAllFilters() {
        this.activeFilters = {};
        this.notifyListeners();
    }

    /**
     * Subscribe to filter changes
     */
    subscribe(callback) {
        this.listeners.push(callback);
    }

    /**
     * Notify all listeners of filter changes
     */
    notifyListeners() {
        this.listeners.forEach(callback => {
            callback(this.getActiveFilters());
        });
    }
}

/**
 * Map Interaction Manager
 * Handles mouse interactions and hover effects on map
 */
class MapInteractionManager {
    constructor(map) {
        this.map = map;
        this.hoveredElement = null;
        this.selectedElement = null;
        this.tooltips = new Map();
        this.init();
    }

    init() {
        this.setupMapListeners();
    }

    setupMapListeners() {
        // Setup click and hover listeners for map elements
        if (this.map) {
            this.map.on('click', (e) => this.handleMapClick(e));
        }
    }

    /**
     * Create an enhanced tooltip for a map element
     */
    createTooltip(latLng, content, options = {}) {
        const {
            offset = L.point(0, 0),
            permanent = false,
            direction = 'top'
        } = options;

        const tooltipOptions = {
            permanent,
            direction,
            offset,
            className: 'attack-tooltip',
            closeButton: !permanent
        };

        const tooltip = L.tooltip(tooltipOptions)
            .setLatLng(latLng)
            .setContent(content);

        if (this.map) {
            tooltip.addTo(this.map);
            this.tooltips.set(JSON.stringify(latLng), tooltip);
        }

        return tooltip;
    }

    /**
     * Show detailed event tooltip
     */
    showEventTooltip(latLng, eventData) {
        const content = this.formatEventContent(eventData);
        return this.createTooltip(latLng, content, {
            permanent: false,
            direction: 'top'
        });
    }

    /**
     * Format event data for tooltip display
     */
    formatEventContent(event) {
        return `
            <div class="attack-tooltip">
                <div class="attack-tooltip-header">
                    ${event.protocol || 'UNKNOWN'} Attack
                </div>
                <div class="attack-tooltip-row">
                    <span class="attack-tooltip-label">From:</span>
                    <span class="attack-tooltip-value">${event.src_ip || 'Unknown'}</span>
                </div>
                <div class="attack-tooltip-row">
                    <span class="attack-tooltip-label">To:</span>
                    <span class="attack-tooltip-value">${event.dst_ip || 'Local'}</span>
                </div>
                <div class="attack-tooltip-row">
                    <span class="attack-tooltip-label">Country:</span>
                    <span class="attack-tooltip-value">${event.country || 'Unknown'}</span>
                </div>
                <div class="attack-tooltip-row">
                    <span class="attack-tooltip-label">Port:</span>
                    <span class="attack-tooltip-value">${event.dst_port || 'N/A'}</span>
                </div>
                <div class="attack-tooltip-row">
                    <span class="attack-tooltip-label">Time:</span>
                    <span class="attack-tooltip-value">${this.formatTime(event.timestamp)}</span>
                </div>
            </div>
        `;
    }

    /**
     * Format timestamp for display
     */
    formatTime(timestamp) {
        if (!timestamp) return 'Unknown';
        return new Date(timestamp).toLocaleTimeString();
    }

    /**
     * Handle map click events
     */
    handleMapClick(e) {
        console.log('[MAP-INTERACTION] Click event at:', e.latlng);
        // Trigger custom event for click handling
        const event = new CustomEvent('mapClicked', {
            detail: { latlng: e.latlng }
        });
        document.dispatchEvent(event);
    }

    /**
     * Enable marker clustering
     */
    enableMarkerClustering() {
        // This would integrate with a clustering library like Leaflet.markercluster
        console.log('[MAP-INTERACTION] Marker clustering enabled');
    }

    /**
     * Clear all tooltips
     */
    clearAllTooltips() {
        this.tooltips.forEach(tooltip => {
            if (this.map) {
                this.map.removeLayer(tooltip);
            }
        });
        this.tooltips.clear();
    }

    /**
     * Set map focus on a specific region
     */
    focusOnRegion(latLng, zoom = 6) {
        if (this.map) {
            this.map.setView(latLng, zoom, { animate: true });
        }
    }
}

/**
 * Search and Query Manager
 * Handles search functionality and complex queries
 */
class SearchManager {
    constructor() {
        this.searchIndex = [];
        this.searchResults = [];
        this.init();
    }

    init() {
        console.log('[SEARCH-MANAGER] Initialized');
    }

    /**
     * Add items to search index
     */
    indexItems(items) {
        items.forEach(item => {
            this.searchIndex.push({
                id: item.id || Math.random(),
                data: item,
                searchText: this.extractSearchText(item).toLowerCase()
            });
        });
    }

    /**
     * Extract searchable text from item
     */
    extractSearchText(item) {
        return [
            item.src_ip,
            item.dst_ip,
            item.protocol,
            item.country,
            item.honeypot,
            item.src_ip_rep,
            item.region
        ].filter(Boolean).join(' ');
    }

    /**
     * Search for items
     */
    search(query) {
        if (!query || query.trim().length === 0) {
            return [];
        }

        const searchTerms = query.toLowerCase().split(' ');
        this.searchResults = this.searchIndex.filter(item => {
            return searchTerms.some(term => item.searchText.includes(term));
        }).map(item => item.data);

        return this.searchResults;
    }

    /**
     * Advanced query search (e.g., "ip:192.168.1.1 protocol:SSH")
     */
    advancedSearch(query) {
        const params = {};
        const regex = /(\w+):([^\s]+)/g;
        let match;

        while ((match = regex.exec(query)) !== null) {
            params[match[1]] = match[2];
        }

        return this.searchIndex.filter(item => {
            for (const [key, value] of Object.entries(params)) {
                if (item.data[key] !== value) return false;
            }
            return true;
        }).map(item => item.data);
    }

    /**
     * Get search results
     */
    getResults() {
        return this.searchResults;
    }

    /**
     * Clear search index
     */
    clearIndex() {
        this.searchIndex = [];
        this.searchResults = [];
    }
}

/**
 * Context Menu Manager
 * Provides right-click context menus for various elements
 */
class ContextMenuManager {
    constructor() {
        this.menu = null;
        this.init();
    }

    init() {
        document.addEventListener('contextmenu', (e) => this.handleContextMenu(e));
    }

    /**
     * Create a context menu at mouse position
     */
    createContextMenu(x, y, options) {
        // Remove existing menu if present
        if (this.menu) {
            this.menu.remove();
        }

        const menu = document.createElement('div');
        menu.className = 'context-menu';
        menu.style.left = x + 'px';
        menu.style.top = y + 'px';

        options.forEach(option => {
            const item = document.createElement('div');
            item.className = 'context-menu-item';
            item.textContent = option.label;
            item.addEventListener('click', () => {
                option.action();
                this.menu.remove();
                this.menu = null;
            });
            menu.appendChild(item);
        });

        document.body.appendChild(menu);
        this.menu = menu;

        // Close menu on click elsewhere
        setTimeout(() => {
            document.addEventListener('click', () => {
                if (this.menu) {
                    this.menu.remove();
                    this.menu = null;
                }
            }, { once: true });
        }, 0);
    }

    /**
     * Handle context menu events
     */
    handleContextMenu(e) {
        // Custom context menu handling would go here
    }
}

/**
 * Export interactive features
 */
window.interactiveFeatures = {
    FilterSystemManager,
    MapInteractionManager,
    SearchManager,
    ContextMenuManager
};

console.log('[INTERACTIVE-FEATURES] System loaded and ready');
