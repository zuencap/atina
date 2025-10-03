import { APP_VERSION } from './config.js';
import {
  photos,
  wikiTitles,
  tips,
  places,
  activities,
  weather,
  daysMain,
  daysAlt,
  daysAlt3,
  foodWikiMap
} from './data.js';

// Show version in footer
(function(){
  let el = document.getElementById('appVersion');
  if (el) el.textContent = 'Version ' + APP_VERSION;
  el = document.getElementById('appVersion-mobile');
  if (el) el.textContent = 'Version ' + APP_VERSION;
})();
/* app.js — Atina Roadtrip PWA (Lokasyon + Yeme-İçme tek sayfa) */

/* ----------------- Küçük yardımcılar ----------------- */
function setVh() {
  document.documentElement.style.setProperty('--vh', (window.innerHeight * 0.01) + 'px');
}
setVh(); addEventListener('resize', setVh);

function qs(sel, root=document){ return root.querySelector(sel); }
function qsa(sel, root=document){ return [...root.querySelectorAll(sel)]; }

/* ----------------- Harita kurulum ----------------- */
const map = L.map('map').setView([37.9838, 23.7275], 7);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors'
}).addTo(map);

async function wikiSummary(title) {
  try {
    const resp = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`);
    if (!resp.ok) return null;
    return await resp.json();
  } catch (e) {
    return null;
  }
}
async function wikiThumbFor(title) {
  const data = await wikiSummary(title);
  return data?.thumbnail?.source || null;
}
function wikiUrlForTitle(title) {
  return `https://en.wikipedia.org/wiki/${encodeURIComponent(title)}`;
}
function mapsUrl(name) {
  const coords = places[name];
  return coords
    ? `https://www.google.com/maps/search/?api=1&query=${coords[0]},${coords[1]}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name)}`;
}
async function loadPlacePhoto(name) {
  const title = wikiTitles[name];
  if (!title) return;
  const data = await wikiSummary(title);
  if (!data) return;
  qsa('img.info-photo').forEach((img) => {
    if (data?.thumbnail?.source) {
      img.src = data.thumbnail.source;
    }
  });
  qsa('#photo-credit').forEach((el) => {
    if (data?.content_urls?.desktop?.page) {
      el.innerHTML = `Fotoğraf: <a href="${data.content_urls.desktop.page}" target="_blank" rel="noopener">Wikipedia</a>`;
    }
  });
}

function weatherFor(stop, dateKey) {
  const weatherGroupMap = {
    'Atina Uluslararası Havalimanı (ATH)': 'ath',
    Atina: 'ath',
    Sounion: 'ath',
    'Pire Limanı': 'ath',
    Glyfada: 'ath',
    'Paralia Varkiza': 'ath',
    Delphi: 'del',
    Nafplio: 'naf',
    Epidavros: 'naf',
    Mykene: 'naf',
    Tolo: 'naf',
    Hydra: 'hyd',
    Paros: 'par',
    Antiparos: 'par',
    Aegina: 'hyd',
    Agistri: 'hyd',
    'Rafina Limanı': 'ath',
    Marathon: 'ath',
    'Schinias Plajı': 'ath',
    'Ramnous Ören Yeri': 'ath',
    'Marmari (Evia)': 'ath',
    Karystos: 'ath',
    'Chalkida (Evia)': 'ath',
    'Steni Dirfyos': 'ath',
    'Vouliagmeni Gölü': 'ath',
    'Kavouri Plajı': 'ath',
  };
  const group = weatherGroupMap[stop] || 'ath';
  return weather[dateKey]?.[group]?.txt || '';
}
function formatDateTR(dateKey) {
  const [y, m, d] = dateKey.split('-');
  const ay = { 10: 'Eki' }[m] || m;
  return `${parseInt(d, 10)} ${ay}`;
}
function setForecast(name) {
  const holders = qsa('#info-content #forecast, #info-content-mobile #forecast');
  const dates = Object.keys(weather).sort();
  const html = dates
    .map((d) => `<li class="forecast-item"><strong>${formatDateTR(d)}:</strong> ${weatherFor(name, d) || '—'}</li>`)
    .join('');
  holders.forEach((h) => h && (h.innerHTML = html));
}



/* ----------------- Görünüm durumu ----------------- */
let markers = {}; let polylines = []; let stopToDayIndex = {};
const defaultOpacity = 0.6;
const daysListDesktop = qs('#days-list');
const daysListMobile  = qs('#days-list-mobile');

const weatherLayer = L.layerGroup().addTo(map);
let lastWeatherDateKey = null;

function clearWeatherBadges(){ weatherLayer.clearLayers(); }
function showWeatherBadgesForDate(dateKey){
  clearWeatherBadges();
  const anchorMap = {
    ath: { name: 'Atina', coords: places['Atina'] },
    del: { name: 'Delphi', coords: places['Delphi'] },
    naf: { name: 'Nafplio', coords: places['Nafplio'] },
    hyd: { name: 'Hydra', coords: places['Hydra'] },
    par: { name: 'Paros', coords: places['Paros'] }
  };
  Object.entries(anchorMap).forEach(([group, meta])=>{
    const wx = weather[dateKey]?.[group]?.txt;
    if(!wx || !meta?.coords) return;
    const tip = L.tooltip({ permanent:true, direction:'top', offset:[0,-6], className:'wx-tooltip' })
      .setLatLng(meta.coords).setContent(`${meta.name}: ${wx}`);
    weatherLayer.addLayer(tip);
  });
  lastWeatherDateKey = dateKey;
}
function isWeatherOn(){
  const d = qs('#weatherToggle'); const m = qs('#weatherToggleMobile');
  return (m?.checked ?? true) && (d?.checked ?? true);
}
function maybeShowWeather(dateKey){
  if (isWeatherOn()) showWeatherBadgesForDate(dateKey);
  else clearWeatherBadges();
  lastWeatherDateKey = dateKey;
}

function resetPolylines(){ polylines.forEach(pl=> pl && map.removeLayer(pl)); polylines = []; }
function resetView(){ resetPolylines(); clearWeatherBadges(); }

function buildInfoHTML(name, dateKey){
  const info = tips[name] || { about:"", see:[], eat:[], drink:[], localFood:[], localDrink:[] };
  const wx = weatherFor(name, dateKey || Object.keys(weather)[0]);
  const img = photos[name] || "https://source.unsplash.com/600x360/?greece";
  const maps = mapsUrl(name);
  return `
    <div class="info-title">
      <h4 style="margin:6px 0;">${name}</h4>
      <span class="wx">${wx || ''}</span>
    </div>
    <p><a class="btn" href="${maps}" target="_blank" rel="noopener">Google Maps’te Aç</a></p>
    <img class="info-photo" src="${img}" alt="${name} foto"/>
    <div id="photo-credit" class="muted" style="margin-top:4px;"></div>
    <div class="section"><span class="chip">4–10 Ekim Hava</span><ul id="forecast" class="list forecast-list"></ul></div>
    <div class="section"><span class="chip">Hakkında</span><div class="muted">${info.about || ''}</div></div>
    <div class="section"><span class="chip">Görülecekler</span><ul class="list">${(info.see||[]).map(i=>`<li>${i}</li>`).join('')}</ul></div>
    <div class="section"><span class="chip">Yemek</span><ul class="list">${(info.eat||[]).map(i=>`<li>${i}</li>`).join('')}</ul></div>
    <div class="section"><span class="chip">İçecek</span><ul class="list">${(info.drink||[]).map(i=>`<li>${i}</li>`).join('')}</ul></div>
    <div class="section"><span class="chip">Yerel Lezzetler</span><ul class="list">${(info.localFood||[]).map(i=>`<li>${i}</li>`).join('')}</ul></div>
    <div class="section"><span class="chip">Yerel İçecekler</span><ul class="list">${(info.localDrink||[]).map(i=>`<li>${i}</li>`).join('')}</ul></div>
  `;
}
const infoElDesktop = qs('#info-content');
const infoElMobile  = qs('#info-content-mobile');
function setInfo(name, dateKey){
  const html = buildInfoHTML(name, dateKey);
  if(infoElDesktop) infoElDesktop.innerHTML = html;
  if(infoElMobile)  infoElMobile.innerHTML  = html;
  loadPlacePhoto(name); setForecast(name);
}

/* ----------------- Rota render ----------------- */
function renderPlace(div, stop, dateKey){
  const w = weatherFor(stop, dateKey);
  div.className='place';
  div.innerHTML = `<strong>${stop}</strong> <span class="meta">— ${activities[stop]||''}</span> <span class="badge">${w}</span>`;
}

function renderRouteLists(days){
  [daysListDesktop, daysListMobile].forEach(c => c && (c.innerHTML=''));
  stopToDayIndex = {};
  days.forEach((dayObj, idx)=>{
    const dayDiv = document.createElement('div'); dayDiv.className='day';
    const dayHeader = document.createElement('h4');
    const colorBox = document.createElement('div'); colorBox.className='color-box';
    colorBox.style.cssText = `width:14px;height:14px;margin-right:6px;border:1px solid #555;border-radius:3px;background:${dayObj.color}`;
    dayHeader.appendChild(colorBox);
    const text = document.createElement('span'); text.innerText = dayObj.day; dayHeader.appendChild(text);
    dayDiv.appendChild(dayHeader);

    dayHeader.onclick = ()=>{ polylines.forEach((pl,i)=> pl && pl.setStyle({opacity: i===idx?1:0.1})); maybeShowWeather(dayObj.dateKey); };

    (dayObj.stops||[]).forEach(stop=>{
      stopToDayIndex[stop] = idx;
      const placeDiv = document.createElement('div'); renderPlace(placeDiv, stop, dayObj.dateKey);
      placeDiv.onclick = ()=>{
        const coords = places[stop];
        if(coords){ map.setView(coords, 10); markers[stop]?.openPopup(); }
        polylines.forEach((pl,i)=> pl && pl.setStyle({opacity: i===idx?1:0.1}));
        maybeShowWeather(dayObj.dateKey);
        setInfo(stop, dayObj.dateKey);
        openInfoSheetOnMobile();
      };
      dayDiv.appendChild(placeDiv);
    });

    const planList = document.createElement('ul'); planList.className='plan';
    (dayObj.plan||[]).forEach(item => { const li=document.createElement('li'); li.textContent=item; planList.appendChild(li); });
    dayDiv.appendChild(planList);

    // desktop & mobile kopyala
    const dayDivClone = dayDiv.cloneNode(true);
    daysListDesktop?.appendChild(dayDivClone);
    daysListMobile?.appendChild(dayDiv);

    // Re-attach listeners to the clone
    dayDivClone.querySelector('h4').onclick = dayHeader.onclick;
    const placeDivs = dayDiv.querySelectorAll('.place');
    const clonedPlaceDivs = dayDivClone.querySelectorAll('.place');
    clonedPlaceDivs.forEach((clonedPlaceDiv, i) => {
        clonedPlaceDiv.onclick = placeDivs[i].onclick;
    });
  });
}

function renderPolylines(days){
  resetPolylines();
  days.forEach(dayObj=>{
    const coordsList = (dayObj.stops||[]).map(s=>places[s]).filter(Boolean);
    if(coordsList.length > 1){
      const poly = L.polyline(coordsList, { color: dayObj.color, weight: 4, opacity: defaultOpacity }).addTo(map);
      polylines.push(poly);
    } else {
      polylines.push(null);
    }
  });
}

function getDaysForRoute(routeKey) {
  switch (routeKey) {
    case 'alt':
      return daysAlt;
    case 'alt2':
      return daysAlt3;
    default:
      return daysMain;
  }
}

function renderRoute(routeKey){
  const days = getDaysForRoute(routeKey);
  resetView();
  renderRouteLists(days);
  renderPolylines(days);
  if (days[0]?.stops?.length) setInfo(days[0].stops[0], days[0].dateKey);
}

/* ----------------- Markerlar ----------------- */
for (const [name, coords] of Object.entries(places)) {
  const marker = L.marker(coords).addTo(map).bindPopup(name);
  marker.on('click', ()=>{
    qsa('.place').forEach(c=> c.style.background='');
    qsa('.place').filter(e=> e.innerText.includes(name)).forEach(e=> e.style.background='#d1ecf1');

        const days = getDaysForRoute(currentRouteKey);
    const idx = stopToDayIndex[name];
    if (idx !== undefined) {
      polylines.forEach((pl, i) => pl && pl.setStyle({ opacity: i===idx?1:0.1 }));
      maybeShowWeather(days[idx].dateKey);
      setInfo(name, days[idx].dateKey);
    } else {
      const fallbackDate = lastWeatherDateKey || (days[0]?.dateKey) || Object.keys(weather)[0];
      setInfo(name, fallbackDate);
    }
    openInfoSheetOnMobile();
  });
  markers[name]=marker;
}

/* ----------------- Kontroller ----------------- */
// Masaüstü
const routeToggle = qs('#routeToggle');
let currentRouteKey = routeToggle ? routeToggle.value : 'main';
qs('#reset')?.addEventListener('click', ()=>{ renderRoute(currentRouteKey); if(!isWeatherOn()) clearWeatherBadges(); });
routeToggle?.addEventListener('change', e=>{ currentRouteKey = e.target.value; renderRoute(currentRouteKey); if(!isWeatherOn()) clearWeatherBadges(); });
qs('#weatherToggle')?.addEventListener('change', e=>{
  if(e.target.checked && lastWeatherDateKey) showWeatherBadgesForDate(lastWeatherDateKey); else clearWeatherBadges();
});

// Mobil
const fabInfo = qs('#fabInfo'), fabRoute = qs('#fabRoute');
const sheetInfo = qs('#sheetInfo'), drawerRoute = qs('#drawerRoute');
function openInfoSheetOnMobile(){ if(matchMedia('(max-width:1024px)').matches){ sheetInfo?.classList.add('open'); } }
fabInfo?.addEventListener('click', ()=> sheetInfo?.classList.toggle('open'));
fabRoute?.addEventListener('click', ()=> drawerRoute?.classList.toggle('open'));

const routeToggleMobile = qs('#routeToggleMobile');
const weatherToggleMobile = qs('#weatherToggleMobile');
const resetMobile = qs('#resetMobile');

routeToggleMobile?.addEventListener('change', e=>{ currentRouteKey = e.target.value; if(routeToggle) routeToggle.value = currentRouteKey; renderRoute(currentRouteKey); if(!isWeatherOn()) clearWeatherBadges(); });
weatherToggleMobile?.addEventListener('change', ()=>{ if(isWeatherOn() && lastWeatherDateKey){ showWeatherBadgesForDate(lastWeatherDateKey); } else { clearWeatherBadges(); } });
resetMobile?.addEventListener('click', ()=>{ renderRoute(currentRouteKey); if(!isWeatherOn()) clearWeatherBadges(); });

/* ----------------- Tam ekran modları ----------------- */
const btnLocations = qs('#btnLocations');
const btnFoods = qs('#btnFoods');
const modeLocations = qs('#modeLocations');
const modeFoods = qs('#modeFoods');
const gridLocations = qs('#gridLocations');
const gridFoods = qs('#gridFoods');

function openOverlay(el){ el?.classList.add('open'); }
function closeOverlay(el){ el?.classList.remove('open'); }
qsa('.overlay .close').forEach(btn=> btn.addEventListener('click', ()=>{
  const sel = btn.getAttribute('data-close'); if(sel) closeOverlay(qs(sel));
}));
addEventListener('keydown', e=>{ if(e.key==='Escape'){ [modeLocations, modeFoods].forEach(closeOverlay); }});

btnLocations?.addEventListener('click', ()=>{ buildLocationsGrid(); openOverlay(modeLocations); });
btnFoods?.addEventListener('click', ()=>{ buildFoodsGrid(); openOverlay(modeFoods); });

function cardTemplate(title, img, href, subtitle){
  return `<a class="card" href="${href}" target="_blank" rel="noopener">
            <img loading="lazy" src="${img}" alt="${title}">
            <div class="title" style="padding:8px 10px;font-size:14px;font-weight:600;">${title}</div>
            ${subtitle?`<div class="subtitle" style="padding:0 10px 10px;font-size:12px;color:#555;">${subtitle}</div>`:''}
          </a>`;
}

function wikiUrlByName(name){
  const t = wikiTitles[name];
  return t ? wikiUrlForTitle(t) : '#';
}

function buildLocationsGrid(){
  if(!gridLocations) return;
  gridLocations.innerHTML='';
  const names = Object.keys(places);
  names.forEach(n=>{
    const fallback = photos[n] || 'https://source.unsplash.com/600x360/?greece';
    gridLocations.insertAdjacentHTML('beforeend', cardTemplate(n, fallback, wikiUrlByName(n), ''));
  });
  // Lazy Wikipedia görseli güncelle
  names.forEach(async (n, i)=>{
    const t = wikiTitles[n]; if(!t) return;
    const src = await wikiThumbFor(t); if(!src) return;
    const card = gridLocations.children[i]; const imgEl = card?.querySelector('img'); if(imgEl) imgEl.src = src;
  });
}

function uniqueFoods(){
  const set = new Set();
  Object.values(tips).forEach(v=>{
    (v.localFood||[]).forEach(x=> set.add(x));
    (v.localDrink||[]).forEach(x=> set.add(x));
  });
  return [...set];
}
async function buildFoodsGrid(){
  if(!gridFoods) return;
  gridFoods.innerHTML='';
  const items = uniqueFoods();
  items.forEach(label=>{
    const placeholder = `https://source.unsplash.com/600x360/?${encodeURIComponent(label)},greek`;
    const href = wikiUrlForTitle(foodWikiMap[label] || label);
    gridFoods.insertAdjacentHTML('beforeend', cardTemplate(label, placeholder, href, ''));
  });
  const cards = qsa('#gridFoods .card');
  for(let i=0;i<items.length;i++){
    const label = items[i]; const title = foodWikiMap[label] || label;
    const src = await wikiThumbFor(title);
    if(src && cards[i]){ const img = cards[i].querySelector('img'); if(img) img.src = src; }
  }
}

/* ----------------- İlk çizim ----------------- */
renderRoute(currentRouteKey);

// Basit smoke testler (konsolda)
try{
  console.assert(typeof L !== 'undefined', 'Leaflet yüklenmeli');
  console.assert(qs('#btnLocations'), 'Lokasyonlar butonu bulunmalı');
  console.assert(qs('#btnFoods'), 'Yeme-İçme butonu bulunmalı');
}catch(e){}
