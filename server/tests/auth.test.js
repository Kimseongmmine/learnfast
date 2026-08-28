// 회원가입 · 로그인 · 증표 검사.
//
// 진짜 HTTP 로 확인한다. 함수를 직접 부르는 게 아니라 서버를 빈 포트에 띄우고
// fetch 로 두드린다 - 상태 코드·헤더·JSON 까지 실제로 오가는 것과 같아진다.

// ── 준비: 코드가 불러지기 "전에" 환경을 만들어둔다 ───────────
// 순서가 중요하다. src/index.js 는 읽히는 순간 환경변수를 검사하고,
// auth.js 는 읽히는 순간 JWT_SECRET 을 잡아둔다. 그래서 require 보다 먼저 채워야 한다.
process.env.JWT_SECRET = "test-secret-not-a-real-one";
process.env.DATABASE_URL = "postgresql://fake/fake";   // 검사만 통과하면 된다. 접속은 안 한다
process.env.BCRYPT_COST = "4";                          // 12 로 두면 이 파일 하나가 3초를 넘긴다

const fake = require("./fakedb").installFakeDb();       // ← src/db.js 를 가짜로 바꿔치기
const app = require("../src/index.js");                 // ← 이제 auth.js 는 가짜 DB 를 쓴다

let f = 0;
const ok = (n, c, e) => { if (!c) f++; console.log((c ? "ok   " : "FAIL ") + n + (c ? "" : "  " + (e || ""))); };

// ── 서버를 빈 포트에 띄운다 ──────────────────────────────────
// listen(0) 은 "아무 빈 포트나 골라달라" 는 뜻이다. 3000번을 쓰면 개발 중인 서버와 부딪힌다.
const server = app.listen(0);
const PORT = server.address().port;
const BASE = "http://127.0.0.1:" + PORT;

