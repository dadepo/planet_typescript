import {Application, oakCors, Router, RouterContext, send} from "./deps.ts"
import { submitHandler, submitHandlerProcessor} from "./handlers/handlers.ts";
import { indexHandler } from "./handlers/home.ts";
import { postVoteHandler } from "./handlers/voting.ts";
import {hideLinksPostHandler, hidePostHandler, linksGetHandler, pendingGetHandler} from "./handlers/admin.ts";

import { isIPAllowed } from "./middleware/ip_check.ts"
import {recentHandler} from "./handlers/recent.ts";
import {
    loginIndexGetHandler,
    loginPostHandler,
    logoutGetHandler,
    registerIndexGetHandler,
    registerPostHandler
} from "./handlers/auth.ts";
import {isAuthed} from "./middleware/auth_check.ts";
import {hasCurrentUser} from "./middleware/has_currentuser_check.ts";


const app = new Application()
const router = new Router();

router.get("/", isAuthed, indexHandler)
router.get("/index", isAuthed, indexHandler)
router.get("/recent", recentHandler)

router.get("/submit", submitHandler)
router.get("/admin/pending/:page", isIPAllowed, pendingGetHandler)
router.get("/admin/links", isIPAllowed, linksGetHandler)

router.post("/admin/links/visibility", isIPAllowed, hideLinksPostHandler)
router.post("/admin/pending/visibility", isIPAllowed, hidePostHandler)

router.post("/vote", hasCurrentUser, postVoteHandler)
router.post("/submit", submitHandlerProcessor)

//auh routes
router
    .get("/register", registerIndexGetHandler)
    .get("/login", loginIndexGetHandler)
    .get("/logout", logoutGetHandler)
    .post("/login", loginPostHandler)
    .post("/register", registerPostHandler)

router.get("/style/:filename", async (ctx: RouterContext) => {      
    ctx.response.status = 200
    await send(ctx, ctx.params.filename!, {
        root: `${Deno.cwd()}/views/style`
    })
});

router.get("/images/:filename", async (ctx: RouterContext) => {
    ctx.response.status = 200
    await send(ctx, ctx.params.filename!, {
        root: `${Deno.cwd()}/views/images`
    })
});


// Find a better way for a fall through
// this depends on the location
router.get("/(.*)", (context: RouterContext) => {      
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

})

await app.listen({ port: 4300 });
