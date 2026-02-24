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

console.log('Use Token:', token);

const http = require('http');

function postSafeEntry() {
  const data = JSON.stringify({
    month: 'February',
    date: new Date().toISOString(),
    description: 'Test Entry',
    incoming: 100,
    incomingMethod: 'cash',
    outgoing: 0,
    outgoingMethod: '',
    balance: 100
  });

  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/safe',
    method: 'POST',
    headers: {
      'Cookie': cookie,
      'Content-Type': 'application/json',
      'Content-Length': data.length
    }
  };

  const req = http.request(options, (res) => {
    let responseBody = '';
    res.on('data', chunk => responseBody += chunk);
    res.on('end', () => {
      console.log(`POST /api/safe Status: ${res.statusCode}`);
      console.log('Response Body:', responseBody);
    });
  });

  req.on('error', (e) => {
    console.error(`Error: ${e.message}`);
  });

  req.write(data);
  req.end();
}

postSafeEntry();
