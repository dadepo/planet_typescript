import {isRelevant} from "../../utils/patterns.ts";
import { assertEquals } from "../../deps.ts";


Deno.test({
    name: "Should correctly check relevancy of text",
    only: false,
    async fn() {
        const text = `Just this Tuesday, 9th of March, at work, I was partly responsible for a partial downtime of a critical piece of the internet's infrastructure. 

This morning, I got two packages delivered to my place. One for myself, the other, to keep for my neighbor who wasn't at home. A combination of miscommunication with the delivery guy and excitement to unwrap my package, I ended up tearing up my neighbors package, mistaking it for mine! 😅. It was super awkward explaining my little mistake to her, when she came to pick her stuff up 😬. 

And fast forward to just a couple of hours ago, I mistakenly pushed a property file containing sensitive credentials to Github! Impact not super devastating but still, some damage control had to be done! 

It feels like I am on a roll here...what will I be tripping over next? What will the next gaffe be? Me dropping the database in production? 😅😬`;

        assertEquals(isRelevant(text), false)
    }
} as any)
