/* eslint-disable no-console */
const autocannon = require('autocannon');

const url = process.env.BENCHMARK_URL || 'http://localhost:3000/api/hints';
const duration = Number(process.env.BENCHMARK_DURATION || 30);
const connections = Number(process.env.BENCHMARK_CONNECTIONS || 20);

const payload = JSON.stringify({
    message: 'Can I get a hint for a two-sum style array problem?',
    problemInfo: {
        id: 'benchmark-two-sum',
        title: 'Two Sum',
        description: 'Find two numbers that add up to target.',
        code: 'function twoSum(nums, target) {}',
        difficulty: 'Easy',
        language: 'JavaScript',
        tags: ['Array', 'Hash Table']
    }
});

const instance = autocannon({
    url,
    method: 'POST',
    duration,
    connections,
    headers: {
        'content-type': 'application/json'
    },
    body: payload
}, (error, result) => {
    if (error) {
        console.error('Benchmark failed:', error);
        process.exitCode = 1;
        return;
    }

    const p95 = result.latency.p95;
    const avg = result.latency.average;
    const requestsPerSec = result.requests.average;

    console.log('\nBenchmark summary');
    console.log('-----------------');
    console.log(`URL: ${url}`);
    console.log(`Duration: ${duration}s`);
    console.log(`Connections: ${connections}`);
    console.log(`Average latency (ms): ${avg}`);
    console.log(`P95 latency (ms): ${p95}`);
    console.log(`Average requests/sec: ${requestsPerSec}`);

    if (p95 >= 2000) {
        console.log('Result: p95 latency is above 2 seconds.');
    } else {
        console.log('Result: p95 latency is under 2 seconds.');
    }
});

autocannon.track(instance, { renderProgressBar: true });
