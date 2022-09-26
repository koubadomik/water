(async function() {
  const request = await fetch("https://raw.githubusercontent.com/koubadomik/water/main/resources/bible.json")
  bible = await request.json()

  console.log(bible["Gn"]["chapters"][0][0])

})();
