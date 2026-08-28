// Postgres 연결. 이 파일 하나만 DB 주소를 안다.
//
// 다른 파일들은 여기서 내보내는 query() 만 가져다 쓴다. 그래야 나중에 DB 를 바꾸거나
// 로그를 붙일 때 고칠 곳이 한 군데다.

const { Pool } = require("pg");

// ── 풀(Pool)이란 ─────────────────────────────────────────────
// DB 에 연결하는 일은 생각보다 비싸다. 주소를 찾고, 손을 잡고(TCP), 암호화를 협상하고,
// 로그인까지 하면 수십 밀리초가 든다. 요청이 올 때마다 이걸 새로 하면 낭비다.
//
// 그래서 연결을 몇 개 미리 열어두고 돌려쓴다. 그 묶음이 풀이다.
// query() 를 부르면 풀에서 놀고 있는 연결을 하나 빌려 쓰고 자동으로 반납한다.
const pool = new Pool({
  // 주소·사용자·비밀번호·포트가 전부 한 문자열에 들어 있다(.env 의 DATABASE_URL).
  connectionString: process.env.DATABASE_URL,

  // ── SSL ──
  // Supabase 는 암호화되지 않은 접속을 아예 안 받는다. 당연한 것이, 비밀번호와
  // 사용자 데이터가 인터넷을 그대로 건너가면 중간에서 읽힌다.
  //
  // rejectUnauthorized: false 는 "상대 인증서를 검증하지는 않겠다"는 뜻이다.
  // 통신은 여전히 암호화되지만, 상대가 진짜 Supabase 인지는 확인하지 않는다.
  // 제대로 하려면 Supabase 의 인증서 파일을 받아서 ca 에 넣어야 하는데,
  // 학습 단계에서는 이 정도로 두고 4단계에서 다시 본다.
  ssl: { rejectUnauthorized: false },

  // 연결을 최대 몇 개까지 열어둘지. Supabase 무료 등급은 동시 연결 수가 넉넉하지 않고,
  // 우리 서버는 한 대뿐이라 작게 잡는다.
  max: 5,

  // 30초 동안 안 쓴 연결은 닫는다. Render 무료 서버가 잠들 때 연결을 붙들고 있지 않도록.
  idleTimeoutMillis: 30000,
});

// 풀 안에서 놀고 있던 연결이 끊어지면(DB 재시작·네트워크 끊김) 여기로 온다.
// 이 핸들러가 없으면 Node 가 처리되지 않은 에러로 보고 프로세스를 통째로 죽인다.
pool.on("error", function (err) {
  console.error("[db] idle client error:", err.message);
});

// SQL 한 줄 실행. params 는 값 목록이다.
//
// 값을 문자열에 직접 이어붙이지 않고 반드시 $1, $2 로 넘긴다:
//   나쁨: "select * from users where email = '" + email + "'"
//   좋음: query("select * from users where email = $1", [email])
//
// 이어붙이면 사용자가 email 칸에 SQL 을 적어넣어 DB 를 조작할 수 있다(SQL 주입).
// $1 로 넘기면 드라이버가 "이건 값이지 명령이 아니다" 라고 분리해서 보내므로 그 길이 막힌다.
function query(text, params) {
  return pool.query(text, params);
}

module.exports = { query, pool };
