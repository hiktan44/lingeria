const fs = require('fs');

async function test() {
  const base64Str = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
  const buffer = Buffer.from(base64Str, 'base64');
  const blob = new Blob([buffer], { type: 'image/png' });
  const form = new FormData();
  form.append('file', blob, 'test.png');

  const res = await fetch('https://kieai.redpandaai.co/api/file-stream-upload', {
    method: 'POST',
    headers: { Authorization: 'Bearer 4c38be77aef6c7fa2c67c60f04a12ec2' },
    body: form
  });

  const data = await res.json();
  console.log(data);
}
test();
