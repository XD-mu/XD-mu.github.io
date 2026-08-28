/* ═══════════════════════════════════════════════════════════════
   WEDirector · THE CUTTING ROOM — interactions v3
   chat-driven demo: autonomous first cut → conversational revision
   ═══════════════════════════════════════════════════════════════ */
(() => {
"use strict";
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const sleep = ms => new Promise(r => setTimeout(r, ms));
const pad = n => String(n).padStart(2, "0");
const tc = f => `${pad(Math.floor(f / 86400))}:${pad(Math.floor(f / 1440) % 60)}:${pad(Math.floor(f / 24) % 60)}:${pad(f % 24)}`;

/* ───────────── 1. clocks (24fps timecode) ───────────── */
const navTc = $("#navTc"), deckClock = $("#deckClock");
let frame = 0;
setInterval(() => {
  frame++;
  if (navTc) navTc.textContent = tc(frame);
  if (deckClock && deckClock.dataset.live === "1") deckClock.textContent = tc(+deckClock.dataset.f || 0);
}, 1000 / 24);

/* ───────────── 2. nav scrolled / reveal / count-up ───────────── */
const nav = $("#nav");
addEventListener("scroll", () => nav.classList.toggle("scrolled", scrollY > 24), { passive: true });

const io = new IntersectionObserver(es => es.forEach(e => {
  if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
}), { threshold: .12 });
$$(".reveal").forEach(el => io.observe(el));

const cio = new IntersectionObserver(es => es.forEach(e => {
  if (!e.isIntersecting) return;
  cio.unobserve(e.target);
  const el = e.target, to = +el.dataset.to, dec = +el.dataset.dec;
  const t0 = performance.now(), dur = reduced ? 1 : 1500;
  (function tick(now) {
    const p = Math.min((now - t0) / dur, 1);
    el.textContent = (to * (1 - Math.pow(1 - p, 3))).toFixed(dec).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    if (p < 1) requestAnimationFrame(tick);
  })(t0);
}), { threshold: .6 });
$$(".count").forEach(el => cio.observe(el));

/* ───────────── 2c. hero flow-field particles ───────────── */
const flowCv = $("#heroFlow");
if (flowCv && !reduced) {
  const ctx = flowCv.getContext("2d");
  const DPR = Math.min(devicePixelRatio || 1, 2);
  let W, H, parts = [], raf = null, t = 0;
  const mouse = { x: -9e3, y: -9e3 };
  const COLORS = ["62,230,196", "255,180,84", "143,216,200"];

  const flowAngle = (x, y, t) =>
    (Math.sin(x * 1.7 + t) + Math.cos(y * 1.3 - t * .7) + Math.sin((x + y) * .9 + t * .5)) * 1.05;
  const spawn = (p = {}) => {
    p.x = Math.random() * W; p.y = Math.random() * H;
    p.px = p.x; p.py = p.y;
    p.life = 120 + Math.random() * 240;
    p.sp = .35 + Math.random() * .75;
    p.c = COLORS[(Math.random() * COLORS.length) | 0];
    p.a = .12 + Math.random() * .3;
    return p;
  };
  function resize() {
    W = flowCv.clientWidth; H = flowCv.clientHeight;
    flowCv.width = W * DPR; flowCv.height = H * DPR;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    parts = Array.from({ length: Math.min(520, Math.floor(W * H / 3200)) }, () => spawn());
    ctx.clearRect(0, 0, W, H);
  }
  function tick() {
    t += .0035;
    ctx.globalCompositeOperation = "destination-out";
    ctx.fillStyle = "rgba(0,0,0,.05)";
    ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = "lighter";
    ctx.lineWidth = 1;
    for (const p of parts) {
      const ang = flowAngle(p.x / W * 2.2, p.y / H * 2.2, t);
      let vx = Math.cos(ang) * p.sp, vy = Math.sin(ang) * p.sp;
      const dx = p.x - mouse.x, dy = p.y - mouse.y, d2 = dx * dx + dy * dy;
      if (d2 < 28900) {
        const d = Math.sqrt(d2) || 1, f = (1 - d / 170) * 1.6;
        vx += dx / d * f; vy += dy / d * f;
      }
      p.px = p.x; p.py = p.y;
      p.x += vx; p.y += vy;
      ctx.strokeStyle = `rgba(${p.c},${p.a})`;
      ctx.beginPath(); ctx.moveTo(p.px, p.py); ctx.lineTo(p.x, p.y); ctx.stroke();
      if (--p.life < 0 || p.x < -10 || p.x > W + 10 || p.y < -10 || p.y > H + 10) spawn(p);
    }
    raf = requestAnimationFrame(tick);
  }
  const heroEl = $(".hero");
  heroEl.addEventListener("pointermove", e => {
    const r = flowCv.getBoundingClientRect();
    mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
  });
  heroEl.addEventListener("pointerleave", () => { mouse.x = -9e3; mouse.y = -9e3; });
  new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { if (!raf) raf = requestAnimationFrame(tick); }
    else { cancelAnimationFrame(raf); raf = null; }
  })).observe(heroEl);
  addEventListener("resize", resize);
  resize();
}

