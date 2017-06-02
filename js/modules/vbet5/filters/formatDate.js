/* global VBET5 */
/**
 * @ngdoc filter
 * @name vbet5.filter:formatDate
 * @description
 * formats date
 *
 * @param {Number|String} unix timestamp in seconds or ISO date string
 * @param {String} [format] optional.
 * @param {Number} [calendarDays] optional. Closeness to now(in days) after which date will be displayed in default format instead of .calendar()
 * Date format to use (see {@link http://momentjs.com/docs/#/displaying/format/ moment.js docs})
 * If 'full' default full format will be used
 * If not specified 'relative' format will be used
 */
VBET5.filter('formatDate', [ 'Moment', 'Config',  function (Moment, Config) {
    'use strict';
    var DEFAULT_FORMAT = Config.main.defaultTimeFormat || (Config.env.lang === 'tur' ? "DD MMM YYYY LT" : "ll LT");

    return function (timestamp, format, calendarDays, longDateFormat) {
        var doNotTranslateLocale = false;
        calendarDays = calendarDays || 1;
        if (typeof timestamp === 'string' && timestamp.indexOf(':') !== -1 && timestamp.indexOf('-') !== -1) {
            timestamp = Moment.get(timestamp);
        } else {
            timestamp = Moment.moment.unix(timestamp);
        }
        Moment.setLongDateFormat(longDateFormat || Config.env.timeFormat);
        if (format) {
            switch (format) {
                case 'full':
                    format = DEFAULT_FORMAT;
                    break;
                case 'hour':
                    format = longDateFormat === '12h' ? 'hh:mm A' : 'HH:mm';
                    break;
                case 'fullHour':
                    format = longDateFormat === '12h' ? 'hh:mm:ss A' : 'HH:mm:ss';
                    break;
                case 'fullHourWithoutAmPm':
                    format = longDateFormat === '12h' ? 'hh:mm:ss' : 'HH:mm:ss';
                    break;
                case 'onlyAmPm':
                    format = longDateFormat === '12h' ? 'A' : ' ';
                    doNotTranslateLocale = true; // TODO see below
                    break;
                case 'noLocaleTranslate':
                    format = Config.env.timeFormat === '12h' ? 'DD/MM/YYYY LT' : 'DD/MM/YYYY HH:mm:ss';
                    doNotTranslateLocale = true; // TODO see below
                    break;
                case 'noLocaleTime':
                    format = Config.env.timeFormat === '12h' ? 'LT' : 'HH:mm';
                    doNotTranslateLocale = true;
                    break;
                case 'onlyTime':
                    format = Config.env.timeFormat ===  '12h' ? 'hh:mm' :'HH:mm';
                    doNotTranslateLocale = false;
                    break;
                case 'edition':
                    var edition = Moment.get(timestamp).locale('en');
                    return parseInt(edition.format('DDD'), 10) + ((Config.main.edition && Config.main.edition.offset) || 0);
            }

            // TODO: we'll refactor this later, to have more correct solution
            if(doNotTranslateLocale) {
                var eng = Moment.get(timestamp).locale('en');
                return eng.format(format);
            }

            return Moment.get(timestamp).format(format);
        }
        if (Math.abs(Moment.get().diff(timestamp, 'days')) < calendarDays) {
            return timestamp.calendar();
        }
        return timestamp.format(DEFAULT_FORMAT);
    };
}]);