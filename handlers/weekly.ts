import { db } from "../dao/db_connection.ts"
import {config, renderFileToString, RouterContext} from "../deps.ts";
import {RelevantPostDao} from "../dao/relevant_post_dao.ts";
import {getAgo} from "../utils/date_summarizer.ts";

const relevantPostDao = new RelevantPostDao(db)

/**
 * Date and time (GMT): Friday, April 16, 2021 11:00:00 AM
 * Date and time (Your time zone): Friday, April 16, 2021 1:00:00 PM GMT+02:00
 */
const firstPostTimestamp = 1618570800000

const getNumberOfWeeks = (now:number, then:number) => {
    return Math.floor(
        ((now - then) / (1000 * 3600 * 24)) / 7
    )
}

export const getAllWeekLinks =  async (ctx: RouterContext) => {
    const weekId = parseInt(ctx.params.id!)
    const weekInMilli = 604800000
    const origin = new URL(config()["RESET_LINK"]).origin

    const from = weekId === 1 ? firstPostTimestamp : (weekId * weekInMilli) + firstPostTimestamp
    const till = from + weekInMilli

    const results = relevantPostDao.getAllVisiblePostsBetweenTimestamp(from, till);

    switch (results.kind) {
        case "success": {
            const values = results.value?.asObjects()
            if (values) {

                const links = [...values].map(link => {
                    link.votes = link.votes ? link.votes : 0
                    link.timestamp = getAgo(link.timestamp, Date.now())
                    link.website = new URL(link.website).origin
                    link.discussurl = `${origin}/${new URL(link.website).hostname}/?itemid=${link.uuid}`
                    return Object.assign(link, {
                        summary: link.summary.split(" ").splice(0, 30).join(" ") ?? ""
                    });
                })

                ctx.response.body = await renderFileToString(`${Deno.cwd()}/views/home.ejs`, {
                    links: links.reverse(),
                    origin: origin,
                    page: 0,
                    currentUser: ctx.state.currentUser
                })

            } else {
                ctx.response.body = await renderFileToString(`${Deno.cwd()}/views/home.ejs`, {
                    links: []
                })
            }

            break
        }
        case "fail": {
            break
        }
    }
}

export const getWeekListHandler = async (ctx: RouterContext) => {
    const origin = new URL(config()["RESET_LINK"]).origin
    const weeklyLinks = [];
    const weekInMilli = 604800000;
    const numberOfWeeks = getNumberOfWeeks(Date.now(), firstPostTimestamp);
    for (let step = 1; step <= numberOfWeeks; step++) {
        weeklyLinks.push({
            id:step,
            title: new Date(firstPostTimestamp + (step * weekInMilli)).toDateString()
        })
    }

    ctx.response.body = await renderFileToString(`${Deno.cwd()}/views/weekly.ejs`, {
        links: weeklyLinks.reverse(),
        origin: origin,
        page: 0,
        currentUser: null
    })
}



