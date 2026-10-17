// Sweep every occasion across weather scenarios and print the top picks with reasons.
import { readFileSync } from 'fs';
import { rank, OCCASIONS, windowForPreset } from '../docs/engine.js';
const collection = JSON.parse(readFileSync(new URL('../docs/data/collection.json', import.meta.url)));
const mk = (t, h, extra = {}) => ({ tempMean: t, feelsMean: t + (h >= 70 && t >= 24 ? 2 : 0), humidity: h, rainProb: 10, wind: 12, nightShare: 0, muggy: h >= 72 && t >= 24, gloom: 0.05, cloud: 15, label: `${t}° h${h}`, ...extra });
const SCEN = {
  'hot muggy day 33°': mk(33, 75), 'hot night 27°': mk(27, 70, { nightShare: 1 }), 'warm day 26°': mk(26, 55),
  'mild evening 19°': mk(19, 60, { nightShare: 1 }), 'cool night 13°': mk(13, 60, { nightShare: 1 }), 'cool day 17°': mk(17, 50),
  'rainy warm 25°': mk(25, 85, { rainProb: 90, gloom: 0.9, cloud: 95, desc: 'rain' }),
  'grey drizzle 21° day': mk(21, 60, { rainProb: 70, gloom: 0.84, cloud: 86, desc: 'light drizzle' }),
};
const verbose = new Set(['hot muggy day 33°', 'hot night 27°', 'cool night 13°', 'mild evening 19°', 'grey drizzle 21° day']);
const only = process.argv[2];
for (const [sname, w] of Object.entries(SCEN)) {
  if (only && !sname.startsWith(only)) continue;
  console.log(`\n===== ${sname} =====`);
  for (const o of OCCASIONS) {
    const win = windowForPreset(w.nightShare ? 'tonight' : 'today', o.id, new Date(2026, 9, 17, 9));
    const r = rank({ collection, occasionId: o.id, window: win, weather: w });
    const top = r.slice(0, 3);
    console.log(`${o.label.padEnd(14)} ${top.map(x => `${x.bottle.name.replace("Collector's Edition", 'CE').slice(0, 18)} ${x.score}`).join(' | ')}   last: ${r[r.length - 1].bottle.name.slice(0, 14)} ${r[r.length - 1].score}`);
    if (verbose.has(sname)) top.slice(0, 2).forEach(x => console.log(`     ${x.bottle.name.slice(0, 16).padEnd(16)} ${x.sprays.n} sprays (${x.sprays.why}) ~${x.longevity.range.join('–')}h — ${x.reason}`));
  }
}
