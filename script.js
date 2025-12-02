// Weather Forecast App Script

const API_KEY = 'd72f44f52c83e60b092b3e5dcb640501'; // OpenWeatherMap API key
const BASE_URL = 'https://api.openweathermap.org/data/2.5';
const GEO_URL = 'https://api.openweathermap.org/geo/1.0';

const cityInput = document.getElementById('city-input');
const searchBtn = document.getElementById('search-btn');
const currentLocationBtn = document.getElementById('current-location-btn');
const recentCitiesSelect = document.getElementById('recent-cities');
const recentCitiesContainer = document.getElementById('recent-cities-container');
const currentWeatherDiv = document.getElementById('current-weather');
const cityName = document.getElementById('city-name');
const temperature = document.getElementById('temperature');
const unitToggle = document.getElementById('unit-toggle');
const weatherIcon = document.getElementById('weather-icon');
const weatherDescription = document.getElementById('weather-description');
const feelsLike = document.getElementById('feels-like');
const humidity = document.getElementById('humidity');
const windSpeed = document.getElementById('wind-speed');
const alertDiv = document.getElementById('alert');
const alertMessage = document.getElementById('alert-message');
const extendedForecastDiv = document.getElementById('extended-forecast');
const forecastContainer = document.getElementById('forecast-container');
const errorMessageDiv = document.getElementById('error-message');
const errorText = document.getElementById('error-text');

let isCelsius = true;
let recentCities = JSON.parse(localStorage.getItem('recentCities')) || [];

// Event listeners
searchBtn.addEventListener('click', () => {
    const city = cityInput.value.trim();
    if (city) {
        getWeatherByCity(city);
        addToRecentCities(city);
    } else {
        showError('Please enter a city name.');
    }
});

cityInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        searchBtn.click();
    }
});

currentLocationBtn.addEventListener('click', getWeatherByLocation);

recentCitiesSelect.addEventListener('change', () => {
    const selectedCity = recentCitiesSelect.value;
    if (selectedCity) {
        getWeatherByCity(selectedCity);
    }
});

unitToggle.addEventListener('click', toggleTemperatureUnit);

// Functions
async function getWeatherByCity(city) {
    try {
        hideError();
        const geoResponse = await fetch(`${GEO_URL}/direct?q=${city}&limit=1&appid=${API_KEY}`);
        const geoData = await geoResponse.json();
        
        if (geoData.length === 0) {
            throw new Error('City not found');
        }
        
        const { lat, lon, name } = geoData[0];
        await getWeatherData(lat, lon, name);
    } catch (error) {
        showError('Failed to fetch weather data. Please check the city name and try again.');
    }
}

async function getWeatherByLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(async (position) => {
            const { latitude, longitude } = position.coords;
            try {
                hideError();
                await getWeatherData(latitude, longitude);
            } catch (error) {
                showError('Failed to fetch weather data for your location.');
            }
        }, () => {
            showError('Unable to retrieve your location. Please allow location access.');
        });
    } else {
        showError('Geolocation is not supported by this browser.');
    }
}

async function getWeatherData(lat, lon, cityNameParam = '') {
    const currentResponse = await fetch(`${BASE_URL}/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`);
    const currentData = await currentResponse.json();
    
    const forecastResponse = await fetch(`${BASE_URL}/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`);
    const forecastData = await forecastResponse.json();
    
    displayCurrentWeather(currentData, cityNameParam);
    displayExtendedForecast(forecastData);
    updateBackground(currentData.weather[0].main);
}

function displayCurrentWeather(data, cityNameParam) {
    const city = cityNameParam || data.name;
    cityName.textContent = city;
    
    const temp = Math.round(data.main.temp);
    temperature.textContent = `${temp}°`;
    unitToggle.textContent = 'C';
    isCelsius = true;
    
    weatherDescription.textContent = data.weather[0].description;
    feelsLike.textContent = `Feels like ${Math.round(data.main.feels_like)}°C`;
    humidity.textContent = `Humidity: ${data.main.humidity}%`;
    windSpeed.textContent = `Wind: ${data.wind.speed} m/s`;
    
    const iconCode = data.weather[0].icon;
    weatherIcon.className = `fas ${getWeatherIcon(data.weather[0].main)} text-6xl text-yellow-300 mr-4`;
    
    currentWeatherDiv.classList.remove('hidden');
    
    // Check for extreme temperatures
    if (temp > 40) {
        showAlert('Extreme heat warning! Stay hydrated and avoid prolonged sun exposure.');
    } else {
        hideAlert();
    }
}

