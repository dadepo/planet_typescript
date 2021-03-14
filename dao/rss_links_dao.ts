import { DB } from "../deps.ts";
import { Result } from "../lib.ts"

export class RssLinkDao {
  constructor(private db: DB) {
    // contains the links that has been validated to be rss links
    this.db.query(
      "CREATE TABLE IF NOT EXISTS rss_links (id INTEGER PRIMARY KEY AUTOINCREMENT, link TEXT UNIQUE, timestamp INTEGER)",
    );
  }

  public saveLink(rssLink: string): Result<boolean>  {
    try {
      this.db.query("INSERT INTO rss_links (link, timestamp) VALUES (?, ?)", [
        rssLink,
        Date.now(),
      ]);
      return {kind:"success", value: true};
    } catch (e) {
      return { kind:"fail", message: (e as Error).message };
    }
  }

  public updateLink(oldLink: string, newLink: string): Result<boolean> {
    try {
      this.db.query("UPDATE rss_links SET link = (?) where link = (?)", [
        newLink,
        oldLink,
      ]);
      return {kind:"success", value: true}
    } catch(e) {
      return { kind:"fail", message: (e as Error).message };
    }
  }

  public getAllLinks() {
    try {
      return this.db.query("SELECT link from rss_links");
    } catch (e) {
      return [];
    }
  }
}