/* ───────────── 3. hero: bg video fade + playhead sweep ───────────── */
const hero = $(".hero"), heroBg = $("#heroBg");
if (hero && heroBg) {
  let ticking = false;
  const onScroll = () => {
    if (ticking) return; ticking = true;
    requestAnimationFrame(() => {
      const h = hero.offsetHeight || 1;
      const p = Math.min(Math.max(scrollY / (h * .85), 0), 1);
      heroBg.style.opacity = String(1 - p);
      ticking = false;
    });
  };
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();
}
const heroPh = $("#heroPlayhead");
if (heroPh && !reduced) {
  let p = 0;
  (function sweep() {
    p = (p + .12) % 100;
    heroPh.style.left = `calc(6vw + ${p} * 0.88%)`;
    requestAnimationFrame(sweep);
  })();
}

/* ═════════════ 4. AGENT DECK — chat + preview + timeline ═════════════ */
const stream = $("#stream"), nle = $("#nle");
if (stream && nle) {
  const laneV = $("#laneV"), laneT = $("#laneT"), laneA = $("#laneA"), laneB = $("#laneB"),
        playhead = $("#nlePlayhead"), runProgress = $("#runProgress"),
        preview = $("#preview"), pvBadge = $("#pvBadge"), deckSession = $("#deckSession"),
        chips = { seg: $("#stSeg"), shot: $("#stShot"), issue: $("#stIssue"), budget: $("#stBudget"), art: $("#stArt") };

  const N = 12;
  const clipPos = i => ({ left: (i * 8.24 + .3) + "%", width: "7.6%" });
  const txtShots = [1, 4, 7, 10];
  let runToken = 0, deckClockT = null;

  function buildLanes() {
    [laneV, laneT, laneA, laneB].forEach(l => l.innerHTML = "");
    for (let i = 0; i < N; i++) {
      const v = document.createElement("div");
      v.className = "clip ghost"; v.id = "cv" + i;
      Object.assign(v.style, clipPos(i));
      v.textContent = "S" + pad(i + 1);
      laneV.appendChild(v);
      const a = document.createElement("div");
      a.className = "clip aud"; a.id = "ca" + i;
      Object.assign(a.style, clipPos(i));
      laneA.appendChild(a);
    }
    txtShots.forEach((i, k) => {
      const t = document.createElement("div");
      t.className = "clip txt"; t.id = "ct" + i;
      Object.assign(t.style, clipPos(i));
      t.textContent = "CAP-" + (k + 1);
      laneT.appendChild(t);
    });
    const b = document.createElement("div");
    b.className = "clip bgm"; b.id = "cbgm";
    Object.assign(b.style, { left: ".3%", width: "99%" });
    b.textContent = "BGM · epic_cinematic_041";
    laneB.appendChild(b);
    playhead.style.opacity = 0;
  }

  const setChip = (key, val, hot = false) => {
    const chip = chips[key].closest(".chip");
    chips[key].textContent = val;
    chip.classList.remove("bump"); void chip.offsetWidth; chip.classList.add("bump");
    if (key === "issue") chip.classList.toggle("hot", hot);
  };
  const laneTo = i => `calc(46px + ${(i + .5) * 8.24}% * 0.985)`;
  const setBadge = txt => {
    pvBadge.innerHTML = txt.replace(/ /g, "&nbsp;");
    pvBadge.classList.remove("bump"); void pvBadge.offsetWidth; pvBadge.classList.add("bump");
  };

  /* chat primitives */
  let agentBody = null;
  const scrollStream = () => { stream.scrollTop = stream.scrollHeight; };
  function userMsg(text) {
    const m = document.createElement("div");
    m.className = "msg user";
    m.innerHTML = `<div class="msg-body"></div>`;
    m.querySelector(".msg-body").textContent = text;
    stream.appendChild(m); scrollStream();
  }
  function agentMsg(turnLabel) {
    const m = document.createElement("div");
    m.className = "msg agent";
    m.innerHTML = `<div class="msg-body"><div class="msg-who mono">WEDIRECTOR <span class="turn-no">${turnLabel || ""}</span></div></div>`;
    stream.appendChild(m); scrollStream();
    agentBody = m.querySelector(".msg-body");
    return agentBody;
  }
  function addLine(cls, text, typeSpeed) {
    const d = document.createElement("div");
    d.className = "st-line " + cls;
    agentBody.appendChild(d); scrollStream();
    if (reduced || !typeSpeed) { d.textContent = text; scrollStream(); return; }
    let i = 0;
    const cur = document.createElement("span"); cur.className = "st-cursor";
    d.appendChild(cur);
    const timer = setInterval(() => {
      d.insertBefore(document.createTextNode(text[i]), cur);
      scrollStream();
      if (++i >= text.length) { clearInterval(timer); cur.remove(); }
    }, typeSpeed);
  }
  const sysLine = text => {
    const d = document.createElement("div");
    d.className = "st-sys"; d.textContent = text;
    stream.appendChild(d); scrollStream();
  };

  /* ── the full demo script ── */
  async function run() {
    const token = ++runToken;
    const alive = () => token === runToken;
    stream.innerHTML = ""; buildLanes();
    preview.classList.remove("live");
    runProgress.style.width = "0%";
    deckSession.textContent = "TAKE " + Math.floor(Math.random() * 0xFFFF).toString(16).toUpperCase().padStart(4, "0");
    setChip("seg", "–"); setChip("shot", "–"); setChip("issue", "0"); setChip("budget", "4"); setChip("art", "–");
    deckClock.dataset.live = "1"; deckClock.dataset.f = 0;
    clearInterval(deckClockT);
    deckClockT = setInterval(() => { deckClock.dataset.f = (+deckClock.dataset.f || 0) + 3; }, 125);
    const STEPS = 18; let done = 0;
    const tick = () => runProgress.style.width = (++done / STEPS * 100) + "%";

    /* ── ACT 1 · 用户下需求 ── */
    await sleep(800); if (!alive()) return;
    userMsg("把这篇《中华文明五千年》的解说稿做成 6 分钟左右的成片，史诗基调，16:9。");

    /* ── ACT 2 · 自主成片 ── */
    await sleep(1000); if (!alive()) return;
    agentMsg("autonomous run");

    addLine("st-think", "收到。通读脚本 1,248 字：文明史诗题材。先切带时间戳的解说段，再逐章规划分镜。", 8);
    await sleep(reduced ? 60 : 1900); if (!alive()) return;
    addLine("st-call", "Tool_SegmentArticle", 12);
    await sleep(420); if (!alive()) return;
    addLine("st-arg", "{ \"granularity\": \"sentence_group\", \"target_ratio\": \"16:9\" }");
    await sleep(620); if (!alive()) return;
    addLine("st-ok", "return · 14 narration segments · est. 05:49");
    setChip("seg", "14"); tick();

    await sleep(750); if (!alive()) return;
    addLine("st-think", "开篇航拍宫殿群立史诗感，黄河长镜头承转，结尾星空收束。12 个镜头，逐段绑定视觉简报。", 8);
    await sleep(reduced ? 60 : 1800); if (!alive()) return;
    addLine("st-call", "Tool_PlanShots", 12);
    await sleep(420); if (!alive()) return;
    addLine("st-arg", "{ \"chapters\": [1,2,3], \"shots_per_segment\": \"auto\" }");
    await sleep(620); if (!alive()) return;
    addLine("st-ok", "return · 12 shots planned · visual briefs bound");
    setChip("shot", "12 planned");
    for (let i = 0; i < N; i++) { await sleep(reduced ? 5 : 50); if (!alive()) return; $("#cv" + i).classList.add("on"); }
    tick();

    await sleep(750); if (!alive()) return;
    addLine("st-think", "投产前自查：S08 字幕文案 42 字，超安全框上限——现在改写比成片返工便宜。", 8);
    await sleep(reduced ? 60 : 1700); if (!alive()) return;
    addLine("st-call", "Tool_SelfReflect", 12);
    await sleep(560); if (!alive()) return;
    addLine("st-ok", "return · 1 patch (S08 caption rewritten) · plan APPROVED");
    tick();

    await sleep(750); if (!alive()) return;
    addLine("st-think", "规划锁定。素材检索与 TTS 配音并行下发，失败自动换源重试。", 8);
    await sleep(reduced ? 60 : 1500); if (!alive()) return;
    addLine("st-call", "Tool_BatchVisualAudio", 12);
    await sleep(420); if (!alive()) return;
    addLine("st-arg", "{ \"shots\": 12, \"tts\": \"zh_male_deep\", \"retry\": \"swap_source\" }");
    for (let i = 0; i < N; i++) {
      await sleep(reduced ? 8 : 115); if (!alive()) return;
      const c = $("#cv" + i); c.classList.remove("ghost"); c.classList.add("solid", "on");
      $("#ca" + i).classList.add("on");
      setChip("shot", (i + 1) + "/12");
    }
    addLine("st-ok", "return · 12 visuals bound · 12 voice tracks · 0 miss");
    tick();

    await sleep(650); if (!alive()) return;
    addLine("st-call", "Tool_BatchDecorateSpotlights", 12);
    for (const i of txtShots) { await sleep(reduced ? 8 : 140); if (!alive()) return; $("#ct" + i).classList.add("on"); }
    addLine("st-ok", "return · 4 caption cards · spotlight motion applied");
    tick();

    await sleep(650); if (!alive()) return;
    addLine("st-call", "Tool_BatchTimelineCompose", 12);
    await sleep(560); if (!alive()) return;
    addLine("st-ok", "return · timeline v1 composed · 12 shots placed");
    setChip("art", "timeline@v1"); tick();

    await sleep(650); if (!alive()) return;
    addLine("st-think", "史诗题材配低频鼓点加弦乐，BPM 70–90，避开人声频段。", 8);
    await sleep(reduced ? 60 : 1400); if (!alive()) return;
    addLine("st-call", "Tool_MusicSearch", 12);
    await sleep(560); if (!alive()) return;
    addLine("st-ok", "return · epic_cinematic_041 · loudness-matched");
    $("#cbgm").classList.add("on"); tick();

    /* judge + self-repair */
    await sleep(750); if (!alive()) return;
    addLine("st-think", "逐维度过片：文字贴合、画面语义、音画同步。播放头扫一遍全片。", 8);
    playhead.style.opacity = 1;
    playhead.style.left = laneTo(0);
    await sleep(reduced ? 60 : 1200); if (!alive()) return;
    addLine("st-call", "Tool_Stage4DimensionJudge", 12);
    for (let i = 0; i < N; i++) {
      playhead.style.left = laneTo(i);
      await sleep(reduced ? 18 : 260); if (!alive()) return;
    }
    $("#cv7").classList.add("broken"); $("#ct7").classList.add("broken");
    $("#cv10").classList.add("broken"); $("#ca10").classList.add("broken");
    playhead.style.left = laneTo(7);
    addLine("st-warn", "inspect · S08 text overflow 42>36 chars · S11 A/V drift 240ms");
    setChip("issue", "2", true); tick();

    await sleep(900); if (!alive()) return;
    addLine("st-think", "两处失败都不波及其余镜头——不重拍全片。S08 只重排字幕层，S11 只重新对轨。预算 4 花 2，够了。", 8);
    await sleep(reduced ? 60 : 2300); if (!alive()) return;
    addLine("st-call", "Tool_Stage4DimensionalRepair", 12);
    await sleep(420); if (!alive()) return;
    addLine("st-arg", "{ \"shots\": [\"S08\", \"S11\"], \"dims\": [\"text\", \"av_sync\"], \"budget\": 4 }");
    await sleep(reduced ? 50 : 800); if (!alive()) return;
    playhead.style.left = laneTo(7); await sleep(reduced ? 25 : 450); if (!alive()) return;
    $("#cv7").classList.replace("broken", "fixed"); $("#ct7").classList.replace("broken", "fixed");
    setChip("budget", "3");
    playhead.style.left = laneTo(10); await sleep(reduced ? 25 : 550); if (!alive()) return;
    $("#cv10").classList.replace("broken", "fixed"); $("#ca10").classList.replace("broken", "fixed");
    setChip("budget", "2");
    addLine("st-ok", "return · 2 shots re-rendered · re-verify PASSED");
    setChip("issue", "0"); setChip("art", "timeline@v2"); tick();
    playhead.style.left = "calc(100% - 2px)";

    await sleep(700); if (!alive()) return;
    addLine("st-call", "Tool_FinalRender", 12);
    await sleep(420); if (!alive()) return;
    addLine("st-arg", "{ \"res\": \"1920x1080\", \"mix_bgm\": true, \"loudness\": \"-14LUFS\" }");
    await sleep(reduced ? 60 : 950); if (!alive()) return;
    addLine("st-ok", "return · master rendered · 1920×1080 · −14 LUFS");
    tick();

    await sleep(650); if (!alive()) return;
    addLine("st-call", "Tool_StitchVideo", 12);
    await sleep(600); if (!alive()) return;
    addLine("st-ok", "return · DELIVERY VERIFIED · final_cut.mp4 · 05:49");
    setChip("art", "final_cut.mp4"); tick();
    addLine("st-say", "初剪完成，05:49。预览在右上——镜头、配乐、字幕模板，哪里不满意直接说。");
    preview.classList.add("live"); setBadge("CUT v1");

    /* ── ACT 3 · 对话修改 ①：换镜头素材 + 换 BGM ── */
    await sleep(reduced ? 100 : 2600); if (!alive()) return;
    userMsg("S08 的宫殿镜头换成沙漠驼队航拍，BGM 换一首轻快点的。");

    await sleep(900); if (!alive()) return;
    agentMsg("revision 1");
    addLine("st-think", "两处修改都不动结构：S08 换源后按原时长 4.2s 对齐，时间线不动；BGM 换 light_groove 类，响度重新匹配到 −14 LUFS。", 8);
    await sleep(reduced ? 60 : 2200); if (!alive()) return;
    addLine("st-call", "Tool_SwapVisual", 12);
    await sleep(420); if (!alive()) return;
    addLine("st-arg", "{ \"shot\": \"S08\", \"query\": \"desert caravan aerial\", \"keep_duration\": true }");
    $("#cv7").classList.add("swapping");
    playhead.style.left = laneTo(7);
    await sleep(reduced ? 60 : 1000); if (!alive()) return;
    $("#cv7").classList.remove("swapping", "fixed"); $("#cv7").classList.add("alt");
    addLine("st-ok", "return · visual swapped · duration matched 4.2s");
    tick();

    await sleep(650); if (!alive()) return;
    addLine("st-call", "Tool_MusicSearch", 12);
    await sleep(420); if (!alive()) return;
    addLine("st-arg", "{ \"mood\": \"light_groove\", \"bpm\": [95, 110], \"replace\": \"epic_cinematic_041\" }");
    await sleep(reduced ? 50 : 800); if (!alive()) return;
    const bgm = $("#cbgm");
    bgm.textContent = "BGM · light_groove_017";
    bgm.style.background = "linear-gradient(180deg,#e0a86f,#c47c4f)";
    addLine("st-ok", "return · light_groove_017 · loudness re-matched");
    setChip("art", "timeline@v3"); tick();

    await sleep(600); if (!alive()) return;
    addLine("st-call", "Tool_FinalRender", 12);
    await sleep(500); if (!alive()) return;
    addLine("st-arg", "{ \"incremental\": [\"S08\", \"bgm\"] }");
    await sleep(reduced ? 50 : 750); if (!alive()) return;
    addLine("st-ok", "return · incremental render · 18s wall-clock");
    addLine("st-say", "改好了 → CUT v2。沙漠驼队已就位，配乐换轻了。");
    setChip("art", "final_cut_v2.mp4"); setBadge("CUT v2"); tick();

    /* ── ACT 4 · 对话修改 ②：换字幕模板 ── */
    await sleep(reduced ? 100 : 2600); if (!alive()) return;
    userMsg("片头字幕模板换成极简款，别压太多字。");

    await sleep(900); if (!alive()) return;
    agentMsg("revision 2");
    addLine("st-think", "只动模板层：S02 片头字幕卡换 minimal 模板、字号下调，其余三张字幕卡保持不变。改完单镜重验即可。", 8);
    await sleep(reduced ? 60 : 2000); if (!alive()) return;
    addLine("st-call", "Tool_BatchDecorateSpotlights", 12);
    await sleep(420); if (!alive()) return;
    addLine("st-arg", "{ \"shots\": [\"S02\"], \"template\": \"minimal\", \"coverage\": \"low\" }");
    $("#ct1").classList.add("swapping");
    playhead.style.left = laneTo(1);
    await sleep(reduced ? 60 : 900); if (!alive()) return;
    $("#ct1").classList.remove("swapping"); $("#ct1").classList.add("minimal");
    addLine("st-ok", "return · template swapped · S02 caption restyled");
    tick();

    await sleep(600); if (!alive()) return;
    addLine("st-call", "Tool_Stage4DimensionJudge", 12);
    await sleep(420); if (!alive()) return;
    addLine("st-arg", "{ \"scope\": [\"S02\"] }");
    await sleep(reduced ? 50 : 700); if (!alive()) return;
    addLine("st-ok", "return · S02 PASSED · text_fit ✓");
    addLine("st-say", "完成 → CUT v3，这版可以交付了。");
    setChip("art", "final_cut_v3.mp4"); setBadge("CUT v3 · FINAL"); tick();

    await sleep(500); if (!alive()) return;
    sysLine("▸ session idle · 2 chat revisions · 0 re-shoots · 16 tool calls total");
    clearInterval(deckClockT); deckClock.dataset.live = "0";

    await sleep(12000); if (!alive()) return;
    run();
  }

  buildLanes();
  $("#replayBtn").addEventListener("click", () => run());
  const dio = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { dio.disconnect(); run(); }
  }), { threshold: .2 });
  dio.observe($("#deck"));
}

