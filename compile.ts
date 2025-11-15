import type { Message } from "./types";
import dataRaw from "./data.json";

// it REALLY doesn't like the types associated with JSON
// parsing ↓
// @ts-expect-error see above
const {
  messages,
  contextualMessages,
}: {
  messages: Message[];
  contextualMessages: Message[];
} = dataRaw;

console.log(`${messages.length} total messages, ${contextualMessages.length - messages.length } additional contextual messages`);

const getParentMessage = (message: Message) =>
  message.parentmessage_id
    ? (contextualMessages.find((a) => a.id === message.parentmessage_id) ??
      null)
    : null;
const buildXmlFromMessage = (message: Message) => `<message>
<user>@${message.user.fullname}</user>
<time>${message.created_at}</time>
${
  (getParentMessage(message) &&
    `\
<replying-to>
<user>@${getParentMessage(message)!.user.fullname}</user>
<content>
${getParentMessage(message)!.message}
</content>
</replying-to>
`) ??
  ""
}<content>
${message.message}
</content>
</message>`;
// choose a random element of messages
const xmls = messages.toSorted((a, b) => new Date(a.user_edited_at ?? a.created_at).getTime() - new Date(b.user_edited_at ?? b.created_at).getTime()).map(buildXmlFromMessage);
const xml = `<messages>
${xmls.join('\n')}
</messages>
`;
Bun.write("./data.xml", xml)
