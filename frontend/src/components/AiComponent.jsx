import React from 'react'
import { useEffect, useRef } from 'react';

const AiComponent = ({ userInput, onResponse }) => {
    const [AIAns, setAIAns] = React.useState("");
    const [loading, setLoading] = React.useState(false);
    const hasRun = useRef(false);

    useEffect(() => {
        // Prevent running multiple times
        if (hasRun.current) return;
        hasRun.current = true;

        const aiResponse = async (userInput) => {
            setLoading(true);
            try {
                const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${import.meta.env.VITE_OPENROUTER_API_KEY}`,
                        "HTTP-Referer": window.location.origin,
                        "X-Title": "Flow",
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        "model": "meta-llama/llama-3.3-70b-instruct:free",
                        "messages": [
                            {
                                "role": "user",
                                "content": `${userInput}`
                            }
                        ]
                    })
                });
                const data = await response.json();
                const content = data.choices[0].message.content;
                setAIAns(content);
                if (onResponse) {
                    onResponse(content);
                }
            } catch (error) {
                console.error("Error fetching AI response:", error);
            } finally {
                setLoading(false);
            }
        }

        if (userInput) {
            aiResponse(userInput);
        }
    }, [userInput]);

    return null; // Component doesn't render anything - parent handles display
}

export default AiComponent