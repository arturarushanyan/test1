/* global VBET5, moment */
/**
 * @ngdoc service
 * @name vbet5.service:Moment
 * @description  Moment.js lib wrapper (http://momentjs.com/)
 */

VBET5.service('Moment', ['Config', '$locale', function (Config, $locale) {
    'use strict';
    var Moment = {
        moment: moment
    };
    var langMapping = {
        'arm': 'hy-am',
        'bra': 'po',
        'tur': 'tr',
        'rus': 'ru',
        'eng': 'en',
        'gre': 'el',
        'kor': 'ko',
        'pol': 'pl',
        'ger': 'de',
        'ita': 'it',
        'cze': 'cs',
        'spa': 'es',
        'por': 'pt',
        'geo': 'ka',
        'lit': 'lt',
        'lat': 'lv',
        'jpn': 'ja',
        'fas': 'fa',
        'nor': 'nb',
        'swe': 'sv',
        'bos': 'bs',
        'hrv': 'hr',
        'mac': 'mk',
        'slv': 'sl',
        'srp': 'sr',
        'heb': 'he',
        'chi': 'zh-cn',
        'bgr': 'bg',
        'vnm': 'vi'
    };

    Moment.moment.locale(langMapping[Config.env.lang]);
    console.log("Moment setting lang", langMapping[Config.env.lang]);

    /**
     * @ngdoc method
     * @name setLang
     * @methodOf vbet5.service:Moment
     * @description sets the language
     * @param {String} lang language to set
     */
    Moment.setLang = function setLang(lang) {
        Moment.moment.locale(langMapping[lang] || lang);
    };

    Moment.setLongDateFormat = function setLongDateFormat(timeFormat) {
        if (timeFormat === Config.env.longTimeFormats.HALF) {
            Moment.moment.locale(langMapping[Config.env.lang], {
                longDateFormat : {
                    LT: "h:mm A",
                    L: "MM/DD/YYYY",
                    l: "M/D/YYYY",
                    LL: "MMMM Do YYYY",
                    ll: "MMM D YYYY",
                    LLL: "MMMM Do YYYY LT",
                    lll: "MMM D YYYY LT",
                    LLLL: "dddd, MMMM Do YYYY LT",
                    llll: "ddd, MMM D YYYY LT"
                }
            });
        }
        if (timeFormat === Config.env.longTimeFormats.FULL) {
            Moment.moment.locale(langMapping[Config.env.lang], {
                longDateFormat : {
                    LT: "HH:mm",
                    L: "MM/DD/YYYY",
                    l: "M/D/YYYY",
                    LL: "MMMM Do YYYY",
                    ll: "MMM D YYYY",
                    LLL: "MMMM Do YYYY LT",
                    lll: "MMM D YYYY LT",
                    LLLL: "dddd, MMMM Do YYYY LT",
                    llll: "ddd, MMM D YYYY LT"
                }
            });
        }
    };

    /**
     * @ngdoc method
     * @name get
     * @methodOf vbet5.service:Moment
     * @description sets selected timezone and calls original moment() function
     */
    Moment.get = function get(a, b, c, d) {
        var zone = null;
        if (Config.main.timeZonePerLanguage && Config.main.timeZonePerLanguage[Config.env.lang]) {
            zone = Config.main.timeZonePerLanguage[Config.env.lang];
        }
        if (Config.env.selectedTimeZone) {
            zone = Config.env.selectedTimeZone;
        }
        return zone ? Moment.moment(a, b, c, d).utcOffset(zone) : Moment.moment(a, b, c, d);
    };

    /**
     * @ngdoc method
     * @name updateMonthLocale
     * @methodOf vbet5.service:Moment
     * @description updates angular month locale from moment
     */
    Moment.updateMonthLocale = function updateMonthLocale() {
        $locale.DATETIME_FORMATS.MONTH = moment.months();
        $locale.DATETIME_FORMATS.SHORTMONTH = moment.monthsShort();
    };

    /**
     * @ngdoc method
     * @name updateWeekDaysLocale
     * @methodOf vbet5.service:Moment
     * @description updates angular weekdays locale from moment
     */
    Moment.updateWeekDaysLocale = function updateWeekDaysLocale() {
        $locale.DATETIME_FORMATS.DAY = moment.weekdays();
        $locale.DATETIME_FORMATS.SHORTDAY = moment.weekdaysShort();
    };

    return Moment;
}]);
