// backend/controllers/enrollmentController.js
const pool   = require('../config/db');
const bcrypt = require('bcryptjs');
const xlsx   = require('xlsx');

// GET /api/enrollment
const getStudents = async (req, res) => {
  try {
    const { batch_id } = req.query;
    let where = 'WHERE 1=1';
    const params = [];
    if (batch_id) { params.push(batch_id); where += ` AND s.batch_id=$${params.length}`; }
    const r = await pool.query(
      `SELECT s.id, s.student_id, s.full_name,
              COALESCE(s.email, '') AS email,
              s.batch_id, b.batch_name,
              s.department_id, d.name AS department_name,
              s.enrollment_date, s.created_at
       FROM students s
       LEFT JOIN batches     b ON s.batch_id     = b.id
       LEFT JOIN departments d ON s.department_id = d.id
       ${where} ORDER BY s.created_at DESC`,
      params
    );
    res.json(r.rows);
  } catch (err) {
    console.error('getStudents:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// POST /api/enrollment (single)
const enrollStudent = async (req, res) => {
  try {
    const { student_id, first_name, last_name, full_name, email, batch_id, department_id } = req.body;
    if (!student_id || !batch_id)
      return res.status(400).json({ message: 'student_id and batch_id are required.' });
    const name = full_name || `${first_name||''} ${last_name||''}`.trim();
    if (!name) return res.status(400).json({ message: 'Name is required.' });
    const hash = await bcrypt.hash(student_id.toLowerCase(), 10);
    await pool.query(
      `INSERT INTO users (juw_id,password_hash,role,full_name,department_id)
       VALUES ($1,$2,'student',$3,$4) ON CONFLICT (juw_id) DO UPDATE SET full_name=EXCLUDED.full_name`,
      [student_id, hash, name, department_id||null]
    );
    const userId = (await pool.query('SELECT id FROM users WHERE juw_id=$1',[student_id])).rows[0].id;
    const sRes = await pool.query(
      `INSERT INTO students (user_id,student_id,full_name,email,batch_id,department_id,enrollment_date)
       VALUES ($1,$2,$3,$4,$5,$6,NOW())
       ON CONFLICT (student_id) DO UPDATE SET
         full_name=EXCLUDED.full_name,email=EXCLUDED.email,
         batch_id=EXCLUDED.batch_id,department_id=EXCLUDED.department_id
       RETURNING *`,
      [userId, student_id, name, email||null, batch_id, department_id||null]
    );
    res.status(201).json(sRes.rows[0]);
  } catch (err) {
    console.error('enrollStudent:', err);
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
};

// PUT /api/enrollment/:id
const updateStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const { full_name, email, batch_id, department_id } = req.body;
    const r = await pool.query(
      `UPDATE students SET full_name=$1,batch_id=$2,department_id=$3 WHERE id=$4 RETURNING *`,
      [full_name, batch_id, department_id||null, id]
    );
    if (!r.rows.length) return res.status(404).json({ message: 'Student not found.' });
    res.json(r.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
};

// Flexible column finder — strips all spaces/underscores/dashes, lowercases
const norm = s => String(s||'').toLowerCase().replace(/[\s_\-\.]/g,'');
const findVal = (row, ...names) => {
  const targets = names.map(norm);
  for (const key of Object.keys(row)) {
    if (targets.includes(norm(key))) {
      const v = String(row[key]||'').trim();
      if (v && v !== '-') return v;
    }
  }
  return '';
};

// POST /api/enrollment/bulk
const bulkEnroll = async (req, res) => {
  try {
    const { batch_id } = req.body;
    if (!batch_id) return res.status(400).json({ message: 'batch_id is required.' });
    if (!req.file)  return res.status(400).json({ message: 'No file uploaded.' });

    const workbook = xlsx.read(req.file.buffer, { type:'buffer', raw:false, cellText:true });
    const sheet    = workbook.Sheets[workbook.SheetNames[0]];
    const rows     = xlsx.utils.sheet_to_json(sheet, { defval:'', raw:false });

    if (!rows.length) return res.status(400).json({ message: 'File is empty.' });

    const cols = Object.keys(rows[0]);
    console.log('[bulkEnroll] columns:', cols);
    console.log('[bulkEnroll] row[0]:', JSON.stringify(rows[0]));

    const bRes = await pool.query('SELECT department_id FROM batches WHERE id=$1', [batch_id]);
    const batchDeptId = bRes.rows[0]?.department_id || null;

    // Pre-hash a default password (use student_id per row, but we use bcryptjs rounds=8 for speed)
    const ROUNDS = 8; // faster than default 10, still secure enough

    let enrolled = 0, skipped = 0;
    const skippedList = [];

    for (const row of rows) {
      // Try ALL possible column name variations including Moodle export format
      const student_id = findVal(row,
        'student_id','studentid','student id',
        'id','rollno','roll no','roll_no',
        'registration','regno','reg no','studentno',
        'username','userid','user id',          // Moodle
        'idnumber','id number',                  // Moodle
        'participantid','participant id'
      );

      const first = findVal(row,
        'first_name','firstname','fname','first name',
        'firstname','first'                       // Moodle: "First name"
      );
      const last = findVal(row,
        'last_name','lastname','lname','last name',
        'surname','last'                          // Moodle: "Surname"
      );
      const email = findVal(row,
        'email','mail','emailaddress','email address',
        'emailaddress'                            // Moodle: "Email address"
      );
      const dname = findVal(row,
        'department','dept','department_name','dept name'
      );

      // Use first_name as full name (it contains the student's full name in this file format)
      // last_name may contain father's name — use first_name only as the student name
      const full = findVal(row,
        'full_name','fullname','full name','name','student_name','studentname'
      ) || first || (first && last ? `${first} ${last}` : last);

      // If no student_id found, use email prefix
      const sid = student_id || (email ? email.split('@')[0] : '');

      if (!sid || !full) {
        skipped++;
        const preview = Object.entries(row).slice(0,3).map(([k,v])=>`${k}:${v}`).join(', ');
        skippedList.push(`row missing id/name — ${preview}`);
        continue;
      }

      // Dept lookup — try partial match, fallback to batch dept, never skip
      let dept_id = batchDeptId;
      if (dname) {
        try {
          // Try progressively shorter matches
          const words = dname.toLowerCase().split(' ').filter(w=>w.length>3);
          for (const word of words) {
            const dRes = await pool.query(
              `SELECT id FROM departments WHERE LOWER(name) LIKE $1 LIMIT 1`,
              [`%${word}%`]
            );
            if (dRes.rows.length) { dept_id = dRes.rows[0].id; break; }
          }
        } catch(_) { /* use batchDeptId */ }
      }

      try {
        const hash = await bcrypt.hash(sid.toLowerCase(), ROUNDS);

        // Insert/update user account
        await pool.query(
          `INSERT INTO users (juw_id,password_hash,role,full_name,department_id)
           VALUES ($1,$2,'student',$3,$4)
           ON CONFLICT (juw_id) DO UPDATE SET
             full_name=EXCLUDED.full_name,
             department_id=EXCLUDED.department_id`,
          [sid, hash, full, dept_id]
        );
        const uRow = await pool.query('SELECT id FROM users WHERE juw_id=$1',[sid]);
        if (!uRow.rows.length) throw new Error('User not created');
        const userId = uRow.rows[0].id;

        // Insert/update student record
        // Try insert with email first, fall back without email if column doesn't exist
        try {
          await pool.query(
            `INSERT INTO students (user_id,student_id,full_name,email,batch_id,department_id,enrollment_date)
             VALUES ($1,$2,$3,$4,$5,$6,NOW())
             ON CONFLICT (student_id) DO UPDATE SET
               full_name=EXCLUDED.full_name,email=EXCLUDED.email,
               batch_id=EXCLUDED.batch_id,department_id=EXCLUDED.department_id,enrollment_date=NOW()`,
            [userId, sid, full, email||null, batch_id, dept_id]
          );
        } catch(emailErr) {
          if (emailErr.code === '42703') {
            // email column doesn't exist yet — insert without it
            await pool.query(
              `INSERT INTO students (user_id,student_id,full_name,batch_id,department_id,enrollment_date)
               VALUES ($1,$2,$3,$4,$5,NOW())
               ON CONFLICT (student_id) DO UPDATE SET
                 full_name=EXCLUDED.full_name,
                 batch_id=EXCLUDED.batch_id,department_id=EXCLUDED.department_id`,
              [userId, sid, full, batch_id, dept_id]
            );
          } else { throw emailErr; }
        }
        enrolled++;
      } catch (err) {
        console.error(`[bulkEnroll] ERROR for student "${sid}" (${full}):`, err.message);
        skipped++;
        skippedList.push(`${sid} (${full}): ${err.message}`);
      }
    }

    console.log(`[bulkEnroll] total:${rows.length} enrolled:${enrolled} skipped:${skipped}`);
    if (skippedList.length) console.log('[bulkEnroll] skipped:', skippedList.slice(0,5));
    res.json({ total:rows.length, enrolled, skipped, skippedList: skippedList.slice(0,10), columns: cols });
  } catch (err) {
    console.error('bulkEnroll fatal:', err);
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
};

module.exports = { getStudents, enrollStudent, updateStudent, bulkEnroll };