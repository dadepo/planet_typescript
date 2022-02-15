import {REDIRECT_BACK, renderFileToString, RouterContext} from "../deps.ts";
import { OAuth2Client } from "../deps.ts";
import * as bcrypt from "https://deno.land/x/bcrypt@v0.2.4/mod.ts";
import {db} from "../dao/db_connection.ts";
import {UserDao} from "../dao/users_dao.ts";
import { create } from "https://deno.land/x/djwt@v2.2/mod.ts";
import {config}  from "../deps.ts";

const oauth2Client = new OAuth2Client({
    clientId: "39e4a1b9e2b8bbd262dc",
    clientSecret: config()["GITHUB_SECRET"],
    authorizationEndpointUri: "https://github.com/login/oauth/authorize",
    tokenUri: "https://github.com/login/oauth/access_token",
    redirectUri: "https://www.planettypescript.com/oauth2/callback/github",
    defaults: {
        scope: ["read:user", "user:email"],
    },
});

type GitHubUserEmail = {
    email: string,
    primary: boolean,
    verified: boolean,
    visibility: string
}

const userDao = new UserDao(db)

export const loginIndexGetHandler = async (ctx: RouterContext<"/login">) => {
    ctx.response.body = await renderFileToString(`${Deno.cwd()}/views/login.ejs`, {});
}

export const logoutGetHandler = (ctx: RouterContext<"/logout">) => {
    ctx.cookies.delete("jwt")
    ctx.response.redirect(REDIRECT_BACK, "/index")
}

export const gitHubLogin = (ctx: RouterContext<"/login/github">) => {
    ctx.response.redirect(
        oauth2Client.code.getAuthorizationUri(),
    );
}

export const gitHubLoginCallback = async (ctx: RouterContext<"/oauth2/callback/github">) => {
    // Exchange the authorization code for an access token
  const tokens = await oauth2Client.code.getToken(ctx.request.url);

  // Use the access token to make an authenticated API request
  let userResponse = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${tokens.accessToken}`,
    },
  });

  const {name, location}: {name: string, location: string} = await userResponse.json()

  userResponse = await fetch("https://api.github.com/user/emails", {
    headers: {
      Authorization: `Bearer ${tokens.accessToken}`,
    },
  });

  const jsonResponse = await userResponse.json() as Array<GitHubUserEmail>;
  
  const email = jsonResponse
  .filter(email => {
      return email.primary && email.verified && email.visibility === "public"
  })[0]
  
  const result = userDao.findUserByEmail(email.email)
  switch (result.kind) {
      case ("success"): {
          // update location if not previously saved
          if (!result.value![0].location || result.value![0].location === "") {
            userDao.updateLocation(email.email, location)
          }
          // user details already saved, set jwt token. Redirect to home page
          ctx.cookies.set('jwt', await createToken(email.email))
          ctx.response.redirect(REDIRECT_BACK, "/")
        break
      }
      case ("fail"): {
        if (result.message === "Not found") {
            // user details not saved already. save now
            userDao.addUser(name, email.email, "", "github", location)
        } else {
            console.log("Error in user retrieval step after github login")
            // TODO probably send back some error message
            ctx.response.redirect(REDIRECT_BACK, "/")
        }
        break
      }
  }
}

export const loginPostHandler = async (ctx: RouterContext<"/login">) => {
    let req = await ctx.request.body().value
    let email = req.get("email")
    let password = req.get("password")

    const result = await userDao.findUserByEmail(email)

    switch (result.kind) {
        case "success": {
            if (await bcrypt.compare(password, result.value![0].password)) {
                ctx.cookies.set('jwt', await createToken(email))
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

export const registerIndexGetHandler = async (ctx: RouterContext<"/register">) => {
    ctx.response.body = await renderFileToString(`${Deno.cwd()}/views/register.ejs`, {});
}

export const registerPostHandler = async (ctx: RouterContext<"/register">) => {
    let req = await ctx.request.body().value
    let displayName = req.get("display_name")
    let email = req.get("email")
    let password = await bcrypt.hash(req.get("password"))


    const result = userDao.addUser(displayName, email, password, "inbuilt", "")
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


const createToken = async (email: string) => {
    const jwt = await create(
        { alg: "HS512", typ: "JWT" },
        { iss: email, exp: new Date().getTime() * 1000 * 3600}, config()["JWT_KEY"]
    )
    return jwt;
}
