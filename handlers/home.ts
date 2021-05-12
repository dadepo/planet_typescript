import { RelevantPostDao } from "../dao/relevant_post_dao.ts"
import {RouterContext}  from "../deps.ts";
import {config}  from "../deps.ts";
import { db } from "../dao/db_connection.ts"
import {renderFileToString} from "../deps.ts"
import {Link, sortByScore} from "../utils/link_util.ts";

const relevantPostDao = new RelevantPostDao(db)

export const indexHandler = async (ctx: RouterContext) => {
    const origin = new URL(config()["RESET_LINK"]).origin
    let page = parseInt(ctx.request.url.searchParams.get("page")  ?? "0")
    if (page === 1) {
        page = 0
    }

    let limit = parseInt(ctx.request.url.searchParams.get("limit") ?? "30")
    const offset = page === 0 ? 0 : page + limit
    let results = relevantPostDao.getAllVisiblePostsOrderByVotes(offset, limit as number)
    switch(results.kind) {
        case ("success"): {
            const values = results.value?.asObjects()
            if (values) {
                const links = [...values]
                ctx.response.body = await renderFileToString(`${Deno.cwd()}/views/home.ejs`, {
                    links: sortByScore(links as Link[], origin),
                    origin: origin,
                    page: (page === 0) ? 2 : page + 1,
                    currentUser: ctx.state.currentUser
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
