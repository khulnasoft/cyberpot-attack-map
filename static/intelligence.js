/**
 * CyberPot Threat Intelligence & Classification
 * Heuristic engine for identifying attack patterns and intent
 */

class AttackClassifier {
    constructor() {
        this.patterns = [
            {
                id: 'brute_force',
                name: 'Brute Force Attempt',
                description: 'Repeated connection attempts to authentication services.',
                criteria: (msg) => ['SSH', 'TELNET', 'FTP', 'RDP', 'ADB'].includes(msg.protocol),
                severity: 'medium'
            },
            {
                id: 'industrial_sabotage',
                name: 'Industrial ICS Target',
                description: 'Attempt to interact with SCADA or Industrial Control Systems (ICS).',
                criteria: (msg) => ['SCADA', 'INDUSTRIAL', 'IEC104', 'MODBUS', 'BACNET', 'S7COMM'].includes(msg.protocol),
                severity: 'critical'
            },
            {
                id: 'ransomware_recon',
                name: 'Ransomware Recon',
                description: 'Scanning for SMB/DirectPlay services often used in lateral movement.',
                criteria: (msg) => ['SMB', 'NBNS', 'DIRECTPLAY', 'MICROSOFT-DS'].includes(msg.protocol),
                severity: 'critical'
            },
            {
                id: 'database_exfiltration',
                name: 'Database Discovery',
                description: 'Scanning or attempting to access database services.',
                criteria: (msg) => ['SQL', 'MYSQL', 'POSTGRESQL', 'MONGODB', 'REDIS', 'ORACLE', 'MSSQL', 'CASSANDRA'].includes(msg.protocol),
                severity: 'high'
            },
            {
                id: 'voip_hijack',
                name: 'VoIP Signaling Probe',
                description: 'Probing for SIP/VoIP vulnerabilities or toll fraud.',
                criteria: (msg) => ['SIP', 'IAX', 'MGCP', 'H323', 'SKYPE'].includes(msg.protocol),
                severity: 'medium'
            },
            {
                id: 'proxy_abuse',
                name: 'Proxy Node Search',
                description: 'Searching for open proxies or SOCKS nodes to anonymize traffic.',
                criteria: (msg) => ['SOCKS', 'HTTP-PROXY', 'SOCKS4', 'SOCKS5', 'TOR'].includes(msg.protocol),
                severity: 'medium'
            },
            {
                id: 'web_exploit',
                name: 'Web Vulnerability Scan',
                description: 'Probing web servers for vulnerabilities (Log4j, SQLi, etc).',
                criteria: (msg) => ['HTTP', 'HTTPS', 'HTTP-ALT', 'WEB'].includes(msg.protocol),
                severity: 'medium'
            },
            {
                id: 'brute_force',
                name: 'Brute Force Attempt',
                description: 'Repeated connection attempts to authentication services.',
                criteria: (msg) => ['SSH', 'TELNET', 'FTP', 'RDP', 'ADB', 'VNC', 'RLOGIN'].includes(msg.protocol),
                severity: 'medium'
            },
            {
                id: 'iot_botnet',
                name: 'IoT Botnet Propagation',
                description: 'Targeting common IoT/Embedded device ports.',
                criteria: (msg) => ['MQTT', 'UPNP', 'TR-069', 'SSDP', 'WINS', 'COAP', 'HNAP'].includes(msg.protocol),
                severity: 'medium'
            }
        ];
    }

    /**
     * Classifies an incoming attack message
     * @param {Object} msg - The attack message from WebSocket
     * @returns {Object} Enrichment data with classification
     */
    classify(msg) {
        let classification = {
            id: 'generic_attack',
            name: 'Generic Threat',
            description: 'Unclassified automated scanning or connection attempt.',
            severity: 'low',
            tags: []
        };

        // Find the first matching pattern
        for (const pattern of this.patterns) {
            if (pattern.criteria(msg)) {
                classification = { ...pattern, tags: [pattern.id] };
                break;
            }
        }

        // Add contextual tags
        if (msg.ip_rep && msg.ip_rep.toLowerCase().includes('attacker')) {
            classification.tags.push('known_malicious');
        }

        return classification;
    }

    getSeverityColor(severity) {
        switch (severity) {
            case 'critical': return '#ff0000';
            case 'high': return '#ff6600';
            case 'medium': return '#ffcc00';
            case 'low': return '#00ccff';
            default: return '#78909C';
        }
    }
}

window.attackClassifier = new AttackClassifier();
