import { DB } from "../deps.ts";

export class RelevantPostDao {
  constructor(private db: DB) {
    // contains polled rss validated feeds
    this.db.query(
      "CREATE TABLE IF NOT EXISTS relevant_post (id INTEGER PRIMARY KEY AUTOINCREMENT, source TEXT UNIQUE, title TEXT, summary TEXT, timestamp INTEGER)",
    );
  }

  public getPostsByIndexAndSize(index: number, size: number) {
    return this.db.query(
      "SELECT * from relevant_post r LEFT JOIN votes v ON r.id = v.post_id limit ?,?",
      [index, size],
    );
  }

  public savePost(source: string, title: string, summary: string) {
    try {
      this.db.query(
        "INSERT INTO relevant_post(source, title, summary, timestamp) VALUES (?, ?, ?, ?)",
        [source, title, summary, Date.now()],
      );
    } catch (e) {
      console.log(e);
    }
  }

  public notAlreadySaved(source: string) {
    try {
      const [count] = this.db.query(
        "SELECT count(*) from relevant_post where source = (?)",
        [source],
      );
      if (count[0] === 0) {
        return true;
      } else {
        return false;
      }
    } catch (e) {
      console.log(e);
      throw e;
    }
  }
}