/* ───────────── 5. lightbox ───────────── */
const lb = $("#lightbox"), lbVideo = $("#lightboxVideo");
if (lb) {
  $$(".card").forEach(c => c.addEventListener("click", () => {
    lbVideo.src = c.dataset.video;
    lb.classList.add("open");
    document.body.style.overflow = "hidden";
    lbVideo.play().catch(() => {});
  }));
  const close = () => {
    lb.classList.remove("open");
    lbVideo.pause(); lbVideo.removeAttribute("src"); lbVideo.load();
    document.body.style.overflow = "";
  };
  $("#lightboxClose").addEventListener("click", close);
  lb.addEventListener("click", e => { if (e.target === lb) close(); });
  addEventListener("keydown", e => { if (e.key === "Escape") close(); });
}

/* ───────────── 6. versus — paired domains, synced playback ───────────── */
const vsOurs = $("#vsOurs"), vsTheirs = $("#vsTheirs"), vsPlay = $("#vsPlay"),
      vsTabs = $("#vsTabs"), vsCaption = $("#vsCaption");
if (vsOurs && vsTheirs && vsTabs) {
  const PAIRS = {
    tech:     { ours: "assets/videos/vs/our_tech.mp4",     theirs: "assets/videos/vs/cr_tech.mp4",     title: "人工智能如何改变生活" },
    finance:  { ours: "assets/videos/vs/our_finance.mp4",  theirs: "assets/videos/vs/cr_finance.mp4",  title: "钱为什么越来越难赚" },
    nature:   { ours: "assets/videos/vs/our_nature.mp4",   theirs: "assets/videos/vs/cr_nature.mp4",   title: "我们为什么探索宇宙" },
    society:  { ours: "assets/videos/vs/our_society.mp4",  theirs: "assets/videos/vs/cr_society.mp4",  title: "现代人为何越来越孤独" },
  };
  let playing = false, curPair = "tech";

  const setPlaying = on => {
    playing = on;
    vsPlay.classList.toggle("playing", on);
    vsPlay.querySelector(".pp").textContent = on ? "❚❚" : "▶";
    if (on) {
      vsTheirs.currentTime = vsOurs.currentTime = 0;
      vsOurs.play().catch(() => {}); vsTheirs.play().catch(() => {});
    } else { vsOurs.pause(); vsTheirs.pause(); }
  };
  const loadPair = key => {
    curPair = key;
    setPlaying(false);
    const p = PAIRS[key];
    const frames = $$(".vs-frame");
    frames.forEach(f => f.classList.add("fading"));
    setTimeout(() => {
      vsOurs.src = p.ours;   vsOurs.poster = p.ours.replace(/\.mp4$/, ".jpg");
      vsTheirs.src = p.theirs; vsTheirs.poster = p.theirs.replace(/\.mp4$/, ".jpg");
      vsOurs.load(); vsTheirs.load();
      vsCaption.textContent = "SCRIPT · " + p.title;
      frames.forEach(f => f.classList.remove("fading"));
    }, 200);
    $$(".vs-tab", vsTabs).forEach(t => t.classList.toggle("on", t.dataset.pair === key));
  };
  loadPair(curPair);
  $$(".vs-tab", vsTabs).forEach(t => t.addEventListener("click", () => {
    if (t.dataset.pair !== curPair) loadPair(t.dataset.pair);
  }));
  vsPlay.addEventListener("click", () => setPlaying(!playing));
  [vsOurs, vsTheirs].forEach(v => v.addEventListener("click", () => setPlaying(!playing)));
  setInterval(() => {
    if (playing && Math.abs(vsOurs.currentTime - vsTheirs.currentTime) > .3)
      vsTheirs.currentTime = vsOurs.currentTime;
  }, 500);
  vsOurs.addEventListener("ended", () => setPlaying(false));
}

