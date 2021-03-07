import {RouterContext}  from "https://deno.land/x/oak@v6.5.0/mod.ts"
import {renderFileToString} from "https://deno.land/x/dejs@0.9.3/mod.ts"
import { submitLink } from "../dao.ts"


export const indexHandler = async (ctx: RouterContext) => {
    ctx.response.body = await renderFileToString(`${Deno.cwd()}/views/home.ejs`, {})
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
