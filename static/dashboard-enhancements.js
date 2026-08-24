/**
 * Dashboard Enhancements System
 * Provides improved data visualization, tabbed interface, and enhanced statistics
 * for the CyberPot Attack Map dashboard
 */

/**
 * Dashboard Tab Manager
 * Handles tab switching and content organization
 */
class DashboardTabManager {
    constructor() {
        this.currentTab = 'live-feed';
        this.tabs = {
            'live-feed': { name: 'Live Feed', icon: 'fa-stream' },
            'top-ips': { name: 'Top IPs', icon: 'fa-network-wired' },
            'top-countries': { name: 'Top Countries', icon: 'fa-globe' },
            'stats': { name: 'Statistics', icon: 'fa-chart-bar' }
        };
        this.init();
    }

    init() {
        this.setupTabListeners();
    }

    setupTabListeners() {
        // Find all tab buttons and attach click listeners
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchTab(btn.getAttribute('data-tab'));
            });
        });
    }

    switchTab(tabName) {
        if (!this.tabs[tabName]) {
            console.warn('[DASHBOARD] Invalid tab:', tabName);
            return;
        }

        // Update active states
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`)?.classList.add('active');

        // Update active pane
        document.querySelectorAll('.tab-pane').forEach(pane => {
            pane.classList.remove('active');
        });
        document.querySelector(`[data-pane="${tabName}"]`)?.classList.add('active');

        this.currentTab = tabName;
        
        // Trigger tab-specific initialization if needed
        this.onTabActivated(tabName);
    }

    onTabActivated(tabName) {
        // Trigger custom events for each tab
        const event = new CustomEvent('tabActivated', { 
            detail: { tabName } 
        });
        document.dispatchEvent(event);
    }

    getActiveTab() {
        return this.currentTab;
    }
}

/**
 * Statistics Card Manager
 * Handles creation and updates of stat cards with animations
 */
class StatisticsCardManager {
    constructor() {
        this.cards = {};
        this.updateIntervals = {};
    }

    /**
     * Create a statistics card
     */
    createCard(containerId, cardData) {
        const {
            id = 'stat-card-' + Date.now(),
            title = 'Statistic',
            value = '-',
            icon = 'fa-chart-pie',
            color = 'var(--primary-color)',
            unit = '',
            trend = null
        } = cardData;

        const cardHtml = `
            <div class="stat-card stat-card-${id}" data-card-id="${id}">
                <div class="stat-card-header">
                    <div class="stat-card-title-section">
                        <i class="fas ${icon}" style="color: ${color};"></i>
                        <h4 class="stat-card-title">${title}</h4>
                    </div>
                    ${trend ? `
                        <div class="stat-card-trend ${trend > 0 ? 'positive' : 'negative'}">
                            <i class="fas ${trend > 0 ? 'fa-arrow-up' : 'fa-arrow-down'}"></i>
                            <span>${Math.abs(trend)}%</span>
                        </div>
                    ` : ''}
                </div>
                <div class="stat-card-content">
                    <div class="stat-card-value" data-value="${value}">
                        ${value}
                    </div>
                    ${unit ? `<div class="stat-card-unit">${unit}</div>` : ''}
                </div>
                <div class="stat-card-footer">
                    <div class="stat-card-bar"></div>
                </div>
            </div>
        `;

        const container = document.getElementById(containerId);
        if (container) {
            container.insertAdjacentHTML('beforeend', cardHtml);
            this.cards[id] = {
                id,
                title,
                value,
                unit,
                element: document.querySelector(`.stat-card-${id}`),
                lastValue: value
            };
        }

        return id;
    }

    /**
     * Update a card value with animation
     */
    updateCardValue(cardId, newValue) {
        if (!this.cards[cardId]) return;

        const card = this.cards[cardId];
        const element = card.element.querySelector('.stat-card-value');
        
        if (element) {
            element.setAttribute('data-value', newValue);
            element.classList.add('updating');
            
            // Animate value change
            element.innerHTML = newValue;
            
            setTimeout(() => {
                element.classList.remove('updating');
            }, 300);

            card.lastValue = newValue;
        }
    }

    /**
     * Update card trend
     */
    updateCardTrend(cardId, trendPercent) {
        const card = this.cards[cardId];
        if (!card) return;

        const trendElement = card.element.querySelector('.stat-card-trend');
        if (trendElement) {
            const isPositive = trendPercent > 0;
            trendElement.className = `stat-card-trend ${isPositive ? 'positive' : 'negative'}`;
            trendElement.innerHTML = `
                <i class="fas ${isPositive ? 'fa-arrow-up' : 'fa-arrow-down'}"></i>
                <span>${Math.abs(trendPercent)}%</span>
            `;
        }
    }

    removeCard(cardId) {
        if (this.cards[cardId]) {
            this.cards[cardId].element.remove();
            delete this.cards[cardId];
        }
    }
}

/**
 * Enhanced Live Feed Manager
 * Handles real-time attack feed with better formatting and filtering
 */
class LiveFeedManager {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.maxItems = 100;
        this.items = [];
        this.filteredItems = [];
        this.filters = {};
    }

    /**
     * Add an attack event to the live feed
     */
    addFeedItem(event) {
        const item = this.createFeedItemElement(event);
        
        if (this.container) {
            this.container.insertAdjacentHTML('afterbegin', item);
        }

        this.items.push(event);

        // Limit number of items in DOM
        if (this.items.length > this.maxItems) {
            this.items.shift();
            this.container.lastChild?.remove();
        }

        // Apply current filters
        this.applyFilters();
    }

    /**
     * Create a formatted feed item element
     */
    createFeedItemElement(event) {
        const timestamp = new Date(event.timestamp).toLocaleTimeString();
        const protocol = event.protocol || 'UNKNOWN';
        const statusClass = this.getStatusClass(event);

        return `
            <div class="feed-item feed-item-${statusClass}" data-timestamp="${event.timestamp}">
                <div class="feed-item-indicator ${statusClass}"></div>
                <div class="feed-item-content">
                    <div class="feed-item-header">
                        <span class="feed-item-protocol badge-protocol">${protocol}</span>
                        <span class="feed-item-time">${timestamp}</span>
                    </div>
                    <div class="feed-item-details">
                        <span class="feed-item-src">${event.src_ip || 'Unknown'}</span>
                        <i class="fas fa-arrow-right feed-item-arrow"></i>
                        <span class="feed-item-dst">${event.dst_ip || 'Local'}</span>
                    </div>
                    <div class="feed-item-meta">
                        <span class="feed-item-country">${event.country || 'Unknown'}</span>
                        <span class="feed-item-honeypot">${event.honeypot || 'honeypot'}</span>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Determine status class for visual styling
     */
    getStatusClass(event) {
        // Classify based on attack severity or protocol
        const highRiskProtocols = ['SSH', 'RDP', 'TELNET', 'SMB'];
        if (highRiskProtocols.includes(event.protocol)) {
            return 'high-severity';
        }
        return 'normal';
    }

    /**
     * Apply filters to feed items
     */
    setFilter(filterName, filterValue) {
        this.filters[filterName] = filterValue;
        this.applyFilters();
    }

    applyFilters() {
        this.filteredItems = this.items.filter(item => {
            for (const [key, value] of Object.entries(this.filters)) {
                if (key === 'protocol' && item.protocol !== value) return false;
                if (key === 'country' && item.country !== value) return false;
            }
            return true;
        });

        this.updateFeedDisplay();
    }

    updateFeedDisplay() {
        // Update visibility of feed items based on filters
        document.querySelectorAll('.feed-item').forEach(element => {
            const shouldShow = this.filteredItems.some(item => 
                item.timestamp === element.getAttribute('data-timestamp')
            );
            element.style.display = shouldShow ? '' : 'none';
        });
    }

    clearFilter(filterName) {
        delete this.filters[filterName];
        this.applyFilters();
    }
}

