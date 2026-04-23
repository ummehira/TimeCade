-- ============================================
-- JUW Timetable System - Seed Data
-- Based on 2nd Semester 2025 Timetable PDF
-- ============================================

-- ── Departments ─────────────────────────────
INSERT INTO departments (name, code) VALUES
  ('Computer Science',    'CS'),
  ('Software Engineering','SE'),
  ('Data Science',        'DS')
ON CONFLICT (code) DO NOTHING;

-- ── Rooms (from PDF) ────────────────────────
INSERT INTO rooms (room_id, room_name, capacity, room_type) VALUES
  ('B-13','Block B - Room 13',45,'classroom'),
  ('B-14','Block B - Room 14',45,'classroom'),
  ('B-15','Block B - Room 15',45,'classroom'),
  ('B-16','Block B - Room 16',50,'classroom'),
  ('B-17','Block B - Room 17',45,'classroom'),
  ('B-19','Block B - Room 19 (Physics Lab)',30,'lab'),
  ('C-60','Block C - Room 60',50,'classroom'),
  ('C-61','Block C - Room 61',45,'classroom'),
  ('C-62','Block C - Room 62',45,'classroom'),
  ('C-63','Block C - Room 63 (CS Lab)',40,'lab'),
  ('D-18','Block D - Room 18',45,'classroom'),
  ('D-19','Block D - Room 19',45,'classroom'),
  ('D-20','Block D - Room 20',45,'classroom'),
  ('D-31','Block D - Room 31',50,'classroom')
ON CONFLICT (room_id) DO NOTHING;

