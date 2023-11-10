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

app.use('/image/:size/:path', async (req, res) => {
  const results = await getImage(req.params.path, req.params.size);
  res.end(results, 'binary');
});

app.use('/youtube/:id', async (req, res) => {
  const results = await getYoutubeStreamUrl(req.params.id);
  res.send(results);
});

app.listen(process.env.PORT || 3000);
