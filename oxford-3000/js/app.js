const WORDS_KEY = 'oxford-flashcard-progress';
const DONTKNOW_KEY = 'oxford-dontknow';
const THEME_KEY = 'oxford-theme';
const MUTE_KEY = 'oxford-mute';

let muted = false;

let words = [];
let currentIndex = 0;
let knownWords = new Set();
let dontKnowWords = [];

let audioKnow, audioWrong, audioFlip;

function loadProgress() {
  try {
    const saved = localStorage.getItem(WORDS_KEY);
    if (saved) knownWords = new Set(JSON.parse(saved));
  } catch {}
  try {
    const saved = localStorage.getItem(DONTKNOW_KEY);
    if (saved) dontKnowWords = JSON.parse(saved);
  } catch {}
  muted = localStorage.getItem(MUTE_KEY) === 'true';
}

function saveProgress() {
  localStorage.setItem(WORDS_KEY, JSON.stringify([...knownWords]));
}

function saveDontKnow() {
  localStorage.setItem(DONTKNOW_KEY, JSON.stringify(dontKnowWords));
}

function loadTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  if (saved) {
    if (saved === 'dark') {
      document.body.classList.add('dark-mode');
      document.querySelector('#themeBtn i').className = 'fa-regular fa-sun';
    }
    return;
  }
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  if (prefersDark) {
    document.body.classList.add('dark-mode');
    document.querySelector('#themeBtn i').className = 'fa-regular fa-sun';
  }
}

function toggleTheme() {
  const isDark = document.body.classList.toggle('dark-mode');
  const i = document.querySelector('#themeBtn i');
  i.className = isDark ? 'fa-regular fa-sun' : 'fa-regular fa-moon';
  localStorage.setItem(THEME_KEY, isDark ? 'dark' : 'light');
}

function getFilteredWords() {
  const level = document.getElementById('levelSelect').value;
  return level === 'all' ? [...words] : words.filter(w => w.level === level);
}

function getUnseenWords(pool) {
  return pool.filter(w => !knownWords.has(w.word));
}

// --- API-based sentence generation ---

const _sentCache = {}
const _transCache = {}

async function _fetchDictExample(word) {
  if (word in _sentCache) return _sentCache[word]
  try {
    const r = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`)
    if (!r.ok) { _sentCache[word] = null; return null }
    const data = await r.json()
    if (!data?.[0]) { _sentCache[word] = null; return null }
    for (const m of data[0].meanings || []) {
      for (const d of m.definitions || []) {
        if (d.example) {
          _sentCache[word] = d.example
          return d.example
        }
      }
    }
  } catch {}
  _sentCache[word] = null
  return null
}

async function _translate(text) {
  const key = text.slice(0, 100)
  if (_transCache[key]) return _transCache[key]
  try {
    const r = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text.slice(0, 500))}&langpair=en|th`)
    if (!r.ok) return null
    const d = await r.json()
    const t = d.responseData?.translatedText
    if (t) _transCache[key] = t
    return t || null
  } catch { return null }
}

let _reqId = 0

async function _fetchBetterExample(word, thai) {
  const id = ++_reqId
  const en = await _fetchDictExample(word)
  if (!en || id !== _reqId) return
  let th = thai
  const t = await _translate(en)
  if (id !== _reqId) return
  if (t) th = t
  const exEl = document.getElementById('exampleDisplay')
  const thExEl = document.getElementById('thaiExampleDisplay')
  if (exEl && exEl.textContent !== en) exEl.textContent = en
  if (thExEl && thExEl.textContent !== th) thExEl.textContent = th
}

function inferPos(word, definition) {
  const d = definition.trim()
  const w = word.trim()
  if (/^to\s/i.test(d)) return 'verb'
  if (/ly$/.test(w)) return 'adverb'
  if (/^(a|an|the)\s/i.test(d)) return 'noun'
  if (/\b(full of|of or relating to|having the quality|capable of being|feeling or showing|of or relating)\b/i.test(d)) return 'adjective'
  if (/^abbreviation\b/i.test(d)) return 'abbreviation'
  if (/^used (before|after|to|for|as|in)\b/i.test(d)) return 'function'
  if (/\b(quality|state|condition|feeling|act|process|practice|belief)\b/i.test(d) && !/^to\s/i.test(d)) return 'noun'
  return 'unknown'
}

