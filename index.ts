import ky from "ky";
import { Err, err, errAsync, ok, okAsync, ResultAsync } from "neverthrow";
import type { GetHistoryResponse, Message } from "./types";
const token = process.env.PRONTO_TOKEN;

function getBubbleHistory(): ResultAsync<
  {
    messages: Message[];
    // includes all of the messages in `messages` and also a few more to give context for replies etc.
    contextualMessages: Message[];
  },
  string
> {
  if (!token) return errAsync("PRONTO_TOKEN is not set");
  return ResultAsync.fromPromise(
    ky
      .post("https://stanfordohs.pronto.io/api/v1/bubble.history", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        json: { bubble_id: 3640189 },
      })
      .json<GetHistoryResponse>(),
    (e) => e as string,
  )
    .map((e) => (e.ok ? ok(e) : err("Response not OK")))
    .andThen((e) => e)
    .map(async (initialHistory) => {
      let messages = initialHistory.messages;
      let contextualMessages = messages.concat(initialHistory.parentmessages);
      console.log(`Received ${messages.length} messages...`);
      let totalMessages = 0;
      while (true) {
        const nextHistory = await ResultAsync.fromPromise(
          ky
            .post("https://stanfordohs.pronto.io/api/v1/bubble.history", {
              headers: {
                Authorization: `Bearer ${token}`,
              },
              json: {
                bubble_id: 3640189,
                latest: messages[messages.length - 1]?.id ?? -1,
              },
            })
            .json<GetHistoryResponse>(),
          (e) => e as string,
        )
          .map((e) => (e.ok ? ok(e) : err(`Response not OK`)))
          .andThen((e) => e);
        if (nextHistory.isErr()) {
          return err(nextHistory.error);
        } else {
          totalMessages += nextHistory.value.messages.length;
          let filtered = nextHistory.value.messages.filter(msg => (new Date()).getTime() - (new Date(msg.created_at)).getTime() <= 3600 * 1000 * 24 * 31);
          if (filtered.length === 0) break;
          messages = messages.concat(filtered);
          contextualMessages = messages.concat(
            nextHistory.value.parentmessages,
          );
        }
        console.log(`Received ${messages.length} messages...`);
      }
      return ok({ messages, contextualMessages });
    })
    .andThen((e) => e);
}

const data = await getBubbleHistory();
if (data.isErr()) {
  console.error(data.error);
} else {
  for (const message of data.value.messages) {
    console.log(new Date(message.updated_at));
  }
  await Bun.write("./data.json", JSON.stringify(data.value));
}
