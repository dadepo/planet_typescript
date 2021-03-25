import { RssLinkDao } from "../../dao/rss_links_dao.ts";
import { assertEquals, DB } from "../../deps.ts";
import { Success } from "../../lib.ts";


Deno.test("Successful submission if not submitted before", () => {
    const sut = new RssLinkDao(new DB(":memory:"))
    
    let result = sut.saveSubmittedLink("https://www.example.com")

    assertEquals(result.kind, "success");
    assertEquals((result as Success<boolean>).value, true);
})

Deno.test("Successfully update link", async () => {
    let db = new DB(":memory:")
    const sut = new RssLinkDao(db)
    const updatedLink = "https://www.example.com";

    const [count1] = db.query("SELECT count(*) from rss_links where link = ?", [updatedLink])

    assertEquals(count1[0], 0);
    
    await sut.saveSubmittedLink("https://www.example.com")
    await sut.updateLink("https://www.example.com", updatedLink)

    const [count2] = db.query("SELECT count(*) from rss_links where link = ?", [updatedLink])

    assertEquals(count2[0], 1);
})

Deno.test("Successful get all posts", async () => {
    const sut = new RssLinkDao(new DB(":memory:"))
    
    await sut.saveSubmittedLink("https://www.example.com")
    await sut.saveSubmittedLink("https://www.example1.com")
    await sut.saveSubmittedLink("https://www.example2.com")

    await sut.updateLink("https://www.example.com", "https://www.example.com")
    await sut.updateLink("https://www.example1.com", "https://www.example1.com")
    await sut.updateLink("https://www.example2.com", "https://www.example2.com")

    const result = sut.getAllLinks()
    switch(result.kind) {
        case("fail"): {
            throw new Error(result.message);
        }
        case("success"):{
            const [link1, link2, link3] = sut.getAllLinks().value!
    
            assertEquals(link1[0], "https://www.example.com");
            assertEquals(link2[0], "https://www.example1.com");
            assertEquals(link3[0], "https://www.example2.com");
            break
        }

    }
    
})
