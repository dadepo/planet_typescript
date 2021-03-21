import { RelevantPostDao } from "../dao/relevant_post_dao.ts"
import {RouterContext}  from "../deps.ts";
import { VoteDao } from "../dao/votes_dao.ts"
import { db } from "../dao/db_connection.ts"
import {renderFileToString} from "../deps.ts"

const relevantPostDao = new RelevantPostDao(db)
const voteDao = new VoteDao(db)

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

export const postVoteHandler = async (ctx: RouterContext) => {
    let response: {
        id: number,
        value:number
    } = await ctx.request.body({type: "json"}).value

    let postId = response.id
    let voteValue = response.value
    let votersIP = ctx.request.headers.get('host') as string
    let currentVote = 0


    // learn more about destructing assignment and refactor
// CREATE TABLE IF NOT EXISTS votes (post_id INTEGER, votes INTEGER, voters_ip TEXT, UNIQUE(post_id, voters_ip) ON CONFLICT REPLACE
    const result = voteDao.getVoteInfo(postId, votersIP)

    switch(result.kind) {
        case("success"): {
            const dbresult = [...result.value!]
            currentVote = dbresult.length === 0 ? 0 : dbresult[0][1]
            voteValue = voteValue + currentVote
            if (isVoteValid(voteValue, currentVote)) {
                await voteDao.updateVoteInfo(postId, votersIP, voteValue)
                ctx.response.body = {postId, voteValue, votersIP}
                return
            } else {
                ctx.response.status = 400
            }

            break
        }
        case("fail"): {
            ctx.response.status = 501
            ctx.response.body = result.message
        }
    }
}


const isVoteValid = (voteValue: number, currentVote: number): boolean => {
    if (currentVote === 0) {
        return true
    } else {
        return [-1, 0, 1].includes(voteValue) && voteValue !== currentVote
    }
}