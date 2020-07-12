const fetchData = async (searchTerm) => {
  const response = await axios.get(
    "http://ddragon.leagueoflegends.com/cdn/10.12.1/data/en_US/champion.json"
  );

  return response.data.data[`${searchTerm}`];
};

const onChampSelect = async (champ) => {
  const response = await axios.get(
    `http://ddragon.leagueoflegends.com/cdn/10.12.1/data/en_US/champion/${champ}.json`
  );
  document.querySelector("#summary").innerHTML = champTemplate(
    response.data.data[`${champ}`]
  );
};

const squaredChamp = async (championName) => {
  const response = await axios.get(
    `http://ddragon.leagueoflegends.com/cdn/10.12.1/img/champion/${championName}.png`
  );
  return response.config.url;
};

const additionalInfo = async (championName) => {
  const response = await axios.get(
    `http://ddragon.leagueoflegends.com/cdn/img/champion/loading/${championName}_0.jpg`
  );
  return response.config.url;
};

// fetching for items
const getItems = async () => {
  const response = await axios.get(
    "http://ddragon.leagueoflegends.com/cdn/10.12.1/data/en_US/item.json"
  );
  return response.data.data;
};

//Capitalize 1st letter
// didnt know how to modify fetched API to lowercase all champs
const capitalize = (str) => {
  if (
    str === "LeeSin" ||
    str === "MissFortune" ||
    str === "MasterYi" ||
    str === "TwistedFate" ||
    str === "TahmKench" ||
    str === "MasterYi" ||
    str === "DrMundo" ||
    str === "JarvanIV" ||
    str === "KogMaw" ||
    str === "XinZhao"
  )
    return str;
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

const root = document.querySelector(".autocomplete");
root.innerHTML = `
<label><b>Search for a champion</b></label>
  <input class='input' />
  <div class="dropdown">
    <div class="dropdown-menu">
      <div class="dropdown-content results"></div>
    </div>
  </div>

`;

const input = document.querySelector("input");
const dropdown = document.querySelector(".dropdown");
const resultsWrapper = document.querySelector(".results");

const debounce = (func, delay = 1000) => {
  let timeoutId;
  return (...args) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      func.apply(null, args);
    }, delay);
  };
};

const onInput = debounce(async (event) => {
  const champion = await fetchData(capitalize(event.target.value));
  const championIcon = await squaredChamp(capitalize(event.target.value));

  resultsWrapper.innerHTML = "";

  dropdown.classList.add("is-active");
  const option = document.createElement("a");
  option.classList.add("dropdown-item");

  option.innerHTML = `
              <img src="${championIcon}" />
              ${champion.id}
            `;
  option.addEventListener("click", () => {
    dropdown.classList.remove("is-active");
    input.value = champion.id;
    onChampSelect(champion.id);
  });

  resultsWrapper.appendChild(option);
}, 500);

input.addEventListener("input", onInput);

document.addEventListener("click", (event) => {
  if (!root.contains(event.target)) {
    dropdown.classList.remove("is-active");
  }
});

const findingGameMode = (champDetail) => {
  for (let i = 0; i < champDetail.recommended.length; i++) {
    if (champDetail.recommended[i].mode === "CLASSIC") {
      return champDetail.recommended[i];
    }
  }
};

const existance = (champDetail) => {
  const allGameProgress = findingGameMode(champDetail).blocks;
  let gameTypes = [];
  for (let i = 0; i < allGameProgress.length; i++) {
    gameTypes.push(allGameProgress[i].type);
  }

  gameTypes = [...new Set(gameTypes)];
  return gameTypes;
};

const mergingDups = (championItemData) => {
  for (let i = 0; i < championItemData.length; i++) {
    for (let j = i + 1; j < championItemData.length; j++) {
      if (championItemData[i].gametype === championItemData[j].gametype) {
        championItemData[i].items = [
          ...championItemData[i].items,
          ...championItemData[j].items,
        ];
      }
    }
  }
};

const removingDups = (championItemData) => {
  for (let i = 0; i < championItemData.length; i++) {
    for (let j = i + 1; j < championItemData.length; j++) {
      if (championItemData[i].gametype === championItemData[j].gametype) {
        championItemData.splice(j, 1);
      }
    }
  }
};

const findGameProgress = (champDetail) => {
  const currentMode = findingGameMode(champDetail);
  let wholeList = existance(champDetail);
  let template = [];
  let items = [];
  let championItemData = [];

  for (let i = 0; i < wholeList.length; i++) {
    for (let j = 0; j < currentMode.blocks.length; j++) {
      if (wholeList[i] === currentMode.blocks[j].type) {
        let gametype = wholeList[i];
        items = currentMode.blocks[j].items.map((item) => item.id);
        championItemData.push({ gametype, items });
      }
    }
  }
  mergingDups(championItemData);
  removingDups(championItemData);
  removingDups(championItemData);
  removingDups(championItemData);
  removingDups(championItemData);

  for (items of championItemData) {
    template.push(`<div><h6>${capitalize(items.gametype)}: </h6>`);
    items.items.forEach((item) =>
      template.push(
        `<img src='http://ddragon.leagueoflegends.com/cdn/10.13.1/img/item/${item}.png' />`
      )
    );
    template.push(`</div>`);
  }
  console.log(template);
  return template;
};

const champTemplate = (champDetail) => {
  return `
    <article class='media'>
      <figure class='media-left'>
        <p class='image'>
          <img src="http://ddragon.leagueoflegends.com/cdn/img/champion/loading/${
            champDetail.id
          }_0.jpg" />
        </p>
      </figure>
      <div class='media-content'>
        <div class="content">
          <h3>${champDetail.id}, ${champDetail.title}</h3>
          <p>Type: ${champDetail.tags
            .map((key) => {
              return key;
            })
            .join(", ")}</p>
          <h6>Lore: ${champDetail.blurb}</h6>
          <h5>Recommended Items:</h5>
          <div class='all-items'>
           ${findGameProgress(champDetail)
             .map((key) => {
               return key;
             })
             .join("")}
          </div>
        </div>
      </div>
    </article>
    <article class='notification is-primary">
      <p class='title'></p>
      <p class='title'>Ally tips</p>
      <p class='subtitle'>${Object.keys(champDetail.allytips)
        .map(function (key) {
          return "<p class='subtitle'>" + champDetail.allytips[key] + "</p>";
        })
        .join("")}</p>
      <p class='title'>Enemy tips</p>
      <p class='subtitle'>${Object.keys(champDetail.enemytips)
        .map(function (key) {
          return "<p class='subtitle'>" + champDetail.enemytips[key] + "</p>";
        })
        .join("")}</p>     
    </article>
  `;
};
