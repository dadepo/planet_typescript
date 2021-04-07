import {RouterContext, REDIRECT_BACK}  from "../deps.ts";

export const hasCurrentUser = async (ctx: RouterContext, next: Function) => {
    if(!ctx.state.currentUser) {
        ctx.response.status = 401
        return;
    } else {
        await next();
    }
}
