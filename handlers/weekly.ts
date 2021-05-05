import { db } from "../dao/db_connection.ts"
import {config, renderFileToString, RouterContext} from "../deps.ts";
import {RelevantPostDao} from "../dao/relevant_post_dao.ts";

const relevantPostDao = new RelevantPostDao(db)


const getNumberOfWeeks = (now:number, then:number) => {
    return Math.floor(
        ((now - then) / (1000 * 3600 * 24)) / 7
    )
}

export const getWeekListHandler = async (ctx: RouterContext) => {

    const origin = new URL(config()["RESET_LINK"]).origin
    console.log(relevantPostDao.getFirstInsertTime())
    const result = relevantPostDao.getFirstInsertTime();
    const weeklyLinks = [];
    const weekInMilli = 604800000;
    switch (result.kind) {
        case "success": {
            const genesisDate = result.value;
            const numberOfWeeks = getNumberOfWeeks(Date.now(), genesisDate);
            for (let step = 1; step <= numberOfWeeks; step++) {
                weeklyLinks.push({
                    id:step,
                    title: new Date(genesisDate + (step * weekInMilli)).toDateString()
                })
            }

            ctx.response.body = await renderFileToString(`${Deno.cwd()}/views/weekly.ejs`, {
                links: weeklyLinks,
                origin: origin,
                page: 0,
                currentUser: null
            })

            break
        }
        case "fail": {
            break
        }
    }


    console.log(Date.now())
}



