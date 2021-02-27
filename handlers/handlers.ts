import {RouterContext}  from "https://deno.land/x/oak@v6.5.0/mod.ts"
import {renderFileToString} from "https://deno.land/x/dejs@0.9.3/mod.ts"

export const indexHandler = async (ctx: RouterContext) => {
    ctx.response.body = await renderFileToString(`${Deno.cwd()}/views/home.ejs`, {})
}

export const submitHandler = async (ctx: RouterContext) => {
    ctx.response.body = await renderFileToString(`${Deno.cwd()}/views/submit.ejs`, {})
}