-- ── Users  (password = juw@2025) ────────────
-- Hash generated with bcrypt rounds=10 for "juw@2025"
INSERT INTO users (juw_id, password_hash, role, full_name, department_id) VALUES
  ('ASSIST001','$2a$10$W3Zfn9Hn.U69aNWs4yshJuMAgRRFjkYn0Vo1ql7hhzUvK9LNY4cxO','office_assistant','Office Assistant',NULL),
  ('ADMIN001', '$2a$10$W3Zfn9Hn.U69aNWs4yshJuMAgRRFjkYn0Vo1ql7hhzUvK9LNY4cxO','department_admin','CS & SE Dept Admin',1),
  ('T001','$2a$10$W3Zfn9Hn.U69aNWs4yshJuMAgRRFjkYn0Vo1ql7hhzUvK9LNY4cxO','teacher','Ms. Ummay Faseeha',1),
  ('T002','$2a$10$W3Zfn9Hn.U69aNWs4yshJuMAgRRFjkYn0Vo1ql7hhzUvK9LNY4cxO','teacher','Ms. Anum Furqan Akbani',1),
  ('T003','$2a$10$W3Zfn9Hn.U69aNWs4yshJuMAgRRFjkYn0Vo1ql7hhzUvK9LNY4cxO','teacher','Ms. Kanwal Zahoor',2),
  ('T004','$2a$10$W3Zfn9Hn.U69aNWs4yshJuMAgRRFjkYn0Vo1ql7hhzUvK9LNY4cxO','teacher','Ms. Bismah Kulsoom',2),
  ('T005','$2a$10$W3Zfn9Hn.U69aNWs4yshJuMAgRRFjkYn0Vo1ql7hhzUvK9LNY4cxO','teacher','Ms. Ushna Tasleem',2),
  ('T006','$2a$10$W3Zfn9Hn.U69aNWs4yshJuMAgRRFjkYn0Vo1ql7hhzUvK9LNY4cxO','teacher','Ms. Neha',1),
  ('T007','$2a$10$W3Zfn9Hn.U69aNWs4yshJuMAgRRFjkYn0Vo1ql7hhzUvK9LNY4cxO','teacher','Ms. Hafiza Anisa Ahmed',2),
  ('T008','$2a$10$W3Zfn9Hn.U69aNWs4yshJuMAgRRFjkYn0Vo1ql7hhzUvK9LNY4cxO','teacher','Ms. Farah Fatima',1),
  ('T009','$2a$10$W3Zfn9Hn.U69aNWs4yshJuMAgRRFjkYn0Vo1ql7hhzUvK9LNY4cxO','teacher','Ms. Manahil',1),
  ('T010','$2a$10$W3Zfn9Hn.U69aNWs4yshJuMAgRRFjkYn0Vo1ql7hhzUvK9LNY4cxO','teacher','Ms. Namal',1),
  ('T011','$2a$10$W3Zfn9Hn.U69aNWs4yshJuMAgRRFjkYn0Vo1ql7hhzUvK9LNY4cxO','teacher','Ms. Syeda Anum Zamir',1),
  ('T012','$2a$10$W3Zfn9Hn.U69aNWs4yshJuMAgRRFjkYn0Vo1ql7hhzUvK9LNY4cxO','teacher','Ms. Fabiha',1),
  ('T013','$2a$10$W3Zfn9Hn.U69aNWs4yshJuMAgRRFjkYn0Vo1ql7hhzUvK9LNY4cxO','teacher','Ms. Asfa Ahsan',1),
  ('T014','$2a$10$W3Zfn9Hn.U69aNWs4yshJuMAgRRFjkYn0Vo1ql7hhzUvK9LNY4cxO','teacher','Ms. Tehreem Qamar',2),
  ('T015','$2a$10$W3Zfn9Hn.U69aNWs4yshJuMAgRRFjkYn0Vo1ql7hhzUvK9LNY4cxO','teacher','Ms. Mehak Abbas',1),
  ('T016','$2a$10$W3Zfn9Hn.U69aNWs4yshJuMAgRRFjkYn0Vo1ql7hhzUvK9LNY4cxO','teacher','Sir Tarique',1),
  ('T017','$2a$10$W3Zfn9Hn.U69aNWs4yshJuMAgRRFjkYn0Vo1ql7hhzUvK9LNY4cxO','teacher','Ms. Safia Feroz',1),
  ('T018','$2a$10$W3Zfn9Hn.U69aNWs4yshJuMAgRRFjkYn0Vo1ql7hhzUvK9LNY4cxO','teacher','Ms. Ayesha Zulfiqar',1),
  ('T019','$2a$10$W3Zfn9Hn.U69aNWs4yshJuMAgRRFjkYn0Vo1ql7hhzUvK9LNY4cxO','teacher','Ms. Arifa Shamim',1),
  ('T020','$2a$10$W3Zfn9Hn.U69aNWs4yshJuMAgRRFjkYn0Vo1ql7hhzUvK9LNY4cxO','teacher','Ms. Rahila',1),
  ('T021','$2a$10$W3Zfn9Hn.U69aNWs4yshJuMAgRRFjkYn0Vo1ql7hhzUvK9LNY4cxO','teacher','Ms. Samia Ghazala',1),
  ('T022','$2a$10$W3Zfn9Hn.U69aNWs4yshJuMAgRRFjkYn0Vo1ql7hhzUvK9LNY4cxO','teacher','Ms. Saba Mazhar',2),
  ('T023','$2a$10$W3Zfn9Hn.U69aNWs4yshJuMAgRRFjkYn0Vo1ql7hhzUvK9LNY4cxO','teacher','Ms. Nimra',1),
  ('T024','$2a$10$W3Zfn9Hn.U69aNWs4yshJuMAgRRFjkYn0Vo1ql7hhzUvK9LNY4cxO','teacher','Ms. Anum Ilyas',3),
  ('T025','$2a$10$W3Zfn9Hn.U69aNWs4yshJuMAgRRFjkYn0Vo1ql7hhzUvK9LNY4cxO','teacher','Sir Farrukh',1),
  ('T026','$2a$10$W3Zfn9Hn.U69aNWs4yshJuMAgRRFjkYn0Vo1ql7hhzUvK9LNY4cxO','teacher','Prof. Dr. Narmeen Zakaria Bawany',2),
  ('T027','$2a$10$W3Zfn9Hn.U69aNWs4yshJuMAgRRFjkYn0Vo1ql7hhzUvK9LNY4cxO','teacher','Sir Amir Imam',2),
  ('T028','$2a$10$W3Zfn9Hn.U69aNWs4yshJuMAgRRFjkYn0Vo1ql7hhzUvK9LNY4cxO','teacher','Ms. Hira Sultan',2),
  ('T029','$2a$10$W3Zfn9Hn.U69aNWs4yshJuMAgRRFjkYn0Vo1ql7hhzUvK9LNY4cxO','teacher','Ms. Soomaiya Hamid',2),
  ('T030','$2a$10$W3Zfn9Hn.U69aNWs4yshJuMAgRRFjkYn0Vo1ql7hhzUvK9LNY4cxO','teacher','Ms. Surayya Obaid',2),
  ('T031','$2a$10$W3Zfn9Hn.U69aNWs4yshJuMAgRRFjkYn0Vo1ql7hhzUvK9LNY4cxO','teacher','Sir Noman',1),
  ('T032','$2a$10$W3Zfn9Hn.U69aNWs4yshJuMAgRRFjkYn0Vo1ql7hhzUvK9LNY4cxO','teacher','Dr. Hussain Mughal',3),
  ('T033','$2a$10$W3Zfn9Hn.U69aNWs4yshJuMAgRRFjkYn0Vo1ql7hhzUvK9LNY4cxO','teacher','Ms. Mehak',1),
  ('STU001','$2a$10$W3Zfn9Hn.U69aNWs4yshJuMAgRRFjkYn0Vo1ql7hhzUvK9LNY4cxO','student','Demo Student',1)
