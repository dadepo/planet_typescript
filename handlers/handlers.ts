import {RouterContext}  from "../deps.ts";
import {renderFileToString} from "../deps.ts"
import { log } from "../deps.ts"
import { Result } from "../lib.ts"
import { PendingSubmissionDao } from "../dao/pending_submission_dao.ts"

import { db } from "../dao/db_connection.ts"



const pendingDao = new PendingSubmissionDao(db)

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



export const submitHandler = async (ctx: RouterContext) => {
    ctx.response.body = await renderFileToString(`${Deno.cwd()}/views/submit.ejs`, {})
}

export const submitHandlerProcessor = async (ctx: RouterContext) => {
    let data: {get: Function} = await ctx.request.body({ type: "form" }).value;
    
    const submit = data.get("link")

    if (submit) {
        console.log("submitting", submit)
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
                ctx.response.body = result.message
                break;
        }

    } else {
        ctx.response.status = 403
        ctx.response.body = "Something went wrong"
    }
}
