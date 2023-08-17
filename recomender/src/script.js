const feedLength = 3;
const shiftFactor = 0.2;
const userWeight = 15;
let mandatoryIterations = 4;
let voluntaryIterations = 3;
let shortItemLength = 150;
let longItemLength = 400;
let feed = [];
let dataRevId;
let id;
let timestamp;
const consumption = {};
let iterations = [];
let remainingMandatoryIterations = mandatoryIterations;
let remainingVoluntaryIterations = voluntaryIterations;
const seen = [];
let readMore = [];
let instructionsVisible = false;

Array.prototype.random = function () {
    return this[Math.floor((Math.random() * this.length))];
}

async function init() {
    async function loadNextPage(init) {
        let volunteer = (remainingMandatoryIterations <= 0);
        if (!init) {
            await computePositions();
            await storeData();
            remainingMandatoryIterations--;
            volunteer = document.getElementById("continue").checked;
        }
        if (volunteer && remainingMandatoryIterations <= 0)
            remainingVoluntaryIterations--;
        if (remainingMandatoryIterations === 1 || (remainingMandatoryIterations <= 0 && init)) {
            document.getElementById("continue").removeAttribute("hidden");
            document.getElementById("continueLabel").removeAttribute("hidden");
        }
        if (remainingVoluntaryIterations === 0) {
            document.getElementById("continue").setAttribute("hidden", "hidden");
            document.getElementById("continueLabel").setAttribute("hidden", "hidden");
        }
        if (remainingMandatoryIterations > 0 || (remainingVoluntaryIterations >= 0 && volunteer)) {
            if (remainingMandatoryIterations > 0) {
                document.getElementById("currentPage").innerText = (1 + iterations.length).toString();
                document.getElementById("maxPage").innerText = mandatoryIterations.toString();
            } else {
                document.getElementById("currentPage").innerText =
                    (1 - mandatoryIterations + iterations.length).toString();
                document.getElementById("maxPage").innerText = "possible " + voluntaryIterations.toString() +
                    " voluntary pages";
            }
            feed = computeNewsFeed();
            displayNews(feed).then(() => {
                document.getElementById("nextHint").innerText = "You need to shift all sliders into a valid " +
                    "position before you can continue.";
                document.getElementById("nextButton").setAttribute("disabled", "disabled");
                if (volunteer)
                    document.getElementById("continue").checked = false;
                location.href = "#head";
            });
        } else {
            alert("The demo has finished!"); //provisional alert for demo purposes
            document.getElementById("nextButton").setAttribute("disabled", "disabled");
            //do not redirect user for demo purposes
            //stopStayLoggedIn(session);
            //location.href = "../post-survey?id=" + id;
        }
    }

    const instructionButton = document.getElementById("instructionButton");
    instructionButton.addEventListener("click", () => {
        const instructions = document.getElementById("instructions");
        if (instructionsVisible) {
            instructions.setAttribute("hidden", "hidden");
            instructionButton.innerText = "Show Instructions";
        } else {
            instructions.removeAttribute("hidden");
            instructionButton.innerText = "Hide Instructions";
        }
        instructionsVisible = !instructionsVisible;
    });
    id = 0; //dummy user
    user.weight = userWeight;
    for (let i = 0; i < news.length; ++i)
        seen.push(false);
    await fetchIterations();
    await loadNextPage(true);
    document.getElementById("nextButton").addEventListener("click", () => loadNextPage(false));
}

async function fetchNewsList() {
    news = (await requestDatabase("GET", "news")).message.data;
}

async function fetchData() {
    const message = (await requestDatabase("GET", "data")).message;
    dataRevId = message["_rev"];
    data = message.data;
}

async function fetchIterations() {
    //no fetching of iterations from database for the purpose of this demo
    //const message = (await requestDatabase("GET", id)).message;
    //iterations = message.iterations;
    remainingMandatoryIterations -= iterations.length;
    if (remainingMandatoryIterations < 0) {
        remainingVoluntaryIterations += remainingMandatoryIterations;
        remainingMandatoryIterations = 0;
    }
    for (const iteration of iterations)
        for (const item of iteration.items)
            seen[item] = true;
}

function computeNewsFeed() {
    const distances = {};
    const feed = [];
    readMore = [];
    for (let i = 0; i < news.length; ++i) {
        const differences = [];
        if (seen[i])
            continue;
        for (const metric in data[i]) {
            if (metric === "weight")
                break;
            let userValue = user[metric];
            if (metric === "opinion")
                userValue *= 3;
            differences.push(data[i][metric] - userValue);
        }
        let result = 0;
        for (const diff of differences)
            result += diff * diff;
        distances[i] = Math.sqrt(result);
    }
    for (let i = 0; i < feedLength; ++i) {
        readMore.push(false);
        let min = 1000000;
        const minSet = []
        for (const item in distances) {
            if (seen[item] === true)
                continue;
            if (distances[item] < min) {
                min = distances[item];
                minSet.splice(0, minSet.length);
                minSet.push(item);
            } else if (distances[item] === min) {
                minSet.push(item);
            }
        }
        const index = minSet.random();
        seen[index] = true;
        feed.push(index);
    }
    timestamp = Math.round(new Date().getTime() / 1000);
    return feed;
}

