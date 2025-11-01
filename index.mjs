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
})

app.get('/getCoordinates', async(req, res) => {
   currentPage = 'coordinates'
   res.render('coordinates.ejs', {currentPage, previousResponses})
})

async function getCoords(url) {
   let geoResponse = await fetch(url)
   let geoData = await geoResponse.json();
   let coordinates = geoData.results[0].geometry.location
   const lat = coordinates.lat
   const lng = coordinates.lng
   return {
      lat: lat,
      lng: lng
   }
}

async function getData(address) {
   // Pull latitude and longitude of location from Google's geocode API.
   let geoURL = `https://maps.googleapis.com/maps/api/geocode/json?address=${address}&key=${keyGoogle}`
   const coords = await getCoords(geoURL);
   console.log(coords)

   // Pull current weather location using OpenWeather.
   let weatherResponse = await fetch(`https://api.openweathermap.org/data/3.0/onecall?lat=${coords.lat}&lon=${coords.lng}&exclude=minutely,hourly,daily,alerts&units=imperial&appid=${keyOpenWeather}`)
   let weatherData = await weatherResponse.json();
   
   let timestamp = new Date();
   
   record(weatherData, address, timestamp, coords)
   return weatherData;
}

// Captures user queries in an array.
async function record(data, address, date, coords){
   previousResponses[responseCounter] = {number:++responseCounter, date:date, coords:coords, address:address, data:data}
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