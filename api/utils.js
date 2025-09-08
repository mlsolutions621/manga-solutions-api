const fetch = require('node-fetch');

// Helper to fetch and parse HTML
async function fetchHtml(url) {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.text();
  } catch (error) {
    console.error('Error fetching HTML:', error);
    throw error;
  }
}

// Helper to extract number from string
function extractNumber(str) {
  if (!str) return 0;
  const match = str.match(/\d+/);
  return match ? parseInt(match[0], 10) : 0;
}

// Helper to format manga ID from URL
function extractMangaId(url) {
  if (!url) return '';
  // Extract from URL like: https://mangabuddy.com/one-piece
  const parts = url.split('/');
  return parts[parts.length - 1] || '';
}

// Helper to extract chapter number from string
function extractChapterNumber(str) {
  if (!str) return 0;
  const match = str.match(/chapter\s*(\d+\.?\d*)/i);
  return match ? parseFloat(match[1]) : 0;
}

module.exports = {
  fetchHtml,
  extractNumber,
  extractMangaId,
  extractChapterNumber
};