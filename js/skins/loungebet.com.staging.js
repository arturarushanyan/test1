/*
 *   All config values specified here will be merged with main config and will override its values
 *
 */

/*
 *  Questions
 *
 *  1. Promo code validation
 *  2. Animation of
 *  2.1 Info tooltip toggle
 *  2.2 Password colorfoul bar
 *  3. Visibility and layers of tooltips
 *  4. When tooltips must be visible and when hidden
 *
 * */

/* global Loungebet5 */
VBET5.constant('SkinConfig', {
    additionalModules: ['exchange', 'casino', 'comboView'],
    'main': {
        showPrematchLimit: 150,
        prefetchLeftMenuHoveredLivesGames: {
            enabled: false,
            prefetchAfter: 250
        },
        betterSportsbook: true, // temporary, @TODO: remove after refactoring
        siteTitle: {
            "por": "Loungebet - Sport betting, Casino, Online Games",
            "eng": "Loungebet - Sport betting, Casino, Online Games",
            "spa": "Loungebet - Sport betting, Casino, Online Games",
            "ita": "Loungebet - Sport betting, Casino, Online Games",
            "rus": "Букмекерская контора Loungebet - Онлайн ставки, покер, казино, онлайн игры",
            "tur": "Loungebet - Sport betting, Casino, Online Games",
            "chi": "Loungebet - Sport betting, Casino, Online Games"
        },
        header: {
            version: 2
        },
        site_name: "Loungebet",
        skin: 'loungebet.com',
        htmlMetaTags: '<meta name="google-site-verification" content="N9XPR6flqy0jsrw7dTqwnxt5I_lMXOER_Tykg1o13G8"/>',
        enableHpBannerInsteadLiveGame: true,
        geoIPLangSwitch: true,
        enableToWinInfoInWallet: false,
        resultMenuOrdering: [844, 848, 850, 852, 858],
        showResultsMaxDays: 7,
        liveMultiViewEnabled: true,
        oldHomepage: false,
        enableMenuSearch: true,
        enableLandingPage: false,
        liveCalendarView: 'oneDaySelectionView',
        enableSystemCalculator: true,
        showExchangePrices:false,
        enableAccountVerification: true,
        showNewBelotePage: true,
        visibleItemsInTopMenu: 9, // visible items quantity in Top Menu in small view
        showOfficeView:false,
        exchangeEnabled:false,
        showNewBackgammonPage: true,
        newPoolBettingPage: false,
        hideGmsMarketBase: false,
        GmsPlatform:true,
        expandFavoriteCompetitions:true,
        expandFavoriteCompetitionsFirst:true,
        enableSportsbookLayoutSwitcher: true,
        enableBonuses: false,
        promotionalBonuses: {
            enable: true,
            sportsbook: true,
            casino: true
        },
        showCapsLockHint: true,
        dashboard: {
            enabled: true,
            leftMenuPrematch: true
        },
        subHeaderItems: [
            {
                alias: "sport",
                displayName: "Event View",
                enabled: true
            },
            {
                alias: "dashboard",
                displayName: "Dashboard",
                enabled: false
            },
            {
                alias: "overview",
                displayName: "Live Overview",
                enabledConfig: "liveOverviewEnabled",
                exceptViews: "modern, euro2016"
            },
            {
                alias: "multiview",
                displayName: "Live MultiView",
                enabledConfig: 'liveMultiViewEnabled',
                exceptViews: "modern"
            },
            {
                alias: "livecalendar",
                displayName: "Schedule",
                enabledConfig: "liveCalendarEnabled"
            },
            {
                alias: "statistics",
                displayName: "Statistics",
                enabledConfig: "statisticsInsportsbookTab"
            },
            {
                alias: "results",
                displayName: "Results",
                enabledConfig: "showResultsTabInSportsbook"
            }
        ],
        subHeaderItemsCasino: [
            {
                alias: "casino",
                displayName: "Lobby",
                enabled: true
            }
        ],
        subHeaderItemsPoker: [
            {
                alias: "poker",
                displayName: "Home",
                enabled: true
            },
            {
                alias: "specialoffers",
                displayName: "Special Offers",
                enabled: true
            },
            {
                alias: "news",
                displayName: "Hold'em",
                enabled: true
            },
            {
                alias: "results",
                displayName: "All-In or Fold",
                enabled: true
            },
            {
                alias: "overview",
                displayName: "Omaha",
                enabled: true
            },
            {
                alias: "multiview",
                displayName: "Fortune Spin",
                enabled: true
            },
            {
                alias: "sport",
                displayName: "Tournament",
                enabled: true
            }
        ],
        enableLayoutSwitcherInSportsbook: true,
        enableHomePageBottomBanner: false, //show banner from Wordpress instead Tournaments
        homePageLastMinuteBets: {
            enable: true,
            timeOptions: [15, 30, 60]
        },
        enableFeaturedGameMultiSliderOnHomePage: false,
        featuredGamesLimitation: 9,
        enableProductsSliderOnHomePage: true,
        enableVisibleInPrematchGames: true,
        customSelectedSequenceInAsianSportsbook: "MATCH",
        enableClassicScrollToggle: true,
        enableLiveSectionPin: true,
        mobileVersionLink: false,
        featuredGameNewTemplate: true,
        showNewsInClassicView: false,
        sportsLayout: "euro2016",
        availableSportsbookViews: {modern: true, classic: false, asian: false, external: false, euro2016: true},
        asianLoadDays: 0,
        sportsClassicLayout: false,
        showFavoriteCompetitions: true, // show "popular competitions" in classic view
        googleAnalyticsId: 'UA-82759825-1',
        yandexMetricaId: '',
        fantasyEnabled: true,
        defaultTimeFormat: 'DD/MM/YYYY LT',
        ogwilEnabled: true,
        casinoEnabled: true,
        transferEnabled: false,
        liveCalendarEnabled: true,
        liveCalendarInLeftMenu: false,
        betTypes: [
            {name: 'single', value: 1},
            {name: 'express', value: 2}

        ],
        liveOverviewEnabled: true,
        enableLiveCalendarPrinting: true,
        exchangeBetHistoryEnabled: false,
        getPokerLeaderboardDataFromSwarm: true, // in home page
        downloadPDFButtons: true,
        pokerEnabled: true,
        hidePokerLeaderboardAllButton: true,
        gameMenuSpecialText: '',
        enableNewPoker: true,
        rememberMeCheckbox: true,
        enableNewSkillGame: true,
        disableInternalMessageSending: true,
        liveDealerEnabled: true,
        financialsEnabled: true,
        countOfRecentBetsToShow: 3,
        //statsHostname: 'http://statistics.betconstruct.com/#/en/external/page/',  // hostname for statistics. when clicking on game statistics icon, popup on this hostname is open,
        headerStatisticsLink: 'https://statistics.loungebet.com',
        headerPokerLink: {
            home: 'http://contents.good-game-network.com/leaflet/loungebet/main/',
            so:  'http://contents.good-game-network.com/leaflet/loungebet/specialoffers/',
            hd:  'http://contents.good-game-network.com/leaflet/loungebet/holdemgamerules/',
            aof:  'http://contents.good-game-network.com/leaflet/loungebet/holdemgamerules/'
        },
        enableH2HStat: true,
        jackpotEnabled: false,
        newMenuItems: {virtualSport:true, games:false, liveCasino:false, fantasy: true},
        poolBettingEnabled: false, //enable/disable pool betting
        enableHeaderAnnouncement: false,
        showFavoriteGamesInSportList: true,
        showFinancialsInSportList: 222,   // false to hide,  any number to show (number is used as 'order' field to define it's position among sports)
        freeBetEnabled: true,
        displayEventsMaxBet: true,
        showEachWay: true,
        nonActivityAction: {
            action: 'logout', // 'reload'
            actionDelay: 0, // milliseconds
            nonActivityInterval: 900, // seconds
            checkingInterval: 5000 // seconds
        },
        showVirtualsInSportList: false,
        showTodayBets: false,
        showOutright: false,//200,
        casinoBalanceDefaultPage: 'deposit',
        sportsTodaysBetSameView: false,
        enableCasinoBalanceHistory: true, //enable casino balance history in top menu
        enableCasinoBetHistory: false, //enable casino balance history in top menu
        enableMixedView: true,
        enableBonusCancellation: true, // enable canceling bonus
        enablePrematchMultiView: true,
        enableSubHeader: true,
        enableMiniGameUnderBetslip: true,
        virtualBettingEnabledInTopMenu: false,
        virtualSportEnabledInTopMenu: false,
        showResultsTabInSportsbook: true,
        statisticsInsportsbookTab: true,
        classicMarkets2ColSorting: false,
        selfExclusionForever: true,
        balanceHistoryDefaultItemsCount: 20,
        balanceHistoryDisabledOperations: [2, 5, 6, 7, 8, 13, 16, 17, 37, 39, 40],
        backGammonEnabledInTopMenu: true,
        beloteEnabledInTopMenu: true,
        showWithdrawRequestsTab: false,
        enableNewCashier: false,
        headerMessageIcon: {
            enabled: true,
            alwaysShow: true
        },
        ageRestrictionInFooter: 18,
        haveFaq: true,
        openHelpAsPopup: 'popup',
        enablePromotions: true,
        aocEnabled: true, // enable AOC link in main menu
        enableFeedbackButton: true,
        availableVideoProviderIds: [6,15,16,19, 21, 22, 23],

        aocLink: "#/section/aoc",
        //theVeryTopMenu: [{href: "#/promos/", label: "Promotions"}, {href: "#/freebet/", label: "Free Quiz"},  {sliderAuthorized: 'deposit', label: "Recharge Account"}],
        balanceDefaultPage: 'deposit',
        showPromotedGamesOnWidget: {
            enabled: true,
            level: 'competition',  // game or competition
            type: 'promoted', // promoted or favorite
            gameLimit: 30
        },
        showPointsBalance: true,
        passwordNewResetMode: false,
        allowTimeFormatChange: true,
        passwordValidationLength: 8,
        availableLanguages: {
            '@replace': true, // this means that object won't be merged with 'parent object', but will replace it
            'por': {'short': 'PT', 'full': "Português", order: 1},
            'eng': {'short': 'EN', 'full': "English", order: 2},
            'spa' : { 'short': 'ES', 'full': "Español", order: 3},
            'ita': {'short': 'IT', 'full': "Italiano", order: 4},
            'rus': {'short': 'RU', 'full': "Русский", order: 5},
            'tur': {'short': 'TR', 'full': "Türkçe", order: 6},
            'chi' : { 'short': 'CH', 'full': "简体中文", order: 7}
        },
        remindToRenewBalance: {
            enabled: true,
            page: 'deposit',
            threshold: 0.5,
            interval: 14400000 //4 hours
        },
        redirectOnTablets: 'https://mobile.loungebet.com/',
        about_company_text: {
            eng : '',
            rus : ''
        },
        //flashVersionLink: {
        //    eng: 'https://inplay.loungebet.com/inplay/?language=en',
        //    rus: 'https://inplay.loungebet.com/inplay/?language=ru',
        //    arm: 'https://inplay.loungebet.com/inplay/?language=hy'
        //},
        oldVersionLink: false,
        menuOrder: ['sport', 'live',  'casino', 'livedealer', 'poker'],
        menuItems: [
            // {
            //title: "Promotions", link: "#/promos/", cssclass: ''
            // },
            //{name: 'Financial', displayName: 'Financials', href: '#/game/TLCTLC/provider/TLC/exid/14000'}
        ],
        liveChat: null,

        site_id: "401",
        registration: {
            defaultCurrency: 'EUR',
            simplified:true,
            restrictedCountries: {},
            enableNotifyEmail: true,
            mailIsSentAfterRegistration: 'Please check your email.'
        },
        personalDetails: {
            readOnlyFields: ['user_id', 'email', 'affiliate_id'],
            editableFields: ['gender', 'first_name', 'sur_name', 'birth_date', 'country_code', 'city', 'address', 'phone_number', 'doc_number'],
            requiredEditableFields: ['country_code', 'city', 'birth_date', 'first_name', 'sur_name', 'gender']
        },
        convertCurrencyName: {
            MBT: 'mBTC'
        },
        availableCurrencies: ['EUR', 'USD','BRL','MBT'],
        //facebookUrl: "https://www.facebook.com/Loungebetcom",
        //googlePlusUrl: "https://plus.google.com/u/1/+Loungebetlivebetting/",
        //youtubeUrl: "https://www.youtube.com/user/VIVARObetting",
        //vkontakteUrl: "https://vk.com/clubLoungebet",
        //instagramUserName: "Loungebet_official",
        //twitterAccount: 'Loungebet_com',
        //twitterHashTag: 'Loungebet',

        betHistoryBalanceTypes: {
            '-1': 'All',
            '0': 'New Bets',
            '1': 'Winning Bets',
            '2': 'Returned Bet',
            '3': 'Deposit',
            '4': 'Card Deposit',
            '5': 'Bonus',
            '6': 'Bonus Bet',
            '7': 'Commission',
            '8': 'Withdrawal',
            '9': 'Correction Up',
            '302': 'Correction Down',
            '10': 'Deposit by payment system',
            '12': 'Withdrawal request',
            '13': 'Authorized Withdrawal',
            '14': 'Withdrawal denied',
            '15': 'Withdrawal paid',
            '16': 'Pool Bet',
            '17': 'Pool Bet Win',
            '18': 'Pool Bet Return',
            '23': 'In the process of revision',
            '24': 'Removed for recalculation',
            '29': 'Free Bet Bonus received',
            '30': 'Wagering Bonus received',
            '31': 'Transfer from Gaming Wallet',
            '32': 'Transfer to Gaming Wallet',
            '37': 'Declined Superbet',
            '39': 'Bet on hold',
            '40': 'Bet cashout',
            '19': 'Fair',
            '20': 'Fair Win',
            '21': 'Fair Commission'
        }
    },
    customTemplates: ["footer.html", "slider/recentbets.html", "header/main.html"],

    regConfig: {
        step1: [
            {
                "title": "Username",
                "name": "username",
                "placeholder": "Enter here",
                "tooltip": 'Hello! Please enter your public username that will be displayed on our website. It should consist of min 4  and max 16 English letters and/or numbers.',
                "type": "text",
                "required": true,
                "classes": "form-text",
                "customAttrs": [{"required": "required"}, {"ng-pattern": "/^[a-zA-Z0-9\\_\\-]{4,16}$/"}, {"prevent-input": "/^[\\S ]+$/"}],
                "validation": [{"name": "required", "message": "Oops! You forgot to enter your username."}, {
                    "name": "exists",
                    "message": "Oops! The username has already been registered. Please enter another username."
                }, {
                    "name": "pattern",
                    "message": "Username must consist of min 4 and max 16 English letters and/or numbers."
                }]
            },{
                "title": "Email Address",
                "name": "email",
                "type": "email",
                "tooltip": 'Please enter your valid e-mail address. It will be used to activate your account. If you wish you can opt-out from receiving our marvelous offers as soon as you log in.',
                "placeholder": "Enter here",
                "required": true,
                "classes": "form-text",
                "customAttrs": [{"required": "required"}, {"ng-pattern": "/^([a-zA-Z0-9]+([_+\.-]?[a-zA-Z0-9]+)*)@([a-zA-Z0-9]+)(([\\-\.]?[a-zA-Z0-9]+)*)([\.])([a-z]+)([^~@!#$%^&*()_+|{}:<>?,/;'-=\\[\\]\\`\"\.\\\\])$/"}, {"prevent-input": "/^[\\S ]+$/"}],
                "validation": [{"name": "required", "message": "Oops! You forgot to enter your e-mail address. "},
                    {"name": "pattern", "message": "It doesn't look like an e-mail address, please check."},
                    {"name": "exists", "message": "Ouch! The e-mail address has already been registered. Click here to reset password or click on Sign In to enter your account. Otherwise try another e-mail."},
                    {"name": "accepted", "message": "The e-mail domain that you filled in isn’t accepted. Please enter a normal e-mail provider."}]
            },{
                "title": "Password",
                "name": "password",
                "placeholder": "Password should contain at least 8 characters",
                "type": "password",
                "tooltip": 'Please enter your password that should consist of min 8 and max 20 characters . We recommend you not to use your  name, surname, username or date of birth in your password.',
                "required": true,
                "classes": "form-text",
                "customAttrs": [{"ng-minlength": "8"}, {"type": "password"}, {"required": "required"}, {"ng-pattern": "/^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)[a-zA-Z\\d\\[\\]\\\\`~!@#$%^&*()_+={};:<>|./?,\"'-]+$/"}, {"ng-keypress": "passwordKeyPress($event, 'password')"}],
                "validation": [{"name": "required", "message": "Oops! You forgot to enter your password. "}, {
                    "name": "minlength",
                    "message": "The password must consist of min 8 and max 20 characters."
                }, {"name": "sameAsLogin", "message": "Password cannot be same as login"}, {
                    "name": "tooShort",
                    "message": "Password is too short"
                }, {
                    "name": "pattern",
                    "message": "Password should contain upper and lower-case English letters, at least one digit and no spaces."
                }]
            }, {
                "title": "Confirm Password",
                "name": "password2",
                "type": "password",
                "tooltip": 'Please repeat your password.',
                "placeholder": "Confirm Password",
                "required": true,
                "classes": "form-text",
                "customAttrs": [{"match": "registrationData.password"}, {"required": "required"}, {"ng-disabled": "registerform.password.$invalid"}, {"ng-keypress": "passwordKeyPress($event, 'password2')"}],
                "validation": [{"name": "required", "message": "Oops! You forgot to repeat your password."}, {
                    "name": "match",
                    "message": "The passwords don't match. Please check both fields."
                }],
            }, {
                "title": "Currency",
                "name": "currency_name",
                "type": "select",
                "required": true,
                "classes": "select-block big",
                "customAttrs": [{"ng-options": "c for c in  conf.availableCurrencies track by c"}, {"ng-value": "c"}, {"ng-disabled": "currencyDisabled"}],
                "validation": []
            }, {
                "title": "Promo code",
                "name": "promo_code",
                "type": "text",
                "tooltip": 'Hey! If you have any promo/referral code, enter it here.',
                "required": false,
                "placeholder": "Enter here",
                "classes": "form-text",
                "customAttrs": [{"ng-disabled": "hasPromoCode"}],
                "validation": [
                    {"name": "pattern", "message": "Invalid promo/referral code."},
                    {"name": "expired", "message": "Sorry, but this promo/referral code is expired."}]
            }

        ],
        step2: {
            "leftCol": [
                {
                    "title": "First Name",
                    "name": "first_name",
                    "type": "text",
                    "required": false,
                    "placeholder": "Enter here",
                    "classes": "form-text first-n",
                    "customAttrs": [{"required": "required"}, {"ng-pattern": "/^[^0-9\\[\\]\\\\`~!@#$%^&*()_+={};:<>|./?,\"'-\\s]+$/"}, {"capitaliseinput": ""}],
                    "validation": [{"name": "required", "message": "This field is required"}, {"name": "pattern", "message": "Please enter a valid  name: only letters - no space, no digits and/or symbols"}]
                },
                {
                    "title": "Last Name",
                    "name": "last_name",
                    "placeholder": "Enter here",
                    "type": "text",
                    "required": false,
                    "classes": "form-text first-n",
                    "customAttrs": [{"required": "required"}, {"ng-pattern": "/^[^0-9\\[\\]\\\\`~!@#$%^&*()_+={};:<>|./?,\"'-\\s]+$/"}, {"capitaliseinput": ""}],
                    "validation": [{"name": "required", "message": "This field is required"}, {"name": "pattern", "message": "Please enter a valid  last name: only letters - no space, no digits and/or symbols"}]
                }, {
                    "title": "Date of Birth",
                    "name": "birth_day",
                    "type": "select",
                    "required": false,
                    "classes": "select-block mini first",
                    "customAttrs": [{"required": "required"}, {"ng-options": "d for d in days"}, {"day-selector": ""}, {"month-model": "registrationData.birth_month"}, {"year-model": "registrationData.birth_year"}, {"options": "days"}, {"ng-change": "calculateAge()"}],
                    "validation": [{"name": "required", "message": "This field is required"}]
                }, {
                    "title": "",
                    "name": "birth_month",
                    "type": "select",
                    "required": false,
                    "classes": "select-block mini",
                    "customAttrs": [{"required": "required"}, {"ng-change": "calculateAge()"}],
                    "optionsData": "<option ng-repeat=\"month in monthNames\" value=\"{{month.val}}\">{{month.name| translate}}</option>",
                    "validation": [{"name": "required", "message": "This field is required"}]
                }, {
                    "title": "",
                    "name": "birth_year",
                    "type": "select",
                    "required": false,
                    "classes": "select-block mini",
                    "customAttrs": [{"required": "required"}, {"ng-options": "y for y in registrationData.years track by y"}, {"ng-change": "calculateAge()"}],
                    "onChange": ["calculateAge"],
                    "validation": [{"name": "required", "message": "For registration you must be at least 18 years old."}],
                    "customValidation": "<div class=\"city-form-block\" ng-class=\"{error: userAge < 18}\"> <div class=\"form-error-text\"> <div class=\"error-icon-f\"></div><p trans ng-show=\"userAge < 18 \">Registration on this site is not permitted for people under 18.</p></div>"
                },{
                    "title": "Country",
                    "name": "country_id",
                    "type": "select",
                    "required": false,
                    "classes": "city-form-block new",
                    "customAttrs": [{"ng-include": "getTemplate(\"templates/slider/countries.html\")"}, {"ng-init": "preFillRegionalData()"}, {"ng-change": "checkIfCountryIsRestricted();"}],
                    "customValidation": "<div class=\"city-form-block\" ng-class=\"{error: countryIsRestricted}\"> <div class=\"form-error-text\"> <div class=\"error-icon-f\"></div><p trans ng-show=\"countryIsRestricted\">Registration on this site is not permitted in selected country.</p><p ng-show=\"altUrl4RestrictedCountry\"><span trans>You can register here:</span> <a href=\"{{altUrl4RestrictedCountry}}\">{{altUrl4RestrictedCountry}}</a></p></div>"
                }, {
                    "title": "City",
                    "name": "city",
                    "placeholder": "Enter here",
                    "type": "text",
                    "required": false,
                    "classes": "form-text registration-form-city city",
                    "customAttrs": [{"required": "required"}],
                    "validation": [{"name": "required", "message": "This field is required"}]
                },
                {
                    "title": "Gender",
                    "name": "gender",
                    "type": "select",
                    "required": false,
                    "classes": "select-block big",
                    "customAttrs": [{"ng-pattern": "/^[M,F]$/"}, {"ng-change": "calculateAge()"}],
                    "optionsData": "<option ng-repeat=\"gender in genders\" value=\"{{gender.val}}\">{{gender.name| translate}}</option>",
                    "validation": []
                },
                {
                    "title": "Currency",
                    "name": "currency_name",
                    "type": "select",
                    "required": true,
                    "classes": "select-block big",
                    "customAttrs": [{"ng-options": "c for c in  conf.availableCurrencies track by c"}, {"ng-value": "c"}, {"ng-disabled": "currencyDisabled"}],
                    "validation": []
                }
            ],
            rightCol: [
                {
                    "title": "Contact number",
                    "name": "phone_code",
                    "type": "text",
                    "required": false,
                    "classes": "form-text phone-code",
                    "customAttrs": [{"country-code-validate": ""}, {"deValidate": ""}, {"ng-maxlength": "5"}, {"required": "required"}, {"prevent-input": "[^0-9]+"}],
                    "validation": [{"name": "countryCode", "message": "Country code is not correct"}, {
                        "name": "required",
                        "message": "Country code is not correct"
                    }]
                },
                {
                    "title": "",
                    "name": "phone_number",
                    "type": "text",
                    "required": false,
                    "placeholder": "Enter number",
                    "hasCustomHtml": true,
                    "classes": "reg-form-input-number phone_number",
                    "customAttrs": [{"ng-pattern": "/^[0-9 ]+$/"}, {"required": "required"}, {"prevent-input": "[^0-9]+"}],
                    "validation": [{"name": "invalid", "message": "Invalid phone number"}, {
                        "name": "duplicate",
                        "message": "Duplicate phone number"
                    }, {"name": "failedsms", "message": "Failed to send sms"}, {
                        "name": "required",
                        "message": "This field is required"
                    }, {"name": "pattern", "message": "Please, enter valid phone number: only digits are allowed - no spaces, letters and/or symbols"}]
                },
                {
                    "title": "CPF",
                    "name": "doc_number_1",
                    "type": "text",
                    "required": false,
                    "classes": "",
                    "customAttrs": [{"required": "required"}, {"maxlength": "3"}, {"prevent-input": "[^0-9]+"}],
                    "validation": [{ "name": "required", "message": "This field is required"}]
                }, {
                    "title": "",
                    "name": "doc_number_2",
                    "type": "text",
                    "required": false,
                    "classes": "",
                    "customAttrs": [{"required": "required"}, {"maxlength": "3"}, {"prevent-input": "[^0-9]+"}],
                    "validation": [{ "name": "required", "message": "This field is required"}]
                }, {
                    "title": "",
                    "name": "doc_number_3",
                    "type": "text",
                    "required": false,
                    "classes": "",
                    "customAttrs": [{"required": "required"}, {"maxlength": "3"}, {"prevent-input": "[^0-9]+"}],
                    "validation": [{ "name": "required", "message": "This field is required"}]
                }, {
                    "title": "",
                    "name": "doc_number_4",
                    "type": "text",
                    "required": false,
                    "classes": "",
                    "customAttrs": [{"required": "required"}, {"maxlength": "2"}, {"prevent-input": "[^0-9]+"}],
                    "validation": [{ "name": "required", "message": "This field is required"}]
                },
                {
                    "title": "Security question",
                    "name": "security_question",
                    "type": "select",
                    "required": false,
                    "classes": "select-block big",
                    "customAttrs": [{"required": "required"}],
                    "optionsData": "<option ng-repeat=\"q in conf.registration.securityQuestion.questions track by $index\" value=\"{{q| translate}}\">{{q| translate}}</option>",
                    "validation": [{"name": "required", "message": "This field is required"}]
                }, {
                    "title": "Security answer",
                    "name": "security_answer",
                    "type": "text",
                    "required": false,
                    "placeholder": "Enter here",
                    "classes": "form-text",
                    "customAttrs": [{"required": "required"}],
                    "validation": [{"name": "required", "message": "This field is required"}]
                }, {
                    "title": "Promo code",
                    "name": "promo_code",
                    "type": "text",
                    "required": false,
                    "placeholder": "Enter here",
                    "classes": "form-text",
                    "customAttrs": [{"ng-disabled": "hasPromoCode"}],
                    "validation": []
                }
                /*
                 ,
                 {
                 "title": "Please enter the text shown on image",
                 "name": "captcha_text",
                 "type": "captcha",
                 "placeholder": "",
                 "required": true,
                 "classes": "form-text",
                 "customAttrs": [{"required": "required"}],
                 "validation": [{"name": "required", "message": "This field is required"}, {"name": "notmatching", "message": "Text you've entered doesn't match text on image."}]
                 }
                 */
            ]
        }
    },

    'env': {
        showFifaCountdown: false,
        lang: 'eng',
        preMatchMultiSelection: false,
        showSportsbookToolTip: true
    },
    'betting': {
        enableSuperBet: false,
        allowManualSuperBet: false
    },
    'swarm': {
        url: [{ url: "https://swarm-spring-cloud.betconstruct.com"}],
        websocket: [{ url: "wss://swarm-spring-cloud.betconstruct.com"}]
        //url: [{ url: "http://10.25.57.125:8088"}],
        //websocket: [{ url: "ws://10.25.57.125:8088"}]
    },
    poker: {
        hideDownloadLinkSectionInPokerPage: true,
        instantPlayAvailable: true,
        tournamentsInfoLink: 'https://loungebet.rhinobit.eu/en/tournaments/weekly-schedule',
        instantPlayLink: 'https://loungebet.betconstruct.poker/flashclient/',
        instantPlayTarget: '',
        downloadLink: {
            '@replace': true,
            windows: 'https://loungebet.betconstruct.poker/downloadFile.php?do=xp',
            mac: 'https://loungebet.betconstruct.poker/downloadFile.php?do=mac',
            android: 'javascript:alert("Coming soon")'
        }
    },
    chinesePoker: {
        hideDownloadLinkSection: false,
        instantPlayAvailable: false,
        downloadLink: {
            '@replace': true,
            windows: 'https://casino.loungebet.com/nardi/VGames-1.1.11-Setup.exe',
            mac: 'https://casino.loungebet.com/nardi/VGames-1.1.3.dmg'
        }
    },
    belote: {
        instantPlayTarget: '',
        redirectOnGame: true
        //instantPlayTarget: '_self',
        //redirectOnInstantPlay: true,
        //instantPlayLink: "https://www.loungebet.com/#/games/?game=599&type=real"
    },
    backgammon: {
        instantPlayTarget: '',
        downloadLink: {
            windows: 'https://casino.loungebet.com/nardi/VGammon-1.1.27-Setup.exe'
        }
    },
    xDomainSlaves: '{"https://swarm6-hz.betconstruct.com:8080" : "/xdomain-proxy.html", "swarm7-hz.betconstruct.com:8080" : "/xdomain-proxy.html", "https://swarm.loungebet.com" : "/xdomain-proxy.html", "https://casino.loungebet.com" : "/global/partners/xdomain/xDomainProxy.html"}',

    'payments': [
        {
            name: 'cpfform',
            canDeposit: true,
            canWithdraw: true,
            order: 1,
            customDepositTemplate: "skins/loungebet.com/templates/deposit.html",
            customWithdrawTemplate: "skins/loungebet.com/templates/withdraw.html"
        }

    ]

});

