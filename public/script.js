document.addEventListener('DOMContentLoaded', function() {
    // Options for the gauge chart
    var opts = {
        angle: 0,
        lineWidth: 0.3,
        radiusScale: 0.9,
        pointer: {
            length: 0.42,
            strokeWidth: 0.029,
            color: '#000000'
        },
        limitMax: true,
        limitMin: true,
        colorStart: '#6F6EA0',
        colorStop: '#C0C0DB',
        strokeColor: '#EEEEEE',
        generateGradient: true,
        highDpiSupport: true,
        staticZones: [
            { strokeStyle: "#30B32D", min: 10, max: 30 }, // Green from 10 to 30
            { strokeStyle: "#FFDD00", min: 30, max: 60 }, // Yellow 30 to 60
            { strokeStyle: "#F03E3E", min: 60, max: 100 } // Red 60 to 100
        ],
        staticLabels: {
            font: "10px sans-serif",
            labels: [10, 30, 60, 100],
            color: "#000000",
            fractionDigits: 0
        },
    };

    // Get canvas element
    var target = document.getElementById('gauge-chart');

    // Create gauge chart
    var gauge = new Gauge(target).setOptions(opts);

    // Set gauge meter properties
    gauge.maxValue = 100;
    gauge.setMinValue(10);
    gauge.animationSpeed = 10;

    // Function to update gauge meter and health recommendations
    function updateGaugeMeter(value, recommendations) {
        gauge.set(value); // Update gauge meter

        // Update health recommendations
        var recommendationsHTML = '';
        for (var populationGroup in recommendations) {
            recommendationsHTML += `<strong>${populationGroup}:</strong> ${recommendations[populationGroup]}<br>`;
        }
        healthRecommendationsElement.innerHTML = `<strong>Health Recommendations:</strong><br>${recommendationsHTML}`;
    }

    // Function to fetch air quality data from the server
    async function fetchAirQualityData(latitude, longitude) {
        try {
            const response = await fetch('/get-air-quality', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ latitude, longitude })
            });
            const data = await response.json();

            // Extract AQI value and health recommendations from response
            const universalAqiValue = data.universalAqi.aqi;
            const healthRecommendations = data.healthRecommendations;

            // Update gauge meter and health recommendations
            updateGaugeMeter(universalAqiValue, healthRecommendations);
        } catch (error) {
            console.error('Error fetching air quality data:', error);
        }
    }

    // Function to get user's current location and fetch air quality data
    function getLocationAndFetchAirQuality() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(function(position) {
                const latitude = position.coords.latitude;
                const longitude = position.coords.longitude;

                // Fetch air quality data using current latitude and longitude
                fetchAirQualityData(latitude, longitude);
            }, function(error) {
                console.error('Error getting current location:', error);
            });
        } else {
            console.error('Geolocation is not supported by this browser.');
        }
    }

    // Get health recommendations element
    var healthRecommendationsElement = document.getElementById('health-recommendations');

    // Call getLocationAndFetchAirQuality function to get current location and fetch air quality data
    getLocationAndFetchAirQuality();
});
