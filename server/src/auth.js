// 회원가입 · 로그인 · "이 요청 누가 보냈나" 검사.
//
// 이 파일이 답하는 질문은 두 개다.
//   1. 비밀번호를 어떻게 저장하고 어떻게 맞춰보나  → bcrypt
//   2. 로그인한 뒤 다음 요청에서 그 사람인 걸 어떻게 아나 → JWT

const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("./db");

// ── 서버가 켜질 때 비밀키부터 확인한다 ───────────────────────
// 없으면 여기서 바로 죽는다. 이게 없는데 그냥 켜지면 로그인은 되는 것처럼 보이다가
// 증표를 아무나 위조할 수 있는 서버가 된다. 조용히 잘못 도는 것보다 시끄럽게 죽는 게 낫다.
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) throw new Error("JWT_SECRET 이 없다. server/.env 를 확인할 것");

// bcrypt 반복 횟수. 1 올라갈 때마다 두 배 느려진다.
// 12 는 요즘 기계에서 한 번에 0.2~0.3초 — 사람에겐 안 느껴지고 공격자에겐 치명적인 지점.
//
// 테스트에서만 낮춘다. 테스트는 해시를 열 번 넘게 만드는데 12 면 그것만 3초가 넘고,
// "느려서 안 돌리게 되는 테스트" 는 없는 것과 같다. 환경변수를 안 주면 항상 12 다 —
// 즉 배포에서 실수로 약해질 길이 없다.
const COST = Number(process.env.BCRYPT_COST) || 12;

// 증표 유효기간. 짧을수록 안전하고 길수록 편하다.
// JWT 는 한 번 발급하면 만료 전까지 취소할 방법이 없어서(=로그아웃을 서버가 강제 못 한다)
// 이 숫자가 곧 "최악의 경우 훔친 증표가 살아있는 시간"이다. 4단계에서 짧게 줄이고 자동 갱신을 붙인다.
const TOKEN_TTL = "7d";

const router = express.Router();

// ── 증표 만들기 ──────────────────────────────────────────────
// 안에 넣는 건 사용자 번호 하나뿐이다.
// JWT 의 내용은 암호화가 아니라 누구나 읽을 수 있다 - 그래서 남이 봐도 되는 것만 넣는다.
// 이메일조차 안 넣는다. 필요하면 그 번호로 DB 에서 찾으면 된다.
function signToken(userId) {
  return jwt.sign({ uid: userId }, JWT_SECRET, { expiresIn: TOKEN_TTL });
}

// 서버가 클라이언트에게 돌려주는 모양을 한 곳에서 만든다.
// password_hash 가 실수로 섞여 나가는 사고는 이런 함수가 없을 때 난다.
function publicUser(row) {
  return { id: Number(row.id), email: row.email, createdAt: row.created_at };
}

// 입력 검사. 통과하면 null, 문제가 있으면 이유를 돌려준다.
function checkInput(email, password) {
  if (typeof email !== "string" || typeof password !== "string") return "email_and_password_required";
  // 이메일 형식은 최소한만 본다. 완벽한 정규식은 존재하지 않고(RFC 가 그만큼 복잡하다),
  // 진짜 확인은 그 주소로 메일을 보내봐야만 되는데 우리는 메일을 안 쓴다.
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return "invalid_email";
  // 길이만 본다. "대문자·특수문자 포함" 같은 규칙은 사람들을 Password1! 로 몰아넣을 뿐
  // 실제 강도는 길이에서 나온다는 게 알려져 있다(NIST 800-63B).
  if (password.length < 8) return "password_too_short";
  if (password.length > 200) return "password_too_long";
  return null;
}

