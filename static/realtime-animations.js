/**
 * Real-Time Animations System
 * Manages smooth transitions, counter animations, and anomaly highlighting
 */

/**
 * Counter Animation Manager
 * Handles animated number transitions
 */
class CounterAnimationManager {
    constructor() {
        this.activeCounters = new Map();
        this.animationFrameId = null;
    }

    /**
     * Animate a counter from current value to target value
     */
    animateCounter(element, fromValue, toValue, duration = 500) {
        if (!element) return;

        // Cancel existing animation if present
        if (this.activeCounters.has(element)) {
            cancelAnimationFrame(this.activeCounters.get(element).frameId);
        }

        const startTime = performance.now();
        let currentValue = fromValue;

        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Easing function (easeOutQuad)
            const easeProgress = 1 - (1 - progress) * (1 - progress);

            currentValue = Math.floor(fromValue + (toValue - fromValue) * easeProgress);
            element.textContent = this.formatNumber(currentValue);

            if (progress < 1) {
                const frameId = requestAnimationFrame(animate);
                this.activeCounters.set(element, { frameId });
            } else {
                element.textContent = this.formatNumber(toValue);
                this.activeCounters.delete(element);
            }
        };

        const frameId = requestAnimationFrame(animate);
        this.activeCounters.set(element, { frameId });
    }

    /**
     * Format number with thousand separators
     */
    formatNumber(num) {
        return num.toLocaleString();
    }
}

/**
 * Smooth Transition Manager
 * Handles CSS transitions and element state changes
 */
class SmoothTransitionManager {
    constructor() {
        this.transitionQueue = [];
        this.isAnimating = false;
    }

    /**
     * Queue a smooth transition
     */
    queueTransition(element, fromState, toState, duration = 300) {
        return new Promise((resolve) => {
            this.transitionQueue.push({
                element,
                fromState,
                toState,
                duration,
                resolve
            });
            this.processQueue();
        });
    }

    /**
     * Process queued transitions
     */
    processQueue() {
        if (this.isAnimating || this.transitionQueue.length === 0) return;

        this.isAnimating = true;
        const { element, fromState, toState, duration, resolve } = this.transitionQueue.shift();

        // Apply from state
        Object.assign(element.style, fromState);

        // Force reflow
        void element.offsetHeight;

        // Set transition duration
        element.style.transition = `all ${duration}ms ease`;

        // Apply to state
        Object.assign(element.style, toState);

        // Wait for transition to complete
        setTimeout(() => {
            element.style.transition = '';
            this.isAnimating = false;
            resolve();
            this.processQueue();
        }, duration);
    }

    /**
     * Fade in an element
     */
    fadeIn(element, duration = 300) {
        return this.queueTransition(
            element,
            { opacity: '0', visibility: 'hidden' },
            { opacity: '1', visibility: 'visible' },
            duration
        );
    }

    /**
     * Fade out an element
     */
    fadeOut(element, duration = 300) {
        return this.queueTransition(
            element,
            { opacity: '1', visibility: 'visible' },
            { opacity: '0', visibility: 'hidden' },
            duration
        );
    }

    /**
     * Slide in from left
     */
    slideInFromLeft(element, duration = 300) {
        return this.queueTransition(
            element,
            { transform: 'translateX(-20px)', opacity: '0' },
            { transform: 'translateX(0)', opacity: '1' },
            duration
        );
    }

    /**
     * Slide in from right
     */
    slideInFromRight(element, duration = 300) {
        return this.queueTransition(
            element,
            { transform: 'translateX(20px)', opacity: '0' },
            { transform: 'translateX(0)', opacity: '1' },
            duration
        );
    }

    /**
     * Bounce animation
     */
    bounce(element, intensity = 1) {
        element.style.animation = `none`;
        void element.offsetHeight; // Trigger reflow
        element.style.animation = `attackPulse 0.4s ease ${intensity}`;
    }
}

/**
 * Anomaly Detection & Highlighting Manager
 * Detects and highlights unusual attack patterns
 */
class AnomalyManager {
    constructor() {
        this.baselineStats = {
            avgAttacksPerMinute: 10,
            avgAttacksPerProtocol: 5,
            avgAttacksPerCountry: 3
        };
        this.anomalies = [];
        this.alertThresholds = {
            spike: 2.0, // 2x normal rate
            unusual: 1.5, // 1.5x normal rate
            critical: 5.0 // 5x normal rate
        };
    }

