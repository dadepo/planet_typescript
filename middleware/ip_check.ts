import {RouterContext, REDIRECT_BACK}  from "../deps.ts";
import {config}  from "../deps.ts";

export const isIPAllowed = async (ctx: RouterContext, next: Function) => {
    const allowedIPS = config()["ADMIN_IP"];
    const userIP = ctx.request.headers.get('host')!;

    if (allowedIPS.split(",").includes(userIP.split(":")[0])) {
        await next();
    } else {
        ctx.response.redirect(REDIRECT_BACK, "/index")
        return;
    }
}