/**
 * Data Aggregation Manager
 * Handles aggregation of attack statistics
 */
class DataAggregationManager {
    constructor() {
        this.stats = {
            totalAttacks: 0,
            uniqueAttackers: new Set(),
            protocolStats: {},
            countryStats: {},
            honeypotStats: {},
            timeSeriesData: []
        };
    }

    /**
     * Add an attack event to statistics
     */
    recordAttack(event) {
        this.stats.totalAttacks++;
        
        // Track unique attackers
        if (event.src_ip) {
            this.stats.uniqueAttackers.add(event.src_ip);
        }

        // Protocol statistics
        const protocol = event.protocol || 'OTHER';
        this.stats.protocolStats[protocol] = (this.stats.protocolStats[protocol] || 0) + 1;

        // Country statistics
        const country = event.country || 'Unknown';
        this.stats.countryStats[country] = (this.stats.countryStats[country] || 0) + 1;

        // Honeypot statistics
        const honeypot = event.honeypot || 'default';
        this.stats.honeypotStats[honeypot] = (this.stats.honeypotStats[honeypot] || 0) + 1;

        // Time series data
        this.recordTimeSeries();
    }

    /**
     * Record data point for time-series chart
     */
    recordTimeSeries() {
        const now = new Date();
        const minute = now.getMinutes();
        
        if (this.stats.timeSeriesData.length === 0 || 
            this.stats.timeSeriesData[this.stats.timeSeriesData.length - 1].minute !== minute) {
            this.stats.timeSeriesData.push({
                minute,
                time: now.toLocaleTimeString(),
                count: 1
            });

            // Keep only last 60 minutes
            if (this.stats.timeSeriesData.length > 60) {
                this.stats.timeSeriesData.shift();
            }
        } else {
            this.stats.timeSeriesData[this.stats.timeSeriesData.length - 1].count++;
        }
    }

    /**
     * Get top items from a category
     */
    getTopItems(category, limit = 10) {
        const stats = this.stats[`${category}Stats`];
        if (!stats) return [];

        return Object.entries(stats)
            .sort((a, b) => b[1] - a[1])
            .slice(0, limit)
            .map(([name, count]) => ({ name, count }));
    }

    /**
     * Get aggregated statistics
     */
    getStatistics() {
        return {
            totalAttacks: this.stats.totalAttacks,
            uniqueAttackers: this.stats.uniqueAttackers.size,
            protocolCount: Object.keys(this.stats.protocolStats).length,
            countryCount: Object.keys(this.stats.countryStats).length,
            honeypotCount: Object.keys(this.stats.honeypotStats).length,
            timeSeriesData: this.stats.timeSeriesData
        };
    }

    /**
     * Reset statistics
     */
    reset() {
        this.stats = {
            totalAttacks: 0,
            uniqueAttackers: new Set(),
            protocolStats: {},
            countryStats: {},
            honeypotStats: {},
            timeSeriesData: []
        };
    }
}

/**
 * Export manager instances for global access
 */
window.dashboardEnhancements = {
    TabManager: DashboardTabManager,
    StatsManager: StatisticsCardManager,
    LiveFeedManager,
    DataAggregationManager
};

console.log('[DASHBOARD-ENHANCEMENTS] System loaded and ready');
