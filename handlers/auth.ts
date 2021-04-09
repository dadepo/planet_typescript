import {REDIRECT_BACK, renderFileToString, RouterContext} from "../deps.ts";
import * as bcrypt from "https://deno.land/x/bcrypt@v0.2.4/mod.ts";
import {db} from "../dao/db_connection.ts";
import {UserDao} from "../dao/users_dao.ts";
import { create } from "https://deno.land/x/djwt@v2.2/mod.ts"
const userDao = new UserDao(db)

export const loginIndexGetHandler = async (ctx: RouterContext) => {
    ctx.response.body = await renderFileToString(`${Deno.cwd()}/views/login.ejs`, {});
}

export const logoutGetHandler = async (ctx: RouterContext) => {
    ctx.cookies.delete("jwt")
    ctx.response.redirect(REDIRECT_BACK, "/index")
}

export const loginPostHandler = async (ctx: RouterContext) => {
    let req = await ctx.request.body().value
    let email = req.get("email")
    let password = req.get("password")

    const result = await userDao.findUserByEmail(email)

    switch (result.kind) {
        case "success": {
            if (await bcrypt.compare(password, result.value![0].password)) {

                const jwt = await create(
                    { alg: "HS512", typ: "JWT" },
                    { iss: email, exp: new Date().getTime() * 1000 * 3600}, "secret"
                )

                ctx.cookies.set('jwt', jwt)
                ctx.response.redirect(REDIRECT_BACK, "/")
            } else {
                ctx.response.body = await renderFileToString(`${Deno.cwd()}/views/login.ejs`, {
                    error: "Not found"
                });
            }
            break
        }
        case "fail": {
            ctx.response.body = await renderFileToString(`${Deno.cwd()}/views/login.ejs`, {
                error: "Not found"
            });
        }
    }
}

export const registerIndexGetHandler = async (ctx: RouterContext) => {
    ctx.response.body = await renderFileToString(`${Deno.cwd()}/views/register.ejs`, {});
}

export const registerPostHandler = async (ctx: RouterContext) => {
    let req = await ctx.request.body().value
    let displayName = req.get("display_name")
    let email = req.get("email")
    let password = await bcrypt.hash(req.get("password"))

    console.log("register", email, req.get("password"), password)

    const result = userDao.addUser(displayName, email, password, "inbuilt")
    switch (result.kind) {
        case "success": {
            ctx.response.redirect(REDIRECT_BACK, "/login")
            break;
        }
        case "fail": {
            ctx.response.status = 400
            ctx.response.body = result.message
            break;
        }
    }
}
