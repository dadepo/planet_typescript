import { VoteDao } from "../../dao/votes_dao.ts";
import { assertEquals, DB } from "../../deps.ts";

Deno.test({
    name: "Successfully add and get vote info",
        only: false,
        async fn(){
            const sut = new VoteDao(new DB(":memory:"))
            sut.updateVoteInfo(1,"test@example.com", 1) // either vote up
            sut.updateVoteInfo(1,"test@example.com", 0) // or when you vote again vote down

            const result = sut.getVoteInfo(1, "test@example.com")
            switch(result.kind) {
                case ("fail"): {
                    throw new Error(result.message);
                }
                case ("success"): {
                    for (const [id, votes, votersEmail] of result.value!) {
                        assertEquals(id, 1);
                        assertEquals(votes, 0);
                        assertEquals(votersEmail, "test@example.com");
                    }
                    break
                }
            }
    }
} as any)
