import {RouterContext}  from "https://deno.land/x/oak@v6.5.0/mod.ts"
import {renderFileToString} from "https://deno.land/x/dejs@0.9.3/mod.ts"
import { submitLink, getPostsByIndexAndSize, getVoteInfo, updateVoteInfo } from "../dao.ts"
import * as log from "https://deno.land/std@0.90.0/log/mod.ts";


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


const logger = log.getLogger();

export const indexHandler = async (ctx: RouterContext) => {
    let offset = ctx.request.url.searchParams.get("offset")  ?? 0
    let limit = ctx.request.url.searchParams.get("limit") ?? 10
    logger.info("hello world")
    const links = [...getPostsByIndexAndSize(offset as number, limit as number).asObjects()]
    
    ctx.response.body = await renderFileToString(`${Deno.cwd()}/views/home.ejs`, {
        links: links
    })
}

export const postVoteHandler = async (ctx: RouterContext) => {
    let response: {
        id: number,
        value: -1 | 0 | 1
    } = await ctx.request.body({type: "json"}).value

    let postId = response.id
    let voteValue = response.value
    let votersIP = ctx.request.headers.get('host') as string


    // learn more about destructing assignment and refactor
    const [[_, currentVote]] = getVoteInfo(postId, votersIP)
    // take care the case where post does not even exit
    voteValue = currentVote ? (voteValue + currentVote) : voteValue
    if (isVoteValid(voteValue, currentVote)) {
        try {
            updateVoteInfo(postId, votersIP, voteValue)
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
        const isSubmitted = submitLink(submit)
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