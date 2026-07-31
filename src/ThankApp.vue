<template>
  <main class="thank-shell">
    <nav class="thank-nav" aria-label="Gratitude views">
      <button v-for="view in views" :key="view.id" :class="{ active: activeView === view.id }" :title="view.name" @click="activeView = view.id">{{ view.icon }}<span>{{ view.name }}</span></button>
      <button title="Appearance" @click="appearanceOpen = !appearanceOpen">Aa</button>
    </nav>
    <section v-if="appearanceOpen" class="thank-appearance">
      <label>Skin <select v-model="skin" @change="applyAppearance(skin)"><option v-for="item in skins" :key="item.id" :value="item.id">{{ item.name }}</option></select></label>
      <label>Type <select v-model="font" @change="applyFont(font)"><option v-for="item in fonts" :key="item.id" :value="item.id">{{ item.name }}</option></select></label>
    </section>

    <template v-if="activeView === 'notes'">
      <div class="entry-date">
        <span>{{ selectedDate === today ? 'Today' : 'Gratitude page' }}</span>
        <strong>{{ longDate(selectedDate) }}</strong>
        <button v-if="selectedDate !== today" @click="openDate(today)">Today</button>
      </div>
      <EditorApp :key="selectedDate" :storage-key="entryKey" :placeholder="prompt" appearance-namespace="thank" preferences-key="thankEditorPrefs" @saved="rememberDate" />
    </template>

    <Transition name="archive-shift" mode="out-in">
      <section v-if="activeView !== 'notes'" :key="activeView" ref="visual" class="archive" :class="`archive-${activeView}`">
        <header class="archive-heading">
          <p>{{ viewName }}</p>
          <h1>{{ archiveTitle }}</h1>
          <small>{{ entries.length ? `${entries.length} grateful ${entries.length === 1 ? 'moment' : 'moments'} to revisit` : 'Your first page is waiting.' }}</small>
        </header>

        <template v-if="entries.length">
          <GratitudeJar v-if="activeView === 'jar'" :entries="entries" @open="openDate" />

          <div v-else-if="activeView === 'sky'" class="sky">
            <vue-particles id="gratitude-sky" class="particle-sky" :options="skyOptions" />
            <button v-for="(date, index) in entries" :key="date" class="star" :style="starStyle(index)" @click="openDate(date)"><span>★</span><small>{{ shortDate(date) }}</small></button>
          </div>

          <div v-else-if="activeView === 'drawer'" class="drawer-wrap">
            <div class="drawer-label">Small good things</div>
            <div ref="archiveList" class="drawer">
              <button v-for="(date, index) in entries" :key="date" v-motion class="drawer-card" :style="{ '--card': index }" :initial="{ opacity: 0, y: 35 }" :enter="{ opacity: 1, y: 0, transition: { delay: index * 45 } }" @click="openDate(date)"><strong>{{ longDate(date) }}</strong><span>{{ preview(date) || 'A quiet page' }}</span></button>
            </div>
          </div>

          <GratitudeGraph v-else-if="activeView === 'graph'" :entries="entries" @open="openDate" />

          <div v-else ref="archiveList" class="trail">
            <button v-for="(date, index) in entries" :key="date" v-motion class="trail-note" :style="stickyStyle(index)" :initial="{ opacity: 0, x: index % 2 ? 28 : -28 }" :enter="{ opacity: 1, x: 0, transition: { delay: index * 50 } }" @click="openDate(date)"><time>{{ longDate(date) }}</time><span>{{ preview(date) || 'A quiet page' }}</span></button>
          </div>
        </template>
        <div v-else class="empty-archive">Write today’s first small good thing, then this world will begin to grow.</div>

        <button class="write-today" @click="openDate(today)">Write today</button>
      </section>
    </Transition>
  </main>
</template>

<script setup>
import { computed, nextTick, ref, watch } from 'vue'
import { gsap } from 'gsap'
import { useAutoAnimate } from '@formkit/auto-animate/vue'
import EditorApp from './EditorApp.vue'
import GratitudeJar from './components/GratitudeJar.vue'
import GratitudeGraph from './components/GratitudeGraph.vue'
import { fonts, useAppearance } from './composables/useAppearance.js'

