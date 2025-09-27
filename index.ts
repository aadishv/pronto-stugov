import ky from "ky";
import { err, ok, ResultAsync } from "neverthrow";
import * as readline from 'readline';
import repl from 'node:repl';

type VerificationResponse = {
  ok: true;
  length: number;
} | {
  ok: false;
  error: string;
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function getToken(email: string) {
  // send verification email req
  return ResultAsync.fromPromise(
    ky.post('https://accounts.pronto.io/api/v1/user.verify', { json: { email } }).json<VerificationResponse>(), (e) => e as string
  )
    .map(async value => {
      if (!value.ok) return err(value.error);
      return ok(await new Promise<string>((resolve) => {
        rl.question(
          `Enter the code sent to ${email} (${value.length} digits): `,
          (code) => resolve(code)
        )
      }));
    })
    .andThen(e => e)
    .map(code =>
    ky.post('https://accounts.pronto.io/api/v3/user.login', {
      json: {
        email,
        code: (() => { console.log(code); return code; })(),
        // "device": {
        //   "browsername": "chrome",
        //   "browserversion": "139.0.0",
        //   "osname": "Mac OS",
        //   "type": "WEB"
        // }
      }
    }).json()
  );
}
const TEST_INVALID_EMAIL = 'invalid@example.com';
const TEST_VALID_EMAIL = 'aadish@ohs.stanford.edu';
const value = (await getToken(TEST_VALID_EMAIL)).unwrapOr("N/A");
