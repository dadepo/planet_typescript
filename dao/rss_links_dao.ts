import { DB } from "https://deno.land/x/sqlite@v2.3.2/mod.ts"
import { v4 } from "https://deno.land/std@0.94.0/uuid/mod.ts"

export class RssLinkDao {
  constructor(private db: DB) {
    // contains the links that has been validated to be rss links
    this.db.query(
      "CREATE TABLE IF NOT EXISTS rss_links (id INTEGER PRIMARY KEY AUTOINCREMENT, website TEXT UNIQUE, rss_link TEXT UNIQUE, timestamp INTEGER, hidden INTEGER DEFAULT 0, uuid TEXT unique)",
    );
  }

  public saveSubmittedLink(website: string, rssLink: string) {
    try {
      this.db.query("INSERT INTO rss_links (website, rss_link, timestamp, uuid) VALUES (?, ?, ?, ?)", [website, rssLink, Date.now(), v4.generate()]);
      return {kind:"success", value: true};
    } catch (e) {
      return { kind:"fail", message: (e as Error).message };
    }
  }

  public getAllRSSLinks() {
    try {
      return {
        kind:"success",
        value:this.db.query("SELECT id, website, rss_link, timestamp, hidden, uuid from rss_links")
      };
    } catch (e) {
      return { kind:"fail", message: (e as Error).message };
    }
  }

  public getAllActiveRSSLinks() {
    try {
      return {
        kind:"success",
        value:this.db.query("SELECT id, website, rss_link, timestamp, uuid from rss_links where hidden = 0")
      };
    } catch (e) {
      return { kind:"fail", message: (e as Error).message };
    }
  }

  public hidePost(id:number) {
    try {
      this.db.query("UPDATE rss_links SET hidden = 1 where id = ?", [id])
    } catch(e: unknown) {
      return {kind: "fail", message: (e as Error).message}
    }
  }

  public showPost(id:number) {
    try {
      this.db.query("UPDATE rss_links SET hidden = 0 where id = ?", [id])
    } catch(e: unknown) {
      return {kind: "fail", message: (e as Error).message}
    }
  }
}
