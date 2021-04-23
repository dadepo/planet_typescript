import { deserializeFeed, RSS1, RSS2, Feed } from "../deps.ts";
import { DOMParser } from "../deps.ts";

import { RelevantPostDao } from "../dao/relevant_post_dao.ts"
import { RssLinkDao } from "../dao/rss_links_dao.ts"
import { db } from "../dao/db_connection.ts"
import { Result } from "../lib.ts";
import {config}  from "../deps.ts";
import {isRelevant} from "../utils/patterns.ts";
import twitter from 'https://dev.jspm.io/twitter';

const relevantPostDao = new RelevantPostDao(db)
const rssLinkDao = new RssLinkDao(db)
const domParser = new DOMParser()

let secret = {}
let client: any = {}

if (config()["ENV"] === "prod") {
    secret = {
        consumer_key: config()["CONSUMER_KEY"],
        consumer_secret: config()["CONSUMER_SECRET"],
        access_token_key: config()["ACCESS_TOKEN_KEY"],
        access_token_secret: config()["ACCESS_TOKEN_SECRET"]
    };

    client = (twitter as Function)(secret);
}

const origin = new URL(config()["RESET_LINK"]).origin

export const postTweet = (input: {title: string, url: string, uuid: string}) => {
    console.log("In env:" + config()["ENV"])

    let discussUrl = `${origin}/${new URL(input.url).hostname}/?itemid=${input.uuid}`

    let tweet = `
    ${input.title}
    
   Link: ${input.url}
   Discuss: ${discussUrl}
    `
    let hashTags = `
    #typescript #100DaysOfCode #javascript
    `
    if ((tweet + hashTags).length <= 280) {
        tweet = tweet + hashTags;
    }

    if (config()["ENV"] === "prod") {
        console.log("In prod, so tweeting")
        client.post('statuses/update', {status: tweet}, (error: any, tweet: any, response: any) => {
            if (error) throw error;
            console.log(tweet);
            console.log(response);
        });
    } else {
        console.log(tweet)
    }

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

                            postTweet({title, url, uuid})

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
            await wait(5000);
        }
    } catch (e) {
        console.log(`Error processing ${website} and ${rssLink}`)
    }
}


const poll = () => {
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
}, 900000);
}

