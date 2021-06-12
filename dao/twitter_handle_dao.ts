import { DB } from "../deps.ts";

export class TwitterHandleDao {
  constructor(private db: DB) {
    this.db.query(
      "CREATE TABLE IF NOT EXISTS twitter_handle (rss_link TEXT PRIMARY KEY, twitter_handle TEXT, UNIQUE(rss_link, twitter_handle))",
    );
  }

  public getTwitterHandle(rss_link: string) {
    try {
      return {
        kind: "success", 
        value: this.db.query("SELECT * from twitter_handle where rss_link = (?)", [rss_link])};
    } catch(e) {
      return {kind:"fail", message: (e as Error).message}
    }
  }

  public getAllTwitterHandle() {
    try {
      return {
        kind: "success",
        value: this.db.query("SELECT * from twitter_handle")};
    } catch(e) {
      return {kind:"fail", message: (e as Error).message}
    }
  }

  public deleteTwitterHandle(rss_link: string) {
    try {
      return {
        kind: "success",
        value: this.db.query("DELETE FROM twitter_handle WHERE rss_link = (?)", [rss_link])
      };

    } catch(e) {
      return {kind:"fail", message: (e as Error).message}
    }
  }

  public addTwitterHandler(rss_link: string, handle: string) {
    try {
      this.db.query(
          "INSERT OR REPLACE INTO twitter_handle (rss_link, twitter_handle) VALUES(?, ?)", [rss_link, handle],
      )
      return {
        kind:"success",
        value: handle
      }
    } catch(e) {
      return {kind:"fail", message: (e as Error).message}
    }
  }
}
