const { chromium } = require('playwright');
const fs = require('fs');

async function validateHackerNewsArticles() {
  // launch browser
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // go to Hacker News
  await page.goto('https://news.ycombinator.com/newest');

  // wait for the articles to load
  await page.waitForSelector('.itemlist');

  // extract article times
  const articles = await page.$$eval('.athing', items => {
    return items.map(item => {
      const titleElement = item.querySelector('.titleline > a');
      const ageElement = item.querySelector('.age');

      return {
        title: titleElement.innerText,
        url: titleElement.href,
        age: ageElement ? ageElement.innerText : 'unknown'
      };
    }).slice(0, 100); // Get the first 100 articles
  });

  // Convert age text to comparable format
  function convertAgeToMinutes(ageText) {
    const now = new Date();
    const [value, unit] = ageText.split(' ');

    if (unit.startsWith('minute')) {
      return now - value * 60 * 1000;
    } else if (unit.startsWith('hour')) {
      return now - value * 60 * 60 * 1000;
    } else if (unit.startsWith('day')) {
      return now - value * 24 * 60 * 60 * 1000;
    } else {
      return now;
    }
  }

  const articlesWithTimestamps = articles.map(article => ({
    ...article,
    timestamp: convertAgeToMinutes(article.age)
  }));

  // Check if the articles are sorted by timestamp (newest to oldest)
  let sorted = true;
  for (let i = 1; i < articlesWithTimestamps.length; i++) {
    if (articlesWithTimestamps[i - 1].timestamp < articlesWithTimestamps[i].timestamp) {
      sorted = false;
      break;
    }
  }

  // Print validation result
  if (sorted) {
    console.log('The first 100 articles are sorted from newest to oldest.');
  } else {
    console.log('The articles are NOT sorted correctly.');
  }

  // close browser
  await browser.close();
}

(async () => {
  await validateHackerNewsArticles();
})();