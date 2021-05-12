import { db } from "../dao/db_connection.ts"
import {config, renderFileToString, RouterContext} from "../deps.ts";
import {RelevantPostDao} from "../dao/relevant_post_dao.ts";
import {decorateLinks, Link} from "../utils/link_util.ts";

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
                const links = decorateLinks([...values] as Link[], origin)
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



