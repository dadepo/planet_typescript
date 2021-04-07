import { DB } from "../deps.ts";

export class ResetDao {
    constructor(private db: DB) {
        this.db.query(
            "CREATE TABLE IF NOT EXISTS reset (email TEXT UNIQUE, bare_link TEXT, reset_link TEXT, timestamp INTEGER)",
        );
    }

    addResetLink(email:string, bareLink:string, resetLink: string) {
        try {
            return {
                kind: "success",
                value: this.db.query(
                    "INSERT INTO reset (email, bare_link, reset_link, timestamp) VALUES (?, ?, ?, ?)",
                    [email, bareLink, resetLink, Date.now()]
                )
            }
        } catch (e) {
            return { kind:"fail", message: (e as Error).message };
        }

    }

    getByLink(resetLink: string) {
        try {
            return {
                kind:"success",
                value:this.db.query("SELECT * from reset where reset_link = ?", [resetLink])
            };
        } catch (e) {
            return { kind:"fail", message: (e as Error).message };
        }
    }
}
