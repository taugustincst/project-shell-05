/* Lost Property Office — content data. Pure data; loaded as window.LPO_DATA in the browser and via require in Node. */
(function (root) {
'use strict';
const SEASON_DAYS = 30;

/* Item parts. Items are composed type × colour × material × mark, so claims are generated, not hand-placed. */
const TYPES = [
  { id: 'umbrella', name: 'umbrella', a: 'an', materials: ['cloth', 'nylon'], icon: '☂' },
  { id: 'suitcase', name: 'suitcase', a: 'a', materials: ['leather', 'canvas', 'cardboard'], icon: '🧳' },
  { id: 'hat', name: 'hat', a: 'a', materials: ['felt', 'straw', 'wool', 'cloth'], icon: '🎩' },
  { id: 'scarf', name: 'scarf', a: 'a', materials: ['wool', 'silk', 'cloth'], icon: '🧣' },
  { id: 'gloves', name: 'pair of gloves', a: 'a', materials: ['leather', 'wool', 'cloth'], icon: '🧤' },
  { id: 'book', name: 'book', a: 'a', materials: ['paper', 'leather', 'cardboard'], icon: '📕' },
  { id: 'spectacles', name: 'pair of spectacles', a: 'a', materials: ['metal', 'plastic', 'tortoiseshell'], icon: '👓' },
  { id: 'watch', name: 'wristwatch', a: 'a', materials: ['metal', 'leather', 'plastic'], icon: '⌚' },
  { id: 'wallet', name: 'wallet', a: 'a', materials: ['leather', 'canvas', 'plastic'], icon: '👛' },
  { id: 'handbag', name: 'handbag', a: 'a', materials: ['leather', 'canvas', 'cloth'], icon: '👜' },
  { id: 'briefcase', name: 'briefcase', a: 'a', materials: ['leather', 'metal', 'canvas'], icon: '💼' },
  { id: 'teddy', name: 'teddy bear', a: 'a', materials: ['wool', 'cloth', 'plush'], icon: '🧸' },
  { id: 'flask', name: 'vacuum flask', a: 'a', materials: ['metal', 'plastic'], icon: '🫙' },
  { id: 'camera', name: 'camera', a: 'a', materials: ['metal', 'leather', 'plastic'], icon: '📷' },
  { id: 'keys', name: 'bunch of keys', a: 'a', materials: ['metal'], icon: '🔑' },
  { id: 'coat', name: 'overcoat', a: 'an', materials: ['wool', 'cloth', 'nylon'], icon: '🧥' },
  { id: 'violin', name: 'violin case', a: 'a', materials: ['leather', 'wood', 'canvas'], icon: '🎻' },
  { id: 'football', name: 'football', a: 'a', materials: ['leather', 'plastic'], icon: '⚽' },
  { id: 'doll', name: 'doll', a: 'a', materials: ['cloth', 'plastic', 'wood'], icon: '🪆' },
  { id: 'lunchbox', name: 'lunch box', a: 'a', materials: ['metal', 'plastic'], icon: '🍱' },
  { id: 'typewriter', name: 'portable typewriter', a: 'a', materials: ['metal'], icon: '⌨' },
  { id: 'cane', name: 'walking cane', a: 'a', materials: ['wood', 'metal'], icon: '🦯' },
  { id: 'ring', name: 'ring', a: 'a', materials: ['gold', 'silver'], icon: '💍' },
  { id: 'parcel', name: 'parcel', a: 'a', materials: ['paper', 'cardboard'], icon: '📦' },
  { id: 'thermos', name: 'picnic basket', a: 'a', materials: ['wicker', 'canvas'], icon: '🧺' },
  { id: 'racket', name: 'tennis racket', a: 'a', materials: ['wood', 'metal'], icon: '🎾' },
  { id: 'birdcage', name: 'birdcage', a: 'a', materials: ['metal', 'wicker'], icon: '🪶' },
  { id: 'shoes', name: 'pair of shoes', a: 'a', materials: ['leather', 'canvas'], icon: '👞' }
];
const COLOURS = ['black', 'brown', 'navy', 'green', 'red', 'grey', 'cream', 'tartan', 'yellow', 'mustard', 'bottle-green', 'maroon'];
const MARKS = [
  'a name tape sewn inside', 'initials in gold leaf', 'a torn corner mended with tape', 'a label from a Blackpool hotel', 'a brass plate reading "Not Yours"',
  'a child\'s drawing of a cat inside', 'a burn mark the size of a shilling', 'a strap replaced with string', 'a chess-club badge pinned on', 'a crack across one corner',
  'a railway timetable tucked in the lining', 'the letters J.P. scratched in', 'a missing button replaced with a different one', 'a sticker of a lighthouse', 'a repair stamp from a Leeds cobbler',
  'a wine stain shaped like Italy', 'one eye missing', 'a wedding-day date engraved inside', 'a regimental ribbon tied on', 'a pencil note of a telephone number',
  'a dog-chewed handle', 'a scorch along the brim', 'a darn in bright orange wool', 'a bus ticket from Harrow in the pocket', 'the name "MAUDE" in marker',
  'a rosette from a flower show', 'a tiny padlock with no key', 'a smell of peppermint', 'a patch of tartan over a hole', 'a broken clasp held with a hairpin'
];
const LINES = ['the 7:40 from Harrow', 'the 9:15 to Blackpool', 'the 10:05 Leeds stopper', 'the 12:30 express', 'the 14:12 to the coast', 'the 17:25 commuter', 'the last train'];
const CARRIAGE = ['luggage rack', 'under a seat', 'the guard\'s van', 'the lavatory', 'the buffet car', 'on the platform', 'the waiting room'];

/* Standing Orders: the rulebook, unlocked across the season. Every stamp is provable from these. */
const ORDERS = [
  { id: 'o_return', day: 1, title: 'Order 1 — Returning', text: 'RETURN an article when exactly one object on the shelves is of the claimed type and bears the claimed distinguishing mark. Memory errs on colour, material, day and train. Memory does not err on the mark: it is personal.' },
  { id: 'o_hold', day: 1, title: 'Order 2 — Holding', text: 'HOLD when no object matches the claim, when the claimant can give no mark, or when more than one object fits. A held claim is not an accusation; the claimant may return with proof.' },
  { id: 'o_prohibited', day: 1, title: 'Order 3 — Prohibited articles', text: 'FLAG any claim for a prohibited article, whoever claims it. The list is posted at the counter and will grow.' },
  { id: 'o_date', day: 3, title: 'Order 4 — The calendar', text: 'FLAG a claim that states a loss on a day AFTER the log\'s found date. Nothing is lost after it is found. The log is the authority on dates and trains; the object is the authority on colour, material and mark.' },
  { id: 'o_returned', day: 5, title: 'Order 5 — Closed entries', text: 'FLAG a claim for an article the log records as already RETURNED. The log keeps closed entries for a fortnight for exactly this reason.' },
  { id: 'o_forms', day: 8, title: 'Order 6 — Insurance forms', text: 'From the second week, some claimants bring an insurance form. The form must agree with the claim on the article\'s type and colour. A form that disagrees with the claim is a false form: FLAG it. A form that agrees changes nothing else.' },
  { id: 'o_rivals', day: 15, title: 'Order 7 — Rival claimants', text: 'When two claimants in one day fit the same object, RETURN it to the one whose stated train matches the log, and HOLD the other. If neither or both match the log, HOLD both.' },
  { id: 'o_auction', day: 22, title: 'Order 8 — Unclaimed goods', text: 'Articles unclaimed for fourteen days go to the Thursday auction. The clerk may withhold any article from auction at the clerk\'s discretion. Some things should wait a little longer.' }
];
const PROHIBITED = [
  { id: 'firework', name: 'box of fireworks', a: 'a', day: 1, icon: '🧨', materials: ['cardboard'] },
  { id: 'pistol', name: 'starting pistol', a: 'a', day: 1, icon: '🔫', materials: ['metal'] },
  { id: 'ferret', name: 'ferret in a sack', a: 'a', day: 6, icon: '🦡', materials: ['cloth'] },
  { id: 'gin', name: 'crate of unlabelled gin', a: 'a', day: 12, icon: '🍾', materials: ['wood'] },
  { id: 'rocket', name: 'distress rocket', a: 'a', day: 18, icon: '🚀', materials: ['metal'] }
];

/* Claimant profiles: how the description goes wrong, and how it sounds. */
const PROFILES = {
  precise: { name: 'honest, precise', errors: [0, 0, 0, 1], manner: ['I have written it down, in case.', 'I am quite sure of every detail.', 'I packed it myself this morning.', 'I can describe it exactly.'] },
  confused: { name: 'honest, confused', errors: [1, 1, 2, 2], manner: ['Or was it the other one? Forgive me.', 'It has been a long day. I may have the colour wrong.', 'My wife would know. I am doing my best.', 'I was half asleep when I got off.'] },
  exaggerator: { name: 'exaggerator', errors: [1, 1, 1, 2], manner: ['It is worth a great deal, you understand.', 'It was a gift from someone very important.', 'I have never in my life lost anything before.', 'The guard was no help whatsoever.'] },
  fraud: { name: 'fraud', errors: [0, 0, 1, 1], manner: ['I saw it on the shelf as I came in, actually.', 'No need to check the book, surely.', 'I am in rather a hurry.', 'I would know it anywhere, obviously.'] }
};
const FIRST = ['Mrs Pargeter', 'Mr Oyelaran', 'Miss Quigley', 'Dr Hansraj', 'Mr Tulloch', 'Mrs Abernathy', 'Master Dobbs', 'Mrs Kowalczyk', 'Mr Fenwick', 'Miss Adeyemi', 'Mr Bramble', 'Mrs Ng', 'Rev. Pottinger', 'Mr Szabo', 'Mrs Lightfoot', 'Miss Okafor', 'Mr Hale', 'Mrs Dunmore', 'Mr Petrakis', 'Miss Threlkeld', 'Mr Ashworth', 'Mrs Varga', 'Mr Idowu', 'Miss Brannigan', 'Mr Moffat', 'Mrs Castellano', 'Mr Rook', 'Miss Pemberton', 'Mr Qureshi', 'Mrs Finch'];

/* Office upgrades, bought from the budget between days. */
const UPGRADES = [
  { id: 'labels', name: 'Shelf labels', cost: 12, desc: 'Sort the shelves by type at a tap.', eff: 'filterType' },
  { id: 'cards', name: 'Index cards', cost: 20, desc: 'Search the shelves and the log by mark.', eff: 'search' },
  { id: 'kettle', name: 'A kettle', cost: 15, desc: 'A tea round for the queue. +1 reputation a day, however the day goes.', eff: 'kettle' },
  { id: 'lamp', name: 'Counter lamp', cost: 18, desc: 'See the objects properly: the shelf shows the mark in full without opening the tag.', eff: 'lamp' },
  { id: 'ledger', name: 'A second ledger', cost: 30, desc: 'Closed entries stay in the log for the whole season, not a fortnight.', eff: 'ledger' },
  { id: 'stool', name: 'A stool for the counter', cost: 10, desc: 'The clerk may sit. Mistakes cost one less reputation.', eff: 'stool' },
  { id: 'shelving', name: 'More shelving', cost: 25, desc: 'The warehouse holds twelve more objects before the oldest go to auction.', eff: 'shelving' },
  { id: 'telephone', name: 'A telephone', cost: 40, desc: 'Ring the guard. The log shows which claimants\' trains actually ran that day.', eff: 'telephone' }
];

/* The season: authored story items and claims. day = the day the claim is made; found = the day the object was logged (same item may be logged earlier). */
const STORY = [
  // The ring arc: E & M, 1961.
  { day: 2, kind: 'claim', who: 'Mr Albert Whitlow', profile: 'confused', item: { type: 'parcel', colour: 'brown', material: 'paper', mark: 'a wedding-day date engraved inside', custom: 'a small ring box, empty' }, foundDay: 1, line: 1, say: 'A ring box. Red velvet inside, nothing in it, which is the trouble. The ring was in it when I got on. Fifty years we were married and I lose it on the 9:15.', after: 'Mr Whitlow turned the empty box over twice and thanked you anyway. "She\'d have laughed," he said. "She\'d have laughed at me."', arc: 'ring', step: 1 },
  { day: 6, kind: 'found', item: { type: 'ring', colour: 'gold', material: 'gold', mark: 'a wedding-day date engraved inside' }, line: 1, where: 3, note: 'Found by a cleaner in the lavatory of the 9:15, wedged behind the mirror.', arc: 'ring', step: 2, keep: true },
  { day: 9, kind: 'claim', who: 'Mr Sidney Crane', profile: 'fraud', item: { type: 'ring', colour: 'gold', material: 'gold', mark: 'initials in gold leaf' }, line: 4, lossDay: 8, say: 'Gold ring, lost Tuesday on the express. Engraved, I think, with something. I would know it anywhere, obviously.', after: 'Mr Crane left in a hurry when you reached for the log. The ring stays on its shelf. Somebody is missing it properly.', arc: 'ring', step: 3 },
  { day: 24, kind: 'claim', who: 'Mrs Elsie Whitlow', profile: 'precise', item: { type: 'ring', colour: 'gold', material: 'gold', mark: 'a wedding-day date engraved inside' }, line: 1, lossDay: 1, say: 'My husband has been here, I think. Albert. He lost my ring and has been too ashamed to say so. Gold, plain, with the date inside: the fourteenth of June, 1961. He takes it to be cleaned and forgets to bring it back. He is ninety-one. So am I.', after: 'Mrs Whitlow put the ring on at the counter, without looking, the way you put on a thing you have worn for sixty years. "Tell him I was never angry," she said. "I was only ever worried about him."', arc: 'ring', step: 4, endsArc: true },
  { day: 28, kind: 'claim', who: 'Mr Albert Whitlow', profile: 'confused', item: { type: 'umbrella', colour: 'black', material: 'cloth', mark: 'a brass plate reading "Not Yours"' }, foundDay: 27, line: 1, say: 'Not the ring. Elsie has the ring; she tells everyone. An umbrella this time, black, with a plate on the handle she had made for me as a joke. I shall lose my head next.', after: 'He took the umbrella and, at the door, turned back. "She said you were kind. I am telling you so you know it got passed on."', arc: 'ring', step: 5, requires: 'ring_reunited' },
  // Smaller authored beats
  { day: 1, kind: 'claim', who: 'Master Tommy Dobbs', profile: 'precise', item: { type: 'teddy', colour: 'brown', material: 'plush', mark: 'one eye missing' }, foundDay: 1, line: 6, say: 'He is called Admiral. He has one eye because of a dog. He was on the rack above me and then he was not.', after: 'Admiral went home under one arm. Tommy saluted you. You saluted back; it seemed required.' },
  { day: 3, kind: 'claim', who: 'Miss Verity Quigley', profile: 'exaggerator', item: { type: 'violin', colour: 'black', material: 'leather', mark: 'a chess-club badge pinned on' }, foundDay: 2, line: 3, say: 'A violin case, black, leather, with my chess-club badge on the handle, and inside it a violin that is frankly priceless. I have an audition on Friday and if I do not have it back I shall simply die.', after: 'She opened the case on the counter, tuned the thing, and played eight bars of something that made the queue go quiet. Then she said "sorry" and left.' },
  { day: 4, kind: 'claim', who: 'Mr Harold Fenwick', profile: 'confused', item: { type: 'typewriter', colour: 'grey', material: 'metal', mark: 'the letters J.P. scratched in' }, foundDay: 3, line: 2, say: 'A typewriter, portable, grey or perhaps green. Initials on the lid, J.P., which are not mine: it was my father\'s. There is a chapter in it. There is only ever one chapter in it.', after: 'He fed a fresh sheet in at the counter and typed one line to check the keys. You did not read it. You did not need to.' },
  { day: 5, kind: 'claim', who: 'Mrs Nkechi Adeyemi', profile: 'precise', item: { type: 'suitcase', colour: 'red', material: 'leather', mark: 'a label from a Blackpool hotel' }, foundDay: 4, line: 2, say: 'Red leather suitcase, Blackpool hotel label on the side, from our honeymoon. Everything for the wedding is in it, and the wedding is Saturday, and it is Thursday.', after: 'She did not open it. She just put both hands flat on the lid for a moment, like checking a child was breathing.' },
  { day: 7, kind: 'claim', who: 'Rev. Pottinger', profile: 'confused', item: { type: 'book', colour: 'black', material: 'leather', mark: 'a pencil note of a telephone number' }, foundDay: 6, line: 5, say: 'A Bible, which I suppose you would call a book. Black. There is a telephone number pencilled in the back which is more important than the Bible, God forgive me, because it is my sister\'s and I have no other copy.', after: 'He read the number aloud twice, to be sure, and then said something that was either a blessing or a sigh.' },
  { day: 8, kind: 'claim', who: 'Mr Leonard Tulloch', profile: 'fraud', dateFraud: true, item: { type: 'camera', colour: 'black', material: 'leather', mark: 'a repair stamp from a Leeds cobbler' }, line: 4, lossDay: 9, foundDay: 7, say: 'Camera, black, leather case. Lost it yesterday, no, tomorrow, no, Friday. On the express. Look, it is obviously mine.', after: 'He said he would be back with a receipt. He will not be.' },
  { day: 10, kind: 'claim', who: 'Miss Ada Threlkeld', profile: 'precise', item: { type: 'birdcage', colour: 'cream', material: 'metal', mark: 'a rosette from a flower show' }, foundDay: 9, line: 6, say: 'A birdcage. The bird is not in it, thank heaven; he is at home sulking. There is a rosette tied to the bars from the Harrow show, second place, which he has never forgiven.', after: 'She carried the cage out at arm\'s length, as if the bird were still in it and still sulking.' },
  { day: 11, kind: 'claim', who: 'Mr Dmitri Petrakis', profile: 'exaggerator', item: { type: 'football', colour: 'brown', material: 'leather', mark: 'a regimental ribbon tied on' }, foundDay: 10, line: 6, say: 'A football, signed by the whole of the 1953 side, with a regimental ribbon tied to the lace. It is worth more than this office, with respect.', after: 'The signatures had mostly worn off. He kissed it anyway.' },
  { day: 12, kind: 'claim', who: 'Mrs Kowalczyk', profile: 'confused', item: { type: 'thermos', colour: 'cream', material: 'wicker', mark: 'a patch of tartan over a hole' }, foundDay: 11, line: 4, say: 'A picnic basket. Wicker. Tartan patch where the dog went through it. There was a cake in it. I do not expect the cake.', after: 'The cake was in it. She cut you a slice at the counter, which is against regulations, and which you ate.' },
  { day: 13, kind: 'claim', who: 'Dr Hansraj', profile: 'precise', item: { type: 'briefcase', colour: 'brown', material: 'leather', mark: 'a brass plate reading "Not Yours"' }, foundDay: 12, line: 4, say: 'Brown leather briefcase, brass plate on the clasp: a student had it engraved as a joke, and it has never once been true until today. Patient notes inside. I need not explain.', after: 'He checked the notes were in order and then, unexpectedly, shook your hand.' },
  { day: 16, kind: 'claim', who: 'Mr Ashworth', profile: 'fraud', item: { type: 'watch', colour: 'grey', material: 'metal', mark: 'a wedding-day date engraved inside' }, line: 2, lossDay: 15, say: 'A watch, steel, engraved. I have an insurance form, which should settle it.', form: { type: 'watch', colour: 'black' }, after: 'The form was for a black watch. The watch on the shelf is grey. He had not thought you would look.' },
  { day: 17, kind: 'claim', who: 'Miss Brannigan', profile: 'confused', item: { type: 'doll', colour: 'cream', material: 'cloth', mark: 'the name "MAUDE" in marker' }, foundDay: 16, line: 1, say: 'A doll. For my niece. It has her name on it, MAUDE, in marker, which was not my idea. I had it on the Blackpool train; or was it the coast?', after: 'She tucked the doll in her coat, face out, so it could see where it was going.' },
  { day: 19, kind: 'claim', who: 'Mr Idowu', profile: 'precise', item: { type: 'cane', colour: 'black', material: 'wood', mark: 'a dog-chewed handle' }, foundDay: 18, line: 5, say: 'My walking cane. Ebony, with a handle my dog has improved over the years. I have walked here from the platform without it, which I would rather not do again.', after: 'He leaned on it, exhaled, and was a different height.' },
  { day: 20, kind: 'claim', who: 'Mrs Castellano', profile: 'exaggerator', item: { type: 'coat', colour: 'maroon', material: 'wool', mark: 'a bus ticket from Harrow in the pocket' }, foundDay: 19, line: 1, say: 'A maroon coat, wool, Italian, you understand. There is a Harrow bus ticket in the pocket. I do not know why I am telling you that. It is not the important thing.', after: 'She found the bus ticket, looked at it for a long moment, and put it back in the pocket, which was perhaps the important thing after all.' },
  { day: 21, kind: 'claim', who: 'Mr Moffat', profile: 'fraud', item: { type: 'wallet', colour: 'brown', material: 'leather', mark: 'initials in gold leaf' }, line: 3, lossDay: 20, say: 'Wallet, brown, leather, initials on it. I can see it from here, as it happens.', after: 'The log said RETURNED, three days ago, to a man with the right initials. This one had the wrong ones and a quick walk.', returnedAlready: true },
  { day: 23, kind: 'claim', who: 'Miss Pemberton', profile: 'confused', item: { type: 'spectacles', colour: 'tortoiseshell', material: 'tortoiseshell', mark: 'a crack across one corner' }, foundDay: 22, line: 6, say: 'My reading glasses. I cannot see to describe them. Tortoiseshell. There is a crack in one corner from sitting on them, which is how I usually find them.', after: 'She put them on and read the Standing Orders aloud, right through, apparently for the pleasure of it.' },
  { day: 24, kind: 'claim', who: 'Mr Hale', profile: 'precise', item: { type: 'lunchbox', colour: 'red', material: 'metal', mark: 'a sticker of a lighthouse' }, foundDay: 23, line: 6, say: 'A lunch box, red tin, with a lighthouse sticker my son put on. The sandwiches are a lost cause. The box is his.', after: 'He threw the sandwiches away and polished the sticker with his sleeve.' },
  { day: 26, kind: 'claim', who: 'Mrs Lightfoot', profile: 'confused', item: { type: 'scarf', colour: 'tartan', material: 'wool', mark: 'a darn in bright orange wool' }, foundDay: 25, line: 7, say: 'A tartan scarf. Red tartan or green; I knitted it in the dark, practically. Darned in orange where the moth got it, which I thought was cheerful.', after: 'She wound it round twice and said it was warmer than she remembered.' },
  { day: 27, kind: 'claim', who: 'Mr Rook', profile: 'precise', item: { type: 'flask', colour: 'green', material: 'metal', mark: 'a railway timetable tucked in the lining' }, foundDay: 26, line: 7, say: 'A green flask. There is a timetable folded in the case, from 1962, which I keep for reasons I will not go into. I kept a lighthouse once. One keeps things.', after: 'He unfolded the timetable, checked something against the clock, nodded, and folded it away.' },
  { day: 25, kind: 'claim', who: 'Mrs Varga', profile: 'exaggerator', item: { type: 'handbag', colour: 'navy', material: 'leather', mark: 'a tiny padlock with no key' }, foundDay: 24, line: 3, say: 'A navy handbag with a tiny padlock on the zip and no key; I lost the key in 1958 and have never needed to open that pocket since. The bag is worth a fortune. The pocket is worth more.', after: 'She did not open the pocket. Some pockets are not for opening.' },
  { day: 29, kind: 'claim', who: 'Miss Okafor', profile: 'precise', item: { type: 'racket', colour: 'cream', material: 'wood', mark: 'a smell of peppermint' }, foundDay: 28, line: 2, say: 'A tennis racket. Wooden. It smells of peppermint because of where I keep it, which is a long story about a sweet shop.', after: 'She sniffed the handle, satisfied, and did not tell you the long story.' },
  { day: 30, kind: 'claim', who: 'Master Tommy Dobbs', profile: 'precise', item: { type: 'hat', colour: 'navy', material: 'felt', mark: 'a sticker of a lighthouse' }, foundDay: 29, line: 6, say: 'It is Admiral\'s hat. He left it on the train because he is an admiral and admirals do that. It has a lighthouse on it. He is at home, holding the fort.', after: 'He put the hat on his own head for safe keeping. The last claim of the season. You closed the ledger.' },
  // Day-of-week colour: found objects with no claimant (atmosphere, and the auction's temptation)
  { day: 15, kind: 'found', item: { type: 'parcel', colour: 'brown', material: 'paper', mark: 'a pencil note of a telephone number' }, line: 5, where: 3, note: 'A parcel addressed to no one, containing a single knitted sock, child-sized. The telephone number on it does not answer.' },
  { day: 18, kind: 'found', item: { type: 'camera', colour: 'black', material: 'leather', mark: 'a burn mark the size of a shilling' }, line: 7, where: 2, note: 'A camera with a full roll of film in it. Nobody has come. You have not developed it. You will not.' }
];

const ENDINGS = {
  gold: { title: 'Clerk of the Year', text: 'The season closed with the ledger balanced, the ring on the right hand, and a queue of people who had, for one afternoon each, had a slightly better day. The station master pinned a notice: "Lost property: ask for the clerk." You kept the notice.' },
  good: { title: 'A Good Season', text: 'Things found their way home, mostly. A few waited longer than they should have; one or two left with the wrong people and came back with the right ones. The kettle paid for itself. The season closed with the shelves half empty, which is the only kind of empty this office wants.' },
  poor: { title: 'A Hard Season', text: 'The ledger closed with more red ink than black. Things went home that should not have, and things stayed that should have gone. The station master did not say much. The next season starts Monday, and the log keeps everything, including the lessons.' }
};

const DATA = { SEASON_DAYS, TYPES, COLOURS, MARKS, LINES, CARRIAGE, ORDERS, PROHIBITED, PROFILES, FIRST, UPGRADES, STORY, ENDINGS };
if (typeof module !== 'undefined' && module.exports) module.exports = DATA; else root.LPO_DATA = DATA;
})(typeof window !== 'undefined' ? window : globalThis);