function aOrAn(word) {
  return /^[aeiou]/i.test(word) ? 'an' : 'a'
}

function capFirst(word) {
  return word.charAt(0).toUpperCase() + word.slice(1)
}

function generateExample(word, thai, definition) {
  const pos = inferPos(word, definition)
  const cap = capFirst(word)
  const art = aOrAn(word)

  const patterns = {
    verb: {
      en: [
        `You should ${word} more often.`,
        `She learned how to ${word} yesterday.`,
        `They want to ${word} every day.`,
        `Can you ${word} for me?`,
        `He decided to ${word} last week.`,
        `We need to ${word} carefully.`,
        `I try to ${word} every morning.`,
        `The team will ${word} tomorrow.`,
        `She ${word}s better than anyone else.`,
        `Did you ${word} yet?`,
        `He is learning to ${word} this year.`,
        `They plan to ${word} next month.`,
      ],
      th: [
        `คุณควร${thai}บ่อยขึ้น`,
        `เธอเรียนรู้วิธี${thai}เมื่อวานนี้`,
        `พวกเขาอยาก${thai}ทุกวัน`,
        `คุณ${thai}ให้ฉันหน่อยได้ไหม`,
        `เขาตัดสินใจ${thai}เมื่อสัปดาห์ที่แล้ว`,
        `เราต้อง${thai}อย่างระมัดระวัง`,
        `ฉันพยายาม${thai}ทุกเช้า`,
        `ทีมจะ${thai}พรุ่งนี้`,
        `เธอ${thai}เก่งกว่าคนอื่น`,
        `คุณ${thai}หรือยัง`,
        `ปีนี้เขาเรียนที่จะ${thai}`,
        `พวกเขาวางแผนที่จะ${thai}เดือนหน้า`,
      ],
    },
    noun: {
      en: [
        `This is an important ${word}.`,
        `She bought a new ${word} yesterday.`,
        `I have ${aOrAn(word)} ${word} at home.`,
        `The ${word} looks very nice.`,
        `We need a better ${word}.`,
        `He showed me the ${word}.`,
        `That ${word} is very useful.`,
        `Do you have ${aOrAn(word)} ${word}?`,
        `The ${word} is on the table.`,
        `I need a ${word} right now.`,
        `Where did you put the ${word}?`,
        `There is a ${word} in the room.`,
      ],
      th: [
        `นี่คือ${thai}ที่สำคัญ`,
        `เธอซื้อ${thai}ใหม่เมื่อวานนี้`,
        `ฉันมี${thai}อยู่ที่บ้าน`,
        `${thai}ดูดีมาก`,
        `เราต้องการ${thai}ที่ดีกว่านี้`,
        `เขาให้ฉันดู${thai}`,
        `${thai}นั้นมีประโยชน์มาก`,
        `คุณมี${thai}ไหม`,
        `${thai}อยู่บนโต๊ะ`,
        `ตอนนี้ฉันต้องการ${thai}`,
        `คุณวาง${thai}ไว้ที่ไหน`,
        `มี${thai}อยู่ในห้อง`,
      ],
    },
    adjective: {
      en: [
        `She is very ${word}.`,
        `That's a ${word} idea.`,
        `The view is absolutely ${word}.`,
        `He seems ${word} today.`,
        `It was a ${word} experience.`,
        `They live in a ${word} neighborhood.`,
        `This is ${word} than I expected.`,
        `I feel ${word} about the result.`,
        `The weather is ${word} today.`,
      ],
      th: [
        `เธอ${thai}มาก`,
        `นั่นเป็นความคิดที่${thai}`,
        `วิว${thai}อย่างเหลือเชื่อ`,
        `วันนี้เขาดู${thai}`,
        `มันเป็นประสบการณ์ที่${thai}`,
        `พวกเขาอยู่ในละแวกที่${thai}`,
        `นี่${thai}กว่าที่ฉันคาดไว้`,
        `ฉันรู้สึก${thai}เกี่ยวกับผลลัพธ์`,
        `วันนี้อากาศ${thai}`,
      ],
    },
    adverb: {
      en: [
        `She spoke ${word} to the audience.`,
        `He ${word} finished his work.`,
        `They ${word} agreed with the plan.`,
        `She ${word} walked into the room.`,
        `He ${word} answered the question.`,
        `They ${word} completed the project.`,
        `Please drive ${word}.`,
        `She ${word} opened the door.`,
        `He ${word} explained the problem.`,
      ],
      th: [
        `เธอพูด${thai}กับผู้ฟัง`,
        `เขา${thai}ทำงานเสร็จ`,
        `พวกเขา${thai}เห็นด้วยกับแผน`,
        `เธอ${thai}เดินเข้าไปในห้อง`,
        `เขา${thai}ตอบคำถาม`,
        `พวกเขา${thai}ทำโครงการเสร็จ`,
        `กรุณาขับรถ${thai}`,
        `เธอ${thai}เปิดประตู`,
        `เขา${thai}อธิบายปัญหา`,
      ],
    },
    function: {
      en: [
        `"${cap}" is a very common word in English.`,
        `Do you know how to use "${word}"?`,
        `Please use "${word}" in a sentence.`,
        `"${word}" can connect ideas in a sentence.`,
        `Understanding "${word}" helps with fluency.`,
      ],
      th: [
        `"${cap}" เป็นคำที่พบบ่อยมากในภาษาอังกฤษ`,
        `คุณรู้วิธีใช้ "${word}" ไหม`,
        `กรุณาใช้ "${word}" ในประโยค`,
        `"${word}" สามารถเชื่อมโยงความคิดในประโยคได้`,
        `การเข้าใจ "${word}" ช่วยให้คล่องขึ้น`,
      ],
    },
    abbreviation: {
      en: [
        `"${cap}" is short for something.`,
        `You can find "${word}" in a dictionary entry.`,
        `"${word}" is commonly used in writing.`,
      ],
      th: [
        `"${word}" เป็นคำย่อของบางสิ่ง`,
        `คุณสามารถหา "${word}" ได้ในพจนานุกรม`,
        `"${word}" ใช้บ่อยในการเขียน`,
      ],
    },
    unknown: {
      en: [
        `"${cap}" is a useful word to know.`,
        `Today we will learn about "${word}".`,
        `"${word}" is a common English word.`,
        `Please study the word "${word}".`,
        `${cap} appears in many everyday situations.`,
        `Do you understand the word "${word}"?`,
      ],
      th: [
        `"${cap}" เป็นคำที่มีประโยชน์`,
        `วันนี้เราจะเรียนรู้เกี่ยวกับ "${word}"`,
        `"${word}" เป็นคำศัพท์ภาษาอังกฤษที่พบบ่อย`,
        `กรุณาศึกษาคำว่า "${word}"`,
        `${cap} ปรากฏในสถานการณ์ประจำวันมากมาย`,
        `คุณเข้าใจคำว่า "${word}" ไหม`,
      ],
    },
  }

  const pool = patterns[pos] || patterns.unknown
  const idx = Math.floor(Math.random() * pool.en.length)
  return { en: pool.en[idx], th: pool.th[idx] }
}

