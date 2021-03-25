import { Application, Router, RouterContext, send }  from "./deps.ts"
import { submitHandler, submitHandlerProcessor} from "./handlers/handlers.ts";
import { indexHandler } from "./handlers/home.ts";
import { postVoteHandler } from "./handlers/voting.ts";
import { hidePostHandler, pendingGetHandler } from "./handlers/admin.ts";

import { isIPAllowed } from "./middleware/ip_check.ts"

const app = new Application()
const router = new Router();

router.get("/", indexHandler)
router.get("/index", indexHandler)
router.get("/submit", submitHandler)
router.get("/admin/pending/:page", isIPAllowed, pendingGetHandler)

router.post("/admin/pending/visibility", isIPAllowed, hidePostHandler)

router.post("/vote", postVoteHandler)
router.post("/submit", submitHandlerProcessor)


router.get("/style/:filename", async (ctx: RouterContext) => {      
    ctx.response.status = 200
    await send(ctx, ctx.params.filename!, {
        root: `${Deno.cwd()}/views/style`
    })
});

// Find a better way for a fall through
// this depends on the location
router.get("/(.*)", (context: RouterContext) => {      
    context.response.status = 404;
    context.response.body = "404 | Page not Found";
});

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
    });

})

await app.listen({ port: 4300 });