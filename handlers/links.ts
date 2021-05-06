import {renderFileToString, RouterContext} from "../deps.ts";
import {RelevantPostDao} from "../dao/relevant_post_dao.ts";
import {db} from "../dao/db_connection.ts";
import {getAgo} from "../utils/date_summarizer.ts";
import {config}  from "../deps.ts";

const relevantPostDao = new RelevantPostDao(db)

export const linkGetHandler = async (ctx: RouterContext) => {
    const origin = new URL(config()["RESET_LINK"]).origin
    ctx.response.status = 200
    const uuid = ctx.request.url.searchParams.get('itemid')

    if (uuid) {
        let results = relevantPostDao.getPostByUUID(uuid)
        switch (results.kind) {
            case "success": {

                const value = results.value?.asObjects()!
                const post = [...value]

                ctx.response.body = await renderFileToString(`${Deno.cwd()}/views/links.ejs`, {
                    links: post.map(link => {
                        link.votes = link.votes ? link.votes : 0
                        link.timestamp = getAgo(link.timestamp, Date.now())
                        link.website = new URL(link.website).origin
                        link.discussurl = `${origin}/${new URL(link.website).hostname}/?itemid=${link.uuid}`
                        return Object.assign(link, {
                            summary: link.summary.split(" ").splice(0, 30).join(" ") ?? ""
                        });
                    }),
                    origin: origin,
                    currentUser: ctx.state.currentUser
                })

                break;
            }
            case "fail": {
                ctx.response.status = 503
                console.log(results.message!)
                break;
            }
        }
    } else {
        ctx.response.status = 404
        ctx.response.body = "Page not found"
    }
}
