import {config, RouterMiddleware, RouterContext, REDIRECT_BACK}  from "../deps.ts";

type isAdminRoute = "/admin/posts/:page" | "/admin/links" | "/admin/links/visibility" | "/admin/pending/visibility" | "/admin/tweet/handle" | "/admin/tweet/handle" | "/admin/tweet/handle"

export const isAdmin: RouterMiddleware<"isAdminRoute"> = async (ctx, next) => {
    const allowedEmails = config()["ADMIN_EMAIL"];
    const currentUser = ctx.state.currentUser;

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
