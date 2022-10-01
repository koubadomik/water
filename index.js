const BIBLE_URL = "https://raw.githubusercontent.com/koubadomik/water/main/resources/bible.json"
const VERSES_URL = "https://raw.githubusercontent.com/koubadomik/water/main/resources/verses.json"
const FIELDS = {
  CENTER: "center",
  SECONDARY: "secondary"
}
const FIELD_ELEMENTS = {
  [FIELDS.CENTER]: document.querySelector(`.${FIELDS.CENTER}`),
  [FIELDS.SECONDARY]: document.querySelector(`.${FIELDS.SECONDARY}`),

}
const PAGE = document.querySelector("html")

async function fetch_json(url) {
  const req = await fetch(url)
  return await req.json();
}

function display_current(text, field = FIELDS.CENTER) {
  FIELD_ELEMENTS[field].innerHTML = text
}

function display_from_dict(mapping) {
  const rest_of_screen = Object.values(FIELDS).filter(value => !Object.keys(mapping).includes(value))
  for (const [k, v] of Object.entries(mapping)) {
    display_current(v, k)
  }
  for (const field of rest_of_screen) {
    display_current("", field)
  }
}

function shuffle(array) {
  let currentIndex = array.length, randomIndex;
  while (currentIndex != 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
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
    if (verse[0] in bible) {
      if (verse.length === 4) {
        sequence.push({ [FIELDS.CENTER]: `✝ ${bible[verse[0]]["name"]} ${verse[1]}:${verse[2]}-${verse[3]}` })
        current_verse = verse[2]
        for (const v of bible[verse[0]]["chapters"][verse[1] - 1].slice(verse[2] - 1, verse[3])) {
          sequence.push({
            [FIELDS.CENTER]: v,
            [FIELDS.SECONDARY]: `✝ ${bible[verse[0]]["name"]} ${verse[1]}:${current_verse++}`
          })
        }
      }
      if (verse.length === 3) {
        sequence.push({ [FIELDS.CENTER]: `✝ ${bible[verse[0]]["name"]} ${verse[1]}:${verse[2]}` })
        sequence.push({
          [FIELDS.CENTER]: bible[verse[0]]["chapters"][verse[1] - 1][verse[2] - 1],
          [FIELDS.SECONDARY]: `✝ ${bible[verse[0]]["name"]} ${verse[1]}:${verse[2]}`
        })
      }
    }
    else {
      console.log(verse[0])
    }
  }


  current_index = 0
  display_from_dict(sequence[current_index])
  PAGE.addEventListener("click", function(event) {
    event.preventDefault()
    if (PAGE.clientWidth / 2 < event.clientX) {
      if (current_index === sequence.length - 1) {
        display_from_dict(sequence[current_index])
      } else {
        display_from_dict(sequence[++current_index])
      }
    }
    else if (PAGE.clientWidth / 2 >= event.clientX) {
      if (current_index === 0) {
        display_from_dict(sequence[current_index])
      }
      else {
        display_from_dict(sequence[--current_index])
      }
    }
  })


})();
