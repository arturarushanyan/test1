/* global module, require */
(function () {
    'use strict';
    var helpers = require('./helpers.js');
    var config = require('./config.js');

    module.exports = {
        getNewsInCategory: function getNewsInCategory(callback, category, count, lang) {
            count = count || config.newsCount;
            var wpNewsUrl = config.skin.wpNewsUrl;
            if (typeof wpNewsUrl === 'object') {
                if (wpNewsUrl[lang]) {
                    wpNewsUrl = wpNewsUrl[lang];
                } else {
                    wpNewsUrl = wpNewsUrl.main;
                }
            }
            console.log(helpers.getLocation(wpNewsUrl).host + helpers.getLocation(wpNewsUrl).pathname + '?json=get_recent_posts&count=' + count + '&cat=' + category);
            helpers.getJson(
                {
                    host: helpers.getLocation(wpNewsUrl).host,
                    port: helpers.getLocation(wpNewsUrl).port || 80,
                    path: helpers.getLocation(wpNewsUrl).pathname + '?anticache=' + Math.floor(Math.random() * 1000) + '&json=get_recent_posts&count=' + count + '&cat=' + category
                },
                callback,
                console.log
            );
        },
        getPage: function getPage(callback, slug, withChildren) {
            withChildren = withChildren ? '1' : '0';
            helpers.getJson(
                {
                    host: helpers.getLocation(config.skin.wpUrl).host,
                    port: helpers.getLocation(config.skin.wpUrl).port || 80,
                    path: helpers.getLocation(config.skin.wpUrl).pathname + '?json=get_page&slug=' + slug + '&children=' + withChildren
                },
                callback,
                console.log
            );
        }
    };
}());