// 요청 한 번을 짧게 쓰기 위한 헬퍼. 상태 코드와 본문을 같이 돌려준다.
async function call(method, path, body, token) {
  const headers = {};
  if (body) headers["Content-Type"] = "application/json";
  if (token) headers["Authorization"] = "Bearer " + token;
  const res = await fetch(BASE + path, {
    method: method,
    headers: headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, body: await res.json() };
}

const EMAIL = "a@b.com";
const PW = "correct horse battery";

(async function () {
  // ── 회원가입 ──
  let r = await call("POST", "/auth/signup", { email: EMAIL, password: PW });
  ok("가입은 201", r.status === 201, String(r.status));
  ok("증표를 준다", typeof r.body.token === "string" && r.body.token.length > 20, JSON.stringify(r.body));
  ok("사용자 정보를 준다", r.body.user && r.body.user.email === EMAIL, JSON.stringify(r.body.user));
  ok("비밀번호는 안 돌려준다", !JSON.stringify(r.body).includes(PW), JSON.stringify(r.body));

  const token = r.body.token;

  // ── DB 에 뭐가 저장됐나 ──
  // 이게 이 파일에서 제일 중요한 검사다. 나머지가 다 통과해도 여기가 깨지면 사고다.
  const stored = fake.rows[0];
  ok("원문이 저장되지 않는다", stored.password_hash !== PW, stored.password_hash);
  ok("bcrypt 형식이다", /^\$2[aby]\$/.test(stored.password_hash), stored.password_hash);
  ok("해시 안에 원문이 없다", !stored.password_hash.includes(PW), stored.password_hash);

  // ── 증표 안에 뭐가 들었나 ──
  // JWT 는 암호화가 아니라 누구나 읽는다. 그래서 남이 봐도 되는 것만 들어 있어야 한다.
  const payload = JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString());
  ok("증표에 사용자 번호", payload.uid === stored.id, JSON.stringify(payload));
  ok("증표에 이메일 없음", !("email" in payload), JSON.stringify(payload));
  ok("증표에 비밀번호 없음", !JSON.stringify(payload).includes(PW), JSON.stringify(payload));
  ok("만료가 있다", typeof payload.exp === "number" && payload.exp > payload.iat, JSON.stringify(payload));

  // ── 같은 이메일로 또 가입 ──
  r = await call("POST", "/auth/signup", { email: EMAIL, password: PW });
  ok("중복은 409", r.status === 409, String(r.status));
  ok("중복 이유를 말해준다", r.body.error === "email_taken", JSON.stringify(r.body));
  ok("줄이 안 늘어난다", fake.rows.length === 1, String(fake.rows.length));

  // 대소문자만 다른 이메일도 같은 사람이다
  r = await call("POST", "/auth/signup", { email: "A@B.com", password: PW });
  ok("대문자 이메일도 중복", r.status === 409, String(r.status));

  // ── 입력 검사 ──
  r = await call("POST", "/auth/signup", { email: "c@d.com", password: "short" });
  ok("짧은 비번은 400", r.status === 400 && r.body.error === "password_too_short", JSON.stringify(r.body));
  r = await call("POST", "/auth/signup", { email: "notanemail", password: PW });
  ok("이메일 형식은 400", r.status === 400 && r.body.error === "invalid_email", JSON.stringify(r.body));
  r = await call("POST", "/auth/signup", {});
  ok("빈 요청도 400", r.status === 400, String(r.status));
  ok("실패는 줄을 안 만든다", fake.rows.length === 1, String(fake.rows.length));

  // ── 로그인 ──
  r = await call("POST", "/auth/login", { email: EMAIL, password: PW });
  ok("로그인 200", r.status === 200, String(r.status));
  ok("로그인도 증표를 준다", typeof r.body.token === "string", JSON.stringify(r.body));
  const loginToken = r.body.token;

  r = await call("POST", "/auth/login", { email: "A@B.COM", password: PW });
  ok("대문자로도 로그인된다", r.status === 200, String(r.status));

  // 실패 두 가지가 "똑같이" 보여야 한다. 다르면 가입자 명단 조회 기능이 된다.
  const wrongPw = await call("POST", "/auth/login", { email: EMAIL, password: "wrong password!!" });
  const noUser = await call("POST", "/auth/login", { email: "nobody@x.com", password: PW });
  ok("틀린 비번은 401", wrongPw.status === 401, String(wrongPw.status));
  ok("없는 이메일도 401", noUser.status === 401, String(noUser.status));
  ok("두 실패가 구별되지 않는다",
    wrongPw.status === noUser.status && JSON.stringify(wrongPw.body) === JSON.stringify(noUser.body),
    JSON.stringify(wrongPw.body) + " vs " + JSON.stringify(noUser.body));

  // ── 증표 검사 ──
  r = await call("GET", "/me", null, loginToken);
  ok("증표가 있으면 내 정보", r.status === 200 && r.body.user.email === EMAIL, JSON.stringify(r.body));
  ok("내 정보에 해시 없음", !JSON.stringify(r.body).includes("$2"), JSON.stringify(r.body));

  r = await call("GET", "/me", null, null);
  ok("증표 없으면 401", r.status === 401 && r.body.error === "no_token", JSON.stringify(r.body));

  // 마지막 글자 하나만 바꾼다 → 서명이 안 맞는다
  r = await call("GET", "/me", null, loginToken.slice(0, -1) + (loginToken.slice(-1) === "A" ? "B" : "A"));
  ok("위조는 401", r.status === 401 && r.body.error === "bad_token", JSON.stringify(r.body));

  // 내용만 바꿔치기: uid 를 999 로 바꿔 넣고 서명은 그대로 둔다
  const parts = loginToken.split(".");
  const tampered = parts[0] + "." + Buffer.from(JSON.stringify({ uid: 999 })).toString("base64url") + "." + parts[2];
  r = await call("GET", "/me", null, tampered);
  ok("내용을 바꾸면 서명이 잡는다", r.status === 401, String(r.status) + " " + JSON.stringify(r.body));

  r = await call("GET", "/me", null, "not-a-token-at-all");
  ok("아무 글자나 넣어도 401", r.status === 401, String(r.status));

  // ── 없는 주소 ──
  r = await call("GET", "/nope", null, null);
  ok("없는 주소는 404 JSON", r.status === 404 && r.body.error === "not_found", JSON.stringify(r.body));

  // 끝낼 때 process.exit() 를 쓰지 않는다.
  // 윈도우에서 아직 닫히는 중인 소켓이 남은 채로 강제 종료하면 Node 가 libuv assertion 으로 죽는다
  // (Assertion failed: !(handle->flags & UV_HANDLE_CLOSING)). 검사는 전부 통과했는데
  // 프로세스는 실패로 끝나서, 러너가 "실패" 라고 표시한다. 실제로 한 번 밟았다.
  //
  // 대신 남은 연결을 끊고, 종료 코드만 정해두고, 할 일이 없어지면 스스로 끝나게 둔다.
  server.closeAllConnections();
  server.close();
  console.log(f ? "\nFAILED " + f : "\nAUTH OK");
  process.exitCode = f ? 1 : 0;
})();
