const https = require('https');

const apiKey = 'sk_87cfe203464e933c43f88042b9e5b6fed7e00c22ffe42cef';

const options = {
    hostname: 'api.elevenlabs.io',
    path: '/v1/voices',
    method: 'GET',
    headers: {
        'xi-api-key': apiKey
    }
};

const req = https.request(options, (res) => {
    console.log(`statusCode: ${res.statusCode}`);

    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        if (res.statusCode === 200) {
            const voices = JSON.parse(data).voices;
            console.log(`Successfully fetched ${voices.length} voices.`);
            console.log('Available Voices:');
            voices.forEach(v => console.log(`- ${v.name} (${v.voice_id})`));
        } else {
            console.log('Error response:', data);
        }
    });
});

req.on('error', (error) => {
    console.error(error);
});

req.end();
