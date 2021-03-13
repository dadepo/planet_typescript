import { DB } from "../deps.ts";

export class VoteDao {
  constructor(private db: DB) {
    // TODO what does on conflict replace mean
    this.db.query(
      "CREATE TABLE IF NOT EXISTS votes (post_id INTEGER, votes INTEGER, voters_ip TEXT, UNIQUE(post_id, voters_ip) ON CONFLICT REPLACE)",
    );
  }

  public getVoteInfo(postId: number, votersIP: string) {
    return this.db.query(
      "SELECT * from votes where post_id = (?) and voters_ip = (?)",
      [postId, votersIP],
    );
  }

  public updateVoteInfo(postId: number, votersIP: string, vote: number) {
    return this.db.query(
      "REPLACE INTO votes (post_id, votes, voters_ip) VALUES (?, ?, ?)",
      [postId, vote, votersIP],
    );
  }
}
