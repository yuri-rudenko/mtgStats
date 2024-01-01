function findBinomialElement(arr) {
    const randomNumber = Math.random()
    let result = null
  
    for (let i = 0; i < arr.length; i++) {
      const currentElement = arr[i]
      const previousProbability = i === 0 ? 0 : arr[i - 1].probability
  
      if (
        randomNumber >= previousProbability &&
        randomNumber < currentElement.probability
      ) {
        result = currentElement
        break
      }
    }

    return result
}

async function processBoosters(data) {

    const def = data.data.booster.default;
    const keys = Object.keys(def.sheets);

    const promises = keys.map(async (type) => {
        const probabilities = [];
        const cardKeys = Object.keys(def.sheets[type].cards);
        let count = 0;

        cardKeys.forEach((card) => {
            const dynamicObject = {};
            const id = data.data.cards.find((find) => find.uuid === card).identifiers.scryfallId;

            dynamicObject.probability = (def.sheets[type].cards[card] + count) / def.sheets[type].totalWeight;
            dynamicObject.id = id;
            probabilities.push(dynamicObject);
            count += def.sheets[type].cards[card];
        });

        const fullCards = await Promise.all(probabilities.map(async (card) => {
            const response = await fetch(`https://api.scryfall.com/cards/${card.id}`);
            const cardData = await response.json();
            return { ...card, data: cardData };
        }));

        return { type: type, cards: fullCards };
    });

    return Promise.all(promises);
}

async function selectBooster(data) {

    const def = data.data.booster.default

    console.log(def)
    let count = 0
    const boosterArray = def.boosters.map(el => {
        count += el.weight
        return ({ contents: el.contents, weight: count / def.boostersTotalWeight })
    })

    console.log(boosterArray)


    const randomBooster = Math.random()
    let foundBooster = boosterArray.find((el, index) => {
        if(index === 0) if(randomBooster<el.weight) return el
        if(randomBooster<el.weight && randomBooster>boosterArray[index-1].weight) {return el}
    })

    return(foundBooster)
}

async function openBooster(foundBooster, result) {

    const boosterValues = Object.keys(foundBooster.contents)

        const cards = []
        console.log(boosterValues)
        boosterValues.forEach(el => {
            for(let i = 0; i < foundBooster.contents[el]; i++) {
                const card = findBinomialElement(result.find(cardType => cardType.type === el).cards)
                el.toLowerCase().includes('foil') ? card.foil = true : card.foil = false
                cards.push(card)
            }
        })

        return cards
}


fetch('./MH2.json')
  .then(response => response.json())
  .then(async data => {

    const promises = await processBoosters(data)

    Promise.all(promises).then( async (result) => {

        const foundBooster = await selectBooster(data)

        const cards = await openBooster(foundBooster, result)

        console.log(cards, foundBooster)

    });

    })
  .catch(error => console.error('Error fetching JSON:', error));
