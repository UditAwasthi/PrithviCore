const express = require('express');
const router = express.Router();
const axios = require('axios');
const { protect } = require('../middleware/auth');

const OWAPI = process.env.OPENWEATHER_BASE_URL || 'https://api.openweathermap.org/data/2.5';
const API_KEY = process.env.OPENWEATHER_API_KEY;

// ─── GET /api/weather ────────────────────────────────────
router.get('/weather', protect, async (req, res) => {
  try {
    const { city, lat, lon } = req.query;

    // Use user's farm location if no query params
    const queryLat  = lat  || req.user.farm_location?.lat;
    const queryLon  = lon  || req.user.farm_location?.lon;
    const queryCity = city || req.user.farm_location?.city || 'Delhi';

    if (!API_KEY) {
      return res.status(503).json({ error: 'Weather API key not configured' });
    }

    let currentUrl, forecastUrl;

    if (queryLat && queryLon) {
      currentUrl  = `${OWAPI}/weather?lat=${queryLat}&lon=${queryLon}&appid=${API_KEY}&units=metric`;
      forecastUrl = `${OWAPI}/forecast?lat=${queryLat}&lon=${queryLon}&appid=${API_KEY}&units=metric&cnt=8`;
    } else {
      currentUrl  = `${OWAPI}/weather?q=${queryCity}&appid=${API_KEY}&units=metric`;
      forecastUrl = `${OWAPI}/forecast?q=${queryCity}&appid=${API_KEY}&units=metric&cnt=8`;
    }

    const [currentRes, forecastRes] = await Promise.all([
      axios.get(currentUrl, { timeout: 10000 }),
      axios.get(forecastUrl, { timeout: 10000 }),
    ]);

    const c = currentRes.data;
    const f = forecastRes.data;

    res.json({
      current: {
        city:        c.name,
        country:     c.sys.country,
        temperature: c.main.temp,
        feels_like:  c.main.feels_like,
        humidity:    c.main.humidity,
        pressure:    c.main.pressure,
        description: c.weather[0].description,
        icon:        c.weather[0].icon,
        wind_speed:  c.wind.speed,
        wind_dir:    c.wind.deg,
        visibility:  c.visibility,
        clouds:      c.clouds.all,
        sunrise:     c.sys.sunrise,
        sunset:      c.sys.sunset,
        uvi:         c.uvi || null,
      },
      forecast: f.list.map(item => ({
        time:        item.dt,
        temperature: item.main.temp,
        feels_like:  item.main.feels_like,
        humidity:    item.main.humidity,
        description: item.weather[0].description,
        icon:        item.weather[0].icon,
        rain:        item.rain?.['3h'] || 0,
        wind_speed:  item.wind.speed,
      })),
    });
  } catch (err) {
    if (err.response?.status === 401) {
      return res.status(503).json({ error: 'Invalid OpenWeather API key' });
    }
    if (err.response?.status === 404) {
      return res.status(404).json({ error: 'City not found' });
    }
    console.error('[WEATHER ERROR]', err.message);
    res.status(500).json({ error: 'Failed to fetch weather data' });
  }
});

module.exports = router;
