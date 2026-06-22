
let fs = require('fs');
let path = require('path');
let CATEGORY_MAP = {
  smartphones: ['smartphones'],
  audio:       ['mobile-accessories'],
  laptops:     ['laptops'],
  tablets:     ['tablets'],
  wearables:   ['mens-watches', 'womens-watches'],
  accessories: ['mobile-accessories'],
  cameras:     ['mobile-accessories'],
  gaming:      ['mobile-accessories'],
};
let EXTRA_KEYWORDS = {
  audio:       ['headphones', 'speaker', 'earbuds', 'charger'],
  cameras:     ['camera', 'lens', 'gimbal'],
  gaming:      ['controller', 'keyboard', 'mouse', 'chair'],
};
let https = require('https');
function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { timeout: 15000 }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchJSON(res.headers.location).then(resolve, reject);
      }
      if (res.statusCode !== 200) return reject(new Error('HTTP ' + res.statusCode));
      let chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        try { resolve(JSON.parse(Buffer.concat(chunks).toString())); }
        catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
}
async function main() {
  let dataPath = path.join(__dirname, '..', 'data', 'products.json');
  let data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  let photoCache = {};
  let allCats = [...new Set(data.products.map(p => p.category))];
  for (let cat of allCats) {
    let slugs = CATEGORY_MAP[cat] || ['smartphones'];
    let photos = [];
    for (let slug of slugs) {
      try {
        let json = await fetchJSON(`https://dummyjson.com/products/category/${slug}?limit=100&select=thumbnail,images,title,category`);
        for (let p of json.products || []) {
          let kw = EXTRA_KEYWORDS[cat] || [];
          let title = (p.title || '').toLowerCase();
          let match = kw.length === 0 || kw.some(k => title.includes(k));
          if (p.thumbnail) {
            if (match) photos.unshift(p.thumbnail);
            else photos.push(p.thumbnail);
          }
          if (p.images) {
            for (let img of p.images) {
              if (match) photos.unshift(img);
              else photos.push(img);
            }
          }
        }
      } catch (e) { console.log('  skip:', slug, e.message); }
    }
    photoCache[cat] = [...new Set(photos)];
    console.log(`${cat}: ${photoCache[cat].length} фото`);
  }
  let perCat = {};
  for (let p of data.products) {
    let idx = perCat[p.category] = (perCat[p.category] || 0);
    perCat[p.category] += 1;
    let urls = photoCache[p.category] || [];
    p.image = urls.length > 0 ? urls[idx % urls.length] : '';
  }
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
  console.log('\nГотово. Фото URL для', data.products.length, 'товаров.');
  let noImg = data.products.filter(p => !p.image);
  if (noImg.length) {
    console.log('Без фото:', noImg.length, noImg.map(p => p.title));
  } else {
    console.log('Все товары имеют фотографии.');
  }
}
main().catch(e => { console.error(e); process.exit(1); });
