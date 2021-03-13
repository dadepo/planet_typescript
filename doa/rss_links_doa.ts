import { DB } from "../deps.ts";

export class RssLinkDoa {
  constructor(private db: DB) {
    // contains the links that has been validated to be rss links
    this.db.query(
      "CREATE TABLE IF NOT EXISTS rss_links (id INTEGER PRIMARY KEY AUTOINCREMENT, link TEXT UNIQUE, timestamp INTEGER)",
    );
  }

  public saveLink(rssLink: string) {
    try {
      this.db.query("INSERT INTO rss_links (link, timestamp) VALUES (?, ?)", [
        rssLink,
        Date.now(),
      ]);
      console.log("added to rss_link", rssLink);
      return true;
    } catch (e) {
      console.log(e);
      return false;
    }
  }

  public updateLink(oldLink: string, newLink: string) {
    return this.db.query("UPDATE rss_links SET link = (?) where link = (?)", [
      newLink,
      oldLink,
    ]);
  }

  public getAllLinks() {
    try {
      return this.db.query("SELECT link from rss_links");
    } catch (e) {
      return [];
    }
  }
}
