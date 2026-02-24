const jwt = require('jsonwebtoken');

// Use matching secret and cookie name from login.js
const JWT_SECRET = process.env.JWT_SECRET || 'dev-jwt-secret';
const COOKIE_NAME = process.env.AUTH_COOKIE_NAME || 'token';

// Create a token for the existing test user (id: 27, email: 'test@gmail.com')
const payload = {
  id: 27,
  name: 'Tester',
  email: 'test@gmail.com'
};

const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
const cookie = `${COOKIE_NAME}=${token}`;

console.log('Generated Test Token:', token);
console.log('Cookie Header:', cookie);

const http = require('http');

function checkEndpoint(path) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: 'GET',
      headers: {
        'Cookie': cookie,
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log(`${path}: Status ${res.statusCode}`);
        if (res.statusCode !== 200) {
           console.log('Response:', data.substring(0, 200)); // Log first 200 chars of error
        }
        resolve(res.statusCode);
      });
    });

    req.on('error', (e) => {
      console.error(`${path}: Error ${e.message}`);
      resolve(500);
    });

    req.end();
  });
}

async function run() {
  console.log('Checking API Endpoints with Authentication...');
  
  const endpoints = [
    '/api/clients', 
    '/api/inventory', 
    '/api/suppliers',
    '/api/dashboard-stats',
    '/api/projects'
  ];

  for (const endpoint of endpoints) {
    await checkEndpoint(endpoint);
  }
}

run();
