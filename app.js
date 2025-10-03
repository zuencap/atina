import { APP_VERSION } from './config.js';

// Show version in footer
(function(){
  const el = document.getElementById("appVersion");
  if (el) el.textContent = "Version " + APP_VERSION;
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

/* ----------------- Medya / Wikipedia yardımcıları ----------------- */
const photos = {
  'Atina Uluslararası Havalimanı (ATH)': 'https://source.unsplash.com/600x360/?airport,athens',
  Atina: 'https://source.unsplash.com/600x360/?athens,acropolis',
  Sounion: 'https://source.unsplash.com/600x360/?sounion,poseidon,temple',
  Delphi: 'https://source.unsplash.com/600x360/?delphi,temple',
  'Korinthos Kanalı': 'https://source.unsplash.com/600x360/?corinth,canal',
  Nafplio: 'https://source.unsplash.com/600x360/?nafplio,port',
  Epidavros: 'https://source.unsplash.com/600x360/?epidavros,theater',
  Mykene: 'https://source.unsplash.com/600x360/?mycenae,ruins',
  Tolo: 'https://source.unsplash.com/600x360/?tolo,beach',
  'Pire Limanı': 'https://source.unsplash.com/600x360/?piraeus,port',
  Hydra: 'https://source.unsplash.com/600x360/?hydra,greece',
  Paros: 'https://source.unsplash.com/600x360/?paros,island',
  Antiparos: 'https://source.unsplash.com/600x360/?antiparos,island',
  Glyfada: 'https://source.unsplash.com/600x360/?glyfada,athens',
  'Paralia Varkiza': 'https://source.unsplash.com/600x360/?varkiza,beach',
  Aegina: 'https://source.unsplash.com/600x360/?aegina,greece',
  Agistri: 'https://source.unsplash.com/600x360/?agistri,greece',
  Marathon: 'https://source.unsplash.com/600x360/?marathon,attica',
  'Schinias Plajı': 'https://source.unsplash.com/600x360/?schinias,beach',
  'Ramnous Ören Yeri': 'https://source.unsplash.com/600x360/?rhamnous,ruins',
  'Rafina Limanı': 'https://source.unsplash.com/600x360/?rafina,port',
  'Marmari (Evia)': 'https://source.unsplash.com/600x360/?marmari,euboea',
  Karystos: 'https://source.unsplash.com/600x360/?karystos,greece',
  'Chalkida (Evia)': 'https://source.unsplash.com/600x360/?chalcis,bridge',
  'Steni Dirfyos': 'https://source.unsplash.com/600x360/?dirfys,forest',
  'Vouliagmeni Gölü': 'https://source.unsplash.com/600x360/?vouliagmeni,lake',
  'Kavouri Plajı': 'https://source.unsplash.com/600x360/?kavouri,beach',
};

const wikiTitles = {
  'Atina Uluslararası Havalimanı (ATH)': 'Athens_International_Airport',
  Atina: 'Acropolis_of_Athens',
  Sounion: 'Temple_of_Poseidon_at_Sounion',
  Delphi: 'Delphi',
  'Korinthos Kanalı': 'Corinth_Canal',
  Nafplio: 'Nafplio',
  Epidavros: 'Ancient_Theatre_of_Epidaurus',
  Mykene: 'Lion_Gate',
  Tolo: 'Tolo,_Greece',
  'Pire Limanı': 'Port_of_Piraeus',
  Hydra: 'Hydra_(island)',
  Paros: 'Paros',
  Antiparos: 'Antiparos',
  Glyfada: 'Glyfada',
  'Paralia Varkiza': 'Varkiza',
  Aegina: 'Aegina',
  Agistri: 'Agistri',
  Marathon: 'Marathon, Greece',
  'Schinias Plajı': 'Schinias National Park',
  'Ramnous Ören Yeri': 'Rhamnous',
  'Rafina Limanı': 'Rafina',
  'Marmari (Evia)': 'Marmari, Euboea',
  Karystos: 'Karystos',
  'Chalkida (Evia)': 'Chalcis',
  'Steni Dirfyos': 'Steni Dirfyos',
  'Vouliagmeni Gölü': 'Lake Vouliagmeni',
  'Kavouri Plajı': 'Kavouri',
};

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

/* ----------------- İpuçları (yer hakkında) ----------------- */
const tips = {
  Atina: {
    about: 'Şehrin tarihi kalbi: Akropolis, Plaka, Monastiraki ve Syntagma çevresi.',
    see: ['Akropolis & Müze', 'Anafiotika sokakları', 'Roma/Antik Agora'],
    eat: ['Ta Karamanlidika tou Fani (meze)', 'Kuzina (manzaralı)', 'Oineas'],
    drink: ['Brettos (Plaka)', 'Six d.o.g.s', 'The Clumsies'],
    localFood: ['Souvlaki', 'Moussaka', 'Spanakopita', 'Loukoumades'],
    localDrink: ['Greek coffee', 'Ouzo', 'Tsipouro'],
  },
  Sounion: {
    about: 'Poseidon Tapınağı ile ünlü, gün batımı efsane.',
    see: ['Poseidon Tapınağı', 'Sahil yolu manzara molaları'],
    eat: ['Lavrio balık tavernaları'],
    drink: ['Sahil kafeleri'],
    localFood: ['Grida', 'Ahtapot ızgara'],
    localDrink: ['Buzlu uzo', 'Beyaz şarap (Attika)'],
  },
  Delphi: {
    about: 'Antik dünyanın kehanet merkezi; dağ manzaraları.',
    see: ['Apollo Tapınağı', 'Stadion', 'Arkeoloji Müzesi'],
    eat: ["Arachova'da taverna"],
    drink: ['Dağ kahvesi & yerel şaraplar'],
    localFood: ['Arachova Formaela peyniri', 'Keçi/kuzu fırın'],
    localDrink: ['Kırmızı şarap', 'Tsipouro'],
  },
  'Korinthos Kanalı': {
    about: "Ege ile İyon'u bağlayan dar kanal.",
    see: ['Köprü üstü fotoğraf'],
    eat: ['Yol üstü atıştırmalık'],
    drink: ['Kısa kahve molası'],
    localFood: ['Korint üzümü', 'Loukaniko'],
    localDrink: ['Bira'],
  },
  Nafplio: {
    about: 'Venedik izleri taşıyan romantik eski şehir.',
    see: ['Palamidi Kalesi', 'Bourtzi'],
    eat: ['Eski şehir tavernaları'],
    drink: ['Liman barları'],
    localFood: ['Gogges', 'Taze deniz ürünleri'],
    localDrink: ['Beyaz şarap', 'Ouzo'],
  },
  Epidavros: {
    about: 'Akustiğiyle ünlü antik tiyatro.',
    see: ['Tiyatro', 'Asklepieion'],
    eat: ['Yol üstü taverna'],
    drink: ['Serin içecek'],
    localFood: ['Zeytinyağlılar', 'Portakallı tatlılar'],
    localDrink: ['Taze portakal suyu'],
  },
  Mykene: {
    about: "Agamemnon'un diyarı; Aslanlı Kapı.",
    see: ['Aslanlı Kapı', 'Kraliyet mezarları'],
    eat: ["Nafplio'da öğle"],
    drink: ['Kahve molası'],
    localFood: ['Gogges', 'Kuzu tandır'],
    localDrink: ['Kırmızı şarap'],
  },
  Tolo: {
    about: 'Sakin kumsallar; deniz günü için ideal.',
    see: ['Plajlar'],
    eat: ['Sahil tavernaları'],
    drink: ['Dondurma & soğuk içecek'],
    localFood: ['Kalamar tava', 'Çipura/Levrek ızgara'],
    localDrink: ['Bira', 'Beyaz şarap'],
  },
  'Pire Limanı': {
    about: 'Adalara feribotların kalktığı ana liman.',
    see: ['Marina Zea'],
    eat: ['Balık restoranları'],
    drink: ['Liman kafeleri'],
    localFood: ['Midye saganaki', 'Gavros tiganito'],
    localDrink: ['Ouzo'],
  },
  Hydra: {
    about: 'Arabasız ada; taş evler ve koylar.',
    see: ['Liman çevresi', 'Kısa yürüyüş rotaları'],
    eat: ['Ada tavernaları'],
    drink: ['Sahil barları'],
    localFood: ['Amygdalota', 'Taze balık'],
    localDrink: ['Buzlu uzo', 'Frappe'],
  },
  Paros: {
    about: 'Plajlar ve Naousa/Parikia kasabaları.',
    see: ['Naousa', 'Kolymbithres'],
    eat: ['Deniz ürünleri'],
    drink: ['Beach barlar'],
    localFood: ['Gouna', 'Xynomizithra'],
    localDrink: ['Souma'],
  },
  Antiparos: {
    about: 'Rahat ada atmosferi.',
    see: ['Antiparos Mağarası', 'Kasaba'],
    eat: ['Meyhaneler'],
    drink: ['Kokteyl barlar'],
    localFood: ['Pasteli', 'Ahtapot ızgara'],
    localDrink: ['Souma', 'Ouzo'],
  },
  Glyfada: {
    about: 'Sahil semti; alışveriş ve kafe kültürü.',
    see: ['Sahil yürüyüşü'],
    eat: ['Kafeler & brunch'],
    drink: ['Kahve barları'],
    localFood: ['Gyros', 'Greek salad'],
    localDrink: ['Frappe'],
  },
  'Paralia Varkiza': {
    about: 'Popüler plaj; deniz ve güneş.',
    see: ['Plaj kulüpleri'],
    eat: ['Sahil tavernaları'],
    drink: ['Soğuk içecekler'],
    localFood: ['Ahtapot ızgara', 'Tarama'],
    localDrink: ['Beyaz şarap', 'Bira'],
  },
  'Atina Uluslararası Havalimanı (ATH)': {
    about: 'Atina ana havalimanı.',
    see: ['Duty free'],
    eat: ['Terminal tavernaları'],
    drink: ['Kafe/barlar'],
    localFood: ['Bougatsa', 'Koulouri'],
    localDrink: ['Frappe'],
  },
  Aegina: {
    about: 'Saronik Adaları’nın en yakını; Aphaia Tapınağı, Perdika ve Aegina fıstığıyla ünlü.',
    see: ['Aphaia Tapınağı', 'Perdika köyü', 'Agia Marina'],
    eat: ['Perdika sahil tavernaları', 'Pistachio’lu tatlılar'],
    drink: ['Liman kafeleri', 'Uzo-meze'],
    localFood: ['Aegina fıstığı (PDO)', 'Taze deniz ürünleri'],
    localDrink: ['Uzo', 'Yunan kahvesi'],
  },
  Agistri: {
    about: 'Küçük, sakin koylarıyla deniz günü için ideal; Aponisos popüler.',
    see: ['Aponisos koyu', 'Skala & Megalochori'],
    eat: ['Ada tavernaları', 'Sahilde meze'],
    drink: ['Sahil barları'],
    localFood: ['Kalamar & ahtapot ızgara'],
    localDrink: ['Bira', 'Uzo'],
  },
  Marathon: {
    about: 'Tarihi Maraton ovası; baraj gölü ve anıt alanı ile bilinir.',
    see: ['Marathon Tümülüsü', 'Marathon Barajı'],
    eat: ['Yerel lokantalar'],
    drink: ['Kahve molası'],
    localFood: ['Köy usulü ızgara etler'],
    localDrink: ['Yunan kahvesi'],
  },
  'Schinias Plajı': {
    about: 'Milli park içinde uzun sahiller; rüzgâr/deniz sporları.',
    see: ['Schinias Milli Parkı', 'Uzun kumsal'],
    eat: ['Beach bar & tavernalar'],
    drink: ['Soğuk içecekler'],
    localFood: ['Balık & deniz ürünleri'],
    localDrink: ['Bira', 'Beyaz şarap'],
  },
  'Ramnous Ören Yeri': {
    about: 'Nemesis Tapınağı kalıntıları ve antik kent; Attika’nın kuzeydoğusunda.',
    see: ['Rhamnous arkeolojik alanı', 'Nemesis Tapınağı'],
    eat: ['Yol üstü taverna'],
    drink: ['Su/soğuk içecek'],
    localFood: ['Zeytinyağlılar'],
    localDrink: ['Yunan kahvesi'],
  },
  'Rafina Limanı': {
    about: 'Evia ve Kiklad hattı feribotları için ikinci büyük Atina limanı.',
    see: ['Liman sahili'],
    eat: ['Balık tavernaları'],
    drink: ['Kafeler'],
    localFood: ['Midye saganaki', 'Gavros tiganito'],
    localDrink: ['Uzo'],
  },
  'Marmari (Evia)': {
    about: 'Sessiz sahil kasabası; Rafina’dan feribotla kolay ulaşım.',
    see: ['Marmari sahil', 'Yakın koylar'],
    eat: ['Sahil tavernaları'],
    drink: ['Kafe & barlar'],
    localFood: ['Taze balık', 'Ahtapot ızgara'],
    localDrink: ['Beyaz şarap'],
  },
  Karystos: {
    about: 'Evia’nın güneyi; Bourtzi kulesi, antik akropolis ve Dimosari vadisi.',
    see: ['Bourtzi', 'Eski akropolis kalıntıları', 'Dimosari vadisi (yürüyüş)'],
    eat: ['Liman balıkçıları'],
    drink: ['Sahil barları'],
    localFood: ['Balık & deniz ürünleri'],
    localDrink: ['Bira', 'Beyaz şarap'],
  },
  'Chalkida (Evia)': {
    about: 'Gelgit benzeri akıntılarıyla meşhur köprü; sahil yürüyüşü.',
    see: ['Euripus boğazı köprüsü', 'Sahil şeridi'],
    eat: ['Şehir tavernaları'],
    drink: ['Kahve & dondurma molası'],
    localFood: ['Izgara balık'],
    localDrink: ['Frappe'],
  },
  'Steni Dirfyos': {
    about: 'Dirfys Dağı eteklerinde serin dağ köyü; yerel taverna kültürü.',
    see: ['Köy merkezi', 'Kısa doğa yürüyüşleri'],
    eat: ['Odun fırınında etler', 'Yerel peynirler'],
    drink: ['Dağ kahvesi'],
    localFood: ['Kuzu fırın', 'Ev yapımı börek'],
    localDrink: ['Şarap'],
  },
  'Vouliagmeni Gölü': {
    about: 'Termal kaynaklı lagün; berrak ve ılık su.',
    see: ['Göl platformları', 'Çevre yürüyüşü'],
    eat: ['Yakın kafeler/tavernalar'],
    drink: ['Soğuk içecekler'],
    localFood: ['Deniz ürünleri meze'],
    localDrink: ['Beyaz şarap'],
  },
  'Kavouri Plajı': {
    about: 'Atina Riviera’nın popüler kumsalı; deniz & gün batımı.',
    see: ['Kavouri sahil hattı'],
    eat: ['Sahil tavernaları'],
    drink: ['Beach bar'],
    localFood: ['Kalamar tava', 'Greek salad'],
    localDrink: ['Bira', 'Frappe'],
  },
};

/* ----------------- Yerler / Aktiviteler / Hava ----------------- */
const places = {
  'Atina Uluslararası Havalimanı (ATH)': [37.9364, 23.9445],
  Atina: [37.9838, 23.7275],
  Sounion: [37.65, 24.0333],
  Delphi: [38.4828, 22.501],
  'Korinthos Kanalı': [37.928, 22.991],
  Nafplio: [37.567, 22.8053],
  Epidavros: [37.637, 23.1597],
  Mykene: [37.7308, 22.7543],
  Tolo: [37.521, 22.86],
  'Pire Limanı': [37.942, 23.646],
  Hydra: [37.352, 23.475],
  Paros: [37.085, 25.146],
  Antiparos: [37.041, 25.081],
  Glyfada: [37.862, 23.757],
  'Paralia Varkiza': [37.807, 23.786],
  Aegina: [37.745, 23.427],
  Agistri: [37.692, 23.343],
  Marathon: [38.152, 23.962],
  'Schinias Plajı': [38.1485, 24.0355],
  'Ramnous Ören Yeri': [38.148, 24.1015],
  'Rafina Limanı': [38.0238, 24.0056],
  'Marmari (Evia)': [38.041, 24.315],
  Karystos: [38.013, 24.418],
  'Chalkida (Evia)': [38.4639, 23.6025],
  'Steni Dirfyos': [38.5675, 23.8825],
  'Vouliagmeni Gölü': [37.8107, 23.7938],
  'Kavouri Plajı': [37.8126, 23.7689],
};

const activities = {
  'Atina Uluslararası Havalimanı (ATH)': 'Varış/transfer, check-in & güvenlik/boarding',
  Atina: 'Akropolis, Plaka, Lycabettus',
  Sounion: 'Poseidon Tapınağı gün batımı, plaj',
  Delphi: 'Apollo Tapınağı, müze, Arachova',
  'Korinthos Kanalı': 'Seyir noktası, fotoğraf',
  Nafplio: 'Eski Şehir, Palamidi Kalesi',
  Epidavros: 'Antik tiyatro',
  Mykene: 'Aslanlı Kapı, ören yeri',
  Tolo: 'Plaj ve yüzme',
  'Pire Limanı': 'Feribot/deniz otobüsü kalkış noktası',
  Hydra: 'Arabasız ada — liman, plajlar, taş sokaklar',
  Paros: 'Naousa/Parikia, plajlar; Antiparos geçişi',
  Antiparos: 'Sakin ada havası, kasaba ve mağara',
  Glyfada: 'Sahil semti — kafe/alışveriş',
  'Paralia Varkiza': 'Popüler plaj — deniz günü',
  Aegina: 'Aphaia Tapınağı, Perdika köyü, fıstık (pistachio) ürünleri',
  Agistri: 'Saronik’te deniz günü, Aponisos koyu',
  Marathon: 'Maraton ovası, arkeoloji alanı, baraj gölü',
  'Schinias Plajı': 'Milli park içi uzun sahil, deniz & rüzgâr sporları',
  'Ramnous Ören Yeri': 'Nemesis tapınağı kalıntıları ve antik kent',
  'Rafina Limanı': 'Evia ve Kiklad hattı feribotları',
  'Marmari (Evia)': 'Sessiz sahil kasabası, feribot hattı',
  Karystos: 'Bourtzi, antik akropolis, Dimosari vadisi',
  'Chalkida (Evia)': 'Gelgit benzeri akıntılarıyla meşhur köprü, sahil yürüyüşü',
  'Steni Dirfyos': 'Dirfys eteklerinde serin dağ köyü, taverna',
  'Vouliagmeni Gölü': 'Termal kaynaklı lagün; şifalı su, sakin yüzme',
  'Kavouri Plajı': 'Sahil yürüyüşü ve deniz, Atina Riviera',
};

const weather = {
  '2025-10-04': {
    ath: { txt: '☀️ 21°/15°' },
    del: { txt: '⛅ 17°/6°' },
    naf: { txt: '🌤 22°/13°' },
    hyd: { txt: '☀️ 17°/13°' },
    par: { txt: '🌤 20°/18°' },
  }, // Sat - Sunny
  '2025-10-05': {
    ath: { txt: '☀️ 22°/17°' },
    del: { txt: '☀️ 19°/11°' },
    naf: { txt: '☀️ 24°/16°' },
    hyd: { txt: '☀️ 17°/15°' },
    par: { txt: '☀️ 21°/18°' },
  }, // Sun - Sunny
  '2025-10-06': {
    ath: { txt: '🌧 23°/17°' },
    del: { txt: '☀️ 18°/9°' },
    naf: { txt: '🌧 22°/14°' },
    hyd: { txt: '☀️ 18°/13°' },
    par: { txt: '☀️ 21°/17°' },
  }, // Mon - Light rain
  '2025-10-07': {
    ath: { txt: '⛅ 19°/13°' },
    del: { txt: '⛅ 15°/6°' },
    naf: { txt: '⛅ 19°/11°' },
    hyd: { txt: '⛅ 16°/11°' },
    par: { txt: '🌦️ 18°/14°' },
  }, // Tue - Partly cloudy
  '2025-10-08': {
    ath: { txt: '⛅ 20°/13°' },
    del: { txt: '🌤 17°/8°' },
    naf: { txt: '🌤 19°/12°' },
    hyd: { txt: '🌤 16°/12°' },
    par: { txt: '⛅ 17°/15°' },
  }, // Wed - Partly cloudy
  '2025-10-09': {
    ath: { txt: '☀️ 21°/14°' },
    del: { txt: '⛅ 18°/8°' },
    naf: { txt: '☀️ 21°/13°' },
    hyd: { txt: '☀️ 17°/13°' },
    par: { txt: '⛅ 20°/15°' },
  }, // Thu - Sunny
  '2025-10-10': {
    ath: { txt: '⛅ 22°/15°' },
    del: { txt: '⛅ 18°/10°' },
    naf: { txt: '☀️ 22°/16°' },
    hyd: { txt: '⛅ 17°/14°' },
    par: { txt: '☀️ 20°/16°' },
  }, // Fri - Mostly sunny
};
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

/* ----------------- Günler (iki rota) ----------------- */
const daysMain = [
  {
    day: '4 Ekim (Cmt) — Varış',
    dateKey: '2025-10-04',
    color: 'red',
    stops: ['Atina Uluslararası Havalimanı (ATH)', 'Atina'],
    plan: [
      '16:35 ZRH kalkış — SWISS LX1840',
      '20:10 ATH varış — pasaport & bagaj',
      '21:00 Otele transfer ve akşam yemeği',
    ],
  },
  {
    day: '5 Ekim (Paz)',
    dateKey: '2025-10-05',
    color: 'orange',
    stops: ['Atina', 'Sounion', 'Atina'],
    plan: [
      '09:00 Akropolis & Müze',
      '12:30 Plaka öğle yemeği',
      '15:00 Vouliagmeni plaj/göl',
      '18:30 Poseidon gün batımı',
      '21:00 Atina dönüş',
    ],
  },
  {
    day: '6 Ekim (Pzt)',
    dateKey: '2025-10-06',
    color: 'green',
    stops: ['Atina', 'Delphi', 'Atina'],
    plan: ["07:30 Delphi'ye çıkış (2.5s)", '10:30 Ören yeri & müze', '13:30 Arachova öğle', "16:00 Atina'ya dönüş"],
  },
  {
    day: '7 Ekim (Sal)',
    dateKey: '2025-10-07',
    color: 'blue',
    stops: ['Atina', 'Korinthos Kanalı', 'Nafplio'],
    plan: ['09:00 Korinthos Kanalı', '11:30 Nafplio eski şehir', '16:00 Palamidi Kalesi', '19:30 Akşam'],
  },
  {
    day: '8 Ekim (Çar)',
    dateKey: '2025-10-08',
    color: 'purple',
    stops: ['Nafplio', 'Epidavros', 'Mykene', 'Nafplio'],
    plan: ['09:30 Epidavros', '12:30 Mykene', '16:30 Nafplio sahil', '19:30 Eski şehir'],
  },
  {
    day: '9 Ekim (Per)',
    dateKey: '2025-10-09',
    color: 'brown',
    stops: ['Nafplio', 'Tolo', 'Nafplio'],
    plan: ['10:00 Tolo plaj', '13:00 Sahil öğle', '15:30 Vivari koyu', '18:30 Dondurma turu'],
  },
  {
    day: '10 Ekim (Cum) — Dönüş',
    dateKey: '2025-10-10',
    color: 'darkcyan',
    stops: ['Nafplio', 'Atina Uluslararası Havalimanı (ATH)'],
    plan: ['09:00 Son kahve', "10:00 ATH'ye yol", '15:00 Check-in', '17:20 ATH→ADB Aegean A3996', '18:20 ADB varış'],
  },
];
const daysAlt = [
  {
    day: '4 Ekim (Cmt) — Varış',
    dateKey: '2025-10-04',
    color: '#E91E63',
    stops: ['Atina Uluslararası Havalimanı (ATH)', 'Atina'],
    plan: ['16:35 ZRH kalkış — SWISS LX1840', '20:10 ATH varış', '21:00 Otele giriş'],
  },
  {
    day: '5 Ekim (Paz) — Atina Merkez',
    dateKey: '2025-10-05',
    color: '#FF9800',
    stops: ['Atina'],
    plan: ['Akropolis & Müze', 'Plaka/Monastiraki yürüyüş', 'Syntagma nöbet değişimi', 'Akşam Psiri'],
  },
  {
    day: '6 Ekim (Pzt) — Hydra Günü',
    dateKey: '2025-10-06',
    color: '#4CAF50',
    stops: ['Atina', 'Pire Limanı', 'Hydra', 'Pire Limanı', 'Atina'],
    plan: ["Pire'ye geçiş", 'Hydra feribot', 'Ada merkezi & kısa yürüyüş', "Atina'ya dönüş"],
  },
  {
    day: '7 Ekim (Sal) — Güney Kıyı',
    dateKey: '2025-10-07',
    color: '#2196F3',
    stops: ['Atina', 'Glyfada', 'Paralia Varkiza', 'Atina'],
    plan: ['Glyfada kahvaltı', 'Varkiza plaj', 'Akşam merkez'],
  },
  {
    day: '8 Ekim (Çar) — Paros/Antiparos',
    dateKey: '2025-10-08',
    color: '#9C27B0',
    stops: ['Atina', 'Pire Limanı', 'Paros', 'Antiparos', 'Pire Limanı', 'Atina'],
    plan: ['Erken feribot Paros', 'Parikia/Naousa', 'Antiparos kasaba', 'Dönüş/opsiyon konaklama'],
  },
  {
    day: '9 Ekim (Per) — Serbest',
    dateKey: '2025-10-09',
    color: '#795548',
    stops: ['Atina'],
    plan: ['Müzeler / alışveriş / serbest'],
  },
  {
    day: '10 Ekim (Cum) — Dönüş',
    dateKey: '2025-10-10',
    color: '#008B8B',
    stops: ['Atina Uluslararası Havalimanı (ATH)'],
    plan: ['Valiz & check-out', '15:00 Havalimanı', '17:20 ATH→ADB Aegean A3996'],
  },
];

const daysAlt3 = [
  {
    day: '4 Ekim (Cmt) — Varış & Merkez',
    dateKey: '2025-10-04',
    color: '#2563EB',
    stops: ['Atina'],
    plan: ['20:10 ATH varış → otele geçiş', 'Akşam: Plaka/Monastiraki kısa yürüyüş'],
  },

  {
    day: '5 Ekim (Paz) — Aegina & Agistri (Pire çıkışlı)',
    dateKey: '2025-10-05',
    color: '#0EA5E9',
    stops: ['Atina', 'Pire Limanı', 'Aegina', 'Agistri', 'Pire Limanı', 'Atina'],
    plan: [
      'Sabah: Pire Limanı’na geçiş',
      'Feribot: Aegina (Aphaia Tapınağı / Perdika)',
      'Öğleden sonra: Agistri’de deniz molası',
      'Akşam: Pire → Atina dönüş',
    ],
  },

  {
    day: '6 Ekim (Pzt) — Marathon & Schinias & Rhamnous',
    dateKey: '2025-10-06',
    color: '#10B981',
    stops: ['Atina', 'Marathon', 'Schinias Plajı', 'Ramnous Ören Yeri', 'Atina'],
    plan: [
      'Marathon kasabası ve anıt alan',
      'Schinias Milli Parkı / plaj',
      'Rhamnous antik kenti kalıntıları',
      'Akşam Atina',
    ],
  },

  {
    day: '7 Ekim (Sal) — Evia Güney: Marmari & Karystos',
    dateKey: '2025-10-07',
    color: '#F59E0B',
    stops: ['Atina', 'Rafina Limanı', 'Marmari (Evia)', 'Karystos', 'Marmari (Evia)', 'Atina'],
    plan: [
      'Rafina’dan Marmari’ye feribot',
      'Karystos liman & Bourtzi/akropolis kalıntıları',
      'Dimosari vadisi (kısa yürüyüş) opsiyon',
      'Akşam dönüş',
    ],
  },

  {
    day: '8 Ekim (Çar) — Evia Kuzey: Chalkida & Steni Dirfyos',
    dateKey: '2025-10-08',
    color: '#8B5CF6',
    stops: ['Atina', 'Chalkida (Evia)', 'Steni Dirfyos', 'Atina'],
    plan: [
      'Chalkida deniz üstü köprü ve sahil yürüyüşü',
      'Steni Dirfyos dağ köyü (yerel taverna/kahve)',
      'Akşam Atina',
    ],
  },

  {
    day: '9 Ekim (Per) — Vouliagmeni Gölü & Sahil',
    dateKey: '2025-10-09',
    color: '#EF4444',
    stops: ['Atina', 'Vouliagmeni Gölü', 'Kavouri Plajı', 'Atina'],
    plan: [
      'Sabah: Vouliagmeni Gölü (termal/akvaryum gibi berrak)',
      'Öğle/öğleden sonra: Kavouri plajında deniz',
      'Akşam: Atina merkez',
    ],
  },

  {
    day: '10 Ekim (Cum) — Dönüş',
    dateKey: '2025-10-10',
    color: '#14B8A6',
    stops: ['Atina Uluslararası Havalimanı (ATH)'],
    plan: ['Valiz & check-out', '15:00 Havalimanı', '17:20 ATH → ADB (Aegean A3996)'],
  },
];


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

/* ----------------- Yeme-İçme tam ekran ----------------- */
const foodWikiMap = {
  'Souvlaki':'Souvlaki','Moussaka':'Moussaka','Spanakopita':'Spanakopita','Loukoumades':'Loukoumades','Grida':'Gilthead_seabream',
  'Ahtapot ızgara':'Octopus_as_food','Arachova Formaela peyniri':'Formaela','Keçi/kuzu fırın':'Roast_lamb','Korint üzümü':'Zante_currant',
  'Loukaniko':'Loukaniko','Gogges':'Gogges','Kalamar tava':'Calamari','Çipura/Levrek ızgara':'Sea_bream','Midye saganaki':'Saganaki',
  'Gavros tiganito':'Fried_fish','Amygdalota':'Amygdalota','Taze balık':'Fish_as_food','Gouna':'Gouna_(food)','Xynomizithra':'Xynomizithra',
  'Pasteli':'Pasteli','Tarama':'Taramosalata','Gyros':'Gyros','Greek salad':'Greek_salad','Bougatsa':'Bougatsa','Koulouri':'Koulouri',
  'Greek coffee':'Greek_coffee','Ouzo':'Ouzo','Tsipouro':'Tsipouro','Buzlu uzo':'Ouzo','Beyaz şarap (Attika)':'Retsina',
  'Kırmızı şarap':'Wine','Bira':'Beer','Frappe':'Frappé','Souma':'Tsipouro','Taze portakal suyu':'Orange_juice'
};
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