async function displayNews(feed) {
    const newsArea = document.getElementById("newsarea");
    while (newsArea.firstChild)
        newsArea.firstChild.remove()

    function createTitleItem(newsItem, div) {
        const titleSpan = document.createElement("span");
        titleSpan.setAttribute("class", "title");
        titleSpan.appendChild(document.createTextNode(newsItem.title));
        div.appendChild(titleSpan);
        div.appendChild(document.createElement("br"));
    }

    function createAuthorItem(newsItem, div) {
        const authorSpan = document.createElement("span");
        authorSpan.setAttribute("class", "author");
        let author = newsItem.author.split(" ")[0].toLowerCase().split("-")[0];
        author = author.charAt(0).toUpperCase() + author.slice(1);
        authorSpan.appendChild(document.createTextNode("Author: " + author + " "));
        div.appendChild(authorSpan);
    }

    /*
    no source display intended
     */
    function createSourceItem(newsItem, div) {
        div.appendChild(document.createElement("br"));
    }

    function createAbstractItem(newsItem, index, div) {
        const abstractSpan = document.createElement("span");
        abstractSpan.setAttribute("class", "abstract");
        abstractSpan.appendChild(document.createTextNode(fillContent(newsItem)));
        const readMoreButton = document.createElement("button");
        readMoreButton.setAttribute("class", "readMoreButton");
        readMoreButton.setAttribute("id", "readmore-" + index);
        readMoreButton.innerText = "read more";
        readMoreButton.addEventListener("click", () => {
            readMoreButton.parentElement.innerText = fillContent(newsItem, true);
            readMore[index] = true;

        });
        abstractSpan.appendChild(readMoreButton);
        div.appendChild(abstractSpan);
        div.appendChild(document.createElement("br"));
    }

    function createSliders(div, index) {
        function createSlider(std, dimension, index) {
            const slider = document.createElement("input");
            sliders.push(slider);
            slider.setAttribute("title", dimension);
            slider.setAttribute("id", dimension + "Slider" + index);
            slider.setAttribute("type", "range");
            slider.setAttribute("min", (min - 1).toString());
            slider.setAttribute("max", (max + 1).toString());
            slider.setAttribute("value", init.toString());
            slider.setAttribute("disabled", "disabled");
            const smallerButton = document.createElement("button");
            buttons.push(smallerButton);
            smallerButton.setAttribute("title", "rate " + dimension + " lower");
            smallerButton.appendChild(document.createTextNode("-"));
            smallerButton.setAttribute("class", "sliderButton");
            smallerButton.addEventListener("click", () => {
                    if (parseInt(slider.value) - stepsize > slider.min)
                        if (parseInt(slider.value) === init)
                            slider.value = (parseInt(slider.value) - stepsize / 2).toString();
                        else
                            slider.value = (parseInt(slider.value) - stepsize).toString();
                    if (values.includes(parseInt(slider.value)))
                        slider.setAttribute("style", "background: seagreen");
                    else
                        slider.removeAttribute("style");
                    if (parseInt(slider.value) - stepsize < slider.min)
                        smallerButton.setAttribute("disabled", "disabled");
                    biggerButton.removeAttribute("disabled");
                }
            );
            const biggerButton = document.createElement("button");
            buttons.push(biggerButton);
            biggerButton.setAttribute("title", "rate " + dimension + " higher");
            biggerButton.appendChild(document.createTextNode("+"));
            biggerButton.setAttribute("class", "sliderButton");
            biggerButton.addEventListener("click", () => {
                if (parseInt(slider.value) + stepsize < slider.max)
                    if (parseInt(slider.value) === init)
                        slider.value = (parseInt(slider.value) + stepsize / 2).toString();
                    else
                        slider.value = (parseInt(slider.value) + stepsize).toString();
                if (values.includes(parseInt(slider.value)))
                    slider.setAttribute("style", "background: seagreen");
                else
                    slider.removeAttribute("style");
                if (parseInt(slider.value) + stepsize > slider.max)
                    biggerButton.setAttribute("disabled", "disabled");
                smallerButton.removeAttribute("disabled");

            });
            const leftIcon = document.createElement("img");
            leftIcon.setAttribute("title", "low " + dimension);
            leftIcon.setAttribute("src", "../img/low" + dimension + ".png");
            leftIcon.setAttribute("class", "sliderIcon");
            const rightIcon = document.createElement("img");
            rightIcon.setAttribute("title", "high " + dimension);
            rightIcon.setAttribute("src", "../img/high" + dimension + ".png");
            rightIcon.setAttribute("class", "sliderIcon");
            std.appendChild(leftIcon);
            std.appendChild(smallerButton);
            std.appendChild(slider);
            std.appendChild(biggerButton);
            std.appendChild(rightIcon);
        }

        const sliderTable = document.createElement("table");
        sliderTable.setAttribute("class", "sliderTable");
        const str1 = document.createElement("tr");
        const str2 = document.createElement("tr");
        const std1 = document.createElement("td");
        const std2 = document.createElement("td");
        const std3 = document.createElement("td");
        const std4 = document.createElement("td");
        str1.appendChild(std1);
        str1.appendChild(std2);
        str2.appendChild(std3);
        str2.appendChild(std4);
        sliderTable.appendChild(str1);
        sliderTable.appendChild(str2);
        div.appendChild(sliderTable);
        createSlider(std1, "likeability", index);
        createSlider(std2, "quality", index);
        createSlider(std3, "relevance", index);
        createSlider(std4, "consensus", index);
    }

    const stepsize = 4;
    const min = 2;
    const max = min + 3 * stepsize;
    const init = (max - min) / 2 + min;
    const values = [min, min + stepsize, min + 2 * stepsize, min + 3 * stepsize];
    const buttons = [];
    const sliders = [];
    for (let index = 0; index < feedLength; ++index) {
        const item = feed[index];
        const div = document.createElement("div");
        div.setAttribute("id", "item" + index);
        div.setAttribute("class", "newsitem");
        newsArea.appendChild(div);
        const newsItem = news[item];
        createTitleItem(newsItem, div);
        createAuthorItem(newsItem, div);
        createSourceItem(newsItem, div);
        createAbstractItem(newsItem, index, div);
        createSliders(div, index);
    }
    for (const button of buttons) {
        button.addEventListener("click", () => {
            for (const slider of sliders)
                if (!values.includes(parseInt(slider.value)))
                    return;
            document.getElementById("nextHint").innerText = "You may now continue to the next page by " +
                "clicking the button below:";
            document.getElementById("nextButton").removeAttribute("disabled");
        });
    }
}

