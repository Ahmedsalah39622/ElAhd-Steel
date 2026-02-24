const http = require('http');

function checkEndpoint(path) {
  return new Promise((resolve) => {
    http.get(`http://localhost:3000${path}`, (res) => {
      console.log(`${path}: Status ${res.statusCode}`);
      resolve(res.statusCode);
    }).on('error', (e) => {
      console.error(`${path}: Error ${e.message}`);
      resolve(500);
    });
  });
}

async function run() {
  console.log('Checking API Endpoints...');
  
  // List of endpoints to check
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
