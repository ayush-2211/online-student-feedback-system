// Run with the API started and freshly seeded:  npm run seed, then npm run dev, then npm run test:api
const base = process.env.API_URL || 'http://localhost:5000/api';
const call = async (method, path, body, token) => {
  const r = await fetch(base + path, { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) }, body: body ? JSON.stringify(body) : undefined });
  let j = null; try { j = await r.json(); } catch (e) {}
  return { status: r.status, body: j };
};
const show = (label, r, pick) => console.log(String(r.status).padEnd(4), label.padEnd(52), JSON.stringify(pick ? pick(r.body) : r.body).slice(0, 110));
(async () => {
  show('login wrong password', await call('POST', '/auth/login', { email: 'ayush.ayush@dsce.edu.in', password: 'nope' }));
  const s = await call('POST', '/auth/login', { email: 'ayush.ayush@dsce.edu.in', password: 'Student@123' });
  show('login student', s, (b) => ({ role: b.user.role, usn: b.user.usn }));
  const st = s.body.token;
  show('GET /courses (no token)', await call('GET', '/courses'));
  const all = await call('GET', '/courses', null, st);
  show('GET /courses', all, (b) => b.map((c) => `${c.code}:${c.selected}`));
  const mine = await call('GET', '/courses/mine', null, st);
  show('GET /courses/mine', mine, (b) => b.map((c) => `${c.code}:fb=${c.feedback_given}`));
  const c311 = all.body.find((c) => c.code === 'MMCA311');
  const c314 = all.body.find((c) => c.code === 'MMCA314D');
  show('feedback for un-selected course -> 403', await call('POST', '/feedback', { courseId: c311.id, ratingTeaching: 5, ratingContent: 5, ratingInteraction: 5, ratingOverall: 5 }, st));
  show('feedback missing rating -> 400', await call('POST', '/feedback', { courseId: c314.id, ratingTeaching: 5 }, st));
  show('feedback rating 9 -> 400', await call('POST', '/feedback', { courseId: c314.id, ratingTeaching: 9, ratingContent: 5, ratingInteraction: 5, ratingOverall: 5 }, st));
  show('select course 311', await call('POST', '/enrollments', { courseId: c311.id }, st));
  show('select course 311 again -> 409', await call('POST', '/enrollments', { courseId: c311.id }, st));
  show('drop course 311', await call('DELETE', '/enrollments/' + c311.id, null, st));
  show('submit feedback 314D', await call('POST', '/feedback', { courseId: c314.id, ratingTeaching: 5, ratingContent: 4, ratingInteraction: 5, ratingOverall: 5, comments: 'test', anonymous: true }, st));
  show('submit feedback 314D again -> 409', await call('POST', '/feedback', { courseId: c314.id, ratingTeaching: 5, ratingContent: 4, ratingInteraction: 5, ratingOverall: 5 }, st));
  const c312 = all.body.find((c) => c.code === 'MMCA312');
  show('drop course with feedback -> 400', await call('DELETE', '/enrollments/' + c312.id, null, st));
  show('student hits /reports/summary -> 403', await call('GET', '/reports/summary', null, st));
  show('register duplicate email -> 409', await call('POST', '/auth/register', { name: 'X', email: 'ayush.ayush@dsce.edu.in', usn: '1DS24MC999', password: 'abcdef' }));
  const reg = await call('POST', '/auth/register', { name: 'Test User', email: 'test.user@dsce.edu.in', usn: '1ds24mc900', password: 'abcdef' });
  show('register new student', reg, (b) => b.user);

  const f = await call('POST', '/auth/login', { email: 'alamma.bh@dsce.edu.in', password: 'Faculty@123' });
  const ft = f.body.token;
  const sum = await call('GET', '/reports/summary', null, ft);
  show('faculty summary', sum, (b) => ({ totals: b.totals, courses: b.courses.map((c) => `${c.code} ${c.avg_overall} (${c.responses}/${c.enrolled})`) }));
  const other = all.body.find((c) => c.code === 'MMCA313');
  show('faculty -> other faculty course -> 403', await call('GET', '/reports/course/' + other.id, null, ft));
  const det = await call('GET', '/reports/course/' + c314.id, null, ft);
  show('faculty course detail', det, (b) => ({ stats: b.stats, dist: b.distribution.map((d) => d.count), anon: b.feedback.filter((x) => x.anonymous).map((x) => x.student_name).slice(0, 2) }));
  show('faculty POST /courses -> 403', await call('POST', '/courses', { code: 'X' }, ft));

  const a = await call('POST', '/auth/login', { email: 'admin@dsce.edu.in', password: 'Admin@123' });
  const at = a.body.token;
  const asum = await call('GET', '/reports/summary', null, at);
  show('admin summary', asum, (b) => b.totals);
  const adet = await call('GET', '/reports/course/' + c314.id, null, at);
  show('admin sees anonymous authors', adet, (b) => b.feedback.filter((x) => x.anonymous).map((x) => x.student_name).slice(0, 2));
  const fl = await call('GET', '/courses/faculty', null, at);
  show('admin faculty list', fl, (b) => b.length);
  const add = await call('POST', '/courses', { code: 'mmca317', title: 'Test Course', semester: 3, credits: 3, facultyId: fl.body[0].id }, at);
  show('admin add course', add);
  show('admin add duplicate -> 409', await call('POST', '/courses', { code: 'MMCA317', title: 'Test', semester: 3, credits: 3, facultyId: fl.body[0].id }, at));
  show('admin delete course', await call('DELETE', '/courses/' + add.body.id, null, at));
  show('admin delete again -> 404', await call('DELETE', '/courses/' + add.body.id, null, at));
  show('unknown route -> 404', await call('GET', '/nothing', null, at));
})();
