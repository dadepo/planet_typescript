import "https://deno.land/x/dotenv/load.ts";
import {renderFileToString, RouterContext, SmtpClient, encode, Sha256} from "../deps.ts";
import {config}  from "../deps.ts";
import {UserDao} from "../dao/users_dao.ts";
import {db} from "../dao/db_connection.ts";
import {ResetDao} from "../dao/reset_dao.ts";
import * as bcrypt from "https://deno.land/x/bcrypt@v0.2.4/mod.ts";

const userDao = new UserDao(db)
const resetDao = new ResetDao(db)



const mailer = async (receipient: string, message: string) => {
    const client = new SmtpClient();

    await client.connectTLS({
        username: config()["RESET_SENDER_UNAME"],
        password: config()["RESET_SENDER_PASS"],
        hostname: "smtp.gmail.com",
        port: 465
    });

    await client.send({
        from: config()["RESET_SENDER_UNAME"],
        to: receipient,
        subject: "Your password reset link",
        content: message,
    });

    await client.close();

};


export const sendResetLinkPostHandler = async (ctx: RouterContext) => {
    let req = await ctx.request.body().value
    let email = req.get("email")

    const result = userDao.findUserByEmail(email);

    switch(result.kind) {
        case ("success"): {
            const bareLink = new Date().toISOString() + Math.random().toString();
            const sha256 = new Sha256();
            let reset = encode(sha256.update(bareLink).toString()).replace("==", "")
            resetDao.deleteResetLink(email);
            const result = resetDao.addResetLink(email, bareLink, reset);
            switch (result.kind) {
                case "success": {
                    mailer(email, `
                    This is your password reset link. It expires in 1 hr
                    ${config()["RESET_LINK"]}/${reset}
                    `)
                    break
                }
                case "fail": {
                    console.log("failed", result.message!)
                    break
                }
            }

            break
        }
        case ("fail"): {
            console.log("failed2", result.message!)
            break
        }
    }
    ctx.response.body = await renderFileToString(`${Deno.cwd()}/views/message.ejs`, {
        message: `If an account exist with the email, a reset link has been sent.`
    })
}

export const renderPageGetHandler = async (ctx: RouterContext) => {
    const resetLink = ctx.params.link!;
    const result = resetDao.getByResetLink(resetLink)
    switch (result.kind) {
        case("success"): {
            const entry = [...result.value!.asObjects()!][0]
            if (!entry) {
                ctx.response.redirect("../")
                return
            }

            if (!isExpired(entry.timestamp)) {
                ctx.response.body = await renderFileToString(`${Deno.cwd()}/views/reset_pass.ejs`, {
                    email: entry.email,
                    resetLink: entry.reset_link
                });
                return
            } else {
                ctx.response.redirect("../")
                return
            }
        }
        case("fail"): {
            ctx.response.redirect("./")
            break
        }

    }
}

export const updatePasswordPostHandler = async (ctx: RouterContext) => {
    let req = await ctx.request.body().value
    let email = req.get("email")
    const resetLink = req.get("reset_link");
    let newPassword = await bcrypt.hash(req.get("new_password"))
    const linkFound = resetDao.getByResetLink(resetLink)

    switch(linkFound.kind) {
        case ("success"): {

            if([...linkFound.value!.asObjects()!].length === 1) {
                const result = userDao.updatePassword(email, newPassword);
                switch(result.kind) {
                    case ("success"): {
                        resetDao.deleteResetLink(email)
                        ctx.response.redirect("../../")
                        break
                    }
                    case ("fail"): {
                        console.log(result.message!)
                        ctx.response.redirect("../../")
                        break
                    }
                }
            } else {
                console.log("Reset link not found")
                ctx.response.redirect("../../")
                return;
            }
            break
        }
        case ("fail"): {
            ctx.response.redirect("../../")
            break;
        }
    }
}

export const resetGetHandler = async (ctx: RouterContext) => {
    ctx.response.body = await renderFileToString(`${Deno.cwd()}/views/reset.ejs`, {});
}

const isExpired = (timestamp: number) => {
    return (timestamp - Date.now()) > 3600000
}
