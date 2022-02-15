import {renderFileToString, RouterContext} from "../deps.ts";
import {RelevantPostDao} from "../dao/relevant_post_dao.ts";
import {db} from "../dao/db_connection.ts";
import {config}  from "../deps.ts";
import {decorateLinks, Link} from "../utils/link_util.ts";

const relevantPostDao = new RelevantPostDao(db)

export const linkGetHandler = async (ctx: RouterContext<"/:website">) => {
    const origin = new URL(config()["RESET_LINK"]).origin
    ctx.response.status = 200
    const uuid = ctx.request.url.searchParams.get('itemid')

    if (uuid) {
        let results = relevantPostDao.getPostByUUID(uuid)
        switch (results.kind) {
            case "success": {

                const value = results.value?.asObjects()!
                const links = [...value]

                ctx.response.body = await renderFileToString(`${Deno.cwd()}/views/links.ejs`, {
                    title: "Link",
                    links: decorateLinks(links as Link[], origin),
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
