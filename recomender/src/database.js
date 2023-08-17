const databaseURI = "https://db.news.digitaltransformation.bayern/data/";

function getUserID() {
    const urlSearchParams = new URLSearchParams(window.location.search);
    const params = Object.fromEntries(urlSearchParams.entries());
    const id = params["id"];
    if (!id)
        return null;
    return id;
}

async function requestDatabase(method, path, body = {}) {
    let response;
    if (method === "GET" || method === "HEAD") {
        response = await fetch(databaseURI + path, {
            method: method,
            credentials: "include"
        });
    } else {
        response = await fetch(databaseURI + path, {
            method: method,
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "include",
            body: JSON.stringify(body)
        });
    }
    if (response.status >= 400) {
        alert("Unfortunately, there is a server problem. Hence, you cannot continue with the experiment. " +
            "We invite you to try again later. Thank you for participating!");
        window.location.href = "../";
        return null;
    }
    const message = await response.json();
    return {
        response: response,
        message: message
    };
}

function disableBackButton() {
    window.location.hash = "exp";
    window.location.hash = "exp2";

    window.onhashchange = function () {
        window.location.hash = "exp";
    }
}

function stayLoggedIn() {
    return window.setInterval(async function () {
        await requestDatabase("GET", "../_session");
    }, 60000);
}

function stopStayLoggedIn(session) {
    clearInterval(session);
}

disableBackButton();
