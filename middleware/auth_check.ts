import { verify } from "https://deno.land/x/djwt@v2.2/mod.ts"
import {UserDao} from "../dao/users_dao.ts";
import {db} from "../dao/db_connection.ts";
import {config, RouterContext, RouterMiddleware}  from "../deps.ts";

const userDao = new UserDao(db)

export const isAuthed: RouterMiddleware<"/" | "/index"> = async (ctx, next) => {
    const jwtToken = await ctx.cookies.get("jwt");
    if (jwtToken) {
        const payload = await verify(jwtToken, config()["JWT_KEY"], "HS512")
        if (payload) {
            const email = payload.iss!
            const result = userDao.findUserDetailsByEmail(email)
            switch (result.kind) {
                case ("success"): {
                    ctx.state.currentUser = result.value![0];
                    break;
                }
                case ("fail"): {
                    ctx.cookies.delete("jwt")
                    break;
                }
            }
            await next()
        } else {
            ctx.cookies.delete("jwt")
            await next()
        }
    } else {
        ctx.state.currentUser = null
        await next()
    }
}
