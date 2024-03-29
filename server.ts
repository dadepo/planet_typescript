import {Application, cron, oakCors, Router, RouterContext, send} from "./deps.ts"
import { submitHandler, submitHandlerProcessor} from "./handlers/submit.ts";
import { indexHandler } from "./handlers/home.ts";
import { postVoteHandler } from "./handlers/voting.ts";
import {
    addAuthorTwitterPostHandler,
    hideLinksPostHandler,
    hidePostHandler,
    linksGetHandler,
    relevantpostGetHandler, removeAuthorTwitterDeleteHandler
} from "./handlers/admin.ts";

import {recentHandler} from "./handlers/recent.ts";
import {
    gitHubLogin,
    gitHubLoginCallback,
    loginIndexGetHandler,
    loginPostHandler,
    logoutGetHandler,
    registerIndexGetHandler,
    registerPostHandler
} from "./handlers/auth.ts";
import {isAuthed} from "./middleware/auth_check.ts";
import {hasCurrentUser} from "./middleware/has_currentuser_check.ts";
import {isAdmin} from "./middleware/admin_user_check.ts";
import {
    renderPageGetHandler,
    resetGetHandler,
    sendResetLinkPostHandler,
    updatePasswordPostHandler
} from "./handlers/resetpass.ts";
import {linkGetHandler} from "./handlers/links.ts";
import {getAllWeekLinks, getWeekListHandler, sendWeekly} from "./handlers/weekly.ts";
import { composeMiddleware as compose } from "https://deno.land/x/oak/mod.ts";
const app = new Application()
const router = new Router();

router.get("/", isAuthed, indexHandler)
router.get("/index", isAuthed, indexHandler)
router.get("/recent", recentHandler)

router.get("/submit", submitHandler)

router.get("/admin/posts/:page", isAuthed, isAdmin, relevantpostGetHandler)
router.get("/admin/links", isAuthed, isAdmin, linksGetHandler)
router.post("/admin/links/visibility", isAuthed, isAdmin, hideLinksPostHandler)
router.post("/admin/pending/visibility", isAuthed, isAdmin, hidePostHandler)
router.post("/admin/tweet/handle", isAuthed, isAdmin, addAuthorTwitterPostHandler)
router.delete("/admin/tweet/handle", isAuthed, isAdmin, removeAuthorTwitterDeleteHandler)

router.post("/vote", hasCurrentUser, postVoteHandler)
router.post("/submit", submitHandlerProcessor)

// weekly routes
router
    .get("/weekly", getWeekListHandler)
    .get("/weekly/:id", getAllWeekLinks)

router
    .get("/reset", resetGetHandler)
    .get("/reset/:link", renderPageGetHandler)
    .post("/reset", sendResetLinkPostHandler)


//auh routes
router
    .get("/register", registerIndexGetHandler)
    .get("/login", loginIndexGetHandler)
    .get("/oauth2/callback/github", gitHubLoginCallback)
    .get("/login/github", gitHubLogin)
    .get("/logout", logoutGetHandler)
    .post("/login", loginPostHandler)
    .post("/register", registerPostHandler)
    .post("/updatepassword", updatePasswordPostHandler)

router.get("/style/:filename", async (ctx: RouterContext<"/style/:filename">) => {      
    ctx.response.status = 200
    await send(ctx, ctx.params.filename!, {
        root: `${Deno.cwd()}/views/style`
    })
});

router.get("/images/:filename", async (ctx: RouterContext<"/images/:filename">) => {
    ctx.response.status = 200
    await send(ctx, ctx?.params?.filename!, {
        root: `${Deno.cwd()}/views/images`
    })
});


router.get("/:website", linkGetHandler)

// Find a better way for a fall through
// this depends on the location
router.get("/(.*)", (context: RouterContext<"/(.*)">) => {      
    context.response.status = 404;
    context.response.body = "404 | Page not Found";
});

app.use(oakCors())
app.use(router.routes())
app.use(router.allowedMethods())
app.addEventListener("error", evt => {
    console.log(evt.error);
})

app.addEventListener("listen", evt => {
    // on server up, starts polling rss
    new Worker(new URL("workers/poll_rss.ts", import.meta.url).href, {
        type: "module",
        deno: {
            namespace: true,
        }
    } as any);

    // Every friday at 12:30pm
    cron("0 30 12 * * 5", sendWeekly);
})

await app.listen({ port: 4300 });
