const express = require('express');
const app = express();
const port = process.env.PORT || 3000;
const host = process.env.HOST || '0.0.0.0';

app.get('/', (req, res) => {
  console.log(`${req.method} ${req.url}`);
  res.send('Hello World');
})
.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  res.status(404).send('Not Found');
})
.use((err, req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

app.listen(port, host, () => {
  console.log(`Server is running at http://${host}:${port}`);
});
