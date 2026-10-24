// Fills the database with sample users, courses, enrolments and feedback so the dashboards are not empty.
// Run:  npm run seed      (schema.sql must be loaded first)
require('dotenv').config();
const bcrypt = require('bcryptjs');

// Small deterministic random generator so every run produces the same demo data
function makeRng(seed) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

const COMMENTS = {
  5: [
    'Excellent explanations with live coding. The mini-projects made every concept click.',
    'Very well structured course and the faculty clears doubts promptly after class.',
    'Real-world examples throughout. I could build my own app by the end of the unit.',
    'Best course this semester. Assignments were challenging but fair.',
  ],
  4: [
    'Good pace overall. I would like a few more practice problems before the internal tests.',
    'Clear teaching and useful notes. Lab sessions could be a little longer.',
    'Content is up to date with industry needs. More guest sessions would help.',
  ],
  3: [
    'Content is relevant, but the pace gets quite fast in the second half of the unit.',
    'Teaching is fine, though more worked examples would make the topics easier to follow.',
    'Good topics, but the slides need more diagrams and fewer paragraphs.',
  ],
  2: [
    'Hard to follow the concepts without more demonstrations. Please slow down during derivations.',
    'Assignments felt disconnected from what was covered in class.',
  ],
  1: ['Needs a better structure. I struggled to see how the units connect.'],
};

const pad = (n) => String(n).padStart(2, '0');
const sqlDate = (d) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;

async function seed(pool) {
  const rand = makeRng(42);
  const clamp = (n) => Math.max(1, Math.min(5, Math.round(n)));

  for (const table of ['feedback', 'enrollments', 'courses', 'users']) {
    await pool.execute(`DELETE FROM ${table}`);
  }

  const insertUser = async (name, email, usn, password, role) => {
    const hash = await bcrypt.hash(password, 10);
    const [r] = await pool.execute(
      'INSERT INTO users (name, email, usn, password_hash, role) VALUES (?, ?, ?, ?, ?)',
      [name, email, usn, hash, role]
    );
    return r.insertId;
  };

  // ---- admin + faculty ----
    await insertUser('Dr. Lakshmi Narayan', 'admin@dsce.edu.in', null, 'Admin@123', 'admin');
  const fac = {};
  for (const [key, name, email] of [
    ['anitha', 'Alamma B H', 'alamma.bh@dsce.edu.in'],
    ['suresh', 'Prof. Suresh Kumar', 'suresh.kumar@dsce.edu.in'],
    ['kavitha', 'Dr. Kavitha Iyer', 'kavitha.iyer@dsce.edu.in'],
    ['rajesh', 'Prof. Rajesh Patil', 'rajesh.patil@dsce.edu.in'],
  ]) {
    fac[key] = await insertUser(name, email, null, 'Faculty@123', 'faculty');
  }

  // ---- courses (base = how well the course tends to be rated in the sample data) ----
  const courseDefs = [
    ['MMCA311', 'Advanced Database Systems', 3, 4, 'Query optimisation, transactions, NoSQL and distributed databases.', 'suresh', 3.9],
    ['MMCA312', 'Cloud Computing', 3, 3, 'Virtualisation, containers, serverless and deploying on public clouds.', 'kavitha', 4.1],
    ['MMCA313', 'Machine Learning', 3, 4, 'Supervised and unsupervised learning with hands-on model building.', 'rajesh', 3.5],
    ['MMCA314D', 'Web Development Using Full Stack Open', 3, 4, 'React, Node.js, Express and MySQL/MongoDB, built around a real project.', 'anitha', 4.4],
    ['MMCA315', 'Cyber Security', 3, 3, 'Threat models, secure coding, cryptography basics and incident response.', 'suresh', 4.0],
    ['MMCA316', 'Software Project Management', 3, 3, 'Estimation, agile delivery, risk management and project tracking.', 'anitha', 3.7],
  ];
  const courses = [];
  for (const [code, title, semester, credits, description, facKey, base] of courseDefs) {
    const [r] = await pool.execute(
      'INSERT INTO courses (code, title, semester, credits, description, faculty_id) VALUES (?, ?, ?, ?, ?, ?)',
      [code, title, semester, credits, description, fac[facKey]]
    );
    courses.push({ id: r.insertId, code, base });
  }
  const byCode = Object.fromEntries(courses.map((c) => [c.code, c]));

  // ---- students ----
  const studentNames = [
    'Ayush Ayush', 'Rohit Verma', 'Priya Nair', 'Karthik Gowda', 'Sneha Reddy', 'Aditya Menon',
    'Divya Hegde', 'Mohammed Faizan', 'Pooja Shetty', 'Arjun Bhat', 'Nandini Rao', 'Varun Kulkarni',
    'Ishita Das', 'Harsha Murthy', 'Meghana Joshi', 'Sanjay Prasad',
  ];
  const students = [];
  for (let i = 0; i < studentNames.length; i++) {
    const name = studentNames[i];
    const email = `${name.toLowerCase().replace(/ /g, '.')}@dsce.edu.in`;
    const usn = `1DS24MC${String(i + 1).padStart(3, '0')}`;
    students.push({ id: await insertUser(name, email, usn, 'Student@123', 'student') });
  }

  const addFeedback = async (studentId, course, daysAgo) => {
    const overall = clamp(course.base + (rand() - 0.5) * 2.4);
    const crit = () => clamp(overall + (rand() < 0.5 ? 0 : rand() < 0.5 ? -1 : 1));
    const pool5 = COMMENTS[overall];
    const comment = rand() < 0.8 ? pool5[Math.floor(rand() * pool5.length)] : null;
    const when = new Date(Date.now() - daysAgo * 86400000 - Math.floor(rand() * 40000) * 1000);
    await pool.execute(
      `INSERT INTO feedback (student_id, course_id, rating_teaching, rating_content, rating_interaction,
                             rating_overall, comments, is_anonymous, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [studentId, course.id, crit(), crit(), crit(), overall, comment, rand() < 0.4 ? 1 : 0, sqlDate(when)]
    );
  };

  // Demo student (Ayush): three courses selected, feedback already given for Cloud Computing only
  const demo = students[0].id;
  for (const code of ['MMCA312', 'MMCA313', 'MMCA314D']) {
    await pool.execute('INSERT INTO enrollments (student_id, course_id) VALUES (?, ?)', [demo, byCode[code].id]);
  }
  await addFeedback(demo, byCode.MMCA312, 2);

  // Everyone else: four courses each, most have already given feedback
  const codes = courseDefs.map((c) => c[0]);
  for (let i = 1; i < students.length; i++) {
    const picks = new Set(['MMCA314D']);
    let k = i;
    while (picks.size < 4) picks.add(codes[k++ % codes.length]);
    for (const code of picks) {
      await pool.execute('INSERT INTO enrollments (student_id, course_id) VALUES (?, ?)', [students[i].id, byCode[code].id]);
      if (rand() < 0.8) await addFeedback(students[i].id, byCode[code], 1 + Math.floor(rand() * 20));
    }
  }
}

module.exports = seed;

if (require.main === module) {
  const pool = require('./db');
  seed(pool)
    .then(() => {
      console.log('Sample data loaded.');
      console.log('  Admin   : admin@dsce.edu.in           / Admin@123');
      console.log('  Faculty : alamma.bh@dsce.edu.in      / Faculty@123');
      console.log('  Student : ayush.ayush@dsce.edu.in   / Student@123');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Seeding failed:', err.message);
      process.exit(1);
    });
}
