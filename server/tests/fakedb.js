// 가짜 DB. 진짜 Postgres 대신 배열 하나에 담아둔다.
//
// 왜 가짜를 쓰나:
//  1. 테스트가 네트워크를 안 탄다 → 인터넷이 없어도, Supabase 가 잠들어도 돈다
//  2. 비밀값이 필요 없다 → GitHub Actions 가 DATABASE_URL 없이 돌릴 수 있다
//  3. 매번 빈 상태에서 시작한다 → 앞 테스트가 남긴 줄이 뒤 테스트를 흔들지 않는다
//  4. 빠르다 → 느린 테스트는 안 돌리게 되고, 안 돌리는 테스트는 없는 것과 같다
//
// 대가도 분명하다. 이건 "우리 코드가 SQL 을 제대로 쓰는지" 를 검사하지 않는다.
// 오타 난 SQL 도 여기서는 통과할 수 있다. 그건 진짜 DB 를 붙인 테스트가 할 일이고,
// 지금 단계에서는 로직(해시·증표·상태 코드)을 지키는 게 먼저다.

function makeFakeDb() {
  const rows = [];      // 여기가 users 테이블이다
  let nextId = 1;       // bigserial 흉내

  function query(text, params) {
    // 줄바꿈·들여쓰기를 지워서 한 줄로 만든다. 그래야 아래에서 문자열로 알아볼 수 있다.
    const sql = String(text).replace(/\s+/g, " ").trim();

    // ── insert ──
    if (/^insert into users/i.test(sql)) {
      const email = params[0];
      const hash = params[1];

      // 진짜 Postgres 의 unique 제약을 흉내낸다.
      // 코드가 이 에러 코드(23505)를 보고 409 를 만들기 때문에, 숫자가 정확해야 한다.
      if (rows.some(function (r) { return r.email === email; })) {
        const e = new Error('duplicate key value violates unique constraint "users_email_key"');
        e.code = "23505";
        return Promise.reject(e);
      }

      const row = {
        id: nextId++,
        email: email,
        password_hash: hash,
        created_at: new Date("2026-08-27T00:00:00.000Z"),
      };
      rows.push(row);
      // returning 절이 돌려주는 것만 준다 - password_hash 는 안 준다.
      return Promise.resolve({ rows: [{ id: row.id, email: row.email, created_at: row.created_at }] });
    }

    // ── select ... where email = $1 ──
    if (/where email = \$1/i.test(sql)) {
      return Promise.resolve({ rows: rows.filter(function (r) { return r.email === params[0]; }) });
    }

    // ── select ... where id = $1 ──
    if (/where id = \$1/i.test(sql)) {
      return Promise.resolve({ rows: rows.filter(function (r) { return String(r.id) === String(params[0]); }) });
    }

    // 모르는 SQL 이 오면 조용히 빈 결과를 주지 않고 터뜨린다.
    // 조용히 넘어가면 "테스트는 통과하는데 실제로는 안 되는" 상태가 만들어진다.
    return Promise.reject(new Error("fake db: 모르는 SQL -> " + sql));
  }

  return { query: query, rows: rows, pool: { end: function () {} } };
}

// ── require 를 가로채는 부분 ─────────────────────────────────
// node 는 한 번 읽은 모듈을 require.cache 에 넣어두고 다음부터 그걸 재사용한다.
// 그래서 src/db.js 를 아무도 읽기 전에 캐시에 가짜를 미리 넣어두면,
// 나중에 auth.js 가 require("./db") 를 해도 진짜 파일 대신 이걸 받는다.
//
// 라이브러리(jest 등) 없이 흉내내기를 하는 방법이고, client 쪽 테스트가
// document·localStorage 를 가짜로 주입하는 것과 같은 발상이다.
function installFakeDb() {
  const path = require.resolve("../src/db.js");
  const fake = makeFakeDb();
  require.cache[path] = { id: path, filename: path, loaded: true, exports: fake };
  return fake;
}

module.exports = { makeFakeDb: makeFakeDb, installFakeDb: installFakeDb };
