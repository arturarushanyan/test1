/* global VBET5 */
VBET5.value('Config', {
    'env': {
        lang: 'eng'
    },
    'main': {
        skin: "vivarobet.am",
        name: "Vivaro Bets",
        authSessionLifetime: 15550000000, // in milliseconds,
        site_id: 1,
        availableLanguages: {
            'eng' : { 'short': 'EN', 'full': "English"},
            'arm' : { 'short': 'HY', 'full': "Հայերեն"},
            'rus' : { 'short': 'RU', 'full': "Русский"}
        }
    },
    'swarm': {
        url: [{ url: "http://swarm.vivarobet.am:8084/"}],
        websocket: [{ url: "ws://swarm.vivarobet.am:8084/"}, { url: "ws://swarm-ye1.vivarobet.am:8082"}],
//        url: "https://10.32.5.83:8080/", // bob
//        url: "https://www.vbet.com:8080/", //production
//        websocket: "ws://10.32.5.83:8080/", //bob
//        websocket: "ws://192.168.253.223:8080/", //stable

        useWebSocket: true,
        maxWebsocketRetries: 5,  // maximum number of websocket reconnect attempts after which it will give up
        webSocketRetryInterval: 2000 // retry interval, in milliseconds (will be increased after each unsuccessful retry by itself)
    }
});
