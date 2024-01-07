import { CheerioCrawler, ProxyConfiguration, Dataset } from 'crawlee';

import { router } from './routes.js';

// Note: W3C does have a JSON API, see https://api.w3.org/doc, that can be used
// to retrieve some of the necessary information. It does not have all of it,
// however, and so it may be easier just to scrape the site like for all of the
// others.

const startUrls = ['https://www.w3.org/TR/'];

const crawler = new CheerioCrawler({
    requestHandler: router,
    // Comment this option to scrape the full website.
    // maxRequestsPerCrawl: 20,
});

await crawler.run(startUrls);

var urlFromHist = {};
var all = {};
const dataset = await crawler.getDataset();
await dataset.forEach(async (item, index) => {
  if (item['type'] == 'record') {
    urlFromHist[item['histUrl']] = item['url'];
    all[item['url']] = item;
  } else if (item['type'] == 'history') {
    all[urlFromHist[item['url']]]['history'] = item['history'];
  } else if (item['type'] == 'keyphrases') {
    all[item['url']]['keyphrases'] = item['keyphrases'];
  }
});

const datasetCombined = await Dataset.open('combined');
for (var rec of Object.values(all)) {
  const  {type, ...newRec} = rec;
  await datasetCombined.pushData(newRec);
}
await datasetCombined.exportToJSON('result');

