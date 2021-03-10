import { DB } from "https://deno.land/x/sqlite@v2.3.2/mod.ts"

const db = new DB("tsfeed.db");
// maybe remove valid BOOLEAN
// contains stuff (links) people submitted
db.query("CREATE TABLE IF NOT EXISTS pending_submissions (id INTEGER PRIMARY KEY AUTOINCREMENT, link TEXT, timestamp INTEGER, valid BOOLEAN)");
// contains the links that has been validated to be rss links
db.query("CREATE TABLE IF NOT EXISTS rss_links (id INTEGER PRIMARY KEY AUTOINCREMENT, link TEXT UNIQUE, timestamp INTEGER)");
// contains polled rss validated feeds 
db.query("CREATE TABLE IF NOT EXISTS relevant_post (id INTEGER PRIMARY KEY AUTOINCREMENT, source TEXT UNIQUE, title TEXT, summary TEXT, timestamp INTEGER)");
// TODO what does on conflict replace mean
db.query("CREATE TABLE IF NOT EXISTS votes (post_id INTEGER, votes INTEGER, voters_ip TEXT, UNIQUE(post_id, voters_ip) ON CONFLICT REPLACE)");



export const saveLink = (rssLink: string) => {
    try {
        db.query("INSERT INTO rss_links (link, timestamp) VALUES (?, ?)", [rssLink, Date.now()]);
        console.log("added to rss_link", rssLink)
        return true
    } catch(e) {
        console.log(e)
        return false
    }
}

export const updateLink = (oldLink: string, newLink: string) => {    
    return db.query("UPDATE rss_links SET link = (?) where link = (?)", [newLink, oldLink])
}

export const getAllLinks = () => {
    try {
        return db.query("SELECT link from rss_links");
    } catch(e) {
        return []
    }
}

export const getPostsByIndexAndSize = (index: number, size: number) => {
    return db.query("SELECT * from relevant_post r LEFT JOIN votes v ON r.id = v.post_id limit ?,?", [index, size])
}

export const savePost = (source: string, title: string, summary: string) => {    
    try {
        db.query("INSERT INTO relevant_post(source, title, summary, timestamp) VALUES (?, ?, ?, ?)", [source, title, summary, Date.now()])
    } catch(e) {
        console.log(e)
    }
}

export const notAlreadySaved = (source: string) => {
    try {
        const [count] = db.query("SELECT count(*) from relevant_post where source = (?)", [source])
        if (count[0] === 0) {
            return true;
        } else {
            return false;
        }
    } catch(e) {
        console.log(e)
        throw e
    }
}

export const submitLink = (rssLink: string) => {
    // check link is not already submitted
    const [count] = db.query("SELECT count(*) FROM pending_submissions where link=(?)", [rssLink]);
    if (count[0] === 0) {
        db.query("INSERT INTO pending_submissions (link, timestamp, valid) VALUES (?, ?, ?)", [rssLink, Date.now(), false]);
        return true;
    } else {
        return false;
    }
}

export const getSubmissions = () => {
    return db.query("SELECT * FROM pending_submissions")
}

export const getVoteInfo = (postId: number, votersIP: string) => {
    return db.query("SELECT * from votes where post_id = (?) and voters_ip = (?)", [postId, votersIP])
}

export const updateVoteInfo = (postId: number, votersIP: string, vote: number) => {
    return db.query("REPLACE INTO votes (post_id, votes, voters_ip) VALUES (?, ?, ?)", [postId, vote, votersIP])
}