    /**
     * Detect anomalies in attack data
     */
    detectAnomalies(currentStats) {
        const detected = [];

        // Check for attack spike
        if (currentStats.attacksPerMinute > this.baselineStats.avgAttacksPerMinute * this.alertThresholds.critical) {
            detected.push({
                type: 'critical-spike',
                severity: 'critical',
                message: 'CRITICAL: Massive attack spike detected',
                value: currentStats.attacksPerMinute
            });
        } else if (currentStats.attacksPerMinute > this.baselineStats.avgAttacksPerMinute * this.alertThresholds.spike) {
            detected.push({
                type: 'spike',
                severity: 'high',
                message: 'Attack rate significantly elevated',
                value: currentStats.attacksPerMinute
            });
        }

        // Check for unusual protocol usage
        for (const [protocol, count] of Object.entries(currentStats.protocolStats || {})) {
            if (count > this.baselineStats.avgAttacksPerProtocol * this.alertThresholds.spike) {
                detected.push({
                    type: 'unusual-protocol',
                    severity: 'medium',
                    message: `Unusual activity: ${protocol} protocol spike`,
                    protocol,
                    value: count
                });
            }
        }

        // Check for unusual geographic patterns
        for (const [country, count] of Object.entries(currentStats.countryStats || {})) {
            if (count > this.baselineStats.avgAttacksPerCountry * this.alertThresholds.unusual) {
                detected.push({
                    type: 'unusual-source',
                    severity: 'low',
                    message: `Elevated attacks from ${country}`,
                    country,
                    value: count
                });
            }
        }

        this.anomalies = detected;
        return detected;
    }

    /**
     * Highlight anomalous element
     */
    highlightAnomaly(element, severity = 'medium') {
        if (!element) return;

        element.classList.add('anomaly-highlight');
        element.setAttribute('data-anomaly-severity', severity);

        // Add specific styling based on severity
        const highlightClass = {
            'critical': 'anomaly-critical',
            'high': 'anomaly-high',
            'medium': 'anomaly-medium',
            'low': 'anomaly-low'
        }[severity];

        if (highlightClass) {
            element.classList.add(highlightClass);
        }

        // Auto-remove highlight after 5 seconds
        setTimeout(() => {
            this.removeHighlight(element);
        }, 5000);
    }

    /**
     * Remove anomaly highlight
     */
    removeHighlight(element) {
        if (!element) return;
        element.classList.remove('anomaly-highlight');
        element.classList.remove('anomaly-critical', 'anomaly-high', 'anomaly-medium', 'anomaly-low');
        element.removeAttribute('data-anomaly-severity');
    }

    /**
     * Show anomaly alert notification
     */
    showAnomalyAlert(anomaly) {
        const alertDiv = document.createElement('div');
        alertDiv.className = `anomaly-alert anomaly-alert-${anomaly.severity}`;
        alertDiv.innerHTML = `
            <div class="anomaly-alert-icon">
                <i class="fas fa-exclamation-triangle"></i>
            </div>
            <div class="anomaly-alert-content">
                <div class="anomaly-alert-title">${anomaly.message}</div>
                <div class="anomaly-alert-details">
                    Value: <strong>${anomaly.value}</strong>
                </div>
            </div>
            <button class="anomaly-alert-close">
                <i class="fas fa-times"></i>
            </button>
        `;

        // Add to notifications container
        const container = document.querySelector('.alerts-container') || document.body;
        container.appendChild(alertDiv);

        // Setup close button
        alertDiv.querySelector('.anomaly-alert-close').addEventListener('click', () => {
            alertDiv.remove();
        });

        // Auto-remove after 8 seconds
        setTimeout(() => {
            alertDiv.remove();
        }, 8000);

        return alertDiv;
    }

    /**
     * Get detected anomalies
     */
    getAnomalies() {
        return [...this.anomalies];
    }

    /**
     * Clear anomalies
     */
    clearAnomalies() {
        this.anomalies = [];
    }

    /**
     * Update baseline statistics
     */
    updateBaseline(stats) {
        this.baselineStats = {
            avgAttacksPerMinute: stats.avgAttacksPerMinute || this.baselineStats.avgAttacksPerMinute,
            avgAttacksPerProtocol: stats.avgAttacksPerProtocol || this.baselineStats.avgAttacksPerProtocol,
            avgAttacksPerCountry: stats.avgAttacksPerCountry || this.baselineStats.avgAttacksPerCountry
        };
    }
}

/**
 * Pulse and Glow Effects Manager
 */
class PulseEffectsManager {
    constructor() {
        this.activePulses = new Map();
    }

    /**
     * Create a pulsing glow effect on an element
     */
    createPulse(element, color = 'var(--primary-color)', duration = 2000) {
        if (!element) return;

        element.classList.add('glow-element');
        element.style.setProperty('--pulse-color', color);

        const pulseId = Math.random().toString(36).substr(2, 9);
        this.activePulses.set(pulseId, element);

        return pulseId;
    }

    /**
     * Stop pulsing effect
     */
    stopPulse(pulseId) {
        const element = this.activePulses.get(pulseId);
        if (element) {
            element.classList.remove('glow-element');
            this.activePulses.delete(pulseId);
        }
    }

    /**
     * Create ripple effect at a point
     */
    createRipple(element, event) {
        if (!element) return;

        const rect = element.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = event.clientX - rect.left - size / 2;
        const y = event.clientY - rect.top - size / 2;

        const ripple = document.createElement('span');
        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';
        ripple.classList.add('ripple');

        element.appendChild(ripple);

        setTimeout(() => ripple.remove(), 600);
    }
}

/**
 * Export all animation systems
 */
window.realtimeAnimations = {
    CounterAnimationManager,
    SmoothTransitionManager,
    AnomalyManager,
    PulseEffectsManager
};

console.log('[REALTIME-ANIMATIONS] System loaded and ready');