/* ═════════════ 7. EVAL SANDBOX — sample → cite → anchored score ═════════════ */
const evalBox = $("#evalBox"), evalTerm = $("#evalTerm");
if (evalBox && evalTerm) {
  const evalStrip = $("#evalStrip"), evalTiles = $("#evalTiles"),
        evalScores = $("#evalScores"), evalClock = $("#evalClock");
  const TILE_TS = ["055.0s", "060.0s", "065.0s", "070.0s"];
  let evToken = 0, evClockT = null;

  const evScroll = () => { evalTerm.scrollTop = evalTerm.scrollHeight; };
  function evLine(cls, html, typeSpeed) {
    const d = document.createElement("div");
    d.className = "ev-line " + cls;
    d.innerHTML = html;
    evalTerm.appendChild(d); evScroll();
    if (reduced || !typeSpeed) return;
    // typewriter over plain text, then restore html
    const full = d.textContent;
    d.textContent = "";
    let i = 0;
    const cur = document.createElement("span"); cur.className = "ev-cursor";
    d.appendChild(cur);
    const timer = setInterval(() => {
      d.insertBefore(document.createTextNode(full[i]), cur);
      evScroll();
      if (++i >= full.length) { clearInterval(timer); d.innerHTML = html; }
    }, typeSpeed);
  }

  function buildStrip() {
    evalStrip.innerHTML = "";
    for (let i = 1; i <= 8; i++) {
      const f = document.createElement("div");
      f.className = "sframe"; f.id = "sf" + i;
      f.innerHTML = `<img src="assets/img/eval/strip${i}.jpg" alt="sampled frame ${i}"><span class="fts">${pad(Math.floor(i * 127 / 60))}:${pad(i * 127 % 60)}</span>`;
      evalStrip.appendChild(f);
    }
  }
  function buildTiles() {
    evalTiles.innerHTML = "";
    for (let i = 1; i <= 4; i++) {
      const t = document.createElement("div");
      t.className = "etile"; t.id = "et" + i;
      t.innerHTML = `<img src="assets/img/eval/tile${i}.jpg" alt="tile ${i}"><span class="tid">tile#${i}</span><span class="ett">@${TILE_TS[i - 1]}</span>`;
      evalTiles.appendChild(t);
    }
  }

  async function evalRun() {
    const token = ++evToken;
    const alive = () => token === evToken;
    evalTerm.innerHTML = ""; buildStrip(); buildTiles();
    evalScores.classList.remove("run");
    evalScores.querySelectorAll(".edim").forEach(d => d.classList.remove("show"));
    evalScores.querySelectorAll(".es-bar i").forEach(b => b.style.width = "");
    evalClock.textContent = "00:00:00:00";
    let ef = 0;
    clearInterval(evClockT);
    evClockT = setInterval(() => { ef += 2; evalClock.textContent = tc(ef); }, 83);

    await sleep(700); if (!alive()) return;
    evLine("ev-sys", "▸ case #0042 · input locked · rubric: visual_impact / clarity");

    await sleep(800); if (!alive()) return;
    evLine("ev-call", "harness.probe(video)");
    await sleep(500); if (!alive()) return;
    evLine("ev-ok", "16:58 runtime · 21 shots detected · manifest sha256 bound");
    for (let i = 1; i <= 8; i++) { await sleep(reduced ? 10 : 130); if (!alive()) return; $("#sf" + i).classList.add("on"); }

    await sleep(700); if (!alive()) return;
    evLine("ev-call", "harness.uniform_sample(unit=\"shot\")");
    await sleep(550); if (!alive()) return;
    evLine("ev-ok", "frozen sampler · chronological frames · timestamps registered");

    await sleep(700); if (!alive()) return;
    evLine("ev-call", "harness.confirm_keyframes(policy=\"max_saliency\", n=4)");
    await sleep(500); if (!alive()) return;
    for (let i = 1; i <= 4; i++) { await sleep(reduced ? 10 : 260); if (!alive()) return; $("#et" + i).classList.add("on"); }
    evLine("ev-ok", "4 keyframes confirmed as visual evidence · packet sealed");

    await sleep(800); if (!alive()) return;
    evLine("ev-call", "harness.layout_analysis(tiles)");
    await sleep(600); if (!alive()) return;
    evLine("ev-arg", "→ composition grid stable · subject locked at visual center · rule-of-thirds pass");

    await sleep(700); if (!alive()) return;
    evLine("ev-call", "harness.saliency_detect(tile#2)");
    await sleep(600); if (!alive()) return;
    evLine("ev-arg", "→ attention heatmap concentrated on 主体 · no competing hotspots");

    await sleep(700); if (!alive()) return;
    evLine("ev-call", "harness.text_legibility(tiles)");
    await sleep(600); if (!alive()) return;
    evLine("ev-arg", "→ subtitle contrast 7.2:1 · no overflow · no glyph clipping");

    await sleep(700); if (!alive()) return;
    evLine("ev-call", "harness.motion_overlap_check(tiles)");
    await sleep(600); if (!alive()) return;
    evLine("ev-arg", "→ 0 frames where animation occludes text · transition timing nominal");

    await sleep(800); if (!alive()) return;
    evLine("ev-call", "opus5.judge(dimension=\"visual_impact\", rubric=\"rubric_v1\")");
    await sleep(600); if (!alive()) return;
    evLine("ev-obs", "<b>evidence</b> · tile#1 @055.0s — 构图重心稳定，色调统一", 10);
    $("#et1").classList.add("cited"); $("#sf2").classList.add("flash");
    await sleep(reduced ? 60 : 1200); if (!alive()) return;
    evLine("ev-obs", "<b>evidence</b> · tile#2 @060.0s — 主体显著性集中，无干扰热点", 10);
    $("#et2").classList.add("cited"); $("#sf4").classList.add("flash");
    await sleep(reduced ? 60 : 1200); if (!alive()) return;
    evLine("ev-ok", "visual_impact = 8.8 / 10 · 详细推理由 rubric 锚定");
    $("#dimVisual").classList.add("show");

    await sleep(800); if (!alive()) return;
    evLine("ev-call", "opus5.judge(dimension=\"clarity\", rubric=\"rubric_v1\")");
    await sleep(600); if (!alive()) return;
    evLine("ev-obs", "<b>evidence</b> · tile#3 @065.0s — 字幕对比度达标，无溢出", 10);
    $("#et3").classList.add("cited"); $("#sf6").classList.add("flash");
    await sleep(reduced ? 60 : 1200); if (!alive()) return;
    evLine("ev-obs", "<b>evidence</b> · tile#4 @070.0s — 动效未遮挡正文信息", 10);
    $("#et4").classList.add("cited"); $("#sf8").classList.add("flash");
    await sleep(reduced ? 60 : 1200); if (!alive()) return;
    evLine("ev-ok", "clarity = 9.2 / 10 · 详细推理由 rubric 锚定");
    $("#dimClarity").classList.add("show");

    await sleep(600); if (!alive()) return;
    evLine("ev-sys", "▸ 2 dimensions scored · every point backed by cited keyframes");

    await sleep(16000); if (!alive()) return;
    evalRun();
  }

  buildStrip(); buildTiles();
  const eio = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { eio.disconnect(); evalRun(); }
  }), { threshold: .2 });
  eio.observe(evalBox);
}

/* ───────────── 7. copy bibtex ───────────── */
const copyBtn = $("#copyBib");
if (copyBtn) copyBtn.addEventListener("click", async () => {
  const txt = $("#bibText").textContent;
  try { await navigator.clipboard.writeText(txt); }
  catch {
    const ta = document.createElement("textarea");
    ta.value = txt; document.body.appendChild(ta); ta.select();
    document.execCommand("copy"); ta.remove();
  }
  copyBtn.textContent = "COPIED ✓";
  $("#bibBox").classList.add("copied");
  setTimeout(() => { copyBtn.textContent = "COPY"; $("#bibBox").classList.remove("copied"); }, 1800);
});
})();
