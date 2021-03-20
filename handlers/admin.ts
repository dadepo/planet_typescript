import {RouterContext}  from "../deps.ts";
import {renderFileToString} from "../deps.ts"
import { RelevantPostDao } from "../dao/relevant_post_dao.ts"
import { db } from "../dao/db_connection.ts"

const relevantPostDao = new RelevantPostDao(db)

export const hidePostHandler = async (ctx: RouterContext) => {
    let response = await ctx.request.body({type: "json"}).value

    if (response.action === "hide") {
        relevantPostDao.hidePost(response.id)
        ctx.response.status = 200
    } else if (response.action === "show") {
        relevantPostDao.showPost(response.id)
        ctx.response.status = 200
    } else {
        ctx.response.status = 400
    }    
}

export const pendingGetHandler = async (ctx: RouterContext) => {
    let offset = 0;
    const count = 10;

    if (ctx.params.page !== "1") {
        offset = (parseInt(ctx.params.page!) - 1) * count
    } 

    let results = relevantPostDao.getAllPosts(offset, count)

    switch(results.kind) {
        case ("success"): {

            const values = results.value?.asObjects()
            if (values) {
                const links = [...values]
                
                ctx.response.body = await renderFileToString(`${Deno.cwd()}/views/pending_submissions.ejs`, {
                    links:links
                })
            } else {
                ctx.response.body = await renderFileToString(`${Deno.cwd()}/views/home.ejs`, {
                    links: []
                })
            }
            break
        }
        case ("fail"): {
            ctx.response.body = results.message;
        }
    }
}