// ── POST /auth/signup ────────────────────────────────────────
router.post("/signup", async function (req, res) {
  // 이메일은 소문자로 통일한다. Foo@x.com 과 foo@x.com 으로 두 번 가입되면 안 된다.
  const email = String(req.body.email || "").trim().toLowerCase();
  const password = String(req.body.password || "");

  const bad = checkInput(email, password);
  if (bad) return res.status(400).json({ ok: false, error: bad });

  // 여기가 느린 지점이다. 일부러 느리다.
  const hash = await bcrypt.hash(password, COST);

  try {
    // returning 을 쓰면 넣은 줄을 그대로 돌려받는다. 넣고 나서 다시 조회할 필요가 없다.
    const r = await db.query(
      "insert into users (email, password_hash) values ($1, $2) returning id, email, created_at",
      [email, hash]
    );
    const user = publicUser(r.rows[0]);
    // 가입하면 바로 로그인된 상태가 된다. 가입 직후 다시 로그인시키는 건 이유 없는 한 걸음이다.
    res.status(201).json({ ok: true, token: signToken(user.id), user: user });
  } catch (e) {
    // 23505 = unique 제약 위반. 이미 있는 이메일이다.
    // "먼저 조회해서 있으면 거절" 로 짜지 않는 이유: 두 요청이 동시에 들어오면
    // 둘 다 "없음" 을 보고 둘 다 넣으려 든다. DB 제약은 그 틈이 없다.
    if (e.code === "23505") return res.status(409).json({ ok: false, error: "email_taken" });
    throw e;
  }
});

// ── POST /auth/login ─────────────────────────────────────────
router.post("/login", async function (req, res) {
  const email = String(req.body.email || "").trim().toLowerCase();
  const password = String(req.body.password || "");
  if (!email || !password) return res.status(400).json({ ok: false, error: "email_and_password_required" });

  const r = await db.query("select id, email, password_hash, created_at from users where email = $1", [email]);
  const row = r.rows[0];

  // 없는 이메일이어도 bcrypt 를 한 번 돌린다.
  //
  // 왜냐하면: 없는 이메일이면 즉시 실패하고, 있는 이메일이면 0.25초 걸린다면,
  // 공격자는 응답 시간만 재서 "이 이메일은 가입돼 있다" 를 알아낼 수 있다(타이밍 공격).
  // 가짜 해시와 한 번 비교해서 걸리는 시간을 맞춰준다.
  const hash = row ? row.password_hash : "$2b$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidinv";
  const okPassword = await bcrypt.compare(password, hash);

  // 실패 이유를 구분해서 알려주지 않는다. "이메일이 없다" 와 "비번이 틀렸다" 를 나누면
  // 그게 곧 가입자 명단 조회 기능이 된다.
  if (!row || !okPassword) return res.status(401).json({ ok: false, error: "invalid_credentials" });

  const user = publicUser(row);
  res.json({ ok: true, token: signToken(user.id), user: user });
});

// ── 미들웨어: 이 요청 누가 보냈나 ────────────────────────────
// 미들웨어는 요청이 본 처리에 닿기 전에 거쳐가는 함수다.
// 통과시키려면 next() 를 부르고, 막으려면 그냥 응답해버리면 된다.
//
// 2단계부터 동기화 API 앞에 이걸 그대로 붙인다. 그래서 여기서 잘 만들어두면
// 뒤에 나오는 모든 API 의 인증이 한 줄로 끝난다.
function requireAuth(req, res, next) {
  // 관례상 증표는 이 형태로 온다:  Authorization: Bearer <토큰>
  // Bearer 는 "이걸 가진 사람(bearer)에게 권한을 준다" 는 뜻이다 - 즉 이 글자를 훔치면 그 사람이 된다.
  const h = req.headers.authorization || "";
  const token = h.startsWith("Bearer ") ? h.slice(7) : null;
  if (!token) return res.status(401).json({ ok: false, error: "no_token" });

  try {
    // verify 는 두 가지를 한 번에 본다: 서명이 우리 비밀키로 만든 게 맞는지, 그리고 아직 안 지났는지.
    // 둘 중 하나라도 틀리면 예외를 던진다. DB 는 건드리지 않는다 - 계산만으로 끝난다.
    const payload = jwt.verify(token, JWT_SECRET);
    req.userId = payload.uid;   // 뒤에 오는 처리들이 이 값을 본다
    next();
  } catch (e) {
    // 만료와 위조를 나눠서 알려준다. 만료는 "다시 로그인해라" 이고 위조는 그냥 거절이다.
    const why = e.name === "TokenExpiredError" ? "token_expired" : "bad_token";
    res.status(401).json({ ok: false, error: why });
  }
}

module.exports = { router, requireAuth, publicUser };
