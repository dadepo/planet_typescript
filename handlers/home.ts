import { RelevantPostDao } from "../dao/relevant_post_dao.ts"
import {RouterContext}  from "../deps.ts";

import { db } from "../dao/db_connection.ts"
import {renderFileToString} from "../deps.ts"

const relevantPostDao = new RelevantPostDao(db)


export const indexHandler = async (ctx: RouterContext) => {
    let page = parseInt(ctx.request.url.searchParams.get("page")  ?? "0")

    if (page !== 0) {
        page = page - 1
    }

    let limit = parseInt(ctx.request.url.searchParams.get("limit") ?? "30")

    let results = relevantPostDao.getAllVisiblePosts(page, limit as number)
    switch(results.kind) {
        case ("success"): {

            const values = results.value?.asObjects()
       
            if (values) {
                const links = [...values]
                ctx.response.body = await renderFileToString(`${Deno.cwd()}/views/home.ejs`, {
                    links: links.map(link => {
                        link.votes = link.votes ? link.votes : 0
                        return Object.assign(link, {
                            summary: link.summary.split(" ").splice(0, 30).join(" ") ?? ""
                        });
                    }),
                    page: (page === 0) ? 2 : page + 1
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
