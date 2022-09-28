const BIBLE_URL = "https://raw.githubusercontent.com/koubadomik/water/main/resources/bible.json"
const VERSES_URL = "https://raw.githubusercontent.com/koubadomik/water/main/resources/verses.json"
const CURRENT_VERSE_FIELD = document.querySelector(".verse")
const PAGE = document.querySelector("html")

async function fetch_json(url) {
  const req = await fetch(url)
  return await req.json();
}

function display_current(text) {
  CURRENT_VERSE_FIELD.innerHTML = text
}

function shuffle(array) {
  let currentIndex = array.length, randomIndex;

  // While there remain elements to shuffle.
  while (currentIndex != 0) {

    // Pick a remaining element.
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex], array[currentIndex]];
  }

  return array;
}

(async function() {
  bible = await fetch_json(BIBLE_URL)
  verses = await fetch_json(VERSES_URL)
  verses = verses["data"]
  verses = shuffle(verses)
  sequence = []
  for (const verse of verses) {
    if (verse.length === 4) {
      sequence.push(bible[verse[0]]["name"] + " " + verse[1] + ":" + verse[2] + "-" + verse[3])
      for (const v of bible[verse[0]]["chapters"][verse[1] - 1].slice(verse[2] - 1, verse[3])) {
        sequence.push(v)
      }
    }
    if (verse.length === 3) {
      sequence.push(bible[verse[0]]["name"] + " " + verse[1] + ":" + verse[2])
      sequence.push(bible[verse[0]]["chapters"][verse[1] - 1][verse[2] - 1])
    }
  }


  current_index = 0
  display_current(sequence[current_index++])
  PAGE.addEventListener("click", function(event) {
    console.log(current_index)
    event.preventDefault()
    if (PAGE.clientWidth / 2 < event.clientX) {
      if (current_index === sequence.length - 1) {
        display_current(sequence[current_index])
      } else {
        display_current(sequence[++current_index])
      }
    }
    else if (PAGE.clientWidth / 2 >= event.clientX) {
      if (current_index === 0) {
        display_current(sequence[current_index])
      }
      else {
        display_current(sequence[--current_index])
      }
    }
  })


})();
