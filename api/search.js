const cheerio = require('cheerio');
const { fetchHtml, extractNumber, extractMangaId } = require('./utils');

// Function to search for manga
async function searchManga(query) {
  try {
    if (!query) {
      throw new Error('Search query is required');
    }
    
    // Format query for URL (replace spaces with + or %20)
    const formattedQuery = encodeURIComponent(query);
    const baseUrl = 'https://mangabuddy.com';
    const url = `${baseUrl}/search?q=${formattedQuery}`;
    
    // Fetch HTML
    const html = await fetchHtml(url);
    const $ = cheerio.load(html);
    
    // Extract search results
    const mangaResults = [];
    
    // Try different selectors for search results
    $('.search-result, .result-item, .manga-item, .item, [class*="result"], [class*="item"]').each((index, element) => {
      try {
        const item = $(element);
        
        // Try different selectors for title
        let title = item.find('h3, h4, .title, [class*="title"], a').text().trim() || 
                   item.find('a').attr('title') || 
                   item.find('img').attr('alt') || '';
        
        // Skip if no title
        if (!title) return;
        
        // Try different selectors for image
        let imgUrl = item.find('img').attr('data-src') || 
                    item.find('img').attr('src') || 
                    item.find('.cover, [class*="cover"] img').attr('src') || '';
        
        // Make image URL absolute if it's relative
        if (imgUrl && !imgUrl.startsWith('http')) {
          imgUrl = baseUrl + imgUrl;
        }
        
        // Try different selectors for URL
        let mangaUrl = item.find('a').attr('href') || '';
        if (mangaUrl && !mangaUrl.startsWith('http')) {
          mangaUrl = baseUrl + mangaUrl;
        }
        
        // Extract manga ID from URL
        const id = extractMangaId(mangaUrl);
        
        // Try to get authors
        let authors = [];
        item.find('.author, [class*="author"]').each((i, el) => {
          const author = $(el).text().trim();
          if (author) authors.push(author);
        });
        
        // Try to get views
        let viewsText = item.find('.views, [class*="views"]').text().trim() || '';
        const views = extractNumber(viewsText);
        
        // Try to get latest chapter
        let latestChapter = '';
        let latestChapters = [];
        
        item.find('.chapter, [class*="chapter"]').each((i, el) => {
          const chapterText = $(el).text().trim();
          const chapterUrl = $(el).attr('href') || '';
          
          if (chapterText) {
            if (i === 0) latestChapter = chapterText;
            latestChapters.push({
              chapter: chapterText,
              url: chapterUrl
            });
          }
        });
        
        mangaResults.push({
          id: id,
          title: title,
          imgUrl: imgUrl,
          url: mangaUrl,
          authors: authors,
          views: views,
          latestChapter: latestChapter,
          latestChapters: latestChapters
        });
      } catch (error) {
        console.error('Error processing search result:', error);
        // Continue with other results
      }
    });
    
    return {
      success: true,
      query: query,
      manga: mangaResults,
      totalResults: mangaResults.length
    };
  } catch (error) {
    console.error('Error searching manga:', error);
    return {
      success: false,
      error: error.message,
      query: query,
      manga: [],
      totalResults: 0
    };
  }
}

module.exports = { searchManga };