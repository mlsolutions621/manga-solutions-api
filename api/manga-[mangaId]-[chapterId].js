import { scrapeChapterPages } from './manga';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  // Only allow GET requests
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    return;
  }
  
  try {
    const { mangaId, chapterId } = req.query;
    
    if (!mangaId) {
      res.status(400).json({ error: 'Manga ID is required' });
      return;
    }
    
    if (!chapterId) {
      res.status(400).json({ error: 'Chapter ID is required' });
      return;
    }
    
    // Scrape chapter pages
    const result = await scrapeChapterPages(mangaId, chapterId);
    
    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(500).json({ 
        error: 'Failed to scrape chapter pages',
        details: result.error
      });
    }
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ 
      error: 'Internal Server Error',
      details: error.message
    });
  }
}