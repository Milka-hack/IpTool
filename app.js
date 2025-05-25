let map;
let marker;

async function analyzeIP() {
    const ip = document.getElementById('ip-input').value;
    const results = document.getElementById('ip-results');
    results.innerHTML = 'Scanning...';

    try {
        const response = await fetch(`https://ipapi.co/${ip}/json/`);
        const data = await response.json();
        
        let output = `
IP Address: ${data.ip}
Country: ${data.country_name} (${data.country_code})
Region: ${data.region}
City: ${data.city}
ISP: ${data.org}
ASN: ${data.asn}
Timezone: ${data.timezone}
        `;
        
        results.textContent = output;
        
        // Update map
        if(map) map.remove();
        map = L.map('map').setView([data.latitude, data.longitude], 8);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
        if(marker) marker.remove();
        marker = L.marker([data.latitude, data.longitude]).addTo(map);
        
    } catch (error) {
        results.textContent = 'Error fetching IP information';
    }
}

async function dnsLookup() {
    const domain = document.getElementById('domain-input').value;
    const results = document.getElementById('dns-results');
    results.innerHTML = 'Resolving...';

    try {
        const response = await fetch(`https://dns.google/resolve?name=${domain}&type=A`);
        const data = await response.json();
        
        let output = `DNS Records for ${domain}:\n`;
        data.Answer.forEach(record => {
            output += `${record.type}: ${record.data}\n`;
        });
        
        results.textContent = output;
    } catch (error) {
        results.textContent = 'DNS resolution failed';
    }
}

async function startPortScan() {
    const target = document.getElementById('target-ip').value;
    const maxPort = document.getElementById('port-range').value || 1000;
    const results = document.getElementById('port-results');
    const progressBar = document.querySelector('.progress-bar');
    results.innerHTML = '';
    
    let openPorts = [];
    let scannedPorts = 0;
    
    async function checkPort(port) {
        return new Promise((resolve) => {
            const socket = new WebSocket(`ws://${target}:${port}`);
            const timeout = setTimeout(() => {
                socket.close();
                resolve(false);
            }, 500);
            
            socket.onopen = () => {
                clearTimeout(timeout);
                socket.close();
                resolve(true);
            };
            
            socket.onerror = () => {
                clearTimeout(timeout);
                resolve(false);
            };
        });
    }

    for (let port = 1; port <= maxPort; port++) {
        if(await checkPort(port)) {
            openPorts.push(port);
            results.textContent += `Port ${port} : OPEN\n`;
        }
        
        scannedPorts++;
        progressBar.style.width = `${(scannedPorts / maxPort) * 100}%`;
        
        await new Promise(resolve => setTimeout(resolve, 10));
    }
    
    results.textContent += `Scan complete! Open ports: ${openPorts.join(', ')}`;
}

function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    document.getElementById(tabId).classList.add('active');
    event.currentTarget.classList.add('active');
}

// Initialize map with default location
window.onload = function() {
    map = L.map('map').setView([0, 0], 2);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
}