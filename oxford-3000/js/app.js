const WORDS_KEY = 'oxford-flashcard-progress';

let words = [];
let currentIndex = 0;
let knownWords = new Set();

function loadProgress() {
  try {
    const saved = localStorage.getItem(WORDS_KEY);
    if (saved) knownWords = new Set(JSON.parse(saved));
  } catch {}
}

function saveProgress() {
  localStorage.setItem(WORDS_KEY, JSON.stringify([...knownWords]));
}

function getFilteredWords() {
  const level = document.getElementById('levelSelect').value;
  return level === 'all' ? [...words] : words.filter(w => w.level === level);
}

function getUnseenWords(pool) {
  return pool.filter(w => !knownWords.has(w.word));
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

function generateExample(word, definition, level, stored) {
  const pos = inferPos(word, definition)
  const cap = word.charAt(0).toUpperCase() + word.slice(1)
  const art = aOrAn(word)

  const patterns = {
    verb: [
      `You should ${word} more often.`,
      `She learned how to ${word} yesterday.`,
      `They want to ${word} every day.`,
      `Can you ${word} for me?`,
      `He decided to ${word} last week.`,
      `We need to ${word} carefully.`,
      `I try to ${word} every morning.`,
      `The team will ${word} tomorrow.`,
    ],
    noun: [
      `This is an important ${word}.`,
      `She bought a new ${word} yesterday.`,
      `I have ${aOrAn(word)} ${word} at home.`,
      `The ${word} looks very nice.`,
      `We need a better ${word}.`,
      `He showed me the ${word}.`,
      `That ${word} is very useful.`,
      `Do you have ${aOrAn(word)} ${word}?`,
    ],
    adjective: [
      `This is a very ${word} experience.`,
      `She is ${word} and talented.`,
      `The weather feels ${word} today.`,
      `That was ${aOrAn(word)} ${word} thing to do.`,
      `He seems ${word} about the news.`,
      `It's ${word} to see you happy.`,
    ],
    adverb: [
      `She spoke ${word} to the audience.`,
      `He ${word} finished his work.`,
      `They ${word} agreed with the plan.`,
      `She ${word} walked into the room.`,
      `He ${word} answered the question.`,
      `They ${word} completed the project.`,
    ],
    function: [
      `"${cap}" is a very common word in English.`,
      `Do you know how to use "${word}"?`,
      `Please use "${word}" in a sentence.`,
    ],
    abbreviation: [
      `The label "${word}" refers to a part of speech.`,
      `You can find "${word}" in a dictionary entry.`,
    ],
    unknown: [
      `"${cap}" is a useful word to know.`,
      `Today we will learn about "${word}".`,
      `"${word}" is a common English word.`,
      `Please study the word "${word}".`,
      `${cap} appears in many everyday situations.`,
    ],
  }

  const pool = patterns[pos] || patterns.unknown
  return pool[Math.floor(Math.random() * pool.length)]
}

function renderCard() {
  const pool = getFilteredWords();
  const unseen = getUnseenWords(pool);
  const hasWords = pool.length > 0;
  const wrapper = document.querySelector('.card-wrapper');

  document.getElementById('cardCount').textContent =
    `${unseen.length} / ${pool.length}`;
  document.getElementById('knownCount').textContent =
    pool.length - unseen.length;

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
    document.getElementById('exampleDisplay').textContent = '';
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
  document.getElementById('exampleDisplay').textContent = generateExample(w.word, w.definition, w.level, w.example);
  document.getElementById('cardLevel').textContent = w.level;
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
  nextCard();
}

function markUnknown() {
  const pool = getFilteredWords();
  const unseen = getUnseenWords(pool);
  if (unseen.length === 0) return;

  const card = document.getElementById('flashCard');
  card.classList.toggle('flipped');
}

function resetProgress() {
  knownWords = new Set();
  localStorage.removeItem(WORDS_KEY);
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
  loadProgress();

  document.getElementById('flashCard').addEventListener('click', function(e) {
    if (e.target.closest('.card-inner')) {
      this.classList.toggle('flipped');
    }
  });

  document.getElementById('knowBtn').addEventListener('click', markKnown);
  document.getElementById('dontKnowBtn').addEventListener('click', markUnknown);
  document.getElementById('shuffleBtn').addEventListener('click', shuffleWords);
  document.getElementById('resetBtn').addEventListener('click', resetProgress);
  document.getElementById('levelSelect').addEventListener('change', nextCard);
  document.getElementById('resetFromEmptyBtn').addEventListener('click', function() {
    document.getElementById('levelSelect').value = 'all';
    nextCard();
  });

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
      if (!document.getElementById('knowBtn').disabled) card.classList.toggle('flipped');
    }
  });

  renderCard();
}

document.addEventListener('DOMContentLoaded', init);
