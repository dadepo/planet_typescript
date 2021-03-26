import { VoteDao } from "../dao/votes_dao.ts"
import { db } from "../dao/db_connection.ts"
import {RouterContext}  from "../deps.ts";

const voteDao = new VoteDao(db)

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
            
            if (currentVote === 0) {
                voteValue = 1
            } else {
                voteValue = 0
            }
            
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
        return [0, 1].includes(voteValue) && voteValue !== currentVote
    }
}