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

const getLinksForAWeek = (weekId: number) => {
    const weekInMilli = 604800000
    const from = weekId === 1 ? firstPostTimestamp : (weekId * weekInMilli) + firstPostTimestamp
    const till = from + weekInMilli
    return relevantPostDao.getAllVisiblePostsBetweenTimestamp(from, till);
}

export const getAllWeekLinks =  async (ctx: RouterContext) => {
    const weekId = parseInt(ctx.params.id!)
    const origin = new URL(config()["RESET_LINK"]).origin
    const results = getLinksForAWeek(weekId);

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
        currentUser: ctx.state.currentUser
    })
}

export const sendWeekly = async () => {
    console.log("sending weekly newsletter")
    const origin = new URL(config()["RESET_LINK"]).origin

    const numberOfWeeks = getNumberOfWeeks(Date.now(), firstPostTimestamp);
    const results = getLinksForAWeek(numberOfWeeks - 1);

    switch (results.kind) {
        case "success": {
            const values = results.value?.asObjects()
            if (values) {
                const links = decorateLinks([...values] as Link[], origin)
                const content = await renderFileToString(`${Deno.cwd()}/views/emails/weekly.ejs`, {
                    date: new Date().toDateString(),
                    links: links
                })

                const dc = "us1";
                const apiKey = config()["MAILCHIMP_KEY"];
                const baseUrl = `https://user:${apiKey}@${dc}.api.mailchimp.com/3.0`;

                const emailTemplate = `${baseUrl}/campaigns/058215470d/actions/replicate`
                const replicatedTemplate = await fetch(emailTemplate, {
                    method: "POST"
                })

                const newCampaignId = (await replicatedTemplate.json()).id
                const campaignUrl = `${baseUrl}/campaigns/${newCampaignId}/content`;

                // Update with content
                console.log(11112, content)
                await fetch(campaignUrl, {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        "html": content
                    }),
                });

                const sendUrl = `${baseUrl}/campaigns/${newCampaignId}/actions/send`;
                const sendResponse = await fetch(sendUrl, {
                    method: "POST",
                });

                if(sendResponse.ok) {
                    // attempt to clean after 1 minutes
                    const sleep = (milliseconds: number) => new Promise(resolve => setTimeout(resolve, milliseconds))
                    await sleep(60000)
                    console.log("Weekly update sent. Attempt cleanup of email on MC")
                    const deleteCampaignUrl = `${baseUrl}/campaigns/${newCampaignId}`
                    await fetch(deleteCampaignUrl, {
                        method: "DELETE",
                    });
                }
            } else {
                console.log("Could not send week update")
            }
            break
        }
        case "fail": {
            console.log("Could not send week update, failed when fetching:", results.message)
            break
        }
    }
}
