import { NextResponse } from "next/server";

const step3 = async (apiKey, AUDIO_URL, language) => {
    return new Promise(async (resolve, reject) => {
        try {
            const checkJobStatus = async (jobId) => {
                while (true) {
                    try {
                        const response = await fetch("https://api.myshell.ai/v1/async_job/get_info", {
                            headers: {
                                "accept": "*/*",
                                "authorization": `Bearer ${apiKey}`,
                                "content-type": "application/json",
                            },
                            method: "POST",
                            body: JSON.stringify({ jobId: jobId })
                        });

                        const data = await response.json();

                        if (data.status === "JOB_STATUS_DONE") {
                            const raw = data.data.message.text;
                            console.log("Raw response:", raw);
                            const a = raw.replace("json", '').replace(/`/g, '');
                            const final = JSON.parse(a);
                            resolve(final);  // Resolve with parsed final result instead of raw data
                            break;
                        } else {
                            await new Promise(res => setTimeout(res, 500));
                        }
                    } catch (error) {
                        console.error("Error in checkJobStatus:", error);
                        reject(error);
                        break;
                    }
                }
            };

            // Main API call to send the message
            console.log("Headers being sent:", {
                "accept": "application/json",
                "authorization": `Bearer ${apiKey}`,
                "content-type": "application/json"
            });

            const res = await fetch("https://api.myshell.ai/v1/widget/chat/send_message", {
                headers: {
                    "accept": "application/json",
                    "authorization": `Bearer ${apiKey}`,
                    "content-type": "application/json",
                },
                body: JSON.stringify({
                    "widgetId": "1781991624332992512",
                    "conversation_scenario": 4,
                    "message": "",
                    "messageType": 1,
                    "componentInputMessage": JSON.stringify({
                        "voice_url": AUDIO_URL,
                        "chunk_length_s": 30,
                        "batch_size": 24,
                        "return_timestamps": false,
                        "diarize": false,
                        "language": language
                    }),
                }),
                method: "POST"
            });

            if (res.ok) {
                const reader = res.body.getReader();
                const decoder = new TextDecoder("utf-8");
                let result = "";

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    result += decoder.decode(value, { stream: true });
                }

                const lines = result.split("\n");
                for (const line of lines) {
                    if (line.includes("jobId")) {
                        const eventData = JSON.parse(line.split("data: ")[1]);
                        const jobId = eventData.message.asyncJobInfo.jobId;
                        await checkJobStatus(jobId);
                        return;
                    }
                }

                reject(new Error("jobId not found in the response"));
            } else {
                // Enhanced error logging for failed response
                const errorData = await res.json().catch(() => ({}));
                console.error(`Failed with status code: ${res.status}, error: ${errorData.message || 'Unknown error'}`);
                reject(new Error(`Failed with status code: ${res.status}, message: ${errorData.message || 'Unknown error'}`));
            }
        } catch (error) {
            console.error("Error in step3 function:", error);
            reject(error);
        }
    });
};

const apiKey = process.env.MYSHELL_API_KEY;

export async function POST(payload) {
    try {
        const data = await payload.json();
        const { AUDIO_URL, language } = data;

        console.log("Starting step3 with:", { AUDIO_URL, language, apiKey: apiKey ? 'Present' : 'Missing' });

        const result = await step3(apiKey, AUDIO_URL, language);
        return NextResponse.json({ data: result });
    } catch (error) {
        console.error("Error in POST handler:", error);
        return NextResponse.json({ error: error.message });
    }
}
