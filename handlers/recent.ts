import { RelevantPostDao } from "../dao/relevant_post_dao.ts"
import {RouterContext}  from "../deps.ts";

import { db } from "../dao/db_connection.ts"
import {renderFileToString} from "../deps.ts"
import {getAgo} from "../utils/date_summarizer.ts";

const relevantPostDao = new RelevantPostDao(db)


export const recentHandler = async (ctx: RouterContext) => {
    let page = parseInt(ctx.request.url.searchParams.get("page")  ?? "0")

    if (page === 1) {
        page = 0
    }

    let limit = parseInt(ctx.request.url.searchParams.get("limit") ?? "30")
    const offset = page === 0 ? 0 : page + limit
    let results = relevantPostDao.getAllVisiblePostsOrderByTime(offset, limit as number)
    switch(results.kind) {
        case ("success"): {

            const values = results.value?.asObjects()
       
            if (values) {
                const links = [...values]
                ctx.response.body = await renderFileToString(`${Deno.cwd()}/views/home.ejs`, {
                    links: links.map(link => {
                        link.votes = link.votes ? link.votes : 0
                        link.timestamp = getAgo(link.timestamp, Date.now())
                        link.website = new URL(link.website).origin
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