ON CONFLICT (juw_id) DO NOTHING;

-- ── Teachers ────────────────────────────────
INSERT INTO teachers (user_id, teacher_id, full_name, department_id, specialization) VALUES
  ((SELECT id FROM users WHERE juw_id='T001'),'T001','Ms. Ummay Faseeha',1,'Computer Organization & Assembly Language'),
  ((SELECT id FROM users WHERE juw_id='T002'),'T002','Ms. Anum Furqan Akbani',1,'COAL Lab'),
  ((SELECT id FROM users WHERE juw_id='T003'),'T003','Ms. Kanwal Zahoor',2,'Software Requirement Engineering, Machine Learning'),
  ((SELECT id FROM users WHERE juw_id='T004'),'T004','Ms. Bismah Kulsoom',2,'SRE Lab'),
  ((SELECT id FROM users WHERE juw_id='T005'),'T005','Ms. Ushna Tasleem',2,'Software Design & Architecture, Business Intelligence'),
  ((SELECT id FROM users WHERE juw_id='T006'),'T006','Ms. Neha',1,'Linear Algebra, Multivariable Calculus'),
  ((SELECT id FROM users WHERE juw_id='T007'),'T007','Ms. Hafiza Anisa Ahmed',2,'Object Oriented Programming, Software Construction'),
  ((SELECT id FROM users WHERE juw_id='T008'),'T008','Ms. Farah Fatima',1,'OOP Lab'),
  ((SELECT id FROM users WHERE juw_id='T009'),'T009','Ms. Manahil',1,'Data Structures'),
  ((SELECT id FROM users WHERE juw_id='T010'),'T010','Ms. Namal',1,'Discrete Structures'),
  ((SELECT id FROM users WHERE juw_id='T011'),'T011','Ms. Syeda Anum Zamir',1,'Multivariable Calculus, Mathematics Foundation'),
  ((SELECT id FROM users WHERE juw_id='T012'),'T012','Ms. Fabiha',1,'Applied Physics, COAL'),
  ((SELECT id FROM users WHERE juw_id='T013'),'T013','Ms. Asfa Ahsan',1,'Applied Physics Lab'),
  ((SELECT id FROM users WHERE juw_id='T014'),'T014','Ms. Tehreem Qamar',2,'Object Oriented Programming'),
  ((SELECT id FROM users WHERE juw_id='T015'),'T015','Ms. Mehak Abbas',1,'Data Structures'),
  ((SELECT id FROM users WHERE juw_id='T016'),'T016','Sir Tarique',1,'Data Structures (Theory)'),
  ((SELECT id FROM users WHERE juw_id='T017'),'T017','Ms. Safia Feroz',1,'Theory of Automata, Applied Physics Lab'),
  ((SELECT id FROM users WHERE juw_id='T018'),'T018','Ms. Ayesha Zulfiqar',1,'Theory of Automata'),
  ((SELECT id FROM users WHERE juw_id='T019'),'T019','Ms. Arifa Shamim',1,'Artificial Intelligence'),
  ((SELECT id FROM users WHERE juw_id='T020'),'T020','Ms. Rahila',1,'Linear Algebra'),
  ((SELECT id FROM users WHERE juw_id='T021'),'T021','Ms. Samia Ghazala',1,'Artificial Intelligence'),
  ((SELECT id FROM users WHERE juw_id='T022'),'T022','Ms. Saba Mazhar',2,'Technical & Business Writing, Professional Practices'),
  ((SELECT id FROM users WHERE juw_id='T023'),'T023','Ms. Nimra',1,'AI Lab'),
  ((SELECT id FROM users WHERE juw_id='T024'),'T024','Ms. Anum Ilyas',3,'Introduction to Data Science, Enterprise Web App'),
  ((SELECT id FROM users WHERE juw_id='T025'),'T025','Sir Farrukh',1,'Information Security'),
  ((SELECT id FROM users WHERE juw_id='T026'),'T026','Prof. Dr. Narmeen Zakaria Bawany',2,'Human Computer Interaction'),
  ((SELECT id FROM users WHERE juw_id='T027'),'T027','Sir Amir Imam',2,'Software Quality Engineering'),
  ((SELECT id FROM users WHERE juw_id='T028'),'T028','Ms. Hira Sultan',2,'Web Engineering, SQE Lab'),
  ((SELECT id FROM users WHERE juw_id='T029'),'T029','Ms. Soomaiya Hamid',2,'Computer Networks, Professional Practices'),
  ((SELECT id FROM users WHERE juw_id='T030'),'T030','Ms. Surayya Obaid',2,'Mobile Application Development, Professional Practices'),
  ((SELECT id FROM users WHERE juw_id='T031'),'T031','Sir Noman',1,'Advance Database Management Systems'),
  ((SELECT id FROM users WHERE juw_id='T032'),'T032','Dr. Hussain Mughal',3,'Data Science'),
  ((SELECT id FROM users WHERE juw_id='T033'),'T033','Ms. Mehak',1,'AI Lab')
