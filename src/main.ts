import { CheerioCrawler, ProxyConfiguration } from 'crawlee';

import { router } from './routes.js';

// Note: W3C does have a JSON API, see https://api.w3.org/doc, that can be used
// to retrieve some of the necessary information. It does not have all of it,
// however, and so it may be easier just to scrape the site like for all of the
// others.

const startUrls = ['https://www.w3.org/TR/'];

const crawler = new CheerioCrawler({
    requestHandler: router,
    // Comment this option to scrape the full website.
    maxRequestsPerCrawl: 20,
});

await crawler.run(startUrls);
