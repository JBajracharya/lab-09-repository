'use strict';
//DEPENDENCIES
const PORT = process.env.PORT || 3040;
const express = require('express');
const cors = require('cors');
const superagent = require('superagent');
const pg = require('pg');
require('dotenv').config();
const app = express();
app.use(cors());

// GLOBAL VARIABLES
let error = {
  status: 500,
  responseText: 'Sorry, something went wrong',
}
const GEOCODE_API_KEY = process.env.GEOCODE_API_KEY;
const WEATHER_API_KEY = process.env.DARKSKY_API_KEY;
const EVENTBRITE_API_KEY = process.env.EVENTFUL_API_KEY;
const DATABASE_URL = process.env.DATABASE_URL;
let query;
let locationSubmitted;

const client = new pg.Client(`${DATABASE_URL}`);
client.on('error', error => console.log(error));
client.connect();


// LOCATION CONSTRUCTOR FUNCTION
function Geolocation(searchquery, formAddr, lat, lng) {
  this.searchquery = searchquery;
  this.formatted_query = formAddr;
  this.latitude = lat;
  this.longitude = lng;
}

// Event CONSTRUCTOR FUNCTION
function Event(link, name, event_date, summary = 'none') {
  this.link = link,
  this.name = name,
  this.event_date = event_date,
  this.summary = summary
}

// FORECAST CONSTRUCTOR FUNCTION
function Forecast(summary, time) {
  this.forecast = summary;
  this.time = (new Date(time * 1000)).toDateString();
}

function getWeaterData(request, response) {
  const sql = 'SELECT * FROM cityLocation WHERE searchQuery = $1';
  client.query(sql, [query]).then(sqlResponse => {
  superagent.get(`https://api.darksky.net/forecast/${WEATHER_API_KEY}/${sqlResponse.rows[0].latitude},${sqlResponse.rows[0].longitude}`).then(res => {
    const weatherArr = res.body.daily.data;
    console.log('fdafdaf', res);
    const reply = weatherArr.map(byDay => {
      return new Forecast(byDay.summary, byDay.time);
    })
    response.send(reply);
  })
});
}

app.get('/events', (request, response) => {
  const sql = 'SELECT * FROM cityLocation WHERE searchQuery = $1';
  client.query(sql, [query]).then(sqlResponse => {

    // console.log(sqlResponse);
    superagent.get(`http://api.eventful.com/json/events/search?where=${sqlResponse.rows[0].latitude},${sqlResponse.rows[0].longitude}&within=25&app_key=${EVENTBRITE_API_KEY}`).then(res => {
      let events = JSON.parse(res.text);
      let moreEvents = events.events.event
      let eventData = moreEvents.map(event => {
        return new Event(event.url, event.title, event.start_time, event.description)
      })
      response.send(eventData);
    }).catch(function () {
      console.log('banana');
      return null;
    })
  })
});


function getGeoData(request, response) {
  query = request.query.data;
  const sql = 'SELECT * FROM cityLocation WHERE searchQuery = $1';
  client.query(sql, [query]).then(sqlResponse => {
    if (sqlResponse.rowCount > 0) {
      response.send(sqlResponse.rows[0]);
      // console.log(sqlResponse.rows[0]);
    } else {
      createDataFromAPI(request, response, query);
    }
  });
}

function createDataFromAPI(request, response, query) {
  superagent.get(`https://maps.googleapis.com/maps/api/geocode/json?address=${query}&key=${GEOCODE_API_KEY}`).then(geoResponse => {
    const location = geoResponse.body.results[0].geometry.location;
    console.log('12121', geoResponse.body.results[0].geometry.location);
    const formAddr = geoResponse.body.results[0].formatted_address;
    locationSubmitted = new Geolocation(query, formAddr, location.lat, location.lng);
    const sqlValu = [locationSubmitted.searchquery, locationSubmitted.formatted_query, locationSubmitted.latitude, locationSubmitted.longitude];
    const SQL = `INSERT INTO cityLocation(
      searchQuery, formattedQuery, latitude, longitude
      ) VALUES (
        $1, $2, $3, $4
        )`;
    client.query(SQL, sqlValu);
    response.send(locationSubmitted);
  })
}

// LOCATION PATH
app.get('/location', getGeoData);

// WEATHER PATH
app.get('/weather', getWeaterData);

app.listen(PORT, () => {
  console.log(`App is on PORT: ${PORT}`);
});

