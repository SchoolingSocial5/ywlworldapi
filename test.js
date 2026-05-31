const http = require('http');

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  }
};

const req = http.request(options, res => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const token = JSON.parse(data).token;
    console.log("Token:", token);
    
    // Now post to social media
    const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
    const postData = `--${boundary}\r\nContent-Disposition: form-data; name="name"\r\n\r\nTestChannel\r\n--${boundary}--`;
    
    const req2 = http.request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/admin/social-media/platforms',
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Authorization': `Bearer ${token}`
      }
    }, res2 => {
      let data2 = '';
      res2.on('data', chunk => data2 += chunk);
      res2.on('end', () => console.log("Response:", res2.statusCode, data2));
    });
    req2.write(postData);
    req2.end();
  });
});
req.write(JSON.stringify({email: 'admin@example.com', password: 'password'}));
req.end();
