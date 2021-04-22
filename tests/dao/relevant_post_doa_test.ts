import { RelevantPostDao } from "../../dao/relevant_post_dao.ts";
import { VoteDao } from "../../dao/votes_dao.ts";
import { assertEquals, DB } from "../../deps.ts";
import { Success } from "../../lib.ts";



Deno.test("Successful submission if not submitted before", () => {
    const sut = new RelevantPostDao(new DB(":memory:"))
    
    let result = sut.savePost("http://www.example.com", "http://www.example.com/rss.xml", "title", "summary")

    assertEquals(result.kind, "success");
});

Deno.test("Failed submission on duplicated link submission", () => {
    const sut = new RelevantPostDao(new DB(":memory:"))
    
    sut.savePost("http://www.example.com", "http://www.example.com/rss.xml", "title", "summary")
    let result = sut.savePost("http://www.example.com", "http://www.example.com/rss.xml", "title", "summary")

    assertEquals(result.kind, "fail");
    switch(result.kind) {
        case("success"): {
            throw new Error("this test fails");
        }
        case("fail"): {
            assertEquals(result.kind, "fail");
            assertEquals(result.message, "UNIQUE constraint failed: relevant_post.source");
            break
        }
    }
});


Deno.test({
    name: "Successful retrieval of posts by links no offset",
    only: false,
    async fn() {
        const db = new DB(":memory:");

        new VoteDao(db)
        const sut = new RelevantPostDao(db)

        sut.savePost("http://www.example1.com", "http://www.example1.com/rss.xml", "title1", "summary1")
        sut.savePost("http://www.example2.com", "http://www.example2.com/rss.xml", "title2", "summary2")

        let [first, second] = sut.getAllVisiblePostsOrderByVotes(0,2).value!.asObjects()

        // assertEquals(first.id, 1);
        assertEquals(first.source, "http://www.example1.com/rss.xml");
        assertEquals(first.title, "title1");
        assertEquals(first.summary, "summary1");

        // assertEquals(second.id, 2);
        assertEquals(second.source, "http://www.example2.com/rss.xml");
        assertEquals(second.title, "title2");
        assertEquals(second.summary, "summary2");

    }
} as any) // as any to quiten the red swiggles




Deno.test("Successful retrieval of posts by links using offset and size", () => {
    const db = new DB(":memory:");

    new VoteDao(db)
    const sut = new RelevantPostDao(db)

    sut.savePost("http://www.example1.com", "http://www.example1.com/rss.xml", "title1", "summary1")
    sut.savePost("http://www.example2.com", "http://www.example2.com/rss.xml", "title2", "summary2")
    sut.savePost("http://www.example3.com", "http://www.example3.com/rss.xml", "title3", "summary3")
    sut.savePost("http://www.example4.com", "http://www.example4.com/rss.xml", "title4", "summary4")
    
    let result = sut.getAllVisiblePostsOrderByVotes(1,2)

    switch(result.kind) {
        case("fail"): {
            throw new Error(result.message);
        }
        case ("success"): {
            let [second, third] = sut.getAllVisiblePostsOrderByVotes(1,2).value!.asObjects()
            
            assertEquals(second.id, 2);
            assertEquals(second.source, "http://www.example2.com/rss.xml");
            assertEquals(second.title, "title2");
            assertEquals(second.summary, "summary2");

            assertEquals(third.id, 3);
            assertEquals(third.source, "http://www.example3.com/rss.xml");
            assertEquals(third.title, "title3");
            assertEquals(third.summary, "summary3");
            break;
        }
    }
})

Deno.test("Successfully count by source found 1", () => {
    const db = new DB(":memory:");

    new VoteDao(db)
    const sut = new RelevantPostDao(db)

    sut.savePost("http://www.example1.com", "http://www.example1.com/rss.xml", "title1", "summary1")
    
    let result = sut.countBySource("http://www.example1.com/rss.xml")
    
    switch(result.kind) {
        case("success"): {
            assertEquals(result.value, 1);
            break
        }
        case("fail"): {
            throw new Error(result.message);
            break;
        }

    }
})

Deno.test("Successfully count by source found 0", () => {
    const db = new DB(":memory:");

    new VoteDao(db)
    const sut = new RelevantPostDao(db)
    
    let result = sut.countBySource("http://www.example1.com")
    
    switch(result.kind) {
        case("success"): {
            assertEquals(result.value, 0);
            break
        }
        case("fail"): {
            throw new Error(result.message);
        }

    }
})

Deno.test({
    name: "Successful hide post", 
    only: false,
    fn(){
    const db = new DB(":memory:");
    new VoteDao(db)
    const sut = new RelevantPostDao(db)
    sut.savePost("http://www.example1.com", "http://www.example1.com/rss.xml", "title1", "summary1")
    let result = sut.getAllVisiblePostsOrderByVotes(0,10)

    switch(result.kind) {
        case("success"): {
            const [[,link]] = [...result.value!]
            assertEquals(link, "http://www.example1.com")
            sut.hidePost(1) // id will be 1
            const result2 = sut.getAllVisiblePostsOrderByVotes(0,10)
            const link2 = [...result2.value!]
            assertEquals(link2, [])
            break
        }
        case("fail"): {
            throw new Error(result.message);
        }
    }
}} as any)


Deno.test({
    name: "Successful show hidden post", 
    only: false,
    fn(){
    const db = new DB(":memory:");
    new VoteDao(db)
    const sut = new RelevantPostDao(db)
    sut.savePost("http://www.example1.com", "http://www.example1.com/rss.xml", "title1", "summary1")
    sut.hidePost(1)
    let result = sut.getAllVisiblePostsOrderByVotes(0,10)
    const link = [...result.value!]
    assertEquals(link, [])
    sut.showPost(1)
    const result2 = sut.getAllVisiblePostsOrderByVotes(0,10)
    const [[,link2]] = [...result2.value!]
    assertEquals(link2, "http://www.example1.com")
}} as any)


Deno.test({
    name: "Successful get by uuid",
    only: false,
    fn(){
        const db = new DB(":memory:");
        new VoteDao(db)
        const sut = new RelevantPostDao(db)
        sut.savePost("http://www.example1.com", "http://www.example1.com/rss.xml", "title1", "summary1")
        let result = sut.getAllVisiblePostsOrderByVotes(0,10)
        const link = [...result.value!]
        const uuid = link[0][7]
        result = sut.getPostByUUID(uuid)
        const submission = [...result.value!]

        assertEquals(submission[0][1], "http://www.example1.com")
        assertEquals(submission[0][2], "http://www.example1.com/rss.xml")
    }} as any)
