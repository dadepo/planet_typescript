import { DB } from "../deps.ts"
import {Success, Fail, Result} from "../lib.ts"

export type Submission = {id:number, link: string, timestamp: number, valid: boolean}
export class PendingSubmissionDao {
  constructor(private db: DB) {
    this.db.query(
      "CREATE TABLE IF NOT EXISTS pending_submissions (id INTEGER PRIMARY KEY AUTOINCREMENT, link TEXT, timestamp INTEGER, valid BOOLEAN)",
    );
  }

  public submitLink(rssLink: string): Result<boolean> {
    // check link is not already submitted

    try {
      const [{count}] = this.db.query(
        "SELECT count(*) as count FROM pending_submissions where link=?",
        [rssLink],
      ).asObjects();
  
      if (count === 0) {
        this.db.query(
          "INSERT INTO pending_submissions (link, timestamp, valid) VALUES (?, ?, ?)",
          [rssLink, Date.now(), false],
        );

        return {
          kind:"success",
          value: true
        };

      } else {
        return {
          kind:"fail",
          message: "Link previously submitted"
        };
      }
    } catch(err) {
        return {
          kind:"fail",
          message: (err as Error).message
        }
      }
  }

  public getSubmissions() {
    return this.db.query("SELECT * FROM pending_submissions");
  }
}
