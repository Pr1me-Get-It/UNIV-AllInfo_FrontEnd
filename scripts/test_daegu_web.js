const axios = require('axios');
const fs = require('fs');

async function testWebScraping() {
    try {
        console.log('Fetching from Daegu Bus Web for WINC ID: 00318 ...');
        const response = await axios.get('https://businfo.daegu.go.kr/ba/arrbus/arrbus.do?act=arrbus&wincId=00318', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });

        fs.writeFileSync('daegu_web.html', response.data);
        console.log('Saved Daegu Web HTML to daegu_web.html');

        // Also check if they have a known public station ID in the HTML
        const stationIdMatch = response.data.match(/bsId=['"]?(\d+)['"]?/i) || response.data.match(/stationId=['"]?(\d+)['"]?/i);
        if (stationIdMatch) {
            console.log('Found Station ID in HTML (bsId/stationId):', stationIdMatch[1]);
        }

        // Let's check dongdaegu station code: wincId 02123
        const response2 = await axios.get('https://businfo.daegu.go.kr/ba/arrbus/arrbus.do?act=arrbus&wincId=02123', {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
        });
        fs.writeFileSync('daegu_web_dongdaegu.html', response2.data);
        const match2 = response2.data.match(/bsId=['"]?(\d+)['"]?/i);
        if (match2) console.log('Dongdaegu bsId:', match2[1]);

    } catch (e) {
        console.error('Web Scraping failed:', e.message);
    }
}

testWebScraping();
