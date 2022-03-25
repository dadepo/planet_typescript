import { RelevantPostDao } from "../dao/relevant_post_dao.ts"
import {config}  from "../deps.ts";
import { db } from "../dao/db_connection.ts"
import {renderFileToString, RouterContext} from "../deps.ts"
import {Link, sortByScore} from "../utils/link_util.ts";
import { render } from "../utils/render.ts";

const relevantPostDao = new RelevantPostDao(db)

export const indexHandler = async (ctx: RouterContext<"/" | "/index">) => {
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
                await render(ctx.request.accepts(), async () => {
                    ctx.response.type = "json";
                    ctx.response.body = sortByScore(links as Link[], origin);
                }, async () => {
                    ctx.response.body = await renderFileToString(`${Deno.cwd()}/views/home.ejs`, {
                        links: sortByScore(links as Link[], origin),
                        origin: origin,
                        page: (page === 0) ? 2 : page + 1,
                        currentUser: ctx.state.currentUser
                    })
                })
            } else {
                await render(ctx.request.accepts(), async () => {
                    ctx.response.type = "json";
                    ctx.response.body = [];
                }, async () => {
                    ctx.response.body = await renderFileToString(`${Deno.cwd()}/views/home.ejs`, {
                        links: []
                    })
                });
                
            }
            break
        }
        case ("fail"): {
            ctx.response.body = results.message;
        }
    }
}
