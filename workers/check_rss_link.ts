import { deserializeFeed } from 'https://deno.land/x/rss@0.3.3/mod.ts';
import { saveLink } from "../dao.ts";

self.onmessage = async (e: any) => {
    const { link } = e.data;
    console.log("submitted " + link)
    await processLink(link)
    self.close();
  };


const processLink = async (link: string) => {
    const resp = await fetch(link)
    const xml = await resp.text()

    try {
        await deserializeFeed(xml, { outputJsonFeed: true });
        saveLink(link)
    } catch(ex) {
        console.log(ex)
    }
}


