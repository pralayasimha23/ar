import express from 'express';
import axios from 'axios';
import bodyParser from 'body-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';
// Load environment variables from .env file
dotenv.config();

// Access your API key as an environment variable
const genAI = new GoogleGenerativeAI(process.env.API_KEY);

// Get the current file path and directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// View Engine
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.get('/', (req, res) => {
    res.render('index');
});

app.post('/get-air-quality', async (req, res) => {
    const { latitude, longitude } = req.body;

    try {
        // Call the Google Air Quality API
        const response = await axios.post(
            `https://airquality.googleapis.com/v1/currentConditions:lookup?key=${process.env.GOOGLE_API_KEY}`,
            {
                universalAqi: true,
                location: {
                    latitude: parseFloat(latitude),
                    longitude: parseFloat(longitude),
                },
                extraComputations: [
                    "HEALTH_RECOMMENDATIONS",
                    "DOMINANT_POLLUTANT_CONCENTRATION",
                    "POLLUTANT_CONCENTRATION",
                    "LOCAL_AQI",
                    "POLLUTANT_ADDITIONAL_INFO"
                ],
                languageCode: "en"
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                }
            }
        );

        // Extract air quality and health recommendations data
        const data = response.data;
        const universalAqi = data.indexes.find(index => index.code === 'uaqi');
        const healthRecommendations = data.healthRecommendations;

        // Generate summary using Google Gemini AI including health recommendations
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash"});
        const prompt = `Write a 5 lines summary on health recommendations: ${JSON.stringify(healthRecommendations)}`;

        const result = await model.generateContent(prompt);
        const summary = await result.response;

        // Send response to client with the summary
        res.json({
            universalAqi,
            summary
        });
    } catch (error) {
        // Handle errors
        res.status(500).json({ error: error.message });
    }
});


// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
