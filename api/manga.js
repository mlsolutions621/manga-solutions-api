const cheerio = require('cheerio');
const { fetchHtml, extractNumber, extractChapterNumber } = require('./utils');

// Function to scrape manga details
async function scrapeMangaDetails(mangaId) {
  try {
    if (!mangaId) {
      throw new Error('Manga ID is required');
    }
    
    const baseUrl = 'https://mangabuddy.com';
    const url = `${baseUrl}/${mangaId}`;
    
    // Fetch HTML
    const html = await fetchHtml(url);
    const $ = cheerio.load(html);
    
    // Extract manga details
    const title = $('h1, .title, [class*="title"]').first().text().trim() || 
                  $('h2, .name, [class*="name"]').first().text().trim() || 
                  $('title').text().replace(/[-|_].*mangabuddy.*/i, '').trim() || '';
    
    // Extract image
    let imageUrl = $('.cover, .img, [class*="cover"] img, [class*="img"] img').attr('data-src') || 
                   $('.cover, .img, [class*="cover"] img, [class*="img"] img').attr('src') || 
                   $('meta[property="og:image"]').attr('content') || '';
    
    if (imageUrl && !imageUrl.startsWith('http')) {
      imageUrl = baseUrl + imageUrl;
    }
    
    // Extract author
    let author = $('.author, [class*="author"], .writer, [class*="writer"]').text().trim() || '';
    
    // Extract status
    let status = $('.status, [class*="status"]').text().trim() || '';
    
    // Extract last updated
    let lastUpdated = $('.updated, [class*="update"], .time, [class*="time"]').text().trim() || '';
    
    // Extract views (if available)
    let views = $('.views, [class*="views"]').text().trim() || '';
    const viewCount = extractNumber(views);
    
    // Extract genres
    const genres = [];
    $('.genres a, .genre a, [class*="genre"] a').each((i, el) => {
      const genre = $(el).text().trim();
      if (genre) genres.push(genre);
    });
    
    // Extract rating
    let rating = $('.rating, [class*="rating"], .score, [class*="score"]').text().trim() || '';
    const ratingValue = extractNumber(rating) || 0;
    
    // Extract description
    let description = $('.description, .summary, [class*="desc"], [class*="summary"]').text().trim() || '';
    
    // Extract chapters
    const chapters = [];
    $('.chapter-list a, .chapters a, [class*="chapter"] a').each((i, el) => {
      try {
        const chapterElement = $(el);
        const chapterText = chapterElement.text().trim();
        const chapterUrl = chapterElement.attr('href') || '';
        
        // Extract chapter number
        const chapterNum = extractChapterNumber(chapterText) || (i + 1);
        
        // Extract views for this chapter
        let chapterViews = chapterElement.find('.views, [class*="views"]').text().trim() || '';
        const viewsCount = extractNumber(chapterViews);
        
        // Extract upload date
        let uploaded = chapterElement.find('.date, .time, [class*="date"], [class*="time"]').text().trim() || '';
        
        // Create chapter ID from URL or use chapter number
        let chapterId = '';
        if (chapterUrl) {
          const parts = chapterUrl.split('/');
          chapterId = parts[parts.length - 1] || chapterNum.toString();
        } else {
          chapterId = chapterNum.toString();
        }
        
        chapters.push({
          chapterId: chapterId,
          chapterNumber: chapterNum,
          title: chapterText,
          views: viewsCount,
          uploaded: uploaded,
          timestamp: new Date().getTime(), // Use current time as fallback
          url: chapterUrl.startsWith('http') ? chapterUrl : (baseUrl + chapterUrl)
        });
      } catch (error) {
        console.error('Error processing chapter:', error);
      }
    });
    
    // Sort chapters by number (descending for latest first)
    chapters.sort((a, b) => b.chapterNumber - a.chapterNumber);
    
    return {
      success: true,
      id: mangaId,
      title: title,
      imageUrl: imageUrl,
      author: author,
      status: status,
      lastUpdated: lastUpdated,
      views: viewCount,
      genres: genres,
      rating: ratingValue,
      description: description,
      chapters: chapters
    };
  } catch (error) {
    console.error('Error scraping manga details:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Function to scrape chapter pages
async function scrapeChapterPages(mangaId, chapterId) {
  try {
    if (!mangaId || !chapterId) {
      throw new Error('Manga ID and Chapter ID are required');
    }
    
    const baseUrl = 'https://mangabuddy.com';
    const url = `${baseUrl}/${mangaId}/${chapterId}`;
    
    // Fetch HTML
    const html = await fetchHtml(url);
    const $ = cheerio.load(html);
    
    // Extract image URLs
    const imageUrls = [];
    
    // Try different selectors for manga pages
    $('.page-img, .page-image, [class*="page"] img, img[class*="page"]').each((i, el) => {
      let imgUrl = $(el).attr('data-src') || 
                   $(el).attr('data-original') || 
                   $(el).attr('src') || '';
      
      if (imgUrl && !imgUrl.startsWith('http')) {
        imgUrl = baseUrl + imgUrl;
      }
      
      if (imgUrl) {
        imageUrls.push(imgUrl);
      }
    });
    
    // If no images found with above selectors, try more generic ones
    if (imageUrls.length === 0) {
      $('img').each((i, el) => {
        const img = $(el);
        const src = img.attr('data-src') || img.attr('src') || '';
        const alt = img.attr('alt') || '';
        
        // Filter for manga page images
        if (src && (alt.toLowerCase().includes('page') || src.includes('page') || src.includes('chapter'))) {
          let imgUrl = src;
          if (!imgUrl.startsWith('http')) {
            imgUrl = baseUrl + imgUrl;
          }
          imageUrls.push(imgUrl);
        }
      });
    }
    
    return {
      success: true,
      mangaId: mangaId,
      chapterId: chapterId,
      imageUrls: imageUrls,
      totalPages: imageUrls.length
    };
  } catch (error) {
    console.error('Error scraping chapter pages:', error);
    return {
      success: false,
      error: error.message,
      imageUrls: [],
      totalPages: 0
    };
  }
}

module.exports = { scrapeMangaDetails, scrapeChapterPages };