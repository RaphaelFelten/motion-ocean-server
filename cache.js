import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

export default class Cache {
  db = null;

  constructor() {}

  async init() {
    this.db = await open({
      filename: 'cache.db',
      driver: sqlite3.Database,
    });

    // Dropping the tables
    await this.db.exec('drop table if exists cache');
    await this.db.exec('drop table if exists images');

    // Creating the tables
    await this.db.exec(
      `create table cache (path text, query text, data text, expires timestamp default (datetime('now', '+1 hour')))`
    );
    await this.db.exec(
      `create table images (path text, size text, data blob, expires timestamp default (datetime('now', '+1 hour')))`
    );
  }

  async getData(path, query) {
    return await this.db.get(
      'select * from cache where path = $path and query = $query and expires > current_timestamp',
      { $path: path, $query: JSON.stringify(query) }
    );
  }

  async setData(path, query, data) {
    await this.db.exec(
      'insert into cache (path, query, data) values ($path, $query, $data)',
      {
        $path: path,
        $query: JSON.stringify(query),
        $data: JSON.stringify(data),
      }
    );
  }

  async getImage(path, size) {
    return await this.db.get(
      'select * from images where path = $path and size = $size and expires > current_timestamp',
      { $path: path, $size: size }
    );
  }

  async setImage(path, size, data) {
    await this.db.exec(
      'insert into images (path, size, data) values ($path, $size, $data)',
      {
        $path: path,
        $size: size,
        $data: data,
      }
    );
  }
}
