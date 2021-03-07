import { deserializeFeed, FeedType } from 'https://deno.land/x/rss@0.3.3/mod.ts';
import { DOMParser, Element } from "https://deno.land/x/deno_dom@v0.1.6-alpha/deno-dom-wasm.ts";
import { savePost, notAlreadySaved, getAllLinks } from "../dao.ts";


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

const poll_rss_link = async (rssLink: string) => {
    const xml = await fetch(rssLink).then(resp => resp.text())
    const { feed } = await deserializeFeed(xml, { outputJsonFeed: true });
  
    for (const item of feed.items) {
        let title = item.title as string
        let summary = item.summary as string ?? ""
        let url = item.id as string

        let doc: any = domParser.parseFromString(summary, "text/html")
        let relevant = isRelevant(title, doc.textContent)
        // TODO first extract all the url and check in one go, instead of one by one
        if (relevant && notAlreadySaved(url)) {
            console.log("saving", url)
            savePost(url, title, doc.textContent)
        } else {
            console.log("not saving", url)
        }
        await wait(2000);
    }
}




setInterval(() => {

    for (const [link] of getAllLinks()) {
        poll_rss_link(link)
    }

}, 30*60000);

