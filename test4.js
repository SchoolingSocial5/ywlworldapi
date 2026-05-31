const mongoose = require('mongoose');
require('dotenv').config();

const { createSocialPlatform } = require('./build/controllers/socialPlatformController.js');

const req = {
  body: { name: 'Test', url: 'https://test.com' },
  file: undefined
};

const res = {
  status: function(s) { console.log('Status:', s); return this; },
  json: function(j) { console.log('JSON:', j); return this; }
};

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/schooling_shop', { family: 4 })
.then(async () => {
  await createSocialPlatform(req, res);
  process.exit(0);
});
