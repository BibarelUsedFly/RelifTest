require('dotenv').config();
const Koa = require('koa');
const KoaJSON = require('koa-json');
const router = require('./router');
const bodyParser = require('koa-bodyparser');

const app = new Koa();

// Para procesar el cuerpo de las POST requests
app.use(bodyParser()); 
// Para que la respuesta se vea bonita
app.use(KoaJSON()); 
app.use(router.routes());
app.use(router.allowedMethods());

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Ready on port ${PORT}`);
});