function fillContent(data, long = false) {
    const content = data.content;
    const split = content.split(" ");
    let result = "";
    let factor = shortItemLength;
    if (long)
        factor = longItemLength;
    for (let i = 0; i < factor; ++i) {
        if (i >= split.length)
            break;
        result += split[i] + " ";
    }
    result = result.substring(0, result.length - 1)
    if (result.endsWith("."))
        result = result.substring(0, result.length - 1);
    return result + "...";
}

async function computePositions() {
    //static data for the purpose of this demo
    //await fetchData();
    const factors = [];
    for (let index = 0; index < feedLength; ++index) {
        consumption[feed[index]] = {};
        factors.push(0);
        for (const dimension of ["likeability", "quality", "relevance", "consensus"]) {
            const slider = document.getElementById(dimension + "Slider" + index);
            const value = Math.round((parseInt(slider.value) - 8) * (2 / 6));
            consumption[feed[index]][dimension] = value;
            factors[index] += value / 8;
        }
    }
    let index = 0;
    for (const item of feed) {
        const newsData = data[item];
        const weightDiff = user.weight - newsData.weight;
        const factor = factors[index];
        for (const metric in newsData) {
            if (metric === "weight")
                break;
            const difference = user[metric] - newsData[metric];
            if (weightDiff > 10) {
                const delta = shiftFactor * difference * factor;
                newsData[metric] += delta;
            } else {
                const weightSum = newsData.weight + user.weight;
                const normUserWeight = user.weight / weightSum;
                const normNewsDataWeight = newsData.weight / weightSum;
                const totalDelta = shiftFactor * difference * factor;
                const userDelta = normNewsDataWeight * totalDelta * -1;
                const newsDataDelta = normUserWeight * totalDelta;
                user[metric] += userDelta;
                newsData[metric] += newsDataDelta;
            }
        }
        newsData.weight += 1;
        data[item] = newsData;
        index++;
    }
}

async function storeData(reAttempt = false) {
    for (const item in consumption)
        user.consumption[item] = consumption[item];
    const feedInt = [];
    for (const item of feed)
        feedInt.push(parseInt(item));
    iterations.push({
        "items": feedInt,
        "time": Math.round(new Date().getTime() / 1000) - timestamp,
        "readMore": readMore
    });
    user.iterations = iterations;
}

document.body.onload = init;
