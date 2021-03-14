import { VoteDao } from "../../dao/votes_dao.ts";
import { assertEquals, DB } from "../../deps.ts";

Deno.test("Successfully add and get vote info", () => {
    const sut = new VoteDao(new DB(":memory:"))
    sut.updateVoteInfo(1,"127.0.0.1", 1)
    sut.updateVoteInfo(1,"127.0.0.1", 0)
    sut.updateVoteInfo(1,"127.0.0.1", -1)

    const result = sut.getVoteInfo(1, "127.0.0.1")
    switch(result.kind) {
        case ("fail"): {
            throw new Error(result.message);
        }
        case ("success"): {
            for (const [id, votes, votersIP] of result.value!) {
                assertEquals(id, 1);
                assertEquals(votes, -1);
                assertEquals(votersIP, "127.0.0.1");
            }
            break
        }

    }
})