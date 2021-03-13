import { deserializeFeed } from '../deps.ts';
import { DOMParser } from "../deps.ts";

import { db } from "../doa/db_connection.ts"
import { RssLinkDoa } from "../doa/rss_links_doa.ts"

const rssLinkDoa = new RssLinkDoa(db)

self.onmessage = async (e: any) => {
    const { link } = e.data;
    console.log("submitted " + link)
    await processLink(link)
    self.close();
  };

const processLink = async (link: string) => {
    console.log("1111", link)
    const resp = await fetch(link)
    let xml = await resp.text()

    if (!isRSS(xml)) {
        console.log("in here")
        // parse the xml link
        // TODO fix all the type assertiong and probably don't recurse
        const doc = new DOMParser().parseFromString(xml, "text/html")!;
        const rssLink = doc.querySelector("link[type='application/rss+xml']")?.getAttribute("href") as string
        console.log("got new link", rssLink)
        if (rssLink) {
            const resp = await fetch(rssLink)
            link = rssLink;
            await rssLinkDoa.updateLink(link, rssLink)
            xml = await resp.text()
        } else {
            console.log("Cant retrieve rss")
        }
    }

    try {
        await deserializeFeed(xml, { outputJsonFeed: true });
        rssLinkDoa.saveLink(link)
    } catch(ex) {
        console.log(ex.message)
    }
}

const isRSS = (content: string) => {
    return content.includes("<?xml")
}