import { DOMParser } from "../deps.ts";

import { db } from "../dao/db_connection.ts"
import { RssLinkDao } from "../dao/rss_links_dao.ts"

const rssLinkDao = new RssLinkDao(db)

self.onmessage = async (e: any) => {
    const { link } = e.data;
    console.log("submitted " + link)
    await processLink(link)
    self.close();
  };

const processLink = async (link: string) => {
    const resp = await fetch(link)
    let contentOfLink = await resp.text()

    if (!isXML(contentOfLink)) {
        // parse the xml link
        // TODO fix all the type assertiong and probably don't recurse
        const doc = new DOMParser().parseFromString(contentOfLink, "text/html")!;
        let rssLink = doc.querySelector("link[type='application/rss+xml']")?.getAttribute("href") as string
        rssLink = rssLink ?? doc.querySelector("link[type='application/atom+xml']")?.getAttribute("href") as string
        if (rssLink) {
            if (!rssLink.includes("http")) {
                rssLink = `${link}/${rssLink}`
            }
            await rssLinkDao.saveSubmittedLink(new URL(link).origin, rssLink)
        } else {
            console.log("Cant retrieve rss")
        }
    } else {
        await rssLinkDao.saveSubmittedLink(new URL(link).origin, link)
    }
}

const isXML = (content: string) => {
    return content.includes("<?xml") || content.includes("xmlns")
}
