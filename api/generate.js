// File: api/generate.js
export const maxDuration = 60; // Memberi waktu 60 detik untuk eksekusi

// Fungsi untuk menangani request ke model Gemini
async function handleGemini(fullApiUrl, payload, res) {
  const response = await fetch(fullApiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error('Google API Error (Gemini):', errorBody);
    return res.status(response.status).json({ error: `Google API error: ${response.statusText}`, details: errorBody });
  }

  const data = await response.json();
  res.status(200).json(data);
}

// Fungsi untuk menangani request ke model Imagen
async function handleImagen(fullApiUrl, payload, res) {
  // Imagen memiliki struktur payload yang berbeda
  const imagenPayload = {
    instances: [{
      // Imagen hanya menerima prompt teks
      prompt: payload.contents[0].parts.find(p => p.text).text
    }],
    parameters: {
      sampleCount: 1
    }
  };

  const response = await fetch(fullApiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(imagenPayload)
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error('Google API Error (Imagen):', errorBody);
    return res.status(response.status).json({ error: `Google API error: ${response.statusText}`, details: errorBody });
  }

  const data = await response.json();
  res.status(200).json(data);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { targetUrl, payload } = req.body;

  if (!targetUrl || !payload) {
    return res.status(400).json({ error: 'targetUrl and payload are required.' });
  }

  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

  if (!GEMINI_API_KEY) {
    return res.status(500).json({ error: 'API key not configured on the server.' });
  }

  const fullApiUrl = `${targetUrl}?key=${GEMINI_API_KEY}`;

  try {
    // Memilih handler berdasarkan URL target
    if (targetUrl.includes('imagen-3.0-generate-002')) {
      await handleImagen(fullApiUrl, payload, res);
    } else {
      // Default ke Gemini untuk fitur lain yang mungkin masih menggunakannya
      await handleGemini(fullApiUrl, payload, res);
    }
  } catch (error) {
    console.error('Proxy Error:', error);
    res.status(500).json({ error: 'An internal server error occurred.' });
  }
}

