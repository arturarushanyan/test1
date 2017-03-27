/* global require */
(function () {
    'use strict';



    var fs = require('fs');
    var mustache = require('mustache');
    var config = require('./config.js');
    var helpers = require('./helpers.js');
    var wpapi = require('./wpapi.js');
    var Bagpipe = require('bagpipe');
    var bagpipe = new Bagpipe(100);


    var sitemap = [];
    var onlyUpdateNews = false;
    var noRedirects = false;
//    var categories = config.categories;




    function loadTemplate(template) {
        return fs.readFileSync(config.tplPath + template + '.html').toString();
    }

    function getNewsLink(post) {
        return decodeURIComponent(post.slug) + '-id' + post.id + '.html';
    }

    function getPageLink(page, lang, prefix) {
        prefix = prefix || '';
        return prefix + decodeURIComponent(page.slug) + '-' + lang + '.html';
    }

    function saveSiteMap(sitemap) {
        var i,
            xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
                '<url><loc>' + config.skin.realUrlBase + '</loc><lastmod>' + new Date().toISOString() + '</lastmod><changefreq>daily</changefreq></url>';
        if (config.skin.additionalFiles) {
            for (i = 0; i < config.skin.additionalFiles.length; i++) {
                xml += '\n<url><loc>' + config.skin.realUrlBase + config.skin.additionalFiles[i] + '</loc><lastmod>' + new Date().toISOString() + '</lastmod><changefreq>weekly</changefreq></url>';
            }
        }
        for (i = 0; i < sitemap.length; i++) {
            xml += '\n<url><loc>' + sitemap[i].loc + '</loc><lastmod>' + sitemap[i].lastmod + '</lastmod><changefreq>daily</changefreq></url>';
        }
        xml += '\n</urlset>';
        fs.writeFile(config.rootSavePath + 'sitemap.xml', xml, config.skin.writeOptions);
    }



    var processPromosJson = function (response, lang) {
        var data, i, post, html, path;
        try {
            data = JSON.parse(response);
        } catch (e) {
            console.log(e, response);
        }
        var templateStr = loadTemplate('promos');
        mustache.parse(templateStr); //should speed up rendering
        for (i = 0; i < data.posts.length; i++) {
            post = data.posts[i];
            //sitemap data
            sitemap.push({loc: config.skin.newsUrlBase + getNewsLink(post), lastmod: new Date(post.date).toISOString()});

            if (data.posts[i - 1] !== undefined) {
                post.prev = {link: getNewsLink(data.posts[i - 1]), title: data.posts[i - 1].title };
            }
            if (data.posts[i + 1] !== undefined) {
                post.next = {link: getNewsLink(data.posts[i + 1]), title: data.posts[i + 1].title };
            }
            post.realLink = config.skin.realUrlBase + '#/promos/?lang=' + lang + '&news=' + post.id + '#news-' + post.id;
            post.htmlLink = config.skin.newsUrlBase + getNewsLink(post, lang);
            post.canonicalLink = (config.skin.canonicalUrlBase && config.skin.canonicalUrlBase[lang] ? config.skin.canonicalUrlBase[lang] : config.canonicalUrlBase[lang]) + 'news/' + getNewsLink(post);
            post.metaTitle = config.skin.title[lang].main;
            post.description = config.skin.description[lang].main;
            post.keywords = config.skin.keywords[lang].main;
            post.redirectCode = noRedirects ? "" : helpers.getRedirectCode(post.realLink);
            html = mustache.render(templateStr, post);
            path = config.rootSavePath + 'news/' + getNewsLink(post);
            if (!fs.existsSync(path)) {
                bagpipe.push(fs.writeFile, config.rootSavePath + 'news_delta/' + getNewsLink(post), html, config.writeOptions);
            }
            bagpipe.push(fs.writeFile, path, html, config.writeOptions);
        }
        if (!onlyUpdateNews) {
            saveSiteMap(sitemap);  //will not update sitemap when only checking for news update
        }

        console.log(data.posts.length + ' promos created for ' + lang);
    };

    var processNewsJson = function (response, lang) {
        var data, i, post, html, path;
        try {
            data = JSON.parse(response);
        } catch (e) {
            console.log(e, response);
        }
        var templateStr = loadTemplate('news');
        mustache.parse(templateStr); //should speed up rendering
        for (i = 0; i < data.posts.length; i++) {
            post = data.posts[i];
            //sitemap data
            sitemap.push({loc: config.skin.newsUrlBase + getNewsLink(post), lastmod: new Date(post.date).toISOString()});

            if (data.posts[i - 1] !== undefined) {
                post.prev = {link: getNewsLink(data.posts[i - 1]), title: data.posts[i - 1].title };
            }
            if (data.posts[i + 1] !== undefined) {
                post.next = {link: getNewsLink(data.posts[i + 1]), title: data.posts[i + 1].title };
            }
            post.realLink = config.skin.realUrlBase + '#/news?lang=' + lang + '&news=' + post.id + '#lnews-' + post.id;
            post.htmlLink = config.skin.newsUrlBase + getNewsLink(post, lang);
            post.canonicalLink = (config.skin.canonicalUrlBase && config.skin.canonicalUrlBase[lang] ? config.skin.canonicalUrlBase[lang] : config.canonicalUrlBase[lang]) + 'news/' + getNewsLink(post);
            post.metaTitle = config.skin.title[lang].news;
            post.description = config.skin.description[lang].news;
            post.keywords = config.skin.keywords[lang].news;
            post.redirectCode = noRedirects ? "" : helpers.getRedirectCode(post.realLink);
            html = mustache.render(templateStr, post);
            path = config.rootSavePath + 'news/' + getNewsLink(post);
            if (!fs.existsSync(path)) {
                bagpipe.push(fs.writeFile, config.rootSavePath + 'news_delta/' + getNewsLink(post), html, config.writeOptions);
            }
            bagpipe.push(fs.writeFile, path, html, config.writeOptions);
        }
        if (!onlyUpdateNews) {
            saveSiteMap(sitemap);  //will not update sitemap when only checking for news update
        }

        console.log(data.posts.length + ' news created for ' + lang);
    };

    var processHelpPagesJson = function processHelpPagesJson(response, lang) {
        var data = JSON.parse(response), i, j, page, html, hpcount = 0;
        mustache.parse(loadTemplate('page')); //should speed up rendering
        for (i = 0; i < data.page.children.length; i++) {
            for (j = 0; j < data.page.children[i].children.length; j++) {
                page = data.page.children[i].children[j];
                page.realLink = config.skin.realUrlBase + '#/?help=' + encodeURIComponent(page.slug) + '&lang=' + lang;
                page.htmlLink = config.skin.pagesUrlBase + getPageLink(page, lang);
                page.canonicalLink = (config.skin.canonicalUrlBase && config.skin.canonicalUrlBase[lang] ? config.skin.canonicalUrlBase[lang] : config.canonicalUrlBase[lang]) + 'pages/' + getPageLink(page, lang);
                page.metaTitle = config.skin.title[lang].help;
                page.description = config.skin.description[lang].help;
                page.keywords = config.skin.keywords[lang].help;
                page.redirectCode = noRedirects ? "" : helpers.getRedirectCode(page.realLink);
                sitemap.push({loc: config.skin.pagesUrlBase + getPageLink(page, lang), lastmod: new Date(page.date).toISOString()});
                hpcount++;

                if (data.page.children[i].children[j - 1] !== undefined) {
                    page.prev = {link: getPageLink(data.page.children[i].children[j - 1], lang), title: data.page.children[i].children[j - 1].title };
                }
                if (data.page.children[i].children[j + 1] !== undefined) {
                    page.next = {link: getPageLink(data.page.children[i].children[j + 1], lang), title: data.page.children[i].children[j + 1].title };
                }

                html = mustache.render(loadTemplate('page'), page);

                fs.writeFile(config.rootSavePath + 'pages/' + getPageLink(page, lang), html, config.writeOptions);
            }
        }
        saveSiteMap(sitemap);
        console.log(hpcount + ' help pages created for ' + lang);
    };


    var processPokerPagesJson = function processPokerPagesJson(response, lang) {
        var data = JSON.parse(response), i, page, html, hpcount = 0;
        mustache.parse(loadTemplate('page')); //should speed up rendering
        for (i = 0; i < data.page.children.length; i++) {

            page = data.page.children[i];
            page.realLink = config.skin.realUrlBase + '#/poker/?page=' + encodeURIComponent(page.slug) + '&lang=' + lang;
            page.htmlLink =  config.skin.pagesUrlBase + getPageLink(page, lang, 'poker-');
            page.canonicalLink = (config.skin.canonicalUrlBase && config.skin.canonicalUrlBase[lang] ? config.skin.canonicalUrlBase[lang] : config.canonicalUrlBase[lang]) + 'pages/' + getPageLink(page, lang, 'poker-');
            page.metaTitle = config.skin.title[lang].poker;
            page.description = config.skin.description[lang].poker;
            page.keywords = config.skin.keywords[lang].poker;
            page.redirectCode = noRedirects ? "" : helpers.getRedirectCode(page.realLink);
            sitemap.push({loc: config.skin.pagesUrlBase + getPageLink(page, lang, 'poker-'), lastmod: new Date(page.date).toISOString()});
            hpcount++;

            if (data.page.children[i - 1] !== undefined) {
                page.prev = {link: getPageLink(data.page.children[i - 1], lang, 'poker-'), title: data.page.children[i - 1].title };
            }
            if (data.page.children[i + 1] !== undefined) {
                page.next = {link: getPageLink(data.page.children[i + 1], lang, 'poker-'), title: data.page.children[i + 1].title };
            }

            html = mustache.render(loadTemplate('page'), page);

            fs.writeFile(config.rootSavePath + 'pages/' + getPageLink(page, lang, 'poker-'), html, config.writeOptions);

        }
        saveSiteMap(sitemap);
        console.log(hpcount + ' poker pages created for ' + lang);
    };

    if (process.argv.indexOf('update-news') !== -1) {
        onlyUpdateNews = true;
    }
    if (process.argv.indexOf('no-redirects') !== -1) {
        noRedirects = true;
    }

    var lang;
    for (lang in config.skin.newsCategories) {
        if (config.skin.newsCategories.hasOwnProperty(lang) && config.skin.title[lang]) {
            wpapi.getNewsInCategory(helpers.callWithSecondParam(processNewsJson, lang), config.skin.newsCategories[lang], onlyUpdateNews ? config.newsUpdateCount : undefined, lang);
        }
    }
    if (onlyUpdateNews) {
        return;
    }
    for (lang in config.skin.promoCategories) {
        if (config.skin.promoCategories.hasOwnProperty(lang) && config.skin.title[lang]) {
            wpapi.getNewsInCategory(helpers.callWithSecondParam(processPromosJson, lang), config.skin.promoCategories[lang], undefined, lang);
        }
    }
    for (lang in config.skin.helpPages) {
        if (config.skin.helpPages.hasOwnProperty(lang)) {
            wpapi.getPage(helpers.callWithSecondParam(processHelpPagesJson, lang), config.skin.helpPages[lang], true);
        }
    }

    for (lang in config.skin.pokerPages) {
        if (config.skin.pokerPages.hasOwnProperty(lang)) {
            wpapi.getPage(helpers.callWithSecondParam(processPokerPagesJson, lang), config.skin.pokerPages[lang], true);
        }
    }

}());