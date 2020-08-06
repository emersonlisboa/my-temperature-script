const mongoose = require('mongoose');
const sensor = require("node-dht-sensor").promises;


const PIN = 22
const SENSOR_TYPE = 22
const READ_TIMER = 10000
const MEASUREMENT_COLLECTION = 'Measurements';
import schema from './model/measurement_model'

var Model = mongoose.model("model", schema, MEASUREMENT_COLLECTION);

const dotenv = require('dotenv');
dotenv.config();

const { DB_CONNECTION } = process.env;

console.log('Iniciando conexão ao MongoDB...');
mongoose.connect(
  DB_CONNECTION,
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  },
  (err) => {
    if (err) {
      console.error(`Erro na conexão ao MongoDB - ${err}`);
      process.exit(1);
    }
  }
);

const { connection } = mongoose;

connection.once('open', () => {
  console.log('Conectado ao MongoDB');
  recreateCollections();
});

async function recreateCollections() {
  console.log('Eliminando as collections...');
  await dropCollections();

  console.log('Recriando as collections...');
  await createCollections();

  console.log('Preenchendo os documentos das collections...');


  setInterval(function () {
    populateCollections()
  }, READ_TIMER);



  // connection.close();
  // console.log('Processamento finalizado!');
}

async function dropCollections() {
  const promiseMeasurements = new Promise((resolve, reject) => {
    connection.db
      .dropCollection(MEASUREMENT_COLLECTION)
      .then(() => {
        resolve();
      })
      .catch((err) => {
        if (err.code === 26) {
          resolve();
          return;
        }

        reject(err);
      });
  });

  await Promise.all([promiseMeasurements]);
}

async function createCollections() {
  const promiseMeasurements = new Promise((resolve, reject) => {
    connection.db
      .createCollection(MEASUREMENT_COLLECTION)
      .then(() => {
        resolve();
      })
      .catch((err) => {
        reject(err);
      });
  });

  await Promise.all([promiseMeasurements]);
}


async function populateCollections() {
  const promiseMeasurements = new Promise(async (resolve, reject) => {
    try {
      var res = await sensor.read(SENSOR_TYPE, PIN);
      var d = new Date()
      var n = d.toLocaleString()
    } catch{
      reject(err)
    }

    let temperatura = res.temperature.toFixed(1)
    let umidade = res.humidity.toFixed(1)

    var doc1 = new Model({
      sensor_name: "Freezer01",
      temperature: temperatura,
      humidity: umidade
    });

    doc1.save(function (err, doc) {
      if (err) return console.error(err);
      console.log(
        `Date: ${n}, ` +
        `temp: ${res.temperature.toFixed(1)} °C, ` +
        `humidity: ${res.humidity.toFixed(1)}% `
      );
    });

  });

  await Promise.all([promiseMeasurements]);
}

