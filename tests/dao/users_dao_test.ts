import {RssLinkDao} from "../../dao/rss_links_dao.ts";
import {assertEquals, DB} from "../../deps.ts";
import {UserDao} from "../../dao/users_dao.ts";
import {Fail, Success} from "../../lib.ts";
import {db} from "../../dao/db_connection.ts";


Deno.test({
    name: "Successful add user and find users by email",
    only: false,
    async fn(){
        const sut = new UserDao(new DB(":memory:"))

        sut.addUser("display", "test@example.com", "hash", "auth", "")
        const dbresults = sut.findUserByEmail("test@example.com") as Success<any>;
        const result = [...dbresults.value]

        assertEquals(result[0].display_name, "display");
        assertEquals(result[0].email, "test@example.com");
        assertEquals(result[0].password, "hash");
        assertEquals(result[0].auth_method, "auth");
    }
} as any)


Deno.test({
    name: "Successful find users by email when no email",
    only: false,
    async fn(){
        const sut = new UserDao(new DB(":memory:"))
        const dbresults = sut.findUserByEmail("test@example.com") as Fail;
        assertEquals("Not found", dbresults.message)
    }
} as any)


Deno.test({
    name: "Successful add user and find users by email and password",
    only: false,
    async fn(){
        const sut = new UserDao(new DB(":memory:"))

        sut.addUser("display", "test@example.com", "hash", "auth", "")
        const dbresults = sut.findUserByEmailAndPassword("test@example.com", "hash") as Success<any>;

        const result = [...dbresults.value]

        assertEquals(result[0].display_name, "display")
        assertEquals(result[0].email, "test@example.com")
        assertEquals(result[0].password, "hash")
        assertEquals(result[0].auth_method, "auth")
    }
} as any)

Deno.test({
    name: "Successful add user and find users by email and password empty",
    only: false,
    async fn(){
        const sut = new UserDao(new DB(":memory:"))

        const dbresults = sut.findUserByEmailAndPassword("test@example.com", "hash") as Fail;

        assertEquals(dbresults.message, "Not found")
    }
} as any)


Deno.test({
    name: "Successful update password",
    only: false,
    async fn(){
        const sut = new UserDao(new DB(":memory:"))

        sut.addUser("display", "test@example.com", "hash", "auth", "")

        sut.updatePassword("test@example.com", "hash123") as Success<any>;

        const dbresults = sut.findUserByEmail("test@example.com") as Success<any>;
        const result = [...dbresults.value]

        assertEquals(result[0].password, "hash123")
    }
} as any)


Deno.test({
    name: "Successful update location",
    only: false,
    async fn(){
        const sut = new UserDao(new DB(":memory:"))

        sut.addUser("display", "test@example.com", "hash", "auth", "")

        sut.updateLocation("test@example.com", "amsterdam") as Success<any>;

        const dbresults = sut.findUserByEmail("test@example.com") as Success<any>;
        const result = [...dbresults.value]

        assertEquals(result[0].location, "amsterdam")
    }
})

Deno.test({
    name: "Successful use findUserDetailsByEmail",
    only: false,
    async fn(){
        const sut = new UserDao(new DB(":memory:"))

        sut.addUser("display", "test@example.com", "hash", "auth", "")
        const dbresults = sut.findUserDetailsByEmail("test@example.com") as Success<any>;
        const result = [...dbresults.value]


        assertEquals(result[0].display_name, "display");
        assertEquals(result[0].email, "test@example.com");
    }
} as any)
