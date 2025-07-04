const app = require('./server');

const port = process.env.PORT || 3000;
const host = process.env.HOST || '0.0.0.0';


app.listen(port, host, () => {
  console.log(`Server is running at http://${host}:${port}`);
});