function renderCard() {
  const pool = getFilteredWords();
  const unseen = getUnseenWords(pool);
  const hasWords = pool.length > 0;
  const wrapper = document.querySelector('.card-wrapper');

  const total = pool.length;
  const seen = pool.length - unseen.length;
  document.getElementById('cardCount').textContent = `${unseen.length} / ${total}`;
  document.getElementById('knownCount').textContent = seen;
  document.getElementById('sideCardCount').textContent = `${unseen.length} / ${total}`;
  document.getElementById('sideKnownCount').textContent = seen;

  if (!hasWords) {
    wrapper.classList.remove('has-words');
    document.getElementById('emptyState').style.display = 'block';
    return;
  }

  wrapper.classList.add('has-words');
  document.getElementById('emptyState').style.display = 'none';

  const card = document.getElementById('flashCard');
  card.classList.remove('flipped');

  if (unseen.length === 0) {
    document.getElementById('wordDisplay').textContent = 'All done!';
    document.getElementById('definitionDisplay').textContent =
      'Great job! Reset progress or change the level to continue.';
    document.getElementById('thaiDisplay').textContent = '';
    document.getElementById('posFrontDisplay').textContent = '';
    document.getElementById('exampleDisplay').textContent = '';
    document.getElementById('thaiExampleDisplay').textContent = '';
    document.getElementById('cardLevel').textContent = '';
    document.getElementById('cardLevel').style.display = 'none';
    document.getElementById('knowBtn').disabled = true;
    document.getElementById('dontKnowBtn').disabled = true;
    return;
  }

  const w = unseen[0]
  document.getElementById('wordDisplay').textContent = w.word;
  document.getElementById('definitionDisplay').textContent = w.definition;
  document.getElementById('thaiDisplay').textContent = w.thai;
  const pos = w.pos || inferPos(w.word, w.definition);
  document.getElementById('posFrontDisplay').textContent = pos;
  const ex = generateExample(w.word, w.thai, w.definition);
  document.getElementById('exampleDisplay').textContent = ex.en;
  document.getElementById('thaiExampleDisplay').textContent = ex.th;
  document.getElementById('cardLevel').textContent = w.level;
  _fetchBetterExample(w.word, w.thai);
  document.getElementById('cardLevel').style.display = 'block';
  document.getElementById('knowBtn').disabled = false;
  document.getElementById('dontKnowBtn').disabled = false;
}

