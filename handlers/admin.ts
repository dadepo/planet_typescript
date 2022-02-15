import {renderFileToString, RouterContext} from "../deps.ts"
import { RelevantPostDao } from "../dao/relevant_post_dao.ts"
import { db } from "../dao/db_connection.ts"
import {RssLinkDao} from "../dao/rss_links_dao.ts";
import {TwitterHandleDao} from "../dao/twitter_handle_dao.ts";

const relevantPostDao = new RelevantPostDao(db)
const rssLinkDao = new RssLinkDao(db)
const twtDao = new TwitterHandleDao(db)

export const hidePostHandler = async (ctx: RouterContext<"/admin/pending/visibility">) => {
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

export const relevantpostGetHandler = async (ctx: RouterContext<"/admin/posts/:page">) => {
    let offset = 0;
    const count = 30;

    if (ctx.params.page !== "1") {
        offset = (parseInt(ctx.params.page!) - 1) * count
    } 

    let results = relevantPostDao.getAllPosts(offset, count)

    switch(results.kind) {
        case ("success"): {

            const values = results.value?.asObjects()
            if (values) {
                const links = [...values]
                
                ctx.response.body = await renderFileToString(`${Deno.cwd()}/views/admin/posts_submissions.ejs`, {
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

export const linksGetHandler = async (ctx: RouterContext<"/admin/links">) => {
    let results = rssLinkDao.getAllRSSLinks()

    switch(results.kind) {
        case ("success"): {

            const values = results.value?.asObjects()
            if (values) {
                const links = [...values]
                const res = [...twtDao.getAllTwitterHandle().value!.asObjects()]
                const twitterHandles = [...res]
                ctx.response.body = await renderFileToString(`${Deno.cwd()}/views/admin/links.ejs`, {
                    links:links.map(link => {
                        const handle = twitterHandles.find(twtHandle => link.rss_link === twtHandle.rss_link)
                        if (handle) {
                            link.twitterHandle = handle.twitter_handle
                        }
                        return link
                    })
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

export const hideLinksPostHandler = async (ctx: RouterContext<"/admin/links/visibility">) => {
    let response = await ctx.request.body({type: "json"}).value

    if (response.action === "hide") {
        rssLinkDao.hidePost(response.id)
        ctx.response.status = 200
    } else if (response.action === "show") {
        rssLinkDao.showPost(response.id)
        ctx.response.status = 200
    } else {
        ctx.response.status = 400
    }
}

export const addAuthorTwitterPostHandler = async (ctx: RouterContext<"/admin/tweet/handle">) => {
    const {rssLink, handle} = await ctx.request.body({type: "json"}).value
    twtDao.addTwitterHandler(rssLink, handle);
    ctx.response.status = 200
}

export const removeAuthorTwitterDeleteHandler = async (ctx: RouterContext<"/admin/tweet/handle">) => {
    const {rssLink} = await ctx.request.body({type: "json"}).value
    twtDao.deleteTwitterHandle(rssLink)
    ctx.response.status = 200
}
