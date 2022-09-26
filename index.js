const BIBLE_URL = "https://raw.githubusercontent.com/koubadomik/water/main/resources/bible.json"
const VERSES_URL = "https://raw.githubusercontent.com/koubadomik/water/main/resources/verses.json"

async function fetch_json(url) {
  const req = await fetch(url)
  return await req.json();
}


(async function() {
  bible = await fetch_json(BIBLE_URL)
  verses = await fetch_json(VERSES_URL)
  verses = verses["data"]
  result = []
  for (const verse of verses) {
    if (verse.length === 4) {
      result.push(bible[verse[0]]["chapters"][verse[1] - 1].slice(verse[2] - 1, verse[3]))
    }
    if (verse.length === 3) {
      result.push(bible[verse[0]]["chapters"][verse[1] - 1][verse[2] - 1])
    }
  }
  console.log(result)

})();
