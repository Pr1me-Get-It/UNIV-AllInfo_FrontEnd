const axios = require('axios');
const fs = require('fs');

const DAEGU_BUS_BASE_URL = 'https://apis.data.go.kr/6270000/dbmsapi02';
const SERVICE_KEY = '129f41f2a3bbb9e547274c2f8667a42c2ebc5dd45f29ab937050f25a061e6710';
const STATION_ID = '7011010100'; // 경북대 경상대학앞
const WINC_ID = '00318';

async function testApi(paramName, paramValue) {
    try {
        const response = await axios.get(`${DAEGU_BUS_BASE_URL}/getRealtime02`, {
            params: {
                [paramName]: paramValue,
                serviceKey: SERVICE_KEY,
            }
        });

        return {
            param: paramName,
            value: paramValue,
            success: true,
            status: response.status,
            data: response.data
        };
    } catch (error) {
        return {
            param: paramName,
            value: paramValue,
            success: false,
            error: error.message
        };
    }
}

async function runTests() {
    console.log('Testing various parameters...');
    const results = [];

    // Test stationId
    results.push(await testApi('stationId', STATION_ID));

    // Test bstopId (mobile ID)
    results.push(await testApi('bstopId', WINC_ID));
    results.push(await testApi('bstopId', STATION_ID));

    // Test nodeId
    results.push(await testApi('nodeId', STATION_ID));
    results.push(await testApi('nodeId', WINC_ID));

    // Test wincId
    results.push(await testApi('wincId', WINC_ID));

    fs.writeFileSync('testOutput.json', JSON.stringify(results, null, 2));
    console.log('Results written to testOutput.json');
}

runTests();
