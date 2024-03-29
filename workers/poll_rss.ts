import { deserializeFeed, RSS1, RSS2, Feed } from "../deps.ts";
import { DOMParser } from "../deps.ts";

import { RelevantPostDao } from "../dao/relevant_post_dao.ts"
import { RssLinkDao } from "../dao/rss_links_dao.ts"
import { db } from "../dao/db_connection.ts"
import { Result } from "../lib.ts";
import {config}  from "../deps.ts";

import {isRelevant} from "../utils/patterns.ts";
import {postTweet} from "../utils/tweeter.ts";
import {TwitterHandleDao} from "../dao/twitter_handle_dao.ts";

const relevantPostDao = new RelevantPostDao(db)
const rssLinkDao = new RssLinkDao(db)
const twtHandleDao = new TwitterHandleDao(db);

const domParser = new DOMParser()


async function sleep(ms: number) {
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

const poll_rss_link = async (website:string, rssLink: string) => {
    const xml = await fetch(rssLink).then(resp => resp.text())

    try {
        const {feed, feedType} = await deserializeFeed(xml);

        let items: Item[] = []

        if (isAtom(feed)) {
            feed.entries.forEach(element => {
                items.push({
                    title: element.title.value ?? "",
                    summary: element.summary?.value ?? "",
                    url: (element as any).href ?? ""
                })
            });
        } else if (isRss1(feed)) {
            feed.channel.items.forEach(element => {
                items.push({
                    title: element.title ?? "",
                    summary: element.description ?? "",
                    url: element.link ?? ""
                })
            })
        } else if (isRss2(feed)) {
            feed.channel.items.forEach(element => {
                items.push({
                    title: element.title ?? "",
                    summary: element.description ?? "",
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
            let relevant = isRelevant(title) || isRelevant(doc.textContent)
            // TODO first extract all the url and check in one go, instead of one by one
            let result: Result<number> = relevantPostDao.countBySource(url)

            switch (result.kind) {
                case ("success"): {
                    if (relevant) {
                        if (result.value === 0) {
                            let uuid = relevantPostDao.savePost(website, url, title, doc.textContent).value!
                            const twitterHandleResult = [...twtHandleDao.getTwitterHandle(rssLink).value!.asObjects()][0]
                            const twitterHandle = twitterHandleResult ? twitterHandleResult.twitter_handle : ""
                            postTweet({title, url, uuid, twitterHandle})
                        } else {
                            // console.log("already saved", url)
                        }
                    } else {
                        // console.log("not relevant", url)
                    }
                    break;
                }
                case ("fail"): {
                    console.log("Error", result.message)
                    break;
                }

            }

            await sleep(5000);
        }
    } catch (e) {
        console.log(e)
        console.log(`Error processing ${website} and ${rssLink}`)
    }
}


const poll = () => {
    console.log(`started polling at ${new Date().toUTCString()}`)
    let result = rssLinkDao.getAllActiveRSSLinks()
    switch(result.kind) {
        case ("fail"): {
            break
        }
        case ("success"): {
            for (const [,website, link] of result.value!) {
                poll_rss_link(website, link)
            }
            break
        }
    }
}


if (config()["PAUSE"] !== "true") {
console.log("first polling")
poll()
setInterval(() => {
    poll()
}, 3600000);
}