CMS.constant('SkinWPConfig', {
    wpUrl: 'https://cmsbetconstruct.com/json',  // WordpResss instance serving pages, banners
    wpNewsUrl: {
        main: 'https://cmsbetconstruct.com/json'
    },  // WordpResss instance serving news
    wpBaseHost: 'www.loungebet.com',  // this parameter will be passed to JSON api and all links in response(e.g. images) will have this host
    wpNewsBaseHost: 'vbet',  // this parameter will be passed to JSON api and all links in NEWS response(e.g. images) will have this host
    wpPromoCustomBaseHost: 'www.loungebet.com'
});

CASINO.constant('SkinCConfig', {
    cUrlPrefix: 'https://games.loungebet.com',
    cGamesUrl: '/global/play.php',
    cUrl: '/global/casinoGamesLoad.php',
    main: {
        providersThatWorkWithSwarm: ['PSN', 'EZG', 'NYX', 'ASG'],
        partnerID: '401',
        newCasinoDesign: {
            enabled: true
        },
        filterByProvider: ['EVL','TLC','IGG'],
        showAllGamesOnHomepage: true,
        favourtieGamesCategoryEnabled: true,
        specialsCategoryEnabled: true
    },
    login: {
        url: '/global/partners/rml.php'
    },
    fantasySports: {
        externalURL: 'https://fantasysports.loungebet.com'
    },
    liveCasino: {
        view3DEnabled: false,
        viewStyle: 'SliderView' // 3DView / ClassicView / SliderView
    },
    balance: {
        url: '/global/cashier/cashier.php'
    }
});


EXCHANGE.constant('SkinExchangeConfig', {});
