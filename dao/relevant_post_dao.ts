import { DB } from "../deps.ts";
import { Result } from "../lib.ts"


export class RelevantPostDao {
  constructor(private db: DB) {
    this.db.query(
      "CREATE TABLE IF NOT EXISTS relevant_post (id INTEGER PRIMARY KEY AUTOINCREMENT, source TEXT UNIQUE, title TEXT, summary TEXT, timestamp INTEGER)",
    );
  }

  public savePost(source: string, title: string, summary: string): Result<boolean> {
    try {
      this.db.query(
        "INSERT INTO relevant_post(source, title, summary, timestamp) VALUES (?, ?, ?, ?)",
        [source, title, summary, Date.now()],
      );
      return {kind:"success", value: true}
    } catch (e) {
      return { kind: "fail", message: (e as Error).message }
    }
  }

  public getPosts(offset: number, size: number) {
    try {
      const results = this.db.query(
        "SELECT * from relevant_post r LEFT JOIN votes v ON r.id = v.post_id limit ?,?",
        [offset, size],
      );

      return {kind: "success", value: results}

    } catch(e) {
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
