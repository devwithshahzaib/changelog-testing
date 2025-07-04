const express = require('express');
const app = express();

app
  .get('/', (req, res) => {
    res.send('Hello World');
  })
  .use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    res.status(404).send('Not Found');
    next();
  })
  .use((err, req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    console.error(err.stack);
    res.status(500).send('Something broke!');
  });

module.exports = app;
