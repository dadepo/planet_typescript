import { PendingSubmissionDao } from "../../dao/pending_submission_dao.ts";
import { assertEquals, DB } from "../../deps.ts";
import { Fail } from "../../lib.ts"


Deno.test("Successful submission if not submitted before", () => {
    const sut = new PendingSubmissionDao(new DB(":memory:"))

    let result = sut.submitLink("http://www.example.com")

    assertEquals(result.kind, "success");
});

Deno.test("Failed submission if submitted before", () => {
    const sut = new PendingSubmissionDao(new DB(":memory:"))

    sut.submitLink("http://www.example.com")
    let result = sut.submitLink("http://www.example.com") as Fail
    
    assertEquals(result.kind, "fail");
    assertEquals(result.message, "Link previously submitted");
});


Deno.test("Get all submissions", () => {
    const sut = new PendingSubmissionDao(new DB(":memory:"))
    sut.submitLink("http://www.example.com")
    for (let [id, link, _, valid] of sut.getSubmissions()) {
        assertEquals(id, 1);
        assertEquals(link, "http://www.example.com");
        assertEquals(valid, 0);
    }
})