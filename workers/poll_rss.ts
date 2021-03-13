import { deserializeFeed, RSS1, RSS2, Feed } from "../deps.ts";
import { DOMParser } from "../deps.ts";

import { RelevantPostDao } from "../dao/relevant_post_dao.ts"
import { RssLinkDao } from "../dao/rss_links_dao.ts"
import { db } from "../dao/db_connection.ts"

const relevantPostDao = new RelevantPostDao(db)
const rssLinkDao = new RssLinkDao(db)


const domParser = new DOMParser()
const relevantKeywords = ["deno", "typescript", "javascript", "oak"]

console.log("I am a worker!")

const isRelevant = (title: string, summary: string): boolean => {
    let isRelevantTitle = title.split(" ").some(word => {
        return relevantKeywords.includes(word.toLowerCase())
    })

    let isRelevantSummary = summary.split(" ").some(word => {
        return relevantKeywords.includes(word.toLowerCase())
    })

    return isRelevantTitle || isRelevantSummary;
}

async function wait(ms: number) {
    return new Promise(resolve => {
      setTimeout(resolve, ms);
    });
}


const isAtom = (input: any): input is Feed => {
    return "entries" in input
}

const isRss1 = (input: any): input is RSS1 => {
    return "channel" in input
}

const isRss2 = (input: any): input is RSS2 => {
    return "version" in input
}

type Item = {title: string, summary: string, url: string}

const poll_rss_link = async (rssLink: string) => {
    const xml = await fetch(rssLink).then(resp => resp.text())
    const { feed, feedType } = await deserializeFeed(xml);

    let items: Item[] = []

    if (isAtom(feed)) {
        feed.entries.forEach(element => {
            items.push({
                title: element.title.value ?? "",
                summary: element.content?.value?.split(" ").splice(0, 30).join(" ") ?? "",
                url: element.id ?? ""
            })
        });
    } else if (isRss1(feed)) {
        feed.channel.items.forEach(element => {
            items.push({
                title: element.title ?? "",
                summary: element.description?.split(" ").splice(0, 30).join(" ") ?? "",
                url: element.link ?? ""
            })
        })
    } else if (isRss2(feed)) {
        feed.channel.items.forEach(element => {
            items.push({
                title: element.title ?? "",
                summary: element.description?.split(" ").splice(0, 30).join(" ") ?? "",
                url: element.link ?? ""
            })
        })
    } else {
        console.log(4, feedType)
    }

    for (const item of items) {
        let title = item.title
        let summary = item.summary
        let url = item.url

        let doc: any = domParser.parseFromString(summary, "text/html")
        let relevant = isRelevant(title, doc.textContent)
        // TODO first extract all the url and check in one go, instead of one by one
        if (relevant && relevantPostDao.notAlreadySaved(url)) {
            console.log("saving", url)
            relevantPostDao.savePost(url, title, doc.textContent)
        } else {
            console.log("not saving", url)
        }
        await wait(2000);
    }
}


const poll = () => {
    for (const [link] of rssLinkDao.getAllLinks()) {
        poll_rss_link(link)
    }
}

poll()
setInterval(() => {
    poll()
}, 120000);
