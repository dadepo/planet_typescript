import {getAgo} from "./date_summarizer.ts";

export type Link = {
    uuid: string
    votes: number,
    timestamp: number,
    ago: string,
    website: string,
    discussurl: string,
    summary: string,
    score?: number

}

export const addScore = (links: Link[]): Array<Required<Link>> => {
    return links.map(link => {
        return {
            ...link,
            ...{score: (link.votes) / Math.pow(Date.now() - link.timestamp, 1.8)}
        }
    })
}

export const decorateLinks = (links: Link[], origin: string): Link[] => {
    return links.map(link => {
        link.votes = link.votes ? link.votes : 0
        link.ago = getAgo(link.timestamp, Date.now())!
        link.website = new URL(link.website).origin
        link.discussurl = `${origin}/${new URL(link.website).hostname}/?itemid=${link.uuid}`
        return Object.assign(link, {
            summary: link.summary.split(" ").splice(0, 30).join(" ") ?? ""
        });
    })
}

export const sortByScore = (links: Link[], origin: string): Array<Required<Link>> => {
    let decoratedLinks = decorateLinks(links as Link[], origin)
    let scoredLinks = addScore(decoratedLinks);
    return scoredLinks.sort((a: Required<Link>, b: Required<Link>) => {
        let sort;
        if (a.score === b.score) {
            sort = 0
        } else if (a.score < b.score) {
            sort = 1
        } else {
            sort = -1
        }
        return sort
    })
}
