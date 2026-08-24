/**
 * CyberPot Audio HUD
 * Handles real-time audio alerts for cybersecurity events using Web Audio API
 */

class AudioHUD {
    constructor() {
        this.context = null;
        this.enabled = localStorage.getItem('sound-alerts') === 'true';
        this.selectedSound = localStorage.getItem('alert-sound') || 'beep';
        this.initialized = false;

        // Volume control
        this.masterVolume = 0.3;
    }

    init() {
        if (this.initialized) return;

        try {
            this.context = new (window.AudioContext || window.webkitAudioContext)();
            this.initialized = true;
            console.log('[AUDIO] Audio HUD initialized');
        } catch (e) {
            console.error('[AUDIO] Failed to initialize AudioContext:', e);
        }
    }

    // High-frequency Digital Beep
    playBeep(frequency = 880, duration = 0.1, type = 'sine') {
        if (!this.enabled || !this.initialized) return;
        if (this.context.state === 'suspended') this.context.resume();

        const osc = this.context.createOscillator();
        const gain = this.context.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(frequency, this.context.currentTime);

        gain.gain.setValueAtTime(this.masterVolume, this.context.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + duration);

        osc.connect(gain);
        gain.connect(this.context.destination);

        osc.start();
        osc.stop(this.context.currentTime + duration);
    }

    // Cyber Security Notification (Double Beep)
    playNotification() {
        this.playBeep(660, 0.05, 'square');
        setTimeout(() => this.playBeep(880, 0.1, 'square'), 100);
    }

    // Critical Alert (Siren-like)
    playCriticalAlert() {
        const duration = 0.5;
        const osc = this.context.createOscillator();
        const gain = this.context.createGain();

        osc.frequency.setValueAtTime(440, this.context.currentTime);
        osc.frequency.linearRampToValueAtTime(880, this.context.currentTime + duration / 2);
        osc.frequency.linearRampToValueAtTime(440, this.context.currentTime + duration);

        gain.gain.setValueAtTime(this.masterVolume, this.context.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + duration);

        osc.connect(gain);
        gain.connect(this.context.destination);

        osc.start();
        osc.stop(this.context.currentTime + duration);
    }

    // Retro Video Game Effect
    playRetro() {
        if (!this.enabled || !this.initialized) return;
        if (this.context.state === 'suspended') this.context.resume();

        const osc = this.context.createOscillator();
        const gain = this.context.createGain();
        osc.type = 'sawtooth';

        let now = this.context.currentTime;
        osc.frequency.setValueAtTime(100, now);
        osc.frequency.exponentialRampToValueAtTime(1000, now + 0.1);

        gain.gain.setValueAtTime(this.masterVolume, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

        osc.connect(gain);
        gain.connect(this.context.destination);
        osc.start();
        osc.stop(now + 0.1);
    }

    trigger(type = 'traffic') {
        if (!this.enabled) return;
        this.init(); // Late init for browser policy

        switch (this.selectedSound) {
            case 'beep':
                this.playBeep();
                break;
            case 'notification':
                this.playNotification();
                break;
            case 'alert':
                this.playCriticalAlert();
                break;
            case 'retro_videogame':
                this.playRetro();
                break;
        }
    }

    setEnabled(enabled) {
        this.enabled = enabled;
        localStorage.setItem('sound-alerts', enabled);
        if (enabled) this.init();
    }

    setSound(soundType) {
        this.selectedSound = soundType;
        localStorage.setItem('alert-sound', soundType);
        this.trigger(); // Play a preview
    }
}

// Global instance
window.audioHud = new AudioHUD();
