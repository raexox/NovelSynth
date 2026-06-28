import type { ProjectState } from '../../types';

/**
 * AI Service Client Relay.
 * Handles downstream API requests to Google Gemini, OpenAI, and OpenRouter.
 */
export async function callLLM(
  prompt: string,
  settings: ProjectState['settings'],
  systemInstruction?: string,
  expectJson: boolean = true
): Promise<any> {
  const { apiKey, model, provider, aiTemperature, maxTokens } = settings;

  if (!apiKey || !apiKey.trim()) {
    throw new Error('API key is missing. Please configure your API key in the settings cog in the header.');
  }

  let response: Response;
  let textResult = '';

  try {
    if (provider === 'gemini') {
      const selectedModel = model || 'gemini-1.5-flash';
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${apiKey}`;
      
      const generationConfig: any = {
        temperature: aiTemperature,
        maxOutputTokens: maxTokens || 8192
      };
      if (expectJson) {
        generationConfig.responseMimeType = 'application/json';
      }

      const requestBody = {
        contents: [
          {
            role: 'user',
            parts: [{ text: `${systemInstruction ? systemInstruction + '\n\n' : ''}Prompt:\n${prompt}` }]
          }
        ],
        generationConfig
      };

      response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const rawMessage = errorData.error?.message || '';
        
        if (response.status === 400 && rawMessage.includes('API key')) {
          throw new Error('Invalid API Key: The Gemini key you provided is invalid. Please update it in the settings modal (⚙️).');
        }
        if (response.status === 404) {
          throw new Error(`Model Not Found (404): The Gemini model "${selectedModel}" is invalid or not supported. Check the identifier in settings (⚙️).`);
        }
        if (response.status === 429) {
          throw new Error('Rate Limit Exceeded (429): Too many requests or insufficient quota/credits on your Gemini account.');
        }
        throw new Error(`Gemini API Error (${response.status}): ${rawMessage || 'Unknown error occurred.'}`);
      }

      const resJson = await response.json();
      const candidateParts = resJson.candidates?.[0]?.content?.parts || [];
      textResult = candidateParts.map((p: any) => p.text || '').join('\n').trim();

    } else if (provider === 'openai' || provider === 'openrouter') {
      const url = provider === 'openai' 
        ? 'https://api.openai.com/v1/chat/completions'
        : 'https://openrouter.ai/api/v1/chat/completions';

      const selectedModel = provider === 'openai'
        ? (model || 'gpt-4o-mini')
        : (model || 'google/gemini-2.5-flash');

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      };

      if (provider === 'openrouter') {
        headers['HTTP-Referer'] = 'https://novelsynth.app';
        headers['X-Title'] = 'NovelSynth IDE';
      }

      const messages = [];
      if (systemInstruction) {
        messages.push({ role: 'system', content: systemInstruction });
      }
      messages.push({ role: 'user', content: prompt });

      const requestBody: any = {
        model: selectedModel,
        temperature: aiTemperature,
        max_tokens: maxTokens || 8192,
        messages
      };
      if (expectJson) {
        requestBody.response_format = { type: 'json_object' };
      }

      response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const rawMessage = errorData.error?.message || errorData.error || '';
        const msgStr = typeof rawMessage === 'object' ? JSON.stringify(rawMessage) : String(rawMessage);
        
        const providerName = provider === 'openai' ? 'OpenAI' : 'OpenRouter';
        
        if (response.status === 401) {
          throw new Error(`Authentication Failed (401): The ${providerName} API key you provided is invalid or expired. Check your settings cog (⚙️).`);
        }
        if (response.status === 404) {
          throw new Error(`Model Not Found (404): The model "${selectedModel}" is invalid or not supported by ${providerName}.`);
        }
        if (response.status === 429) {
          throw new Error(`Rate Limit / Credits Exceeded (429): You have run out of credits or hit a rate limit on your ${providerName} account.`);
        }
        throw new Error(`${providerName} API Error (${response.status}): ${msgStr || 'Unknown error.'}`);
      }

      const resJson = await response.json();
      textResult = resJson.choices?.[0]?.message?.content || '';
    } else {
      throw new Error(`Unsupported provider: ${provider}`);
    }

    // Clean markdown wrappers if returned by the LLM
    let cleanText = textResult.trim();
    if (cleanText.startsWith('```')) {
      cleanText = cleanText.replace(/^```(?:json|markdown|text)?\s*/i, '').replace(/```$/, '').trim();
    }

    if (!expectJson) {
      return cleanText || 'I am ready to assist you with your manuscript!';
    }

    if (!cleanText) {
      return { response: 'No response generated by the AI model.' };
    }

    try {
      return JSON.parse(cleanText);
    } catch (e) {
      return { response: cleanText, rawText: cleanText };
    }

  } catch (error: any) {
    console.error('LLM API Call Error:', error);
    const msg = error.message || '';
    if (msg.includes('Failed to fetch') || msg.includes('NetworkError')) {
      throw new Error('Network Connection Failure: Unable to reach the API server. Please check your internet connection or check if your API provider is online.');
    }
    throw error;
  }
}
