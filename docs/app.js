'use strict';

const STORAGE_KEY = 'codemaster.learning.v1';
const QUESTIONS_PER_QUIZ = 5;
const POINTS_PER_CORRECT = 20;
const XP_PER_CORRECT = 10;
const LEVEL_XP = 100;
const COURSES = [
  { id: 1, name: '초급', title: 'C++ 기초', subtitle: '코딩의 첫걸음, 탄탄한 기초부터', topics: '변수 · 자료형 · 조건문 · 반복문 · 연산자', icon: '{ }', color: '' },
  { id: 2, name: '중급', title: 'C++ 활용', subtitle: '개념을 연결하고, 실력을 넓혀요', topics: '배열 · 함수 · 포인터 · 참조자 · 문자열', icon: 'f(x)', color: 'blue' },
  { id: 3, name: '고급', title: '객체지향 C++', subtitle: '객체로 생각하는 개발자로 한 단계 더', topics: '클래스 · 생성자 · 상속 · 캡슐화 · 다형성', icon: '◇', color: 'purple' }
];
let questionBank = [];
let learning = emptyLearning();
let quiz = null;
let currentView = 'home';
let loading = false;
const app = document.getElementById('app');

function emptyLearning() { return { version: 1, totalXP: 0, completedQuizzes: 0, recentResults: [] }; }
function getLevel(xp) { return Math.floor(xp / LEVEL_XP) + 1; }
function isNonnegativeInteger(value) { return Number.isSafeInteger(value) && value >= 0; }
function validateBank(data) {
  if (!Array.isArray(data)) throw new Error('문제은행 형식이 올바르지 않습니다.');
  const ids = new Set();
  for (const q of data) {
    if (!q || !Number.isSafeInteger(q.id) || q.id <= 0 || ids.has(q.id) ||
        ![1, 2, 3].includes(q.difficulty) ||
        !['category', 'text', 'explanation'].every(key => typeof q[key] === 'string' && q[key].trim()) ||
        !Array.isArray(q.choices) || q.choices.length !== 4 ||
        !q.choices.every(choice => typeof choice === 'string' && choice.trim()) ||
        !Number.isInteger(q.correctAnswer) || q.correctAnswer < 1 || q.correctAnswer > 4) {
      throw new Error('문제 데이터, 보기 또는 ID를 확인해 주세요.');
    }
    ids.add(q.id);
  }
  for (const course of COURSES) {
    if (data.filter(q => q.difficulty === course.id).length !== 10) {
      throw new Error(`${course.name} 문제은행에는 정확히 10문제가 필요합니다.`);
    }
  }
  return data;
}
function selectQuestions(bank, difficulty, random = Math.random) {
  if (![1, 2, 3].includes(difficulty)) throw new Error('유효한 난이도를 선택해 주세요.');
  const candidates = bank.filter(q => q.difficulty === difficulty);
  if (candidates.length < QUESTIONS_PER_QUIZ) throw new Error('출제할 문제가 부족합니다.');
  // Fisher–Yates: 원본을 수정하지 않고 복사한 후보를 섞습니다.
  for (let i = candidates.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
  }
  return candidates.slice(0, QUESTIONS_PER_QUIZ);
}
function calculateResult(questions, answers) {
  if (questions.length !== QUESTIONS_PER_QUIZ || answers.length !== questions.length ||
      !answers.every(a => Number.isInteger(a) && a >= 1 && a <= 4)) throw new Error('답안이 완성되지 않았습니다.');
  const correct = questions.filter((q, i) => q.correctAnswer === answers[i]).length;
  return { correct, wrong: questions.length - correct, score: correct * POINTS_PER_CORRECT,
    accuracy: correct / questions.length * 100, xp: correct * XP_PER_CORRECT };
}
function validateLearning(value) {
  if (!value || value.version !== 1 || !isNonnegativeInteger(value.totalXP) || value.totalXP % 10 ||
      !isNonnegativeInteger(value.completedQuizzes) || value.totalXP > value.completedQuizzes * 50 ||
      !Array.isArray(value.recentResults) || value.recentResults.length !== Math.min(value.completedQuizzes, 20)) return false;
  let recentXP = 0;
  for (const result of value.recentResults) {
    if (!result || ![1, 2, 3].includes(result.difficulty) || typeof result.date !== 'string' ||
        !Number.isFinite(Date.parse(result.date)) || !Array.isArray(result.questionIds) ||
        result.questionIds.length !== 5 || new Set(result.questionIds).size !== 5 || !Array.isArray(result.answers)) return false;
    const questions = result.questionIds.map(id => questionBank.find(q => q.id === id && q.difficulty === result.difficulty));
    if (questions.some(q => !q)) return false;
    try {
      const expected = calculateResult(questions, result.answers);
      if (!Object.keys(expected).every(key => result[key] === expected[key])) return false;
      recentXP += expected.xp;
    } catch { return false; }
  }
  return value.totalXP >= recentXP && (value.completedQuizzes > 20 || value.totalXP === recentXP);
}
function showNotice(message) {
  const notice = document.getElementById('notice');
  notice.textContent = message;
  notice.hidden = !message;
}
function readLearning() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyLearning();
    const data = JSON.parse(raw);
    if (!validateLearning(data)) throw new Error('invalid record');
    return data;
  } catch {
    showNotice('학습 기록을 읽을 수 없거나 기록이 손상되어 초기 상태로 시작합니다. 저장이 차단된 브라우저에서는 새로고침 후 기록이 유지되지 않습니다.');
    const initial = emptyLearning();
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(initial)); } catch { /* 메모리에서 계속 학습 */ }
    return initial;
  }
}
function persistLearning() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(learning)); }
  catch { showNotice('브라우저 저장 공간을 사용할 수 없습니다. 이번 결과는 현재 화면에서 확인할 수 있지만 새로고침하면 사라질 수 있습니다.'); }
}
// 문제·보기·해설·저장 데이터는 textContent로만 삽입합니다.
function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}
function button(text, className, action) {
  const node = element('button', className, text);
  node.type = 'button'; node.addEventListener('click', action); return node;
}
function progress(value, label) {
  const bar = element('div', 'progress');
  bar.setAttribute('role', 'progressbar'); bar.setAttribute('aria-label', label);
  bar.setAttribute('aria-valuemin', '0'); bar.setAttribute('aria-valuemax', '100');
  bar.setAttribute('aria-valuenow', String(value));
  const fill = element('span'); fill.style.width = `${value}%`; bar.append(fill); return bar;
}
function refreshHeader() { document.getElementById('header-xp').textContent = learning.totalXP.toLocaleString('ko-KR'); }
function setView(view, title) {
  currentView = view; app.replaceChildren(); app.setAttribute('aria-busy', 'false');
  document.getElementById('breadcrumb').textContent = `나의 학습 / ${title}`;
  document.querySelectorAll('.nav').forEach(node => {
    const active = node.dataset.view === view;
    node.classList.toggle('active', active);
    if (active) node.setAttribute('aria-current', 'page'); else node.removeAttribute('aria-current');
  });
  document.title = `${title} · CodeMaster`; refreshHeader();
  window.scrollTo({ top: 0, behavior: 'instant' });
  document.getElementById('main').focus({ preventScroll: true });
}
function intro(title, subtitle, badge) {
  const row = element('div', 'intro'); const copy = element('div');
  copy.append(element('h1', '', title), element('p', '', subtitle)); row.append(copy);
  if (badge) row.append(element('span', 'small-badge', badge)); return row;
}
function heading(title, note) {
  const row = element('div', 'section-heading'); row.append(element('h2', '', title));
  if (note) row.append(element('span', '', note)); return row;
}
function courseCards() {
  const grid = element('div', 'courses');
  COURSES.forEach(course => {
    const card = element('article', `course ${course.color}`);
    const top = element('div', 'course-top');
    top.append(element('span', 'level-tag', course.name), element('div', 'course-icon', course.icon),
      element('h3', '', course.title), element('p', '', course.subtitle));
    const body = element('div', 'course-body');
    body.append(element('div', 'topics', course.topics), element('div', 'course-meta', '▤ 10개 문제은행　 ·　 매회 5문제'),
      button(`${course.name} 학습 시작　 →`, '', () => startQuiz(course.id)));
    card.append(top, body); grid.append(card);
  }); return grid;
}
function renderHome() {
  setView('home', '대시보드');
  app.append(intro('오늘도 한 걸음, 성장해 볼까요?', '한 번에 다섯 문제. 작은 성공으로 C++ 실력을 쌓아가세요.', '나만의 학습 여정'));
  const hero = element('section', 'hero');
  const copy = element('div', 'hero-copy');
  copy.append(element('span', 'eyebrow', 'BUILD YOUR NEXT LEVEL'), element('h2', '', '코드를 이해하는 즐거움,\n한 문제부터 시작해요.'),
    element('p', '', '기초 문법부터 객체지향까지, 나의 속도로 차근차근.'), button('학습 시작하기　 →', 'primary', renderCourses));
  copy.querySelector('h2').style.whiteSpace = 'pre-line';
  const art = element('div', 'hero-art'); art.setAttribute('aria-hidden', 'true');
  art.append(element('div', 'orb'), element('div', 'code-tile', '</>'), element('span', 'spark', '✦'), element('span', 'floating', '✓ 한 문제씩 성장 중'));
  hero.append(copy, art); app.append(hero);
  const stats = element('section', 'stats'); stats.setAttribute('aria-label', '학습 현황');
  const values = [['⌁', '나의 레벨', `Lv. ${getLevel(learning.totalXP)}`, ''], ['✦', '누적 경험치', `${learning.totalXP}`, 'XP'], ['✓', '완료한 퀴즈', `${learning.completedQuizzes}`, '회']];
  values.forEach(([icon, label, value, unit], i) => {
    const stat = element('div', 'stat'); const content = element('div', 'stat-content'); const strong = element('strong', '', value);
    if (unit) strong.append(element('span', '', unit)); content.append(element('small', '', label), strong);
    if (i === 0) {
      content.append(progress(learning.totalXP % 100, '다음 레벨 진행도'));
      const caption = element('div', 'level-caption'); caption.append(element('span', '', `다음 레벨까지 ${100 - learning.totalXP % 100}XP`), element('span', '', `${learning.totalXP % 100}/100`)); content.append(caption);
    }
    stat.append(element('span', 'stat-icon', icon), content); stats.append(stat);
  }); app.append(stats, heading('나에게 맞는 학습 코스', '모든 난이도를 자유롭게 선택하세요'), courseCards());
  const guide = element('section', 'guide-strip'); const guideCopy = element('div');
  guideCopy.append(element('strong', '', '처음 오셨나요? 이렇게 학습해 보세요.'), element('p', '', '난이도 선택 → 5문제 도전 → 해설 확인 → 오답 복습'));
  guide.append(element('span', 'guide-icon', 'ⓘ'), guideCopy, button('학습 방법 보기　 →', 'secondary', renderGuide)); app.append(guide);
}
function renderCourses() {
  setView('courses', '학습 코스'); app.append(intro('어디서부터 시작할까요?', '난이도별 10문제 중 무작위 5문제에 도전하세요. 잠긴 코스는 없어요.'), courseCards(),
    element('p', 'hint', '정답마다 20점 · 10XP | C++17 기준, 필요한 표준 헤더는 포함되어 있다고 가정합니다.'));
}
function startQuiz(difficulty) {
  try {
    quiz = { difficulty, questions: selectQuestions(questionBank, difficulty), answers: [], index: 0, selected: null, submitted: false, completed: false };
    renderQuestion();
  } catch (error) { showNotice(error.message); }
}
function questionContent(question, container, titleTag = 'h2') {
  const newline = question.text.indexOf('\n');
  container.append(element(titleTag, 'question-title', newline < 0 ? question.text : question.text.slice(0, newline)));
  if (newline >= 0) {
    const pre = element('pre', 'code-block'); pre.append(element('code', '', question.text.slice(newline + 1)));
    container.append(pre);
  }
}
function renderQuestion() {
  setView('quiz', '문제 풀이');
  const q = quiz.questions[quiz.index]; const course = COURSES[quiz.difficulty - 1];
  const wrap = element('div', 'quiz-wrap'); const head = element('div', 'quiz-header');
  head.append(element('h1', '', `${course.name} · ${course.title}`), button('학습 나가기', 'secondary', () => navigate('home')));
  const track = element('div', 'quiz-track'); track.append(progress(quiz.answers.length / 5 * 100, '퀴즈 진행도'), element('span', '', `${quiz.index + 1} / 5`));
  const panel = element('section', 'panel'); panel.dataset.questionId = q.id;
  const meta = element('div', 'question-meta'); meta.append(element('span', 'tag', q.category), element('span', '', `QUESTION ${String(quiz.index + 1).padStart(2, '0')} · ID ${q.id}`));
  panel.append(meta); questionContent(q, panel);
  panel.append(element('p', 'code-caption', 'C++17 기준 · 필요한 표준 헤더는 포함되어 있다고 가정합니다.'));
  const choices = element('div', 'choices'); choices.setAttribute('role', 'group'); choices.setAttribute('aria-label', '정답 보기');
  const submit = button('정답 제출하기', 'primary', submitAnswer); submit.id = 'submit-answer'; submit.disabled = true;
  q.choices.forEach((choice, index) => {
    const answer = index + 1; // 데이터의 정답 번호는 1~4. 배열 접근 때에만 -1.
    const option = button('', 'choice', () => {
      if (quiz.submitted) return;
      quiz.selected = answer;
      choices.querySelectorAll('button').forEach(node => {
        const selected = Number(node.dataset.answer) === answer;
        node.classList.toggle('selected', selected); node.setAttribute('aria-pressed', String(selected));
      }); submit.disabled = false;
    });
    option.dataset.answer = answer; option.setAttribute('aria-pressed', 'false');
    option.append(element('span', 'choice-number', answer), element('span', 'choice-text', choice)); choices.append(option);
  });
  const feedback = element('div'); feedback.id = 'feedback'; feedback.setAttribute('role', 'status'); feedback.setAttribute('aria-live', 'polite');
  const actions = element('div', 'quiz-actions'); actions.id = 'quiz-actions';
  actions.append(element('small', '', '보기 하나를 선택한 뒤 제출해 주세요.'), submit);
  panel.append(choices, feedback, actions); wrap.append(head, track, panel, element('p', 'hint', '완료한 퀴즈의 XP와 학습 기록만 이 브라우저에 저장됩니다.')); app.append(wrap);
}
function submitAnswer() {
  if (!quiz || quiz.submitted || !Number.isInteger(quiz.selected) || quiz.selected < 1 || quiz.selected > 4) return;
  quiz.submitted = true; quiz.answers.push(quiz.selected);
  const q = quiz.questions[quiz.index]; const correct = quiz.selected === q.correctAnswer;
  app.querySelectorAll('.choice').forEach(option => {
    option.disabled = true;
    const answer = Number(option.dataset.answer);
    if (answer === q.correctAnswer) option.classList.add('correct');
    else if (answer === quiz.selected) option.classList.add('wrong');
  });
  const feedback = document.getElementById('feedback'); feedback.className = `feedback${correct ? '' : ' wrong'}`;
  feedback.append(element('h3', '', correct ? '✓ 정답이에요! +20점 · +10XP' : '다시 알아가는 기회예요!'));
  if (!correct) feedback.append(element('p', '', `내 답: ${quiz.selected}. ${q.choices[quiz.selected - 1]}\n정답: ${q.correctAnswer}. ${q.choices[q.correctAnswer - 1]}`));
  feedback.append(element('p', '', q.explanation));
  const actions = document.getElementById('quiz-actions');
  const next = button(quiz.index === 4 ? '학습 결과 보기　 →' : '다음 문제　 →', 'primary', nextQuestion);
  actions.replaceChildren(element('small', '', `이번 퀴즈 획득 XP: ${quiz.questions.slice(0, quiz.answers.length).filter((question, i) => question.correctAnswer === quiz.answers[i]).length * 10}XP`), next);
  const bar = app.querySelector('[aria-label="퀴즈 진행도"]'); bar.setAttribute('aria-valuenow', String(quiz.answers.length * 20)); bar.firstChild.style.width = `${quiz.answers.length * 20}%`;
  if (quiz.answers.length === 5) completeQuiz();
  next.focus({ preventScroll: true }); feedback.scrollIntoView({ block: 'nearest', behavior: 'instant' });
}
function nextQuestion() {
  if (!quiz || !quiz.submitted) return;
  if (quiz.index === 4) { renderResult(); return; }
  quiz.index++; quiz.selected = null; quiz.submitted = false; renderQuestion();
}
function completeQuiz() {
  if (quiz.completed) return;
  const result = { ...calculateResult(quiz.questions, quiz.answers), difficulty: quiz.difficulty,
    date: new Date().toISOString(), questionIds: quiz.questions.map(q => q.id), answers: [...quiz.answers] };
  // 다른 탭이 먼저 완료한 기록이 있다면 가능한 최신 기록에 추가합니다.
  try { const saved = JSON.parse(localStorage.getItem(STORAGE_KEY)); if (validateLearning(saved)) learning = saved; } catch { /* 기존 메모리 기록 사용 */ }
  quiz.completed = true; quiz.result = result;
  learning.totalXP += result.xp; learning.completedQuizzes++;
  learning.recentResults.unshift(result); learning.recentResults = learning.recentResults.slice(0, 20);
  persistLearning(); refreshHeader();
}
function reviewItems(result) {
  const section = element('section'); const wrongQuestions = result.questionIds.map(id => questionBank.find(q => q.id === id)).filter((q, i) => q.correctAnswer !== result.answers[i]);
  section.append(heading('틀린 문제 다시 보기', `${result.wrong}문제 · 해설로 확실하게`));
  if (!wrongQuestions.length) section.append(element('div', 'panel empty', '모두 정답이에요! 이번 퀴즈에는 복습할 오답이 없습니다.'));
  result.questionIds.forEach((id, i) => {
    const q = questionBank.find(item => item.id === id); if (q.correctAnswer === result.answers[i]) return;
    const details = element('details', 'review'); details.open = true;
    details.append(element('summary', '', `${i + 1}번 · ${q.category} · ID ${q.id}`)); questionContent(q, details, 'h3');
    details.append(element('p', 'answer-wrong', `내 답: ${result.answers[i]}. ${q.choices[result.answers[i] - 1]}`),
      element('p', 'answer-correct', `정답: ${q.correctAnswer}. ${q.choices[q.correctAnswer - 1]}`), element('p', '', q.explanation)); section.append(details);
  }); return section;
}
function renderResult(result = quiz?.result) {
  if (!result) return renderHome();
  setView('result', '학습 결과');
  const wrap = element('div', 'quiz-wrap'); const panel = element('section', 'panel'); const hero = element('div', 'result-hero');
  hero.append(element('div', 'medal', '✓'), element('span', 'eyebrow', 'LESSON COMPLETE'), element('h1', '', '오늘의 도전, 완료했어요!'), element('p', '', `${COURSES[result.difficulty - 1].name} · 다섯 문제만큼 더 성장한 나`));
  const score = element('div', 'score', result.score); score.append(element('small', '', ' / 100점')); hero.append(score);
  const stats = element('div', 'result-stats');
  [['정답', `${result.correct}개`], ['오답', `${result.wrong}개`], ['정답률', `${result.accuracy}%`], ['이번 획득 XP', `+${result.xp}XP`]].forEach(([label, value]) => {
    const stat = element('div', 'result-stat'); stat.append(element('strong', '', value), element('small', '', label)); stats.append(stat);
  });
  const actions = element('div', 'result-actions'); actions.append(button('다시 도전하기　 →', 'primary', () => startQuiz(result.difficulty)), button('메인으로 돌아가기', 'secondary', () => { quiz = null; renderHome(); }));
  panel.append(hero, stats, progress(learning.totalXP % 100, '다음 레벨 진행도'), element('p', 'hint', `누적 ${learning.totalXP}XP · 현재 Lv. ${getLevel(learning.totalXP)} · 다음 레벨까지 ${100 - learning.totalXP % 100}XP`), actions);
  wrap.append(panel, reviewItems(result)); app.append(wrap);
}
function renderHistory() {
  setView('history', '학습 기록'); app.append(intro('차곡차곡 쌓인 나의 성장', `완료한 퀴즈 ${learning.completedQuizzes}회 · 누적 ${learning.totalXP}XP · 최근 20회까지 상세 기록을 보관해요.`));
  const panel = element('section', 'panel');
  if (!learning.recentResults.length) panel.append(element('p', 'empty', '아직 완료한 퀴즈가 없어요. 첫 번째 도전을 시작해 보세요.'), button('학습 시작하기', 'primary', renderCourses));
  learning.recentResults.forEach(result => {
    const row = element('article', 'history-item'); const copy = element('div');
    copy.append(element('strong', '', `${COURSES[result.difficulty - 1].name} · ${COURSES[result.difficulty - 1].title}`), element('small', '', new Date(result.date).toLocaleString('ko-KR')));
    const scores = element('div', 'history-score'); scores.append(element('strong', '', `${result.score}점 · +${result.xp}XP`), button('결과·오답 보기', 'secondary', () => renderResult(result)));
    row.append(copy, scores); panel.append(row);
  }); app.append(panel, element('p', 'hint', '기록은 현재 브라우저에만 저장됩니다. 사이트 데이터 삭제 시 기록도 삭제됩니다.'));
}
function renderGuide() {
  setView('guide', '학습 가이드'); app.append(intro('작은 도전을, 확실한 실력으로', '처음이라도 괜찮아요. 아래 네 단계로 시작해 보세요.'));
  const steps = element('div', 'steps');
  [['나에게 맞는 코스 고르기', '초급·중급·고급 중 자유롭게 선택하세요. 각 난이도의 10문제 중 중복 없이 5문제가 나옵니다.'],
    ['보기 선택 후 정답 제출', '정답이라고 생각하는 보기 하나를 선택하고 제출하세요. 제출 전에는 변경할 수 있고, 제출 후에는 답이 확정됩니다.'],
    ['해설을 읽고 다음 문제로', '정답은 20점과 10XP, 오답은 0점과 0XP입니다. 코드와 해설을 비교하며 이해한 뒤 다음 문제로 이동하세요.'],
    ['결과 확인하고 오답 복습하기', '5문제 제출을 완료하면 기록과 XP가 저장됩니다. 100XP마다 레벨이 1 올라갑니다. 학습 기록에서 최근 결과와 오답을 다시 확인할 수 있어요.']].forEach(([title, text]) => {
      const step = element('article', 'step'); const copy = element('div'); copy.append(element('h3', '', title), element('p', '', text)); step.append(copy); steps.append(step);
    });
  app.append(steps, element('p', 'hint', '미완료 퀴즈는 저장되지 않습니다. 모든 문제는 C++17 기준이며 필요한 표준 헤더가 포함되어 있다고 가정합니다.'), button('학습 코스 고르기　 →', 'primary', renderCourses));
}
async function navigate(view) {
  if (loading || !questionBank.length) return;
  if (quiz && !quiz.completed && currentView === 'quiz') {
    const leave = await confirmExit(); if (!leave) return;
  }
  quiz = null;
  ({ home: renderHome, courses: renderCourses, history: renderHistory, guide: renderGuide }[view] || renderHome)();
}
function confirmExit() {
  return new Promise(resolve => {
    const existing = document.querySelector('.exit-dialog'); if (existing) { resolve(false); return; }
    const dialog = element('dialog', 'exit-dialog');
    dialog.append(element('h2', '', '학습을 잠시 멈출까요?'), element('p', '', '아직 완료하지 않은 퀴즈의 답안과 XP는 저장되지 않습니다.'));
    const form = element('form'); form.method = 'dialog';
    const stay = element('button', 'primary', '계속 학습'); stay.value = 'stay';
    const leave = element('button', 'secondary', '나가기'); leave.value = 'leave'; form.append(stay, leave); dialog.append(form);
    dialog.addEventListener('close', () => { const accepted = dialog.returnValue === 'leave'; dialog.remove(); resolve(accepted); }, { once: true });
    document.body.append(dialog); dialog.showModal(); stay.focus();
  });
}
async function loadQuestionBank() {
  if (loading) return;
  loading = true; app.setAttribute('aria-busy', 'true');
  try {
    const response = await fetch('./data/questions.json', { cache: 'no-cache' });
    if (!response.ok) throw new Error(`문제은행 응답 오류 (${response.status})`);
    questionBank = validateBank(await response.json()); learning = readLearning(); renderHome();
  } catch (error) {
    app.replaceChildren(); app.setAttribute('aria-busy', 'false');
    const panel = element('section', 'panel error'); panel.setAttribute('role', 'alert');
    panel.append(element('h1', '', '문제은행을 불러오지 못했어요'), element('p', '', `${error.message}\n인터넷 연결과 data/questions.json 파일을 확인해 주세요. 파일을 더블 클릭했다면 README의 로컬 HTTP 실행 방법을 사용해 주세요.`), button('다시 불러오기', 'primary', loadQuestionBank)); app.append(panel);
  } finally { loading = false; }
}
document.querySelectorAll('[data-view]').forEach(node => node.addEventListener('click', () => navigate(node.dataset.view)));
document.querySelector('.brand').addEventListener('click', event => { event.preventDefault(); navigate('home'); });
window.addEventListener('beforeunload', event => { if (quiz && !quiz.completed) { event.preventDefault(); event.returnValue = ''; } });
loadQuestionBank();
