import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import multer from 'multer';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Gemini Setup
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Supabase Setup
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Multer setup (memory storage)
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

app.use(express.json());

// API: Gemini Search Proxy
app.post('/api/search', async (req, res) => {
  try {
    const { query } = req.body;
    if (!query) return res.status(400).json({ error: 'Query is required' });

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Proporciona una BREVE DESCRIPCIÓN (máximo 3 líneas) de quién es la creadora o personalidad conocida llamada: ${query}. 
      Enfócate en su carrera, plataformas principales y por qué es conocida. 
      Si no conoces a la persona, indica que es una creadora emergente o independiente.`,
    });

    const text = response.text || "No hay información disponible sobre esta creadora.";
    res.json({ text });
  } catch (err) {
    console.error('Gemini search error:', err);
    res.status(500).json({ error: 'Error en el motor de búsqueda' });
  }
});

// API: Obtener contenido
app.get('/api/content', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('content')
      .select('*')
      .order('createdAt', { ascending: false });

    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    console.error('Error fetching from Supabase:', err);
    res.status(500).json({ error: 'Error al obtener contenido' });
  }
});

// API: Subir contenido
app.post('/api/upload', upload.single('file'), async (req: any, res) => {
  try {
    const { name, platform, source, type } = req.body;
    const file = req.file;

    if (!file || !name) {
      return res.status(400).json({ error: 'Faltan datos obligatorios' });
    }

    // 1. Upload to Archive.org using their S3-compatible PUT API
    const identifier = `elite-search-${uuidv4().slice(0, 8)}`;
    const filename = file.originalname.replace(/[^a-zA-Z0-9.]/g, '_');
    const archiveUrl = `https://s3.us.archive.org/${identifier}/${filename}`;

    const headers: Record<string, string> = {
      'Authorization': `LOW ${process.env.ARCHIVE_ACCESS_KEY}:${process.env.ARCHIVE_SECRET_KEY}`,
      'Content-Type': file.mimetype,
      'x-archive-meta-mediatype': file.mimetype.startsWith('video') ? 'movies' : 'image',
      'x-archive-meta-collection': process.env.ARCHIVE_COLLECTION || 'opensource',
      'x-archive-meta-title': `Elite Search - ${name}`,
      'x-archive-meta-description': `Contenido de ${name} compartido vía Elite Search Pro.`,
      'x-archive-meta-subject': 'multimedia;leaks',
      'x-archive-auto-make-bucket': '1', // Create item if it doesn't exist
    };

    const uploadResponse = await fetch(archiveUrl, {
      method: 'PUT',
      headers,
      body: file.buffer,
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error('Archive.org upload failed:', errorText);
      throw new Error('Error al subir a Archive.org');
    }

    // Direct download link
    const finalUrl = `https://archive.org/download/${identifier}/${filename}`;

    // 2. Save to Supabase
    const { data, error } = await supabase
      .from('content')
      .insert([{
        name,
        platform,
        source,
        type,
        url: finalUrl,
        mimeType: file.mimetype,
        createdAt: new Date().toISOString()
      }])
      .select();

    if (error) throw error;

    res.status(201).json(data[0]);
  } catch (err) {
    console.error('Error in upload process:', err);
    res.status(500).json({ error: 'Error al procesar la subida' });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    console.log(`Serving production build from: ${distPath}`);
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
  });
}

startServer();
