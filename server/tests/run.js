// 서버 테스트를 한 번에 돌린다.  cd server && npm test
//
// client 쪽 tests/run.js 와 같은 구조다. 각 테스트를 별개 프로세스로 돌리는 이유도 같다 -
// 여기서는 require.cache 에 가짜 DB 를 심고 환경변수를 덮어쓰기 때문에,
// 한 프로세스에서 여러 개를 돌리면 앞 테스트가 심어둔 가짜가 뒤 테스트로 새어나간다.
//
// 진짜 DB 도 네트워크도 안 쓴다. 그래서 인터넷이 없어도, 비밀값이 없어도 돌아간다.

const { execFileSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const dir = __dirname;
const files = fs.readdirSync(dir)
  .filter(function (f) { return f.endsWith(".test.js"); })
  .sort();

let failed = 0;
const t0 = Date.now();

files.forEach(function (f) {
  const name = f.replace(/\.test\.js$/, "");
  process.stdout.write(name.padEnd(10));
  try {
    execFileSync(process.execPath, [path.join(dir, f)], { stdio: "pipe" });
    console.log("통과");
  } catch (e) {
    failed++;
    console.log("실패");
    // 실패한 줄만 보여준다. 전부 쏟아내면 어디가 깨졌는지 안 보인다.
    const out = String((e.stdout || "") + (e.stderr || ""));
    out.split("\n")
      .filter(function (ln) { return /^FAIL|Error|TypeError|ReferenceError/.test(ln); })
      .slice(0, 8)
      .forEach(function (ln) { console.log("   " + ln); });
  }
});

const secs = ((Date.now() - t0) / 1000).toFixed(1);
console.log("");
console.log(failed
  ? (files.length + "개 중 " + failed + "개 실패  (" + secs + "초)")
  : (files.length + "개 전부 통과  (" + secs + "초)"));
process.exit(failed ? 1 : 0);
