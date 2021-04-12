import {assertEquals, DB} from "../../deps.ts";
import {ResetDao} from "../../dao/reset_dao.ts";
import {Success} from "../../lib.ts";


Deno.test({
    name: "Successful add and get reset link",
    only: false,
    fn(){
        const sut = new ResetDao(new DB(":memory:"))

        sut.addResetLink("test@example.org", "bare", "reset")

        const dbResult = sut.getByResetLink("reset") as Success<any>;
        const result = [...dbResult.value]

        assertEquals(result[0][0], "test@example.org");
        assertEquals(result[0][1], "bare");
        assertEquals(result[0][2], "reset");
    }
} as any);


Deno.test({
    name: "Successful delete link",
    only: false,
    fn(){
        const sut = new ResetDao(new DB(":memory:"))

        sut.addResetLink("test@example.org", "bare", "reset")

        sut.deleteResetLink("test@example.org")

        const dbResult = sut.getByResetLink("reset") as Success<any>;
        const result = [...dbResult.value]
        assertEquals(result, []);
    }
} as any);
