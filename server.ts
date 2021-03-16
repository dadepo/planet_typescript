import { Application, Router, RouterContext }  from "./deps.ts"
import { pendingGetHandler, indexHandler, submitHandler, submitHandlerProcessor, postVoteHandler } from "./handlers/handlers.ts";
import { isIPAllowed } from "./middleware/ip_check.ts"

const app = new Application()
const router = new Router();

router.get("/", indexHandler)

router.get("/index", indexHandler)

router.get("/submit", submitHandler)

router.get("/admin/pending/:page", isIPAllowed, pendingGetHandler)

router.post("/vote", postVoteHandler)
router.post("/submit", submitHandlerProcessor)

// Find a better way for a fall through
// this depends on the location
router.get("/(.*)", async (context: RouterContext) => {      
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