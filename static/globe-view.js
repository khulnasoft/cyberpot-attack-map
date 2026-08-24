/**
 * CyberPot 3D Globe Visualization
 * Powered by Globe.gl and Three.js
 */

class GlobeView {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.globe = null;
        this.active = false;
        this.arcsData = [];
        this.pointsData = [];
        this.maxItems = 100;
        this.initialized = false;

        // Settings
        this.autoRotate = true;
    }

    init() {
        if (this.initialized) return;

        console.log('[GLOBE] Initializing 3D Globe...');

        this.globe = Globe()
            (this.container)
            .globeImageUrl('//unpkg.com/three-globe/example/img/earth-night.jpg')
            .bumpImageUrl('//unpkg.com/three-globe/example/img/earth-topology.png')
            .backgroundImageUrl('//unpkg.com/three-globe/example/img/night-sky.png')
            .arcColor('color')
            .arcDashLength(0.4)
            .arcDashGap(4)
            .arcDashAnimateTime(1500)
            .arcStroke(1)
            .pointColor('color')
            .pointsMerge(true)
            .pointRadius(0.12)
            .pointAltitude(0.01)
            .pointLabel('label')
            .onArcHover(arc => this.handleArcHover(arc))
            .onPointHover(point => this.handlePointHover(point));

        // Initial orientation
        this.globe.pointOfView({ lat: 20, lng: 0, altitude: 2.5 }, 0);

        // Theme adjustments
        this.applyTheme();

        this.initialized = true;

        // Handle window resize
        window.addEventListener('resize', () => {
            if (this.active) {
                this.globe.width(this.container.clientWidth);
                this.globe.height(this.container.clientHeight);
            }
        });
    }

    applyTheme() {
        const theme = document.documentElement.getAttribute('data-theme') || 'dark';
        if (theme === 'light') {
            this.globe.globeImageUrl('//unpkg.com/three-globe/example/img/earth-blue-marble.jpg');
            // Background for light mode
            this.globe.backgroundColor('#f8f9fa');
        } else {
            this.globe.globeImageUrl('//unpkg.com/three-globe/example/img/earth-night.jpg');
            this.globe.backgroundColor('#050505');
        }
    }

    show() {
        this.active = true;
        this.container.classList.remove('hidden');
        this.init();
        this.globe.width(this.container.clientWidth);
        this.globe.height(this.container.clientHeight);

        if (this.autoRotate) {
            this.globe.controls().autoRotate = true;
            this.globe.controls().autoRotateSpeed = 0.5;
        }
    }

    hide() {
        this.active = false;
        this.container.classList.add('hidden');
        if (this.globe) {
            this.globe.controls().autoRotate = false;
        }
    }

    addAttack(attack) {
        if (!this.initialized) return;

        // Map data to Globe.gl format
        const arc = {
            startLat: attack.src_lat,
            startLng: attack.src_long,
            endLat: attack.dst_lat,
            endLng: attack.dst_long,
            color: attack.color || '#ff0000',
            name: `${attack.src_ip} -> ${attack.dst_ip} (${attack.protocol})`
        };

        const point = {
            lat: attack.src_lat,
            lng: attack.src_long,
            color: attack.color || '#ff0000',
            label: `<b>Attacker:</b> ${attack.src_ip}<br><b>Country:</b> ${attack.country}`
        };

        this.arcsData.push(arc);
        this.pointsData.push(point);

        // Cap data size
        if (this.arcsData.length > this.maxItems) this.arcsData.shift();
        if (this.pointsData.length > this.maxItems) this.pointsData.shift();

        // Update if active
        if (this.active) {
            this.globe.arcsData(this.arcsData);
            this.globe.pointsData(this.pointsData);

            // Interaction: Focus on latest attack sometimes? (Maybe too jumpy)
            // this.globe.pointOfView({ lat: attack.dst_lat, lng: attack.dst_long }, 2000);
        }
    }

    // Restoration support
    addRestoredAttack(event) {
        // Use coordinates if available
        if (event.src_lat && event.src_long && event.dst_lat && event.dst_long) {
            this.addAttack(event);
        }
    }

    handleArcHover(arc) {
        if (arc) {
            this.showInsightOverlay('Attack Stream', {
                'Origin': arc.name.split(' -> ')[0],
                'Target': arc.name.split(' -> ')[1].split(' (')[0],
                'Protocol': arc.name.split('(')[1].replace(')', '')
            });
        } else {
            this.hideInsightOverlay();
        }
    }

    handlePointHover(point) {
        if (point) {
            this.showInsightOverlay('Attacker Profile', {
                'IP': point.label.split('Attacker:</b> ')[1].split('<br>')[0],
                'Region': point.label.split('Country:</b> ')[1] || 'Unknown'
            });
        } else {
            this.hideInsightOverlay();
        }
    }

    showInsightOverlay(title, data) {
        const overlay = document.getElementById('globe-insight-overlay');
        const content = document.getElementById('insight-content');
        const header = overlay.querySelector('.insight-header');

        if (!overlay || !content) return;

        header.textContent = title;
        content.innerHTML = '';
        Object.entries(data).forEach(([key, val]) => {
            const item = document.createElement('div');
            item.className = 'insight-item';
            
            const label = document.createElement('span');
            label.className = 'insight-label';
            label.textContent = `${key}:`;
            
            const value = document.createElement('span');
            value.className = 'insight-value';
            value.textContent = val;
            
            item.appendChild(label);
            item.appendChild(value);
            content.appendChild(item);
        });

        overlay.classList.remove('hidden');
        overlay.style.opacity = '1';
    }

    hideInsightOverlay() {
        const overlay = document.getElementById('globe-insight-overlay');
        if (overlay) {
            overlay.style.opacity = '0';
            setTimeout(() => {
                if (overlay.style.opacity === '0') {
                    overlay.classList.add('hidden');
                }
            }, 300);
        }
    }
}

// Global instance
window.globeView = new GlobeView('globe-3d');
