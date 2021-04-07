import { DB } from "../deps.ts";

export class UserDao {
    constructor(private db: DB) {
        this.db.query(
            "CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, display_name TEXT, email TEXT UNIQUE, password TEXT UNIQUE, auth_method TEXT, timestamp INTEGER)",
        );
    }

    addUser(displayName: string, email: string, passwordHash: string, authMethod: string) {
        try {
            this.db.query(
                "INSERT INTO users (display_name, email, password, auth_method) VALUES (?, ?, ?, ?)",
                [displayName, email, passwordHash, authMethod],
            )
            return {
                kind:"success",
                value: email
            }
        } catch(e) {
            return {kind:"fail", message: (e as Error).message}
        }
    }

    findUserByEmail(email: string) {
        try {
            const result = [...this.db.query("SELECT * from users where email = ? ", [email]).asObjects()]
            if (result.length === 0) {
                return {
                    kind:"fail",
                    message: "Not found"
                }
            } else {
                return {
                    kind: "success",
                    value: result
                }
            }
        } catch (e) {
            return {kind:"fail", message: (e as Error).message}
        }
    }

    findUserDetailsByEmail(email: string) {
        try {
            const result = [...this.db.query("SELECT display_name, email from users where email = ? ", [email]).asObjects()]
            if (result.length === 0) {
                return {
                    kind:"fail",
                    message: "Not found"
                }
            } else {
                return {
                    kind: "success",
                    value: result
                }
            }
        } catch (e) {
            return {kind:"fail", message: (e as Error).message}
        }
    }

    findUserByEmailAndPassword(email: string, passwordHash: string) {
        try {
            const result = [...this.db.query("SELECT * from users where email = ? AND password = ? ", [email, passwordHash]).asObjects()]
            if (result.length === 0) {
                return {
                    kind:"fail",
                    message: "Not found"
                }
            } else {
                return {
                    kind: "success",
                    value: result
                }
            }
        } catch (e) {
            return {kind:"fail", message: (e as Error).message}
        }
    }

    updatePassword(email: string, passwordHash: string) {
        try {
            this.db.query("UPDATE users SET (password) = (?) where email = (?)", [passwordHash, email])

            return {
                kind:"success",
                value: true
            }
        } catch(e) {
            return {kind:"fail", message: (e as Error).message}
        }
    }
}