function nextCard() {
  const card = document.getElementById('flashCard');
  card.classList.remove('flipped');
  card.classList.remove('card-enter');
  void card.offsetHeight;
  renderCard();
  card.classList.add('card-enter');
}

function markKnown() {
  const pool = getFilteredWords();
  const unseen = getUnseenWords(pool);
  if (unseen.length === 0) return;
  knownWords.add(unseen[0].word);
  saveProgress();
  playSound('know');
  nextCard();
}

function speakWord(word) {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(word);
    u.lang = 'en-US';
    u.rate = 0.9;
    window.speechSynthesis.speak(u);
  }
}

function playSound(kind) {
  if (muted) return;
  try {
    const a = kind === 'know' ? audioKnow : audioWrong;
    a.currentTime = 0;
    a.play();
  } catch {}
}

function flipSound() {
  if (muted) return;
  try {
    audioFlip.currentTime = 0;
    audioFlip.play();
  } catch {}
}

function toggleMute() {
  muted = !muted;
  localStorage.setItem(MUTE_KEY, muted);
  document.getElementById('muteBtn').classList.toggle('muted', muted);
  document.getElementById('muteBtn').innerHTML = muted ? '<i class=\"fa-solid fa-volume-xmark\"></i>' : '<i class=\"fa-solid fa-volume-high\"></i>';
}

function renderDontKnowList() {
  const list = document.getElementById('dontknowList');
  const count = document.getElementById('dontknowCount');
  list.innerHTML = dontKnowWords.map(w => `<li>${w}</li>`).join('');
  count.textContent = dontKnowWords.length;
}

function markUnknown() {
  const pool = getFilteredWords();
  const unseen = getUnseenWords(pool);
  if (unseen.length === 0) return;

  const w = unseen[0].word;
  if (!dontKnowWords.includes(w)) {
    dontKnowWords.push(w);
    saveDontKnow();
    renderDontKnowList();
  }
  knownWords.add(w);
  saveProgress();
  playSound('dontknow');
  nextCard();
}

function copyDontKnow() {
  const text = dontKnowWords.join(', ');
  navigator.clipboard.writeText(text).catch(() => {
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    ta.remove();
  });
}

function clearDontKnow() {
  dontKnowWords = [];
  saveDontKnow();
  renderDontKnowList();
}

function resetProgress() {
  knownWords = new Set();
  dontKnowWords = [];
  localStorage.removeItem(WORDS_KEY);
  localStorage.removeItem(DONTKNOW_KEY);
  renderDontKnowList();
  nextCard();
}

function shuffleWords() {
  for (let i = words.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [words[i], words[j]] = [words[j], words[i]];
  }
  nextCard();
}

