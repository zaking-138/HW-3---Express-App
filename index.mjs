import express from 'express';
import { createElement } from 'react';
// Body Parser to extract user input.
const bodyParser = (await import('body-parser')).default
// states-us Node package for dropdown select.
import states from 'states-us'

const app = express();

// Body Parser configuration, not quite sure what it means...
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.set("view engine", "ejs");
app.use(express.static("public"));

// API Keys.
const keyOpenWeather = '98e6b75875b59ac46ffcb8264b066797';
const keyGoogle = 'AIzaSyBYxbaHrtLgOFMVs420VtMQ4TISsj5MZ80';
const keyGoogleMaps = 'AIzaSyDghK9jwHZrZ5yb7yZAsg1xTsa08rJLHzY';

let previousResponses = []
let responseCounter = 0
let currentPage

app.get('/', async (req, res) => {
   currentPage = 'home'
   res.render('home.ejs', { states, currentPage })
});

async function getData(address) {
   // Pull latitude and longitude of location from Google's geocode API.
   let geoResponse = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${address}&key=${keyGoogle}`)
   let geoData = await geoResponse.json();
   let coordinates = geoData.results[0].geometry.location
   const lat = coordinates.lat
   const lng = coordinates.lng

   // Pull current weather location using OpenWeather.
   let weatherResponse = await fetch(`https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lng}&exclude=minutely,hourly,daily,alerts&units=imperial&appid=${keyOpenWeather}`)
   let weatherData = await weatherResponse.json();
   
   let timestamp = new Date();
   
   record(weatherData, address, timestamp)
   return weatherData;
}

// Captures user queries in an array.
async function record(data, address, date){
   previousResponses[responseCounter] = {number:++responseCounter, date:date, address:address, data:data}
}

// Call getData() with inputted address.
app.post('/getLocation', async function (req, res) {
   let address1 = req.body.inputAddress
   let city = req.body.inputCity
   let state = req.body.inputState
   let address = `${address1}, ${city}, ${state}`

   let weatherData = await getData(address);
   let mapURL = `https://maps.googleapis.com/maps/api/staticmap?center=${city},${state}&zoom=14&size=750x200&key=${keyGoogleMaps}`

   currentPage = 'display'
   res.render('display.ejs', { weatherData, address, states, previousResponses, currentPage, mapURL})
})

// Display copy of display.ejs with only previous queries.
app.get('/seeQueries', async (req, res) => {
   currentPage = 'display'
   res.render('displayNoCurrent.ejs', { previousResponses, currentPage })
});

app.listen(3000, () => {
   console.log('Server Online.');
});