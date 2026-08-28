// LearnFast 동기화 서버 — 0단계: 살아있다는 것만 대답하는 서버.
//
// 이 파일이 하는 일은 딱 하나다.
// "누가 http://주소/health 로 물어보면 {"ok":true} 라고 답한다."
// 데이터베이스도, 로그인도, 저장도 아직 없다. 그건 1단계부터다.
//
// 왜 이렇게 시작하냐면: 서버는 내 컴퓨터에서 잘 돌다가 인터넷에 올릴 때 막히는 일이 제일 많다.
// 그래서 아무 기능도 없는 빈 서버로 "올리는 길"을 먼저 뚫어놓고, 그 위에 기능을 얹는다.

// require() 는 남이 만든 코드나 다른 파일을 가져오는 명령이다.
// express 는 "누가 이 주소로 물어보면 이렇게 답해라"를 짧게 쓰게 해주는 도구(라이브러리)다.
// express 없이 Node 기본 기능만으로도 서버를 만들 수 있지만, 주소별 분기·JSON 처리 같은 걸
// 전부 손으로 짜야 해서 코드가 서너 배로 길어진다.
const express = require("express");

const db = require("./db");
const auth = require("./auth");

// app 은 이 서버 그 자체다. 앞으로 "이 주소는 이렇게 답해라"를 전부 app 에 등록한다.
const app = express();

// ── 미들웨어: 들어오는 JSON 을 객체로 바꿔준다 ───────────────
// 이게 없으면 req.body 가 undefined 다. 상대가 보낸 건 글자 뭉치일 뿐이라
// 누군가는 그걸 JSON.parse 해줘야 하는데, 그 일을 하는 게 이 한 줄이다.
//
// limit 을 거는 이유: 기본값도 100kb 지만 명시해둔다. 회원가입에 필요한 건 이메일과
// 비밀번호뿐인데 누가 10MB 를 보내면 그냥 메모리 낭비다.
app.use(express.json({ limit: "100kb" }));

// /auth 로 시작하는 요청은 auth.js 가 맡는다.
// 즉 auth.js 안의 "/signup" 은 실제로는 "/auth/signup" 이 된다.
app.use("/auth", auth.router);

// ── 포트(port) ───────────────────────────────────────────────
// 한 컴퓨터에는 프로그램이 여러 개 떠 있다. 포트는 그중 누구에게 온 요청인지 구분하는 번호다.
// 아파트로 치면 IP 주소가 건물 주소이고, 포트가 호수다.
//
// process.env 는 "환경변수" — 코드 바깥에서 프로그램에 넘겨주는 값이다.
// 배포 서비스(Render 등)는 서버를 켤 때 "너는 몇 번 포트를 써라"를 PORT 환경변수로 정해준다.
// 그 값을 무시하고 번호를 코드에 박아두면 배포된 서버는 아무도 못 찾는다.
// || 3000 은 "PORT 가 없으면(=내 컴퓨터에서 그냥 켰으면) 3000번을 써라"는 뜻이다.
const PORT = process.env.PORT || 3000;

// ── 라우트(route) ────────────────────────────────────────────
// 라우트 = "이 주소로 이런 방식의 요청이 오면 이렇게 답한다"는 규칙 하나.
//
// app.get("/health", ...) 을 뜯어보면:
//   get      → HTTP 메서드. 브라우저 주소창에 주소를 치는 것이 GET 이다. "달라"는 뜻.
//              (나중에 쓸 POST 는 "받아라", PUT 은 "덮어써라")
//   "/health"→ 주소의 뒷부분(경로). https://내서버.com/health 의 /health 부분.
//   (req,res)→ 요청이 올 때마다 실행되는 함수.
//              req(request) 는 상대가 보낸 것, res(response) 는 내가 돌려줄 것.
//
// /health 라는 이름은 관습이다. 배포 서비스와 감시 도구가 "이 서버 아직 살아있나?"를
// 확인할 주소가 필요한데, 다들 여기로 물어보기로 암묵적으로 합의해서 굳어졌다.
// 서버가 죽거나 잠들면 이 요청이 실패하고, 그걸로 상태를 판단한다.
app.get("/health", function (req, res) {
  // res.json(...) 은 자바스크립트 객체를 JSON 글자로 바꿔서 돌려준다.
  // 동시에 "이건 JSON 이다"라는 표시(Content-Type 헤더)도 같이 붙여준다.
  res.json({
    ok: true,
    service: "learnfast",
    // uptime() 은 이 서버가 켜진 뒤 몇 초 지났는지다.
    // 배포한 서버가 자꾸 재시작되고 있으면 이 숫자가 계속 0 근처로 돌아온다 — 그걸로 눈치챈다.
    uptime: Math.round(process.uptime()),
  });
});

