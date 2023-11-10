import axios from 'axios';
import {} from 'dotenv/config';

import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const Youtube = require('youtube-stream-url');

export async function get(url, params) {
  const fullUrl = `${process.env.TMDB_API_URL}/${url}?api_key=${
    process.env.TMDB_API_KEY
  }${getQueryParams(params)}`;
  const res = await axios.get(fullUrl, {
    headers: {
      'Accept-Encoding': 'gzip,deflate,compress',
    },
  });
  return res.data;
}

export async function getImage(path, size) {
  let url = process.env.TMDB_IMG_URL;
  if (!size) {
    size = 500;
  }
  if (size > 1000) {
    url += '/original';
  } else {
    url += `/w${size}`;
  }
  url += `/${path}`;
  const res = await axios.get(url, {
    responseType: 'arraybuffer',
  });
  return res.data;
}

export async function getYoutubeStreamUrl(id) {
  const url = `https://www.youtube.com/watch?v=${id}`;
  return await Youtube.getInfo({ url });
}

function getQueryParams(obj) {
  if (!obj || Object.keys(obj).length < 1) {
    return '';
  }
  let res = '';
  for (const [key, val] of Object.entries(obj)) {
    res += '&' + key + '=' + val;
  }
  return res;
}
