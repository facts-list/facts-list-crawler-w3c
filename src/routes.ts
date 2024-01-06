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

/*
    await enqueueLinks({
        urls: urlsHist,
        label: 'history',
    });
*/
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
        url: request.loadedUrl,
        history: records
    });
});

router.addHandler('detail', async ({ request, $, log, pushData }) => {
    const title = $('title').text();
    log.info(`detail: ${title}`, { url: request.loadedUrl });

    const keyphrases = {};

    const file = await retext()
      .use(retextPos) // Make sure to use `retext-pos` before `retext-keywords`.
      .use(retextKeywords, { maximum: 100 })
      .process($('body').text().replace(/\s+/g, ' '));

    if (file.data.keyphrases)
      for (const phrase of file.data.keyphrases)
        keyphrases[toString(phrase.matches[0].nodes)] = phrase.weight;

    await pushData({
        type: 'keyphrases',
        url: request.loadedUrl,
        keyphrases: keyphrases
    });
});
