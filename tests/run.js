// 모든 테스트를 한 번에 돌린다.  node tests/run.js
//
// 각 테스트는 별개의 node 프로세스로 돈다. app.js 가 전역(document, localStorage,
// Date, fetch)을 가짜로 받아야 해서, 한 프로세스에서 여러 개를 돌리면 서로 오염된다.
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