function init() {
  words = [...oxfordWords];

  // Preload audio
  audioKnow = new Audio('sfx/know.mp3');
  audioWrong = new Audio('sfx/wrong.mp3');
  audioKnow.volume = 0.6;
  audioWrong.volume = 0.6;
  audioFlip = new Audio('sfx/flip.wav');
  audioFlip.volume = 0.5;

  loadProgress();
  loadTheme();
  for (let i = words.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [words[i], words[j]] = [words[j], words[i]];
  }

  document.getElementById('flashCard').addEventListener('click', function(e) {
    if (e.target.closest('.card-inner')) {
      const wasFlipped = this.classList.contains('flipped');
      this.classList.toggle('flipped');
      if (!wasFlipped) flipSound();
    }
  });

  document.getElementById('knowBtn').addEventListener('click', markKnown);
  document.getElementById('dontKnowBtn').addEventListener('click', markUnknown);
  document.getElementById('speakBtn').addEventListener('click', function() {
    const w = document.getElementById('wordDisplay').textContent;
    if (w && w !== 'All done!') speakWord(w);
  });
  document.getElementById('muteBtn').addEventListener('click', toggleMute);
  if (muted) {
    document.getElementById('muteBtn').classList.add('muted');
    document.getElementById('muteBtn').innerHTML = '<i class="fa-solid fa-volume-xmark"></i>';
  }
  document.getElementById('shuffleBtn').addEventListener('click', shuffleWords);
  document.getElementById('resetBtn').addEventListener('click', resetProgress);
  document.getElementById('levelSelect').addEventListener('change', nextCard);
  document.getElementById('resetFromEmptyBtn').addEventListener('click', function() {
    document.getElementById('levelSelect').value = 'all';
    document.getElementById('sideLevelSelect').value = 'all';
    nextCard();
  });
  document.getElementById('copyBtn').addEventListener('click', copyDontKnow);
  document.getElementById('clearDontknowBtn').addEventListener('click', clearDontKnow);
  document.getElementById('dontknowToggle').addEventListener('click', function() {
    document.getElementById('dontknowSection').classList.toggle('open');
  });

  // Side menu
  document.getElementById('menuBtn').addEventListener('click', function() {
    document.getElementById('sideOverlay').classList.add('open');
  });
  document.getElementById('sideClose').addEventListener('click', function() {
    document.getElementById('sideOverlay').classList.remove('open');
  });
  document.getElementById('sideOverlay').addEventListener('click', function(e) {
    if (e.target === this) this.classList.remove('open');
  });
  // Sync side controls with main controls
  function syncLevel() {
    const val = document.getElementById('levelSelect').value;
    document.getElementById('sideLevelSelect').value = val;
  }
  function syncSideLevel() {
    const val = document.getElementById('sideLevelSelect').value;
    document.getElementById('levelSelect').value = val;
    nextCard();
    document.getElementById('sideOverlay').classList.remove('open');
  }
  document.getElementById('levelSelect').addEventListener('change', function() {
    syncLevel();
  });
  document.getElementById('sideLevelSelect').addEventListener('change', syncSideLevel);
  document.getElementById('sideShuffleBtn').addEventListener('click', function() {
    shuffleWords();
    document.getElementById('sideOverlay').classList.remove('open');
  });
  document.getElementById('sideResetBtn').addEventListener('click', function() {
    resetProgress();
    document.getElementById('sideOverlay').classList.remove('open');
  });
  document.getElementById('themeBtn').addEventListener('click', toggleTheme);
  syncLevel();

  document.addEventListener('keydown', function(e) {
    if (e.key === 'ArrowRight' || e.key === 'k') {
      e.preventDefault();
      if (!document.getElementById('knowBtn').disabled) markKnown();
    } else if (e.key === 'ArrowLeft' || e.key === 'n') {
      e.preventDefault();
      if (!document.getElementById('dontKnowBtn').disabled) markUnknown();
    } else if (e.key === ' ') {
      e.preventDefault();
      const card = document.getElementById('flashCard');
      if (!document.getElementById('knowBtn').disabled) {
        const wasFlipped = card.classList.contains('flipped');
        card.classList.toggle('flipped');
        if (!wasFlipped) flipSound();
      }
    }
  });

  renderDontKnowList();
  renderCard();
}

document.addEventListener('DOMContentLoaded', init);
