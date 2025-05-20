// netlify/functions/gemini-proxy.js

// Ersetze diese URL mit der tatsächlichen Gemini API Endpoint URL, die du verwenden möchtest.
// Beispiel: "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent"
const GEMINI_API_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent"; // Passe dies ggf. an!

exports.handler = async function(event, context) {
    // Nur POST-Anfragen erlauben
    if (event.httpMethod !== "POST") {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: "Method Not Allowed. Please use POST." }),
            headers: { 'Allow': 'POST' }
        };
    }

    // API-Schlüssel sicher aus den Netlify Umgebungsvariablen laden
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        console.error("Gemini API key not configured in Netlify environment variables.");
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "API key not configured." })
        };
    }

    let clientData;
    try {
        clientData = JSON.parse(event.body);
    } catch (e) {
        console.error("Error parsing request body:", e);
        return {
            statusCode: 400,
            body: JSON.stringify({ error: "Bad Request: Could not parse JSON body." })
        };
    }

    if (!clientData) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: "Bad Request: No data sent." })
        };
    }

    const fullGeminiUrl = `${GEMINI_API_ENDPOINT}?key=${apiKey}`;

    try {
        console.log("Proxy: Sending request to Gemini API with data:", JSON.stringify(clientData));
        const response = await fetch(fullGeminiUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(clientData), // Sende die Daten des Clients direkt weiter
        });

        const responseData = await response.json();

        if (!response.ok) {
            console.error("Proxy: Gemini API Error:", responseData);
            return {
                statusCode: response.status,
                body: JSON.stringify(responseData),
                 // Wichtig für CORS, wenn von einer anderen Domain/Port während der lokalen Entwicklung aufgerufen
                headers: {
                    'Access-Control-Allow-Origin': '*', // Oder spezifischer: 'https://deinedomain.com'
                }
            };
        }

        console.log("Proxy: Received response from Gemini API:", JSON.stringify(responseData));
        return {
            statusCode: 200,
            body: JSON.stringify(responseData),
            headers: {
                'Access-Control-Allow-Origin': '*', // Erlaube Anfragen von jeder Herkunft
                'Content-Type': 'application/json',
            }
        };

    } catch (error) {
        console.error("Proxy: Error calling Gemini API or processing response:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Internal Server Error in proxy function" }),
            headers: {
                'Access-Control-Allow-Origin': '*',
            }
        };
    }
};