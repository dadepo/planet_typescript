import { DB } from "../deps.ts";

export class VoteDao {
  constructor(private db: DB) {
    // TODO what does on conflict replace mean
    this.db.query(
      "CREATE TABLE IF NOT EXISTS votes (post_id INTEGER, votes INTEGER, voters_email TEXT, UNIQUE(post_id, voters_email) ON CONFLICT REPLACE)",
    );
  }

  public getVoteInfo(postId: number, votersEmail: string) {
    try {
      return {
        kind: "success", 
        value: this.db.query(
        "SELECT * from votes where post_id = (?) and voters_email = (?)",
        [postId, votersEmail],
      )};
    } catch(e) {
      return {kind:"fail", message: (e as Error).message}
    }
  }

  public updateVoteInfo(postId: number, votersEmail: string, vote: number) {
    try {
      this.db.query(
          "REPLACE INTO votes (post_id, votes, voters_email) VALUES (?, ?, ?)",
          [postId, vote, votersEmail],
      )
      const currentVote = [...this.db.query("SELECT sum(votes) as votes FROM votes where post_id = ?", [postId])!.asObjects()][0]
      return {
        kind:"success",
        value: currentVote.votes
      }
    } catch(e) {
      return {kind:"fail", message: (e as Error).message}
    }
  }
}
