import {Application, Router, RouterContext}  from "https://deno.land/x/oak@v6.5.0/mod.ts"
import {renderFileToString} from "https://deno.land/x/dejs@0.9.3/mod.ts"
import { indexHandler, submitHandler } from "./handlers/handlers.ts";

const app = new Application()
const router = new Router();


router.get("/", indexHandler)

router.get("/index", indexHandler)

router.get("/submit", submitHandler)

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

await app.listen({ port: 4300 });