import { DB } from "../deps.ts";
import { Result } from "../lib.ts"

export class RssLinkDao {
  constructor(private db: DB) {
    // contains the links that has been validated to be rss links
    this.db.query(
      "CREATE TABLE IF NOT EXISTS rss_links (id INTEGER PRIMARY KEY AUTOINCREMENT, website TEXT UNIQUE, rss_link TEXT UNIQUE, timestamp INTEGER)",
    );
  }

  public saveSubmittedLink(website: string, rssLink: string): Result<boolean>  {
    try {
      this.db.query("INSERT INTO rss_links (website, rss_link, timestamp) VALUES (?, ?, ?)", [website, rssLink, Date.now()]);
      return {kind:"success", value: true};
    } catch (e) {
      return { kind:"fail", message: (e as Error).message };
    }
  }

  public getAllRSSLinks() {
    try {
      return {
        kind:"success",
        value:this.db.query("SELECT id, website, rss_link, timestamp from rss_links")
      };
    } catch (e) {
      return { kind:"fail", message: (e as Error).message };
    }
  }
}