const INDEX_KEY = 'thankBook_v1'
const today = dateKey()
const selectedDate = ref(today)
const activeView = ref('notes')
const appearanceOpen = ref(false)
const { skins, selectedSkin: skin, selectedFont: font, applyAppearance, applyFont } = useAppearance('thank')
const dates = ref(readDates())
localStorage.removeItem('thankDemoDates_v1')
const visual = ref(null)
const [archiveList] = useAutoAnimate({ duration: 260, easing: 'ease-out' })
const views = [
  { id: 'notes', name: 'Notes', icon: '✎' }, { id: 'jar', name: 'Jar', icon: '◒' },
  { id: 'sky', name: 'Sky', icon: '✦' }, { id: 'drawer', name: 'Drawer', icon: '▤' },
  { id: 'graph', name: 'Graph', icon: '⌘' }, { id: 'trail', name: 'Trail', icon: '〰' },
]

const entries = computed(() => [...dates.value].sort((a, b) => b.localeCompare(a)))
const entryKey = computed(() => `thankEntry_${selectedDate.value}`)
const prompt = computed(() => selectedDate.value === today ? 'What was quietly good today?' : `What do you remember from ${longDate(selectedDate.value)}?`)
const viewName = computed(() => views.find((view) => view.id === activeView.value)?.name || '')
const archiveTitle = computed(() => ({ jar: 'A jar of good things', sky: 'Your small constellation', drawer: 'A drawer of days', graph: 'A living memory map', trail: 'A paper trail' }[activeView.value]))
const skyOptions = {
  preset: 'stars', fullScreen: { enable: false }, background: { color: 'transparent' }, fpsLimit: 40,
  particles: { number: { value: 115 }, shape: { type: 'star' }, color: { value: ['#ffffff', '#d9e8ff', '#ffe2a6'] }, opacity: { value: { min: .18, max: .9 }, animation: { enable: true, speed: .4 } }, size: { value: { min: .8, max: 2.7 } }, move: { enable: true, speed: .12, direction: 'none', outModes: { default: 'out' } } },
}

watch(activeView, async (view) => {
  if (view === 'notes') return
  await nextTick()
  if (visual.value) gsap.fromTo(visual.value, { autoAlpha: 0, scale: .94, rotateX: -5, y: 16 }, { autoAlpha: 1, scale: 1, rotateX: 0, y: 0, duration: .52, ease: 'power3.out' })
})