// ── GET /me — 증표가 진짜 도는지 확인하는 곳 ─────────────────
// requireAuth 를 앞에 끼우면, 증표가 없거나 틀린 요청은 여기까지 오지도 못한다.
// 이 한 줄짜리 조립이 2단계부터 모든 동기화 API 에 그대로 쓰인다.
app.get("/me", auth.requireAuth, async function (req, res) {
  // requireAuth 가 넣어둔 값. 증표 안에 있던 사용자 번호다.
  const r = await db.query("select id, email, created_at from users where id = $1", [req.userId]);
  // 증표는 멀쩡한데 그 사용자가 DB 에 없는 경우 - 탈퇴했거나 지워졌다.
  if (!r.rows[0]) return res.status(401).json({ ok: false, error: "user_gone" });
  res.json({ ok: true, user: auth.publicUser(r.rows[0]) });
});

// ── 없는 주소 처리 ───────────────────────────────────────────
// 위에 등록한 어떤 규칙에도 안 걸린 요청이 여기까지 흘러온다.
// 이걸 안 적어두면 express 가 HTML 로 된 기본 에러 페이지를 돌려주는데,
// 이 서버는 JSON 만 주고받기로 했으므로 실패도 JSON 으로 준다.
// 404 는 "그런 주소 없다"는 뜻의 표준 번호다.
app.use(function (req, res) {
  res.status(404).json({ ok: false, error: "not_found" });
});

// ── 마지막 그물: 어디서든 터진 에러가 여기로 모인다 ──────────
// 인자가 네 개(err 가 맨 앞)면 express 는 이걸 "에러 처리기" 로 알아본다. 순서가 아니라 개수로 구분한다.
// Express 5 부터는 async 함수 안에서 던진 에러도 자동으로 여기까지 온다(4 에서는 직접 넘겨야 했다).
//
// 두 가지를 한다:
//  1. 진짜 원인은 서버 로그에만 남긴다
//  2. 밖으로는 짧은 말만 준다 - 에러 메시지에는 SQL 문이나 파일 경로가 섞여 나오는 일이 흔하고,
//     그건 공격자에게 서버 내부 구조를 알려주는 꼴이다
app.use(function (err, req, res, next) {
  console.error("[error]", req.method, req.url, err.message);
  // 보낼 응답을 이미 시작했으면 express 기본 처리에 맡긴다(헤더를 두 번 못 보낸다)
  if (res.headersSent) return next(err);
  res.status(500).json({ ok: false, error: "server_error" });
});

// ── 서버 켜기 ────────────────────────────────────────────────
// listen 은 "이 포트로 오는 요청을 이제부터 받겠다"는 뜻이다.
// 이 줄이 실행되면 프로그램이 끝나지 않고 계속 떠 있는다(Ctrl+C 로 끈다).
//
// 두 번째 인자 "0.0.0.0" 은 "어느 네트워크로 들어오는 요청이든 받겠다"는 뜻이다.
// 기본값이나 "localhost" 로 두면 같은 컴퓨터 안에서만 접속이 되는데,
// 배포 환경에서는 요청이 바깥에서 들어오므로 그렇게 두면 "서버는 켜졌는데 아무도 못 들어오는"
// 상태가 된다. 배포 첫날 가장 흔히 밟는 함정이라 처음부터 박아둔다.
app.listen(PORT, "0.0.0.0", function () {
  console.log("learnfast server listening on port " + PORT);
});
