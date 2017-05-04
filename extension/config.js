/* global VBET5 */
VBET5.value('Config', {
    'env': {
        lang: 'eng'
    },
    'main': {
        balanceFractionSize: 0,
        authSessionLifetime: 15550000000, // in milliseconds,
        site_id: 1,
        skin: "vivarobet.am",
        name: "Vivaro Bets",
        availableLanguages: {
            'eng' : { 'short': 'EN', 'full': "English"},
            'arm' : { 'short': 'HY', 'full': "Հայերեն"},
            'rus' : { 'short': 'RU', 'full': "Русский"}
        }
    },
    'swarm': {
    // TODO: switch to SSL once server is ready
        url: [
            { url: "http://swarm.vivarobet.am:8082/", weight: 3},
            { url: "http://swarm-ye1.vivarobet.am:8082/", weight: 4},
            { url: "http://swarm-ye2.vivarobet.am:8082/", weight: 3}
        ],
        websocket: [
            { url: "ws://swarm.vivarobet.am:8082/", weight: 3},
            { url: "ws://swarm-ye1.vivarobet.am:8082/", weight: 4},
            { url: "ws://swarm-ye2.vivarobet.am:8082/", weight: 3}
        ],
        useWebSocket: true,
        maxWebsocketRetries: 5,  // maximum number of websocket reconnect attempts after which it will give up
        webSocketRetryInterval: 2000 // retry interval, in milliseconds (will be increased after each unsuccessful retry by itself)
    }
});
