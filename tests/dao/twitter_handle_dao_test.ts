
import { assertEquals, DB } from "../../deps.ts";
import {TwitterHandleDao} from "../../dao/twitter_handle_dao.ts";

Deno.test({
    name: "Successfully add and get twitter handle",
        only: false,
        async fn(){
            const sut = new TwitterHandleDao(new DB(":memory:"))
            sut.addTwitterHandler("http://example.org", "@user")
            const result = [...sut.getTwitterHandle("http://example.org").value!]
            assertEquals(result[0][0], "http://example.org")
            assertEquals(result[0][1], "@user")
    }
})

Deno.test({
    name: "Successfully multiple add and get twitter handle",
    only: false,
    async fn(){
        const sut = new TwitterHandleDao(new DB(":memory:"))
        sut.addTwitterHandler("http://example.org", "@user")
        sut.addTwitterHandler("http://example2.org", "@user2")
        const result = [...sut.getAllTwitterHandle().value!]
        assertEquals(result[0][0], "http://example.org")
        assertEquals(result[0][1], "@user")
        assertEquals(result[1][0], "http://example2.org")
        assertEquals(result[1][1], "@user2")
    }
})

Deno.test({
    name: "Successfully delete",
    only: true,
    async fn(){
        const sut = new TwitterHandleDao(new DB(":memory:"))
        sut.addTwitterHandler("http://example.org", "@user")
        sut.addTwitterHandler("http://example2.org", "@user2")
        const result = [...sut.getAllTwitterHandle().value!]
        assertEquals(result[0][0], "http://example.org")
        assertEquals(result[0][1], "@user")
        assertEquals(result[1][0], "http://example2.org")
        assertEquals(result[1][1], "@user2")
        // now delete
        sut.deleteTwitterHandle("http://example.org")
        sut.deleteTwitterHandle("http://example2.org")
        const result2 = [...sut.getAllTwitterHandle().value!]
        assertEquals(result2.length, 0)
    }
})
