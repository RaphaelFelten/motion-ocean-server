import express, { json } from 'express';
import cors from 'cors';
import {} from 'dotenv/config';
import { get, getImage, getYoutubeStreamUrl } from './api.js';

const app = express();
app.use(json());
app.use(cors());

app.use('/data/:path(*)', async (req, res) => {
  console.log(req.params.path, req.query);
  const results = await get(req.params.path, req.query);
  res.send(results);
});

app.use('/search', async (req, res) => {
  const result = await get('search/multi', req.query);
  const promises = [];
  for (const item of result.results) {
    if (item.media_type === 'movie') {
      promises.push({
        item,
        promise: get(`movie/${item.id}`, { append_to_response: 'credits' }),
      });
    } else if (item.media_type === 'tv') {
      promises.push({
        item,
        promise: get(`tv/${item.id}`, { append_to_response: 'credits' }),
      });
    } else if (item.media_type === 'person') {
      promises.push({
        item,
        promise: get(`person/${item.id}`, {
          append_to_response: 'combined_credits',
        }),
      });
    }
  }

  const results = await Promise.all(promises.map((p) => p.promise));
  for (const [i, result] of results.entries()) {
    promises[i].item.details = result;
    if (promises[i].item.media_type === 'person') {
      promises[i].item.credits = result.combined_credits;
    }
  }

  res.send(result);
});

app.use('/image/:size/:path', async (req, res) => {
  const results = await getImage(req.params.path, req.params.size);
  res.end(results, 'binary');
});

app.use('/youtube/:id', async (req, res) => {
  const results = await getYoutubeStreamUrl(req.params.id);
  res.send(results);
});

app.listen(process.env.PORT || 3000, () => {
  console.log('Server is listening on port ' + process.env.PORT || 3000);
});