ON CONFLICT (teacher_id) DO NOTHING;

-- ── Subjects (all from PDF) ─────────────────
INSERT INTO subjects (code,name,short_name,credit_hours,department_id,has_lab,color) VALUES
  ('OOP',      'Object Oriented Programming',              'OOP',         3,1,TRUE, '#3B82F6'),
  ('DS',       'Data Structures',                         'Data.Stru',   3,1,TRUE, '#8B5CF6'),
  ('DISC',     'Discrete Structures',                     'Dis Stru',    3,1,FALSE,'#06B6D4'),
  ('MFC',      'Mathematics Foundation Course (Pre-Calculus II)','M.FC', 3,1,FALSE,'#F59E0B'),
  ('APPHY',    'Applied Physics',                         'App Phy',     3,1,TRUE, '#EF4444'),
  ('FEHMQ',    'Fehm-e-Quran',                            'Fehm-e-Quran',2,1,FALSE,'#22C55E'),
  ('MULTIVC',  'Multivariable Calculus',                  'MVC',         3,1,FALSE,'#F97316'),
  ('COAL',     'Computer Organization & Assembly Language','Coal',        3,1,TRUE, '#4F46E5'),
  ('SRE',      'Software Requirement Engineering',        'SRE',         3,2,TRUE, '#7C3AED'),
  ('SDA',      'Software Design & Architecture',          'SDA',         3,2,TRUE, '#DC2626'),
  ('LA',       'Linear Algebra',                          'LA',          3,1,FALSE,'#059669'),
  ('AUTOMATA', 'Theory of Automata',                      'Automata',    3,1,FALSE,'#D97706'),
  ('AI',       'Artificial Intelligence',                 'AI',          3,1,TRUE, '#6D28D9'),
  ('TBW',      'Technical & Business Writing',            'TBW',         3,1,FALSE,'#92400E'),
  ('INTRODS',  'Introduction to Data Science',            'Intro to DS', 3,3,TRUE, '#065F46'),
  ('ADVSTAT',  'Advanced Statistics',                     'Adv.Stat',    3,3,TRUE, '#1E40AF'),
  ('SOFTCON',  'Software Construction & Development',     'Soft Cons',   3,2,TRUE, '#991B1B'),
  ('SQE',      'Software Quality Engineering',            'SQE',         3,2,TRUE, '#1D4ED8'),
  ('IS',       'Information Security',                    'IS',          3,1,TRUE, '#7F1D1D'),
  ('HCI',      'Human Computer Interaction',              'HCI',         3,2,FALSE,'#BE185D'),
  ('BI',       'Business Intelligence',                   'BI',          3,2,TRUE, '#B45309'),
  ('PP',       'Professional Practices',                  'PP',          3,2,FALSE,'#4D7C0F'),
  ('WEB',      'Web Engineering',                         'Web Eng',     3,1,TRUE, '#C2410C'),
  ('CN',       'Computer Networks',                       'CN',          3,1,TRUE, '#0E7490'),
  ('MA',       'Mobile Application Development',          'MA',          3,2,TRUE, '#6B21A8'),
  ('EWA',      'Enterprise Web App',                      'EWA',         3,2,TRUE, '#9D174D'),
  ('DATASCI',  'Data Science',                            'Data Science',3,3,FALSE,'#047857'),
  ('ADVDMS',   'Advance Database Management Systems',     'Adv.DMS',     3,1,TRUE, '#78350F'),
  ('ML',       'Machine Learning',                        'ML',          3,3,TRUE, '#C2410C'),
  ('ENTRE',    'Entrepreneurship',                        'Entrepreneur',3,2,FALSE,'#374151'),
  ('FYP',      'Final Year Project',                      'FYP',         6,2,FALSE,'#64748B')
