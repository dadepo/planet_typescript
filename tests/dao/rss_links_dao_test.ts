import { RssLinkDao } from "../../dao/rss_links_dao.ts";
import { assertEquals, DB } from "../../deps.ts";
import { Success } from "../../lib.ts";


Deno.test("Successful submission if not submitted before", () => {
    const sut = new RssLinkDao(new DB(":memory:"))
    
    let result = sut.saveSubmittedLink("https://www.example.com", "https://www.example.com/rss.xml")

    assertEquals(result.kind, "success");
    assertEquals((result as Success<boolean>).value, true);
})


Deno.test({
    name: "Successful get all posts",
    only: false,
    async fn(){
        const sut = new RssLinkDao(new DB(":memory:"))

        await sut.saveSubmittedLink("https://www.example.com", "https://www.example.com/rss.xml")
        await sut.saveSubmittedLink("https://www.example1.com", "https://www.example1.com/rss.xml")
        await sut.saveSubmittedLink("https://www.example2.com", "https://www.example2.com/rss.xml")

        const result = sut.getAllRSSLinks()
        switch(result.kind) {
            case("fail"): {
                throw new Error(result.message);
            }
            case("success"):{
                const [link1, link2, link3] = sut.getAllRSSLinks().value!

                assertEquals(link1[1], "https://www.example.com/rss.xml");
                assertEquals(link2[1], "https://www.example1.com/rss.xml");
                assertEquals(link3[1], "https://www.example2.com/rss.xml");

                assertEquals(link1[0], "https://www.example.com");
                assertEquals(link2[0], "https://www.example1.com");
                assertEquals(link3[0], "https://www.example2.com");
                break
            }

        }
    }} as any)


