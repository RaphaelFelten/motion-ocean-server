import express, { json } from 'express';
import cors from 'cors';
import {} from 'dotenv/config';
import { get, getImage, getYoutubeStreamUrl } from './api.js';
import Cache from './cache.js';

const app = express();
app.use(json());
app.use(cors());

const cache = new Cache();
await cache.init();

app.use('/data/:path(*)', async (req, res) => {
  try {
    // Check if the data is in the cache
    const cached = await cache.getData(req.params.path, req.query);
    if (cached) {
      console.log('cached data:', cached.data);
      res.send(cached.data);
      return;
    }

    // Get the data from the API
    const results = await get(req.params.path, req.query);

    // Save the data in the cache
    await cache.setData(req.params.path, req.query, results);

    res.send(results);
  } catch (e) {
    res.status(500).send(e.message);
  }
});

app.use('/search', async (req, res) => {
  // Check if the data is in the cache
  const cached = await cache.getData('search', req.query);
  if (cached) {
    res.send(cached.data);
    return;
  }

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

  // Save the data in the cache
  await cache.setData('search', req.query, result);

  res.send(result);
});

app.use('/image/:size/:path', async (req, res) => {
  // Check if the image is in the cache
  const cached = await cache.getImage(req.params.path, req.params.size);
  if (cached) {
    res.end(cached.data, 'binary');
    return;
  }

  // Get the image from the API
  const results = await getImage(req.params.path, req.params.size);

  // Save the image in the cache
  await cache.setImage(req.params.path, req.params.size, results);

  res.end(results, 'binary');
});

app.use('/youtube/:id', async (req, res) => {
  const cached = await cache.getData('youtube', req.params);
  if (cached) {
    res.send(cached.data);
    return;
  }

  const results = await getYoutubeStreamUrl(req.params.id);

  await cache.setData('youtube', req.params, results);

  res.send(results);
});

app.listen(process.env.PORT || 3000, () => {
  console.log('Server is listening on port ' + process.env.PORT || 3000);
});
