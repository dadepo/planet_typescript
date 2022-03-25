import {config, renderFileToString, RouterContext} from "../deps.ts";
import {Result} from "../lib.ts";
import { PendingSubmissionDao } from "../dao/pending_submission_dao.ts"
import { db } from "../dao/db_connection.ts"
import {validURL} from "../utils/url_validator.ts";

const pendingDao = new PendingSubmissionDao(db)

export const submitHandler = async (ctx: RouterContext<"/submit">) => {
    ctx.response.body = await renderFileToString(`${Deno.cwd()}/views/submit.ejs`, {})
}

export const submitHandlerProcessor = async (ctx: RouterContext<"/submit">) => {
    let data: {get: Function} = await ctx.request.body({ type: "form" }).value;

    const submit = data.get("link")

    if (submit) {
        console.log("submitting", submit)

        if(!validURL(submit)) {
            console.log(submit, "not a valid url")
            ctx.response.body = await renderFileToString(`${Deno.cwd()}/views/message.ejs`, {
                message: `Thanks for the submission. 
                    If the link contains a valid RSS feed, planettypescript would start polling
                `})
            return;
        }

        const result: Result<boolean> = pendingDao.submitLink(submit)
        switch(result.kind) {
            case ("success"): {

                const isSubmitted = result.value
                if (isSubmitted) {
                    const checker = new Worker(new URL("../workers/check_rss_link.ts", import.meta.url).href, {
                        type: "module",
                        deno: {
                            namespace: true,
                            permissions: "inherit",
                        }
                    } as any);

                    checker.postMessage({link: submit})
                }
                ctx.response.body = await renderFileToString(`${Deno.cwd()}/views/message.ejs`, {
                    message: `Thanks for the submission. 
                    If the link contains a valid RSS feed, planettypescript would start polling
                `})
                break
            }
            case ("fail"):
                console.log("error", result.message!)
                ctx.response.body = await renderFileToString(`${Deno.cwd()}/views/message.ejs`, {
                    message: `Thanks for the submission. 
                    If the link contains a valid RSS feed, planettypescript would start polling
                `})
                break;
        }

    } else {
        ctx.response.body = await renderFileToString(`${Deno.cwd()}/views/message.ejs`, {
            message: `Thanks for the submission. 
                    If the link contains a valid RSS feed, planettypescript would start polling
                `})
    }
}
