import {renderFileToString, RouterContext} from "../deps.ts";
import {Result} from "../lib.ts";
import { PendingSubmissionDao } from "../dao/pending_submission_dao.ts"
import { db } from "../dao/db_connection.ts"

const pendingDao = new PendingSubmissionDao(db)

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
                    } as any);

                    checker.postMessage({link: submit})
                }
                ctx.response.body = await renderFileToString(`${Deno.cwd()}/views/message.ejs`, {
                    message: `Link submitted.`
                })
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
