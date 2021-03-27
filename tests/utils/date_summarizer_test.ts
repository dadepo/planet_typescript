import {assertEquals} from "../../deps.ts";
import {getAgo} from "../../utils/date_summarizer.ts";


Deno.test({
    name: "Successfully get seconds diff",
    only: false,
    async fn() {

        const then = Date.now()
        const later = then.valueOf() + 10000 // 10 seconds later

        assertEquals(getAgo(then, later), "10 seconds ago")
    }
} as any)

Deno.test({
    name: "Successfully get minutes diff",
    only: false,
    async fn() {

        const then = Date.now()
        const later = then.valueOf() + 185000 // 3 minutes later

        assertEquals(getAgo(then, later), "3 minutes ago")
    }
} as any)

Deno.test({
    name: "Successfully get hours diff",
    only: false,
    async fn() {

        const then = Date.now()
        const later = then.valueOf() + 3600000 // 1 hour later

        assertEquals(getAgo(then, later), "1 hour(s) ago")
    }
} as any)

Deno.test({
    name: "Successfully get days diff",
    only: false,
    async fn() {

        const then = Date.now()
        const later = then.valueOf() + 86400000 // 1 day later

        assertEquals(getAgo(then, later), "1 day(s) ago")
    }
} as any)
