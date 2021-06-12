import twitter  from 'https://dev.jspm.io/twitter';

import {config}  from "../deps.ts";

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

export const postTweet = (input: {title: string, url: string, uuid: string, twitterHandle:string}) => {

    let discussUrl = `${origin}/${new URL(input.url).hostname}/?itemid=${input.uuid}`

    let tweet = `
    ${input.title} ${input.twitterHandle ? `by @${input.twitterHandle.replaceAll("@", "").toLowerCase()}` : ""}
    
Link: ${input.url}
Discuss: ${discussUrl}
  
`

    let hashTags = ["#typescript", "#javascript", "#100DaysOfCode"]

    for (const tag of hashTags) {
        if ((tweet + tag + " ").length <= 280) {
            tweet = tweet + tag + " "
        } else {
            break;
        }
    }

    tweet = tweet.trim()

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
