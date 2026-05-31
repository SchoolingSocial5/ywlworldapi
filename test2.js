const fs = require('fs');
const http = require('http');
const FormData = require('form-data');

const req = http.request({
  hostname: 'localhost',
  port: 5000,
  path: '/api/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  }
}, res => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const token = JSON.parse(data).token;
    
    // Now post to social media
    const form = new FormData();
    form.append('name', 'TestChannel');
    form.append('url', 'https://test.com');
    // form.append('icon', fs.createReadStream('test2.js'));
    
    const req2 = http.request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/admin/social-media/platforms',
      method: 'POST',
      headers: {
        ...form.getHeaders(),
        'Authorization': `Bearer ${token}`
      }
    }, res2 => {
      let data2 = '';
      res2.on('data', chunk => data2 += chunk);
      res2.on('end', () => console.log("Response:", res2.statusCode, data2));
    });
    form.pipe(req2);
  });
});
req.write(JSON.stringify({email: 'admin@example.com', password: 'password'}));
req.end();
