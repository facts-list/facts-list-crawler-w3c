// Part of the FACTS project. Copyright (C) 2024.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//
// SPDX-License-Identifier: Apache-2.0

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
  } else if (item['type'] == 'abstract') {
    all[item['url']]['abstract'] = item['abstract'];
  }
});

const allSorted = [];
for (var rec of Object.values(all)) {
  const  {type, ...newRec} = rec;
  allSorted.push(newRec);
}

allSorted.sort((a, b) => {
  return a.date.localeCompare(b.date) || a.title.localeCompare(b.title);
});

const datasetCombined = await Dataset.open('combined');
for (var rec of allSorted)
  await datasetCombined.pushData(rec);

await datasetCombined.exportToJSON('result');