ON CONFLICT (code) DO NOTHING;

-- ── Batches (2022-2025 from PDF) ─────────────
INSERT INTO batches (batch_name,major,major_code,year,semester,student_count,department_id) VALUES
  ('BSSE-A-2025','Software Engineering','SE',2025,2,45,2),
  ('BSSE-B-2025','Software Engineering','SE',2025,2,45,2),
  ('BSCS-2025',  'Computer Science',   'CS',2025,2,50,1),
  ('BSDS-2025',  'Data Science',       'DS',2025,2,45,3),
  ('BSSE-A-2024','Software Engineering','SE',2024,2,45,2),
  ('BSSE-B-2024','Software Engineering','SE',2024,2,45,2),
  ('BSCS-2024',  'Computer Science',   'CS',2024,2,50,1),
  ('BSDS-2024',  'Data Science',       'DS',2024,2,45,3),
  ('BSSE-2023',  'Software Engineering','SE',2023,2,45,2),
  ('BSCS-2023',  'Computer Science',   'CS',2023,2,48,1),
  ('BSSE-A-2022','Software Engineering','SE',2022,2,48,2),
  ('BSSE-B-2022','Software Engineering','SE',2022,2,45,2),
  ('BSCS-2022',  'Computer Science',   'CS',2022,2,50,1)
ON CONFLICT (batch_name) DO NOTHING;

-- ── Demo Student ─────────────────────────────
INSERT INTO students (user_id, student_id, full_name, batch_id, department_id)
VALUES (
  (SELECT id FROM users WHERE juw_id='STU001'),
  'STU001',
  'Demo Student',
  (SELECT id FROM batches WHERE batch_name='BSSE-A-2025'),
  (SELECT id FROM departments WHERE code='SE')
) ON CONFLICT (student_id) DO NOTHING;
