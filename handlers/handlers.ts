import {RouterContext}  from "../deps.ts";
import {renderFileToString} from "../deps.ts"
import { log } from "../deps.ts"


import { RelevantPostDoa } from "../doa/relevant_post_doa.ts"
import { VoteDoa } from "../doa/votes_doa.ts"
import { PendingSubmissionDao } from "../doa/pending_submission_doa.ts"

import { db } from "../doa/db_connection.ts"



const pendingDoa = new PendingSubmissionDao(db)
const relevantPostDoa = new RelevantPostDoa(db)
const voteDoa = new VoteDoa(db)

// custom configuration with 2 loggers (the default and `tasks` loggers).
await log.setup({
    handlers: {  
      file: new log.handlers.FileHandler("INFO", {
        filename: "./log.txt",
        // you can change format of output message using any keys in `LogRecord`.
        formatter: "{datetime} {msg}",
      }),
    },
  
    loggers: {
      // configure default logger available via short-hand methods above.
      default: {
        level: "INFO",
        handlers: ["file"],
      },
    },
  });


export const indexHandler = async (ctx: RouterContext) => {
    let offset = ctx.request.url.searchParams.get("offset")  ?? 0
    let limit = ctx.request.url.searchParams.get("limit") ?? 10
    const links = [...relevantPostDoa.getPostsByIndexAndSize(offset as number, limit as number).asObjects()]
    
    ctx.response.body = await renderFileToString(`${Deno.cwd()}/views/home.ejs`, {
        links: links
    })
}

export const postVoteHandler = async (ctx: RouterContext) => {
    let response: {
        id: number,
        value:number
    } = await ctx.request.body({type: "json"}).value

    let postId = response.id
    let voteValue = response.value
    let votersIP = ctx.request.headers.get('host') as string
    let currentVote = 0


    // learn more about destructing assignment and refactor

    const result = voteDoa.getVoteInfo(postId, votersIP)

    if (result) {
        currentVote = [...result][0][1]
    }
    console.log(currentVote, voteValue)
    // take care the case where post does not even exit
    voteValue = voteValue + currentVote
    if (isVoteValid(voteValue, currentVote)) {
        try {
            voteDoa.updateVoteInfo(postId, votersIP, voteValue)
            ctx.response.body = {postId, voteValue, votersIP}
        } catch(exception) {
            console.log(exception)
            ctx.response.status = 501
            // TODO return error message
        }
        return
    } else {
        ctx.response.status = 400
    }
}


export const submitHandler = async (ctx: RouterContext) => {
    ctx.response.body = await renderFileToString(`${Deno.cwd()}/views/submit.ejs`, {})
}

export const submitHandlerProcessor = async (ctx: RouterContext) => {
    let data = await ctx.request.body({ type: "form" }).value;
    const submit = data.get("link")
    if (submit) {
        const isSubmitted = pendingDoa.submitLink(submit)
        if (isSubmitted) {
            // if link successfully added, start a worker to valdate it
            const checker = new Worker(new URL("../workers/check_rss_link.ts", import.meta.url).href, { 
                type: "module",
                deno: {
                    namespace: true,
                }
            });

            checker.postMessage({link: submit})
        }
        // TODO return real error response
        ctx.response.body = "submitted"
    } else {
        ctx.response.body = "Something went wrong"
    }

}


const isVoteValid = (voteValue: number, currentVote: number): boolean => {
    if (currentVote === 0) {
        return true
    } else {
        return [-1, 0, 1].includes(voteValue) && voteValue !== currentVote
    }
}