const cheerio = require('cheerio');
const { fetchHtml, extractNumber, extractMangaId } = require('./utils');

// Function to scrape manga list from mangabuddy.com
async function scrapeMangaList(page = 1) {
  try {
    // Construct URL for the page
    const baseUrl = 'https://mangabuddy.com';
    let url = `${baseUrl}/manga-list?page=${page}`;
    
    // Fetch HTML
    const html = await fetchHtml(url);
    const $ = cheerio.load(html);
    
    // Extract manga items
    const mangaList = [];
    
    // Select manga items - adjust selector based on actual site structure
    $('.manga-item, .item, .book-item, [class*="manga"], [class*="book"]').each((index, element) => {
      try {
        const item = $(element);
        
        // Try different selectors for title
        let title = item.find('h3, h4, .title, [class*="title"]').text().trim() || 
                   item.find('a').attr('title') || 
                   item.find('img').attr('alt') || '';
        
        // Try different selectors for image
        let imgUrl = item.find('img').attr('data-src') || 
                    item.find('img').attr('src') || 
                    item.find('.cover, [class*="cover"] img').attr('src') || '';
        
        // Make image URL absolute if it's relative
        if (imgUrl && !imgUrl.startsWith('http')) {
          imgUrl = baseUrl + imgUrl;
        }
        
        // Try different selectors for latest chapter
        let latestChapter = item.find('.chapter, [class*="chapter"]').text().trim() || 
                           item.find('.latest, [class*="latest"]').text().trim() || '';
        
        // Try different selectors for description
        let description = item.find('.description, [class*="desc"], .summary, [class*="summary"]').text().trim() || '';
        
        // Try to get the manga URL
        let mangaUrl = item.find('a').attr('href') || '';
        if (mangaUrl && !mangaUrl.startsWith('http')) {
          mangaUrl = baseUrl + mangaUrl;
        }
        
        // Extract manga ID from URL
        const id = extractMangaId(mangaUrl);
        
        // Only add if we have a title and ID
        if (title && id) {
          mangaList.push({
            id,
            title,
            imgUrl,
            latestChapter,
            description,
            url: mangaUrl
          });
        }
      } catch (error) {
        console.error('Error processing manga item:', error);
        // Continue with other items
      }
    });
    
    // Extract pagination info
    let totalPages = 1;
    let hasNextPage = false;
    
    // Look for pagination elements
    const pagination = $('.pagination, .pager, [class*="pagin"]');
    if (pagination.length > 0) {
      // Try to find total pages
      const lastPageLink = pagination.find('a:last-child, .last, [class*="last"]');
      if (lastPageLink.length > 0) {
        const lastPageText = lastPageLink.text().trim();
        totalPages = extractNumber(lastPageText) || 1;
      }
      
      // Check if there's a next page
      const nextPageLink = pagination.find('.next, [class*="next"], a:contains("Next")');
      hasNextPage = nextPageLink.length > 0 && !nextPageLink.hasClass('disabled');
    }
    
    // If we couldn't find pagination, estimate based on content
    if (mangaList.length > 0 && totalPages === 1) {
      totalPages = Math.max(page + 1, 10); // Assume at least 10 pages
    }
    
    return {
      success: true,
      data: mangaList,
      pagination: Array.from({ length: totalPages }, (_, i) => i + 1),
      currentPage: page,
      totalPages: totalPages,
      hasNextPage: page < totalPages
    };
  } catch (error) {
    console.error('Error scraping manga list:', error);
    return {
      success: false,
      error: error.message,
      data: [],
      pagination: [1],
      currentPage: 1,
      totalPages: 1,
      hasNextPage: false
    };
  }
}

module.exports = { scrapeMangaList };