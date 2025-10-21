// File: api/generate.js
// Ini adalah backend serverless kita.

export default async function handler(req, res) {
  // Hanya izinkan metode POST
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  // Dapatkan URL API Google asli dari request body yang dikirim frontend
  const { targetUrl, payload } = req.body;

  if (!targetUrl || !payload) {
    return res.status(400).json({ error: 'targetUrl and payload are required.' });
  }

  // Ambil API Key dari Environment Variable yang akan kita set di Vercel
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

  if (!GEMINI_API_KEY) {
    return res.status(500).json({ error: 'API key not configured on the server.' });
  }

  // Gabungkan URL asli dengan API Key yang aman
  const fullApiUrl = `${targetUrl}?key=${GEMINI_API_KEY}`;

  try {
    // Teruskan request ke API Google
    const response = await fetch(fullApiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    // Jika respons dari Google tidak OK, teruskan errornya
    if (!response.ok) {
      const errorBody = await response.text();
      console.error('Google API Error:', errorBody);
      return res.status(response.status).json({ error: `Google API error: ${response.statusText}`, details: errorBody });
    }

    // Teruskan respons sukses dari Google kembali ke frontend
    const data = await response.json();
    res.status(200).json(data);

  } catch (error) {
    console.error('Proxy Error:', error);
    res.status(500).json({ error: 'An internal server error occurred.' });
  }
}