function dateKey(date = new Date()) { return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 10) }
function readStoredDates(key) { try { const stored = JSON.parse(localStorage.getItem(key) || '[]'); return Array.isArray(stored) ? stored : [] } catch { return [] } }
function readDates() { return readStoredDates(INDEX_KEY) }
function rememberDate(html) {
  if (!html.replace(/<br\s*\/?>(\s*)/gi, '').replace(/<[^>]+>/g, '').trim() || dates.value.includes(selectedDate.value)) return
  dates.value = [...dates.value, selectedDate.value]
  localStorage.setItem(INDEX_KEY, JSON.stringify(dates.value))
}
function openDate(date) { selectedDate.value = date; activeView.value = 'notes' }
function longDate(date) { return new Intl.DateTimeFormat(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(`${date}T12:00:00`)) }
function shortDate(date) { return new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short' }).format(new Date(`${date}T12:00:00`)) }
function day(date) { return new Date(`${date}T12:00:00`).getDate() }
function preview(date) {
  const holder = document.createElement('div')
  holder.innerHTML = localStorage.getItem(`thankEntry_${date}`) || ''
  const saved = holder.textContent.trim().replace(/\s+/g, ' ')
  return saved
}
function noteRotate(index) { return `${(index * 19) % 25 - 12}deg` }
function noteStyle(index) { return { '--x': `${(index * 37) % 66 + 7}%`, '--y': `${(index * 53) % 68 + 13}%`, '--r': noteRotate(index) } }
function starPosition(index) { return { x: (index * 37) % 76 + 12, y: (index * 59) % 70 + 14 } }
function starStyle(index) { const point = starPosition(index); return { left: `${point.x}%`, top: `${point.y}%` } }
function leafStyle(index) { return { '--x': `${(index * 31) % 72 + 10}%`, '--y': `${(index * 47) % 58 + 8}%`, '--r': `${(index * 23) % 50 - 25}deg` } }
function stickyStyle(index) {
  const fonts = ['Caveat, "Bradley Hand", "Noteworthy", cursive', '"Patrick Hand", "Chalkboard SE", cursive', 'Caveat, "Segoe Print", cursive']
  return {
    background: ['#f9e78c', '#f6bdd0', '#b8e2d0', '#bcd8f0', '#efd0a4'][index % 5],
    color: ['#3b4852', '#5c3f50', '#38564a', '#394b61', '#5a4637'][index % 5],
    fontFamily: fonts[index % fonts.length],
    fontSize: `${17 + (index * 7) % 4}px`,
    transform: `rotate(${(index * 17) % 7 - 3}deg)`,
  }
}
</script>

<style scoped>
.thank-shell { min-height:100dvh; background:var(--background); color:var(--foreground); }.thank-nav { position:fixed; z-index:14; top:max(8px,env(safe-area-inset-top)); left:50%; display:flex; gap:3px; max-width:calc(100vw - 20px); overflow:auto; padding:4px; transform:translateX(-50%); border:1px solid var(--border); border-radius:var(--radius-full); background:color-mix(in srgb,var(--card) 88%,transparent); box-shadow:var(--shadow-sm); backdrop-filter:blur(12px); }.thank-nav button { display:flex; align-items:center; gap:4px; min-height:28px; border:0; border-radius:var(--radius-full); background:transparent; color:var(--muted-foreground); font:inherit; font-size:11px; padding:0 8px; white-space:nowrap; }.thank-nav button.active { background:var(--primary); color:var(--primary-foreground); }.archive { box-sizing:border-box; min-height:100dvh; max-width:760px; margin:0 auto; padding:82px 22px 90px; transform-origin:50% 0; }.archive-heading { margin:15px 0 28px; text-align:center; font-family:var(--font-reading); }.archive-heading p { margin:0; color:var(--primary); font-size:12px; font-weight:700; letter-spacing:.09em; text-transform:uppercase; }.archive-heading h1 { margin:7px 0; font-size:clamp(28px,8vw,46px); letter-spacing:-.045em; }.archive-heading small { color:var(--muted-foreground); }.write-today { position:fixed; z-index:5; right:18px; bottom:max(18px,env(safe-area-inset-bottom)); border:1px solid var(--primary); border-radius:var(--radius-full); background:var(--primary); color:var(--primary-foreground); box-shadow:var(--shadow-lg); font:inherit; font-size:13px; padding:11px 15px; }.empty-archive { max-width:360px; margin:70px auto; color:var(--muted-foreground); font-family:var(--font-reading); font-size:19px; font-style:italic; text-align:center; }.jar-wrap { display:grid; min-height:450px; place-items:center; }.jar { position:relative; width:min(84vw,390px); height:390px; overflow:hidden; border:6px solid color-mix(in srgb,var(--primary) 50%,var(--border)); border-top:0; border-radius:28px 28px 88px 88px; background:color-mix(in srgb,var(--card) 45%,transparent); box-shadow:inset 0 0 36px color-mix(in srgb,var(--primary) 10%,transparent),var(--shadow-lg); }.jar::before { content:''; position:absolute; top:0; left:18%; width:64%; height:24px; border:6px solid color-mix(in srgb,var(--primary) 50%,var(--border)); border-radius:12px; transform:translateY(-9px); }.jar-note { position:absolute; left:var(--x); top:var(--y); width:56px; height:42px; border:1px solid var(--border); background:var(--card); color:var(--foreground); box-shadow:var(--shadow-sm); font:700 15px var(--font-reading); transform:rotate(var(--r)); }.sky { position:relative; height:min(66vh,520px); overflow:hidden; border-radius:24px; background:radial-gradient(circle at 45% 35%,color-mix(in srgb,var(--primary) 24%,transparent),transparent 30%),color-mix(in srgb,var(--foreground) 8%,var(--background)); }.sky-lines { position:absolute; width:100%; height:100%; }.sky-lines line { stroke:color-mix(in srgb,var(--primary) 32%,transparent); stroke-width:.35; }.star { position:absolute; display:grid; place-items:center; border:0; background:transparent; color:var(--primary); transform:translate(-50%,-50%); }.star span { font-size:28px; filter:drop-shadow(0 0 7px color-mix(in srgb,var(--primary) 65%,transparent)); }.star small { display:block; color:var(--foreground); font:11px var(--font-reading); white-space:nowrap; }.drawer-wrap { max-width:520px; margin:0 auto; }.drawer-label { position:relative; z-index:2; width:70%; margin:0 auto -9px; padding:12px; border:1px solid var(--border); border-radius:12px 12px 0 0; background:var(--card); font:700 12px var(--font-reading); letter-spacing:.07em; text-align:center; text-transform:uppercase; }.drawer { display:grid; gap:10px; max-height:58vh; overflow:auto; padding:28px 18px 36px; border:14px solid color-mix(in srgb,var(--primary) 48%,var(--border)); border-radius:15px 15px 25px 25px; background:color-mix(in srgb,var(--card) 58%,transparent); box-shadow:inset 0 10px 20px color-mix(in srgb,var(--foreground) 12%,transparent),var(--shadow-lg); }.drawer-card,.trail-note { display:flex; flex-direction:column; align-items:flex-start; gap:6px; width:100%; border:1px solid var(--border); background:var(--card); color:var(--foreground); box-shadow:var(--shadow-sm); font:inherit; text-align:left; }.drawer-card { padding:15px 17px; transform:rotate(calc((var(--card) % 2) * 1deg - .5deg)); }.drawer-card span,.trail-note span { color:var(--muted-foreground); font-family:var(--font-reading); font-size:14px; }.tree-wrap { position:relative; height:min(65vh,540px); overflow:hidden; border-radius:50% 50% 18px 18px; background:linear-gradient(180deg,color-mix(in srgb,var(--primary) 12%,var(--background)),var(--background)); }.tree-trunk { position:absolute; bottom:0; left:48%; width:38px; height:57%; border-radius:30px 30px 0 0; background:color-mix(in srgb,var(--foreground) 65%,#6b4b35); transform:rotate(-3deg); transform-origin:bottom; }.tree-trunk::before,.tree-trunk::after { content:''; position:absolute; width:150px; height:17px; border-radius:17px; background:inherit; transform-origin:left; }.tree-trunk::before { top:34%; transform:rotate(-36deg); }.tree-trunk::after { top:21%; transform:rotate(38deg); }.leaf { position:absolute; left:var(--x); top:var(--y); display:grid; width:55px; height:43px; place-items:center; border:0; border-radius:70% 10% 70% 10%; background:color-mix(in srgb,var(--primary) 72%,var(--card)); color:var(--primary-foreground); box-shadow:var(--shadow-sm); transform:rotate(var(--r)); }.leaf span { font-size:16px; }.leaf small { font-size:10px; }.trail { position:relative; display:grid; gap:18px; max-width:520px; margin:0 auto; padding:0 0 0 25px; }.trail::before { content:''; position:absolute; top:0; bottom:0; left:7px; width:2px; background:var(--border); }.trail-note { position:relative; padding:17px 19px; border-radius:3px 15px 15px 3px; }.trail-note::before { content:''; position:absolute; top:26px; left:-25px; width:11px; height:11px; border:3px solid var(--background); border-radius:50%; background:var(--primary); }.trail-note time { color:var(--primary); font:700 12px var(--font-reading); }.archive-shift-enter-active,.archive-shift-leave-active { transition:opacity .26s ease,transform .26s ease; }.archive-shift-enter-from { opacity:0; transform:translateY(15px) scale(.98); }.archive-shift-leave-to { opacity:0; transform:translateY(-12px) scale(1.02); }@media (max-width:520px) { .thank-nav button span { display:none; }.thank-nav button { min-width:30px; justify-content:center; padding:0 7px; }.archive { padding-inline:14px; } }
.preview-button { display:block; margin:15px auto 0; border:1px solid var(--border); border-radius:var(--radius-full); background:var(--card); color:var(--foreground); font:inherit; font-size:12px; padding:7px 11px; }.particle-sky { position:absolute; inset:0; z-index:0; pointer-events:none; }.particle-sky :deep(canvas) { width:100% !important; height:100% !important; }.sky-lines { z-index:1; }.star { z-index:3; min-width:46px; min-height:46px; padding:0; }.star span { color:#fff6d9; text-shadow:0 0 5px #fff,0 0 15px #a8d7ff,0 0 28px #719dcc; animation:twinkle 2.6s ease-in-out infinite alternate; }.star:nth-of-type(3n) span { animation-delay:-1.3s; }.archive-sky { max-width:none; padding:0; }.archive-sky .sky { isolation:isolate; height:100dvh; border-radius:0; }.archive-sky .archive-heading { position:absolute; z-index:4; top:max(62px,calc(env(safe-area-inset-top) + 52px)); left:16px; right:16px; margin:0; color:#f7f4eb; text-shadow:0 2px 18px #000; }.archive-sky .archive-heading p,.archive-sky .archive-heading small { color:#d8e8ff; }.archive-sky .preview-button { background:rgb(10 17 34 / .7); border-color:rgb(218 232 255 / .35); color:#f7f4eb; backdrop-filter:blur(10px); }.entry-date { position:fixed; z-index:10; top:max(48px,calc(env(safe-area-inset-top) + 42px)); left:50%; display:flex; align-items:baseline; gap:7px; max-width:calc(100vw - 28px); transform:translateX(-50%); color:var(--muted-foreground); font-family:var(--font-reading); font-size:12px; white-space:nowrap; }.entry-date strong { color:var(--foreground); font-size:13px; }.entry-date button { border:0; border-radius:var(--radius-full); background:var(--card); color:var(--primary); font:inherit; font-size:11px; padding:3px 7px; }.thank-shell :deep(.editor-shell .page) { padding-top:106px; }@keyframes twinkle { from { opacity:.62; transform:scale(.83) rotate(-12deg); } to { opacity:1; transform:scale(1.13) rotate(12deg); } }
.trail { grid-template-columns:repeat(auto-fill,minmax(145px,1fr)); align-items:start; gap:18px; max-width:620px; padding:28px; border:1px solid color-mix(in srgb,var(--border) 78%,transparent); border-radius:12px; background:radial-gradient(circle at 15% 20%,color-mix(in srgb,var(--foreground) 6%,transparent) 0 1px,transparent 1.5px) 0 0/9px 9px,color-mix(in srgb,var(--card) 82%,#b78960); box-shadow:inset 0 0 28px color-mix(in srgb,var(--foreground) 12%,transparent),var(--shadow-md); }.trail::before { display:none; }.trail-note { min-height:122px; justify-content:space-between; padding:17px 15px; border:0; border-radius:1px; box-shadow:4px 6px 9px color-mix(in srgb,var(--foreground) 18%,transparent); font-weight:500; line-height:1.18; transition:transform var(--transition),box-shadow var(--transition); }.trail-note::before { display:none; }.trail-note:hover { box-shadow:7px 10px 15px color-mix(in srgb,var(--foreground) 24%,transparent); transform:rotate(0deg) translateY(-4px) !important; }.trail-note time,.trail-note span { color:inherit; font-family:inherit; }.trail-note time { font-size:.72em; opacity:.72; }.trail-note span { font-size:1em; }
.archive-jar,.archive-drawer,.archive-trail,.archive-graph { max-width:none; background-position:center; background-size:cover; background-repeat:no-repeat; }.archive-jar { background-image:linear-gradient(rgb(255 247 225 / .72),rgb(255 247 225 / .86)),url('/thank/sunlit-kitchen.png'); }.archive-drawer { background-image:linear-gradient(rgb(45 24 12 / .22),rgb(43 22 10 / .42)),url('/thank/wooden-drawer.png'); }.archive-trail { background-image:linear-gradient(rgb(255 252 239 / .33),rgb(255 252 239 / .53)),url('/thank/fridge-door.png'); }.archive-graph { background-image:linear-gradient(rgb(7 13 31 / .66),rgb(15 22 52 / .82)),url('/thank/heaven-sky.png'); }.archive-graph .archive-heading { color:#f6f1df; text-shadow:0 2px 14px #000; }.archive-graph .archive-heading p,.archive-graph .archive-heading small { color:#d9e8ff; }.archive-sky .sky { background-image:linear-gradient(rgb(5 11 31 / .14),rgb(5 11 31 / .24)),url('/thank/heaven-sky.png'); background-position:center; background-size:cover; }.thank-shell :deep(.editor-shell) { background:linear-gradient(rgb(255 250 238 / .86),rgb(255 250 238 / .92)),url('/thank/sunlit-kitchen.png') center/cover !important; }
.thank-appearance { position:fixed; z-index:15; top:max(48px,calc(env(safe-area-inset-top) + 42px)); right:14px; display:grid; gap:8px; width:178px; padding:12px; border:1px solid var(--border); border-radius:14px; background:color-mix(in srgb,var(--card) 94%,transparent); box-shadow:var(--shadow-md); backdrop-filter:blur(12px); }.thank-appearance label { display:grid; gap:3px; color:var(--muted-foreground); font-size:11px; }.thank-appearance select { min-width:0; border:0; background:transparent; color:var(--foreground); font:inherit; }
</style>
