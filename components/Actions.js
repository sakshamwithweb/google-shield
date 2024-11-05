"use client"
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const Actions = () => {
  const [mode, setMode] = useState(false)
  const [latitude, setLatitude] = useState(null)
  const [longitude, setLongitude] = useState(null)
  const [time, setTime] = useState(null)
  const [weather, setWeather] = useState(null)
  const [motion, setMotion] = useState(null)
  const [safePlaces, setSafePlaces] = useState(null)
  const [loading, setLoading] = useState(false)
  const [isRecording, setIsRecording] = useState(false);
  const [AudioUrl, setAudioUrl] = useState(null)
  const [languege, setLanguege] = useState("hindi")
  const [ready, setReady] = useState(false)
  const [speechToText, setSpeechToText] = useState(null)
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);


  const getLocation = async () => {
    const GPS = () => {
      return new Promise((resolve, reject) => {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const lat = position.coords.latitude;
              const lng = position.coords.longitude;
              resolve({ lat, lng }); // Resolve with GPS location
            },
            (error) => {
              console.error('GPS error:', error);
              reject(error); // Reject on GPS error
            },
            {
              enableHighAccuracy: true,
              timeout: 5000,
              maximumAge: 0,
            }
          );
        } else {
          reject(new Error("Geolocation not supported"));
        }
      });
    };

    try {
      const gpsLocation = await GPS();
      setLatitude(gpsLocation.lat);
      setLongitude(gpsLocation.lng);
      return gpsLocation; // Return GPS location
    } catch (error) {
      console.warn("Falling back to API due to error:", error);
    }

    // Fallback to fetch location from the API if GPS fails
    const req = await fetch('/api/get/location', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!req.ok) {
      console.error('Error fetching location from API:', req.status, req.statusText);
      return null; // Handle the error appropriately
    }

    const res = await req.json();
    setLatitude(res.data.lat);
    setLongitude(res.data.lng);
    console.log("Location obtained from API:", res.data);
    return res.data; // Return the location fetched from the API
  };


  const getTime = async () => {
    const req = await fetch('/api/get/time')
    const res = await req.json()
    setTime(res.time)
    return res.time
  }

  const getWeather = async () => {
    const req = await fetch('/api/get/weather', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        latitude: latitude,
        longitude: longitude
      })
    })
    const res = await req.json()
    setWeather(res.data)
    return res.data
  }

  const getMotion = async () => {
    return new Promise(async (resolve) => {
      const threshold = {
        walking: 2,
        running: 5,
        driving: 1,
      };

      let lastTimestamp = 0;
      let accelerationData = [];
      const detectionInterval = 1000;

      const requestDeviceMotionPermission = async () => {
        if (typeof DeviceMotionEvent.requestPermission === 'function') {
          try {
            const permissionState = await DeviceMotionEvent.requestPermission();
            if (permissionState !== 'granted') {
              throw new Error("Permission not granted for DeviceMotion");
            }
            console.log("DeviceMotion permission granted.");
          } catch (error) {
            console.error("DeviceMotion permission request failed:", error);
            resolve(null); // Resolve with null if permission is denied
          }
        }
      };

      const analyzeMotion = () => {
        if (accelerationData.length > 0) {
          let avgAcceleration = accelerationData.reduce((sum, val) => sum + val, 0) / accelerationData.length;
          accelerationData = [];

          let motionType;
          if (avgAcceleration > threshold.running) {
            motionType = "Running";
          } else if (avgAcceleration > threshold.walking) {
            motionType = "Walking";
          } else if (avgAcceleration < threshold.driving) {
            motionType = "Driving or Stationary";
          } else {
            motionType = "Stationary";
          }
          return motionType; // Return the detected motion type
        }
        return null; // Return null if no data to analyze
      };

      const handleDeviceMotion = (event) => {
        const currentTimestamp = Date.now();
        if (currentTimestamp - lastTimestamp > 50) {
          const { x = 0, y = 0, z = 0 } = event.acceleration || {};
          const totalAcceleration = Math.sqrt(x * x + y * y + z * z);
          accelerationData.push(totalAcceleration);
          lastTimestamp = currentTimestamp;
        }
      };

      await requestDeviceMotionPermission();
      window.addEventListener('devicemotion', handleDeviceMotion);

      const motionInterval = setInterval(() => {
        const detectedMotion = analyzeMotion();
        if (detectedMotion) {
          setMotion(detectedMotion);
          resolve(detectedMotion);
          clearInterval(motionInterval);
          window.removeEventListener('devicemotion', handleDeviceMotion);
        }
      }, detectionInterval);
    });
  };

  const getSafePlace = async () => {
    const req = await fetch('/api/get/safePlaces', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        latitude: latitude,
        longitude: longitude
      })
    })
    const res = await req.json()
    setSafePlaces(res.data)
    return res.data
  }

  useEffect(() => {
    if (longitude !== null && latitude !== null) {
      (async () => {
        const padi1 = await getTime();
        console.log(padi1);
      })()
    }
  }, [longitude, latitude])

  useEffect(() => {
    if (time !== null) {
      (async () => {
        const padi2 = await getWeather();
        console.log(padi2);
      })()
    }
  }, [time])

  useEffect(() => {
    if (weather !== null) {
      (async () => {
        const padi3 = await getMotion();
        console.log(padi3);
      })()
    }
  }, [weather])

  useEffect(() => {
    if (motion !== null) {
      (async () => {
        const padi4 = await getSafePlace();
        console.log(padi4);
      })()
    }
  }, [motion])

  useEffect(() => {
    if (safePlaces !== null) {
      console.log("done");
      setLoading(false);
      setMode(true);
    }
  }, [safePlaces])

  const handleClick = async () => {
    if (mode == false) {
      setLoading(true);
      const padi = await getLocation();
      console.log(padi)
    } else {
      setLatitude(null)
      setLongitude(null)
      setTime(null)
      setWeather(null)
      setMotion(null)
      setSafePlaces(null)
      setMode(false);
    }
  }

  const handleToggleRecording = async () => {
    if (isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    } else {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/mp3' });
        const formData = new FormData();
        formData.append('audio', audioBlob, 'recording.mp3');

        try {
          const response = await fetch('/api/uploadAudio', {
            method: 'POST',
            body: formData,
          });

          if (response.ok) {
            const data = await response.json();
            console.log('Audio uploaded successfully with UID:', data.link);
            setAudioUrl(data.link);
            return;
          } else {
            console.error('Audio upload failed');
          }
        } catch (error) {
          console.error('Error uploading audio:', error);
        }

        audioChunksRef.current = [];
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    }
  };

  useEffect(() => {
    if (AudioUrl !== null && languege !== null) {
      const fetchAudioWithRetry = async (attempts = 25) => {
        try {
          const proxyUrl = 'https://google-shield-cors.onrender.com/proxy?url=';
          const targetUrl = AudioUrl;
          const sentUrl = proxyUrl + targetUrl

          const response = await fetch(proxyUrl + targetUrl);

          if (response.ok) {
            console.log("completed")
            const result = await SpeechToText(sentUrl, languege);
            console.log(result);
          } else {
            console.log(response)
            if (attempts > 0) {
              setTimeout(() => fetchAudioWithRetry(attempts - 1), 4000);
            } else {
              console.error('Max retry attempts reached. Stopping.');
            }
          }
        } catch (error) {
          if (attempts > 0) {
            setTimeout(() => fetchAudioWithRetry(attempts - 1), 4000);
          } else {
            console.error('Max retry attempts reached. Stopping.');
          }
        }
      };

      fetchAudioWithRetry();
    }
  }, [AudioUrl]);


  const SpeechToText = async (AUDIO_URL, language) => {
    const req = await fetch('/api/get/speechToText', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        AUDIO_URL: AUDIO_URL,
        language: language
      })
    })
    const res = await req.json()
    return res.data
  }

  useEffect(() => {
    if (speechToText !== null && mode == true) {
      setReady(true)
    }
  }, [speechToText, mode])


  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-8">
      <div className="flex space-x-4">
        <button
          onClick={handleClick}
          className={`text-6xl mb-1 transition-transform duration-200 transform hover:scale-105`}
          disabled={loading}
          aria-label={loading ? "Loading..." : "Start Action"}
        >
          <svg
            width="100"
            height="100"
            viewBox="0 0 100 100"
            xmlns="http://www.w3.org/2000/svg"
            className={`transition-transform duration-200 ${loading ? "animate-spin" : ""}`}
          >
            <circle
              cx="50"
              cy="50"
              r="40"
              stroke={mode ? "green" : (loading ? "gray" : "red")}
              strokeWidth="5"
              fill="none"
            />
            <line
              x1="50"
              y1="10"
              x2="50"
              y2="50"
              stroke={mode ? "green" : (loading ? "gray" : "red")}
              strokeWidth="5"
            />
          </svg>
        </button>
        {loading || mode ? (<button
          onClick={handleToggleRecording}
          className={`flex items-center justify-center p-4 text-2xl text-white rounded-full shadow-lg transition-colors duration-300 transform hover:scale-105 ${isRecording ? 'bg-red-500' : 'bg-blue-500 hover:bg-blue-600'}`}
          title={isRecording ? "Stop Recording" : "Start Recording"}
          aria-label={isRecording ? "Stop Recording" : "Start Recording"}
        >
          {isRecording ? '⏸️' : '🎤'}
        </button>) : null}

      </div>

      <span className="mb-8 text-lg text-gray-700">
        It is {mode ? "on" : (loading ? "getting on" : "off")}
      </span>

      <div className="grid grid-cols-2 gap-4 w-full max-w-md">
        {["Call to Action", "Define Action", "Data", "Solve Problem"].map((text) => (
          <Link
            key={text}
            href="/"
            className="flex items-center justify-center border border-gray-300 p-4 rounded-lg shadow-sm transition-colors duration-300 hover:bg-gray-200"
          >
            {text}
          </Link>
        ))}
        {ready && (<>Ready to gooo - {speechToText}</>)}
      </div>
    </div>
  );

}


export default Actions;