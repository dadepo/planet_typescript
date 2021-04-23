import { DB, v4 } from "../deps.ts";
import { Result } from "../lib.ts"


export class RelevantPostDao {
  constructor(private db: DB) {
    this.db.query(
      "CREATE TABLE IF NOT EXISTS relevant_post (id INTEGER PRIMARY KEY AUTOINCREMENT, website TEXT, source TEXT UNIQUE, title TEXT, summary TEXT, hidden BOOLEAN, timestamp INTEGER, uuid TEXT)",
    );
  }

  public savePost(website: string, source: string, title: string, summary: string) {
    try {
      const genUUID = v4.generate()
      this.db.query(
        "INSERT INTO relevant_post(website, source, title, summary, hidden, timestamp, uuid) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [website, source, title, summary, false, Date.now(), genUUID],
      );
      
      return {kind:"success", value: genUUID}
    } catch (e) {
      return { kind: "fail", message: (e as Error).message }
    }
  }

  public getAllVisiblePostsOrderByVotes(offset: number, size: number) {
    try {
      const results = this.db.query(
        "SELECT * from relevant_post r LEFT JOIN (select post_id, SUM(votes) as votes from votes group by post_id) v ON r.id = v.post_id WHERE r.hidden = false ORDER BY votes DESC limit ?,?",
        [offset, size],
      );

      return {kind: "success", value: results}

    } catch(e) {
      return {kind: "fail", message: (e as Error).message}
    }
  }

  public getAllVisiblePostsOrderByTime(offset: number, size: number) {
    try {
      const results = this.db.query(
          "SELECT * from relevant_post r LEFT JOIN (select post_id, SUM(votes) as votes from votes group by post_id) v ON r.id = v.post_id WHERE r.hidden = false ORDER BY timestamp DESC limit ?,?",
          [offset, size],
      );

      return {kind: "success", value: results}

    } catch(e) {
      return {kind: "fail", message: (e as Error).message}
    }
  }

  public getAllPosts(offset: number, size: number) {
    try {
      const results = this.db.query(
        "SELECT * from relevant_post r LEFT JOIN (select post_id, SUM(votes) as votes from votes group by post_id) v ON r.id = v.post_id ORDER BY timestamp ASC limit ?,?",
        [offset, size],
      );

      return {kind: "success", value: results}

    } catch(e) {
      return {kind: "fail", message: (e as Error).message}
    }
  }

  public getPostByUUID(uuid: string) {
    try {
      return {
        kind: "success",
        value: this.db.query("SELECT * from relevant_post where uuid = ?", [uuid])
      }
    } catch (e) {
      return {kind: "fail", message: (e as Error).message}
    }
  }

  public hidePost(id:number) {
    try {
      this.db.query("UPDATE relevant_post SET hidden = true where id = ?", [id])
    } catch(e: unknown) {
      return {kind: "fail", message: (e as Error).message}
    }
  }

  public showPost(id:number) {
    try {
      this.db.query("UPDATE relevant_post SET hidden = false where id = ?", [id])
    } catch(e: unknown) {
      return {kind: "fail", message: (e as Error).message}
    }
  }

  public countBySource(source: string): Result<number> {
    //note should only be 0 or 1
    try {
      const [count] = this.db.query(
        "SELECT count(*) from relevant_post where source = (?)",
        [source],
      );
      return { kind:"success", value: count[0] }
    } catch (e) {
      return {kind: "fail", message: (e as Error).message}
    }
  }

}
