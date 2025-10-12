#!/usr/bin/env node

import qrcode from 'qrcode-terminal';

// Get URL from command line or use default
const url = process.argv[2] || 'http://192.168.0.169:3000/pay-and-pickup';

console.log('\n📱 Scan this QR code with your phone:\n');
qrcode.generate(url, { small: true });
console.log('\nURL:', url);
console.log('\nTip: Run with custom URL: node generateQR.js https://your-url.com\n');