function displayExtendedForecast(data) {
    forecastContainer.innerHTML = '';
    
    // Group by day
    const dailyForecasts = {};
    data.list.forEach(item => {
        const date = new Date(item.dt * 1000).toDateString();
        if (!dailyForecasts[date]) {
            dailyForecasts[date] = [];
        }
        dailyForecasts[date].push(item);
    });
    
    Object.keys(dailyForecasts).slice(0, 5).forEach(date => {
        const dayData = dailyForecasts[date][0]; // Take first entry for the day
        const card = createForecastCard(date, dayData);
        forecastContainer.appendChild(card);
    });
    
    extendedForecastDiv.classList.remove('hidden');
}

function createForecastCard(date, data) {
    const card = document.createElement('div');
    card.className = 'bg-white bg-opacity-20 rounded-lg p-4 text-white text-center';
    
    const dayName = new Date(date).toLocaleDateString('en-US', { weekday: 'short' });
    const temp = Math.round(data.main.temp);
    const humidity = data.main.humidity;
    const wind = data.wind.speed;
    
    card.innerHTML = `
        <h4 class="font-bold mb-2">${dayName}</h4>
        <i class="fas ${getWeatherIcon(data.weather[0].main)} text-3xl mb-2"></i>
        <p class="text-lg font-bold">${temp}°C</p>
        <div class="flex justify-between text-sm mt-2">
            <span><i class="fas fa-tint"></i> ${humidity}%</span>
            <span><i class="fas fa-wind"></i> ${wind} m/s</span>
        </div>
    `;
    
    return card;
}

function getWeatherIcon(condition) {
    const icons = {
        'Clear': 'fa-sun',
        'Clouds': 'fa-cloud',
        'Rain': 'fa-cloud-rain',
        'Drizzle': 'fa-cloud-rain',
        'Thunderstorm': 'fa-bolt',
        'Snow': 'fa-snowflake',
        'Mist': 'fa-smog',
        'Fog': 'fa-smog',
        'Haze': 'fa-smog'
    };
    return icons[condition] || 'fa-sun';
}

function updateBackground(condition) {
    const body = document.body;
    body.className = 'min-h-screen font-sans';
    
    if (condition === 'Rain') {
        body.classList.add('bg-gradient-to-br', 'from-gray-400', 'to-gray-600');
    } else if (condition === 'Clear') {
        body.classList.add('bg-gradient-to-br', 'from-blue-400', 'to-blue-600');
    } else if (condition === 'Clouds') {
        body.classList.add('bg-gradient-to-br', 'from-gray-300', 'to-gray-500');
    } else {
        body.classList.add('bg-gradient-to-br', 'from-blue-400', 'to-blue-600');
    }
}

function toggleTemperatureUnit() {
    const currentTemp = parseInt(temperature.textContent);
    if (isCelsius) {
        const fahrenheit = Math.round((currentTemp * 9/5) + 32);
        temperature.textContent = `${fahrenheit}°`;
        unitToggle.textContent = 'F';
    } else {
        const celsius = Math.round((currentTemp - 32) * 5/9);
        temperature.textContent = `${celsius}°`;
        unitToggle.textContent = 'C';
    }
    isCelsius = !isCelsius;
}

function addToRecentCities(city) {
    if (!recentCities.includes(city)) {
        recentCities.unshift(city);
        if (recentCities.length > 5) {
            recentCities.pop();
        }
        localStorage.setItem('recentCities', JSON.stringify(recentCities));
        updateRecentCitiesDropdown();
    }
}

function updateRecentCitiesDropdown() {
    recentCitiesSelect.innerHTML = '<option value="">Recently Searched Cities</option>';
    recentCities.forEach(city => {
        const option = document.createElement('option');
        option.value = city;
        option.textContent = city;
        recentCitiesSelect.appendChild(option);
    });
    
    if (recentCities.length > 0) {
        recentCitiesContainer.classList.remove('hidden');
    }
}

function showAlert(message) {
    alertMessage.textContent = message;
    alertDiv.classList.remove('hidden');
}

function hideAlert() {
    alertDiv.classList.add('hidden');
}

function showError(message) {
    errorText.textContent = message;
    errorMessageDiv.classList.remove('hidden');
}

function hideError() {
    errorMessageDiv.classList.add('hidden');
}

// Initialize
updateRecentCitiesDropdown();