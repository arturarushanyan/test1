/* global CMS */
/**
 * @ngdoc service
 * @name CMS.service:content
 * @description
 *  provides methods for getting content from CMS.  Currnetly it's WordPress with JSON API plugin
 */
CMS.service('content', ['WPConfig', 'Config', '$http', '$rootScope', function (WPConfig, Config, $http, $rootScope) {
    'use strict';
    var content = {};

    var lang = $rootScope.env.lang;

    var excludedFields = '&exclude=author,excerpt,comments,comment_status,comment_count,tags,attachments';
    var tags = WPConfig.wpNewsUrl[lang] ? '' : '&tag=global,' + (WPConfig.newsTag || $rootScope.conf.skin.replace('.', '-')); // this filters posts not to get posts for other skins

    var newsUrl = WPConfig.wpNewsUrl[lang] || WPConfig.wpNewsUrl.main;
    var newsBaseHost = WPConfig.wpNewsUrl[lang] ? WPConfig.wpNewsUrl[lang].match(/^(https?\:)\/\/(([^:\/?#]*)(?:\:([0-9]+))?)(\/[^?#]*)(\?[^#]*|)(#.*|)$/)[2] : WPConfig.wpNewsBaseHost[Config.env.lang] || WPConfig.wpNewsBaseHost['main'] || WPConfig.wpNewsBaseHost;


    /**
     * @ngdoc method
     * @name addHttpsFlag
     * @methodOf CMS.service:content
     * @description returns ssl=1& string if URL is https, empty string otherwise
     *
     * @returns {String}
     */
    function addHttpsFlag(url) {
        return url.split(":/")[0].toLowerCase() === 'https' ? "&ssl=1" : "";
    }

    /**
     * @ngdoc method
     * @name getSports
     * @methodOf CMS.service:content
     * @description returns promise which will be resolved  with list of sports for which we have news
     *
     * @returns {Object} promise
     */
    content.getSports = function getSports() {

        return $http.get(newsUrl + '?base_host=' + newsBaseHost + addHttpsFlag(newsUrl) + '&json=get_category_index&lang=' + Config.env.lang + '&parent=' + (WPConfig.news.langRootCategories[lang] ||  WPConfig.news.langRootCategories.eng));
    };


    /**
     * @ngdoc method
     * @name getRecentNews
     * @methodOf CMS.service:content
     * @description returns promise which will be resolved with object containing recent news
     *
     * @param {Number} count number of news to request
     * @param {String} categoryId category slug
     * @param {String} [customNewsUrl] optional.  json interface URL to use
     *
     * @returns {Object} promise
     */
    content.getRecentNews = function getRecentNews(count, categoryId, customNewsUrl) {
        var customNewsBaseHost;
        if (customNewsUrl) {
            customNewsBaseHost = customNewsUrl.match(/^(https?\:)\/\/(([^:\/?#]*)(?:\:([0-9]+))?)(\/[^?#]*)(\?[^#]*|)(#.*|)$/)[2];
        }
        var rootCategory = WPConfig.news.langRootCategories[lang] ||  WPConfig.news.langRootCategories.eng; //select english if we don't have category for news in selected language
        var countStr = count === undefined ? '' : '&count=' + parseInt(count, 10),
            categoryStr = categoryId === undefined ? '&cat=' + rootCategory : '&cat=' + categoryId;
        var requestUrl = customNewsUrl || newsUrl;
        return $http.get(requestUrl + '?base_host=' + (customNewsBaseHost || newsBaseHost) + addHttpsFlag(requestUrl) + '&json=get_recent_posts&lang=' + Config.env.lang +  countStr + categoryStr  + excludedFields + tags);
    };


    /**
     * @ngdoc method
     * @name getPostsByCategorySlug
     * @methodOf CMS.service:content
     * @description returns promise which will be resolved with object containing posts of specified category
     *
     * @param {String} categorySlug category slug
     * @param {Number} [count] optional. number of posts. if not specified , all will be loaded
     * @param {Boolean} [includeTagInRequest] optional. default is true. whether to include post tag in request(to filter by skin)
     * @param {String} [customNewsUrl] optional.  json interface URL to use
     * @param {String} [customBaseHost] optional.  json interface
     * @returns {Object} promise
     */
    content.getPostsByCategorySlug = function getPostsByCategorySlug(categorySlug, count, includeTagInRequest, customNewsUrl, customBaseHost) {
        var customNewsBaseHost;
        if (customNewsUrl) {
            customNewsBaseHost = customNewsUrl.match(/^(https?\:)\/\/(([^:\/?#]*)(?:\:([0-9]+))?)(\/[^?#]*)(\?[^#]*|)(#.*|)$/)[2];
        }
        includeTagInRequest = includeTagInRequest === undefined ? true : includeTagInRequest;
        var countStr = count === undefined ? '' : '&count=' + parseInt(count, 10);
        var requestUrl = customNewsUrl || newsUrl;
        return $http.get(requestUrl + '?base_host=' + (customBaseHost || customNewsBaseHost || newsBaseHost) + addHttpsFlag(requestUrl) + '&json=get_category_posts&lang=' + Config.env.lang + '&category_slug=' + categorySlug + countStr  + excludedFields + (includeTagInRequest ? tags : ''));
    };

    /**
     * @ngdoc method
     * @name getNewsById
     * @methodOf CMS.service:content
     * @description returns promise which will be resolved with object containing news
     *
     * @param {string} id  news id
     * @param {string} [secret]  optional. a secret to get post content if it's draft (used for preview by editors)
     * @returns {Object} promise
     */
    content.getNewsById = function getNewsById(id, secret) {
        return $http.get(newsUrl + '?base_host=' + newsBaseHost + addHttpsFlag(newsUrl) + '&json=get_post&lang=' + Config.env.lang + '&id=' + id + (secret ? '&secret=' + secret : '')  + excludedFields);
    };

    /**
     * @ngdoc method
     * @name getWidget
     * @methodOf CMS.service:content
     * @description returns promise which will be resolved with object containing banner parameters
     *
     * @param {string} sidebarId  optional. id of sidebar to get banner for
     * @returns {Object} promise
     */
    content.getWidget = function getWidget(sidebarId) {
        sidebarId = sidebarId || 'sidebar-1';
        var url = WPConfig.wpUrl + '?base_host=' + WPConfig.wpBaseHost +  addHttpsFlag(WPConfig.wpUrl) + '&lang=' + Config.env.lang + '&json=widgets/get_sidebar&sidebar_id=' + sidebarId;
        return $http.get(url, {cache: true});
    };

    /**
     * @ngdoc method
     * @name getPage
     * @methodOf CMS.service:content
     * @description returns promise which will be resolved with object containing page data
     *
     * @param {string} slug  page slug
     * @param {boolean} withChildren  true to include page children
     * @param {boolean} cache  whether to cache response
     * @returns {Object} promise
     */
    content.getPage = function getPage(slug, withChildren, cache) {
        withChildren = withChildren || false;
        cache = cache || false;
        var childrenParam = withChildren ? '&children=1' : '';
        var url = WPConfig.wpUrl + '?base_host=' + WPConfig.wpBaseHost +  addHttpsFlag(WPConfig.wpUrl) + '&lang=' + Config.env.lang + '&json=get_page&slug=' + slug + childrenParam + excludedFields;
        return cache ? $http.get(url, {cache: true}) : $http.get(url);
    };

    /**
     * @ngdoc method
     * @name getJSON
     * @methodOf CMS.service:content
     * @description returns promise which will be resolved with object containing json data
     *
     * @param {string} url
     * @param {Object} data if not set its a get request
     * @returns {Object} promise
     */
    content.getJSON = function getJSON(url, data) {
        return $http({
            method: data ? 'POST' : 'GET',
            headers: {
                'Content-Type': 'application/json'
            },
            url: url,
            data: data

        });
    };

    return content;

}]);
