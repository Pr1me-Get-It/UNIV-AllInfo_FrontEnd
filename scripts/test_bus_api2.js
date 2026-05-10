const axios = require('axios');
const fs = require('fs');

const DAEGU_BUS_BASE_URL = 'https://apis.data.go.kr/6270000/dbmsapi02';
const SERVICE_KEY = '129f41f2a3bbb9e547274c2f8667a42c2ebc5dd45f29ab937050f25a061e6710';
const STATION_ID = '7011010100'; // 경북대 경상대학앞

async function testApi(paramMap) {
    try {
        const params = {
            ...paramMap,
            serviceKey: SERVICE_KEY,
        };
        const response = await axios.get(`${DAEGU_BUS_BASE_URL}/getRealtime02`, { params });

        return {
            requestParams: paramMap,
            success: true,
            status: response.status,
            totalCount: response.data.body?.totalCount,
            items: response.data.body?.items,
            msg: response.data.body?.msg
        };
    } catch (error) {
        return {
            requestParams: paramMap,
            success: false,
            error: error.message
        };
    }
}

async function runTests() {
    console.log('Testing more parameter combinations...');
    const results = [];

    // Test bsId
    results.push(await testApi({ bsId: STATION_ID }));
    // Test busStopId
    results.push(await testApi({ busStopId: STATION_ID }));
    // Test stopId
    results.push(await testApi({ stopId: STATION_ID }));
    // Test stnnId
    results.push(await testApi({ stnnId: STATION_ID }));
    // Test stId
    results.push(await testApi({ stId: STATION_ID }));

    fs.writeFileSync('testOutput2.json', JSON.stringify(results, null, 2));
    console.log('Results written to testOutput2.json');
}

runTests();
