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

import { createCheerioRouter } from 'crawlee';

import { toString } from 'nlcst-to-string';
import { retext } from 'retext';
import retextKeywords from 'retext-keywords';
import retextPos from 'retext-pos';

export const router = createCheerioRouter();

router.addDefaultHandler(async ({ request, enqueueLinks, pushData, log, $ }) => {
    const title = $('title').text();
    const urls = [];
    const urlsHist = [];
    const records = [];

    $('.family-grouping .tr-list__item').each((index, el) => {
      var stdTitle = '';
      var stdUrl = '';
      var status = '';
      var date = '';
      var histUrl = '';

      $(el).find('h3 a').first().each((index0, el0) => {
        stdTitle = $(el0).text();
        stdUrl = $(el0).attr('href');
        stdUrl = new URL(stdUrl, request.loadedUrl).toString();
      });

      if (stdTitle.length === 0)
        return;

      $(el).find('.maturity-level').first().each((index0, el0) => {
        status = $(el0).text();
      });

      $(el).find('time').first().each((index0, el0) => {
        date = $(el0).attr('datetime');
      });

      $(el).find('div a').each((index0, el0) => {
        if ($(el0).text() != 'history')
          return;

        histUrl = $(el0).attr('href');
        histUrl = new URL(histUrl, request.loadedUrl).toString();
      });


      log.info(`${title}: ${stdTitle}: (${stdUrl}) ${status} ${date}; history: ${histUrl}`);

      if (histUrl.length !== 0)
        urlsHist.push(histUrl);

      urls.push(stdUrl);

      records.push({
          type: 'record',
          url: stdUrl,
          title: stdTitle,
          status: status,
          date: date,
          histUrl: histUrl
      });
    });

    for (var rec of records)
      await pushData(rec);

    await enqueueLinks({
        urls: urlsHist,
        label: 'history',
    });

    await enqueueLinks({
        urls: urls,
        label: 'detail',
    });
});

router.addHandler('history', async ({ request, $, log, pushData }) => {
    const title = $('title').text();
    const records = [];

    $('article table tbody tr').each((index, el) => {
      var url = '';
      var status = '';
      var date = '';

      $(el).find('td time').first().each((index0, el0) => {
        date = $(el0).attr('datetime');
      });

      $(el).find('td a').first().each((index0, el0) => {
        status = $(el0).text();
        url = $(el0).attr('href');
        url = new URL(url, request.loadedUrl).toString();
      });

      if (date.length === 0 || status.length === 0)
        return;

      records.push({
        url: url,
        status: status,
        date: date
      });
    });

    log.info(`history: ${title}`, { url: request.loadedUrl });

    await pushData({
        type: 'history',
        url: request.url,
        history: records
    });
});

router.addHandler('detail', async ({ request, $, log, pushData }) => {
    const title = $('title').text();
    log.info(`detail: ${title}`, { url: request.loadedUrl });

    const keyphrases = {};
    var abstract = '';

    for (var nm of [ 'ABSTRACT', 'INTRODUCTION' ]) {
      for (var hn of [ 'h2', 'h3', 'h4' ]) {
        $(hn).each((index, el) => {
          if (abstract.length !== 0)
            return;

          if ($(el).text().trim().toUpperCase() != nm)
            return;

          $(el).nextAll('p').first().each((index0, el0) => {
            abstract = $(el0).text().trim().replace(/\s+/g, ' ');
          });

          if (abstract.length !== 0)
            return;

          $(el).nextAll('div').first().find('p').first().each((index0, el0) => {
            abstract = $(el0).text().trim().replace(/\s+/g, ' ');
          });

          if (abstract.length !== 0)
            return;

          const mnm = new RegExp('^' + nm + '\\s*', 'i');
          $(el).parents('section').first().each((index0, el0) => {
            abstract = $(el0).text().trim().replace(/\s+/g, ' ')
                         .replace(mnm, '');
          });

          if (abstract.length !== 0)
            return;

          $(el).parents('div').first().each((index0, el0) => {
            abstract = $(el0).text().trim().replace(/\s+/g, ' ')
                         .replace(mnm, '');
          });
        });
      }
    }

/*
    const file = await retext()
      .use(retextPos) // Make sure to use `retext-pos` before `retext-keywords`.
      .use(retextKeywords, { maximum: 40 })
      .process($('body').text().replace(/\s+/g, ' '));

    if (file.data.keyphrases)
      for (const phrase of file.data.keyphrases)
        keyphrases[toString(phrase.matches[0].nodes)] = phrase.weight;
*/

    await pushData({
        type: 'abstract',
        url: request.url,
        abstract: abstract
    });
});
