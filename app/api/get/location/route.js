import { NextResponse } from "next/server";

const main = async () => {
    async function Geolocation(apiKey) {
        const url = 'https://www.gomaps.pro/geolocation/v1/geolocate?key=' + apiKey;

        const requestBody = {
            "considerIp": "true"
        };

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                throw new Error(`Error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            console.log("get by geolocation-",data.location)
            return data.location;
        } catch (error) {
            console.error('Error fetching geolocation from API:', error);
        }
    }

    function GPS(apiKey) {
        return new Promise((resolve, reject) => {  // Return a Promise
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    async (position) => {
                        const lat = position.coords.latitude;
                        const lng = position.coords.longitude;
                        const location = { lat: lat, lng: lng };
                        resolve(location); // Resolve with GPS location
                    },
                    async (error) => {
                        console.error('GPS error:', error);
                        const apiData = await Geolocation(apiKey);
                        console.log("get by gps-",apiData)
                        resolve(apiData); // Resolve with geolocation data
                    },
                    {
                        enableHighAccuracy: true,
                        timeout: 5000,
                        maximumAge: 0
                    }
                );
            } else {
                // Geolocation not supported, use the API
                Geolocation(apiKey).then(resolve);
            }
        });
    }

    const apiKey = process.env.GOMAPS_API_KEY;
    const location = await GPS(apiKey);
    return location
}

export async function POST() {
    let data = await main();
    return NextResponse.json({ data: data });
}