import { scrapeMangaList } from './manga-list';

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
    // Get page from URL parameter, default to 1
    const page = parseInt(req.query.page) || 1;
    
    // Validate page number
    if (page < 1) {
      res.status(400).json({ error: 'Page number must be at least 1' });
      return;
    }
    
    // Scrape manga list
    const result = await scrapeMangaList(page);
    
    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(500).json({ 
        error: 'Failed to scrape manga list',
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