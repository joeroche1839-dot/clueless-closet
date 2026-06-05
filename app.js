// ── As If! Virtual Closet ──────────────────────────────────
const STORE_KEY = "asif_closet_v1";

const $ = (id) => document.getElementById(id);
const grid = $("grid");
const emptyState = $("empty");
const filters = $("filters");

let outfits = load();
let activeCat = "all";
let pendingImage = null; // base64 of the photo being added

// ── welcome splash (shows on every load) ────────────────────
const welcome = $("welcome");
function dismissWelcome() { welcome.classList.add("hide"); }
$("welcomeBtn").addEventListener("click", dismissWelcome);

// ── persistence ────────────────────────────────────────────
function load() {
  try { return JSON.parse(localStorage.getItem(STORE_KEY)) || []; }
  catch { return []; }
}
function save() {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(outfits));
  } catch (e) {
    alert("Whoa — your closet is full! Try removing a few looks. (Browser storage limit reached.)");
  }
}

// ── rendering ───────────────────────────────────────────────
function render() {
  const list = activeCat === "all" ? outfits : outfits.filter(o => o.cat === activeCat);
  grid.innerHTML = "";

  if (outfits.length === 0) {
    emptyState.classList.add("show");
    return;
  }
  emptyState.classList.remove("show");

  if (list.length === 0) {
    grid.innerHTML = `<p style="grid-column:1/-1;text-align:center;color:var(--muted);padding:30px">
      Nothing in <strong>${activeCat}</strong> yet. As if!</p>`;
    return;
  }

  list.forEach((o) => {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <button class="card-del" title="Remove">×</button>
      <img class="card-img" src="${o.img}" alt="${escapeHtml(o.name)}" />
      <div class="card-body">
        <div class="card-name">${escapeHtml(o.name)}</div>
        <span class="card-cat">${escapeHtml(o.cat)}</span>
      </div>`;
    card.querySelector(".card-del").addEventListener("click", () => removeOutfit(o.id));
    grid.appendChild(card);
  });
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function removeOutfit(id) {
  outfits = outfits.filter(o => o.id !== id);
  save();
  render();
}

// ── filters ─────────────────────────────────────────────────
filters.addEventListener("click", (e) => {
  const chip = e.target.closest(".chip");
  if (!chip) return;
  filters.querySelectorAll(".chip").forEach(c => c.classList.remove("active"));
  chip.classList.add("active");
  activeCat = chip.dataset.cat;
  render();
});

// ── upload modal ────────────────────────────────────────────
const modal = $("modal");
const drop = $("drop");
const fileInput = $("fileInput");
const preview = $("preview");
const nameInput = $("nameInput");
const catInput = $("catInput");

function openModal() {
  resetModal();
  modal.classList.add("open");
}
function closeModal() { modal.classList.remove("open"); }
function resetModal() {
  pendingImage = null;
  preview.src = "";
  drop.classList.remove("has-image");
  nameInput.value = "";
  catInput.value = "Full Looks";
}

$("addBtn").addEventListener("click", openModal);
$("heroAdd").addEventListener("click", openModal);
$("modalClose").addEventListener("click", closeModal);
modal.addEventListener("click", (e) => { if (e.target === modal) closeModal(); });

fileInput.addEventListener("change", (e) => handleFile(e.target.files[0]));

// "Choose Photo" → file picker;  "Take Photo" → in-app camera (with native fallback)
$("chooseBtn").addEventListener("click", () => fileInput.click());
$("cameraBtn").addEventListener("click", openCamera);
$("cameraFallback").addEventListener("change", (e) => handleFile(e.target.files[0]));

["dragover", "dragenter"].forEach(ev =>
  drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.add("dragover"); }));
["dragleave", "drop"].forEach(ev =>
  drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.remove("dragover"); }));
drop.addEventListener("drop", (e) => {
  const file = e.dataTransfer.files[0];
  if (file) handleFile(file);
});

function handleFile(file) {
  if (!file || !file.type.startsWith("image/")) {
    alert("Please pick an image file. 💛");
    return;
  }
  resizeImage(file, 900, applyImage);
}

// shared: set the pending photo from any source (file or camera)
function applyImage(dataUrl) {
  pendingImage = dataUrl;
  preview.src = dataUrl;
  drop.classList.add("has-image");
  if (!nameInput.value) nameInput.focus();
}

// downscale + compress so localStorage doesn't fill up instantly
function resizeImage(file, maxDim, cb) {
  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      if (width > height && width > maxDim) { height = height * maxDim / width; width = maxDim; }
      else if (height > maxDim) { width = width * maxDim / height; height = maxDim; }
      const canvas = document.createElement("canvas");
      canvas.width = width; canvas.height = height;
      canvas.getContext("2d").drawImage(img, 0, 0, width, height);
      cb(canvas.toDataURL("image/jpeg", 0.82));
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

$("saveBtn").addEventListener("click", () => {
  if (!pendingImage) { alert("Add a photo of your look first! 📸"); return; }
  const name = nameInput.value.trim() || "Untitled Look";
  outfits.unshift({
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    img: pendingImage,
    name,
    cat: catInput.value,
  });
  save();
  closeModal();
  // reset filter to the saved item's category so it's visible
  render();
});

// ── in-app camera ───────────────────────────────────────────
const cameraModal = $("camera");
const camVideo = $("camVideo");
const camStage = camVideo.closest(".camera-stage");
const camError = $("camError");
let camStream = null;
let facing = "environment"; // back camera by default (best for outfit flat-lays)

function cameraSupported() {
  return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
}

function openCamera() {
  // No camera API (or insecure context) → fall back to the native capture input
  if (!cameraSupported()) {
    $("cameraFallback").click();
    return;
  }
  cameraModal.classList.add("open");
  startStream();
}

async function startStream() {
  stopStream();
  camStage.classList.remove("error");
  try {
    camStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 1280 } },
      audio: false,
    });
    camVideo.srcObject = camStream;
  } catch (err) {
    // Permission denied / no camera → show message and offer native picker
    camStage.classList.add("error");
    camError.textContent = err && err.name === "NotAllowedError"
      ? "Camera access was blocked. Allow camera in your browser settings, or use “Choose Photo” instead. 💛"
      : "No camera available here. Tap “Choose Photo” to upload from your library instead.";
  }
}

function stopStream() {
  if (camStream) { camStream.getTracks().forEach(t => t.stop()); camStream = null; }
  camVideo.srcObject = null;
}

function closeCamera() {
  stopStream();
  cameraModal.classList.remove("open");
}

$("camShutter").addEventListener("click", () => {
  if (!camStream || !camVideo.videoWidth) return;
  // draw current frame, downscaled to 900px max, into a jpeg
  const max = 900;
  let w = camVideo.videoWidth, h = camVideo.videoHeight;
  if (w > h && w > max) { h = h * max / w; w = max; }
  else if (h > max) { w = w * max / h; h = max; }
  const canvas = document.createElement("canvas");
  canvas.width = w; canvas.height = h;
  canvas.getContext("2d").drawImage(camVideo, 0, 0, w, h);
  applyImage(canvas.toDataURL("image/jpeg", 0.82));
  closeCamera();
});

$("camFlip").addEventListener("click", () => {
  facing = facing === "environment" ? "user" : "environment";
  startStream();
});

$("camClose").addEventListener("click", closeCamera);
cameraModal.addEventListener("click", (e) => { if (e.target === cameraModal) closeCamera(); });

// ── "Pick my outfit" spotlight ──────────────────────────────
const spotlight = $("spotlight");
function pickOutfit() {
  if (outfits.length === 0) { openModal(); return; }
  const pool = activeCat === "all" ? outfits : outfits.filter(o => o.cat === activeCat);
  const choice = (pool.length ? pool : outfits)[Math.floor(Math.random() * (pool.length || outfits.length))];
  $("spotImg").src = choice.img;
  $("spotName").textContent = choice.name;
  spotlight.classList.add("open");
}
$("pickBtn").addEventListener("click", pickOutfit);
$("reroll").addEventListener("click", pickOutfit);
$("spotClose").addEventListener("click", () => spotlight.classList.remove("open"));
spotlight.addEventListener("click", (e) => { if (e.target === spotlight) spotlight.classList.remove("open"); });

// close modals on Escape
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") { closeModal(); closeCamera(); spotlight.classList.remove("open"); }
});

// ── go ──────────────────────────────────────────────────────
render();
