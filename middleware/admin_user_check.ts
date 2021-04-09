import {RouterContext, REDIRECT_BACK}  from "../deps.ts";
import {config}  from "../deps.ts";

export const isAdmin = async (ctx: RouterContext, next: Function) => {
    const allowedEmails = config()["ADMIN_EMAIL"];
    const currentUser = ctx.state.currentUser;
    console.log(allowedEmails, ctx.state.currentUser)
    if (!currentUser) {
        ctx.response.redirect(REDIRECT_BACK, "/index")
        return;
    }
    const userEmail = currentUser.email
    if (allowedEmails.split(",").includes(userEmail)) {
        await next();
    } else {
        ctx.response.redirect(REDIRECT_BACK, "/index")
        return;
    }
}
