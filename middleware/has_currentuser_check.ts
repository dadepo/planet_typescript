import {RouterContext}  from "../deps.ts";

export const hasCurrentUser = async (ctx: RouterContext<"/vote">, next: Function) => {
    if(!ctx.state.currentUser) {
        ctx.response.status = 401
        return;
    } else {
        await next();
    }
}
