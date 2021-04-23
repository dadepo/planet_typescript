import twitter  from 'https://dev.jspm.io/twitter';

import {config}  from "../deps.ts";

const secret = {
    consumer_key: config()["CONSUMER_KEY"],
    consumer_secret: config()["CONSUMER_SECRET"],
    access_token_key: config()["ACCESS_TOKEN_KEY"],
    access_token_secret: config()["ACCESS_TOKEN_SECRET"]
};

const client = (twitter as Function)(secret);
const origin = new URL(config()["RESET_LINK"]).origin

export const postTweet = (input: {title: string, url: string, uuid: string}) => {

    let discussUrl = `${origin}/${new URL(input.url).hostname}/?itemid=${input.uuid}`

    let tweet = `
    ${input.title}
    Link: ${input.url}
    Discuss: ${discussUrl}
    `
    client.post('statuses/update', {status: tweet}, (error: any, tweet: any, response: any) => {
        if (error) throw error;
        console.log(tweet);
        console.log(response);
    });
}

