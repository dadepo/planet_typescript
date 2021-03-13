import {RouterContext}  from "../deps.ts";
import {renderFileToString} from "../deps.ts"
import { log } from "../deps.ts"
import { Result } from "../lib.ts"


import { RelevantPostDao } from "../dao/relevant_post_dao.ts"
import { VoteDao } from "../dao/votes_dao.ts"
import { PendingSubmissionDao } from "../dao/pending_submission_dao.ts"

import { db } from "../dao/db_connection.ts"



const pendingDao = new PendingSubmissionDao(db)
const relevantPostDao = new RelevantPostDao(db)
const voteDao = new VoteDao(db)

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
    const links = [...relevantPostDao.getPostsByIndexAndSize(offset as number, limit as number).asObjects()]
    
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

    const result = voteDao.getVoteInfo(postId, votersIP)

    if (result) {
        currentVote = [...result][0][1]
    }
    console.log(currentVote, voteValue)
    // take care the case where post does not even exit
    voteValue = voteValue + currentVote
    if (isVoteValid(voteValue, currentVote)) {
        try {
            voteDao.updateVoteInfo(postId, votersIP, voteValue)
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
    let data: {get: Function} = await ctx.request.body({ type: "form" }).value;
    
    const submit = data.get("link")

    if (submit) {

        const result: Result<boolean> = pendingDao.submitLink(submit)
        switch(result.kind) {
            case ("success"): {

                const isSubmitted = result.value
                if (isSubmitted) {
                    const checker = new Worker(new URL("../workers/check_rss_link.ts", import.meta.url).href, { 
                        type: "module",
                        deno: {
                            namespace: true,
                        }
                    });
        
                    checker.postMessage({link: submit})
                }
                ctx.response.body = "submitted"
                break
            }
            case ("fail"):
                ctx.response.status = 501
                ctx.response.body = "Something went wrong"
                break;
        }

    } else {
        ctx.response.status = 403
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