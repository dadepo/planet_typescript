import { DB } from "../deps.ts"


export class PendingSubmissionDao {
  constructor(private db: DB) {
    this.db.query(
      "CREATE TABLE IF NOT EXISTS pending_submissions (id INTEGER PRIMARY KEY AUTOINCREMENT, link TEXT, timestamp INTEGER, valid BOOLEAN)",
    );
  }

  public submitLink(rssLink: string) {
    // check link is not already submitted
    const [count] = this.db.query(
      "SELECT count(*) FROM pending_submissions where link=(?)",
      [rssLink],
    );
    if (count[0] === 0) {
      this.db.query(
        "INSERT INTO pending_submissions (link, timestamp, valid) VALUES (?, ?, ?)",
        [rssLink, Date.now(), false],
      );
      return true;
    } else {
      return false;
    }
  }

  public getSubmissions() {
    return this.db.query("SELECT * FROM pending_submissions");
  }
}
