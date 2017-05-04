angular.module('vbet5').constant('RegConfig', {
    "leftCol": [{
        "title": "Name",
        "name": "first_name",
        "type": "text",
        "required": true,
        "placeholder": "First",
        "classes": "form-text first-n",
        "customAttrs": [{"required": "required"}, {"ng-pattern": "/^[^0-9\\[\\]\\\\`~!@#$%^&*()_+={};:<>|./?,\"'-\\s]+$/"}, {"capitaliseinput": ""}],
        "validation": [{"name": "required", "message": "This field is required"}, {"name": "pattern", "message": "Please enter a valid  name: only letters - no space, no digits and/or symbols"}]
    }, {
        "title": "Middle",
        "name": "middle_name",
        "type": "text",
        "placeholder": "Middle",
        "required": false,
        "classes": "form-text middle-n",
        "customAttrs": [{"ng-pattern": "/^[^0-9\\[\\]\\\\`~!@#$%^&*()_+={};:<>|./?,\"'-\\s]+$/"}, {"capitaliseinput": ""}],
        "validation": [{"name": "pattern", "message": "Only letters - no space, no digits and/or symbols"}]
    }, {
        "title": "Last",
        "name": "last_name",
        "placeholder": "Last",
        "type": "text",
        "required": true,
        "classes": "form-text first-n",
        "customAttrs": [{"required": "required"}, {"ng-pattern": "/^[^0-9\\[\\]\\\\`~!@#$%^&*()_+={};:<>|./?,\"'-\\s]+$/"}, {"capitaliseinput": ""}],
        "validation": [{"name": "required", "message": "This field is required"}, {"name": "pattern", "message": "Please enter a valid  last name: only letters - no space, no digits and/or symbols"}]
    }, {
        "title": "Birth date",
        "name": "birth_day",
        "type": "select",
        "required": true,
        "classes": "select-block mini first",
        "customAttrs": [{"required": "required"}, {"ng-options": "d for d in days"}, {"day-selector": ""}, {"month-model": "registrationData.birth_month"}, {"year-model": "registrationData.birth_year"}, {"options": "days"}, {"ng-change": "calculateAge()"}],
        "validation": [{"name": "required", "message": "This field is required"}]
    }, {
        "title": "",
        "name": "birth_month",
        "type": "select",
        "required": true,
        "classes": "select-block mini",
        "customAttrs": [{"required": "required"}, {"ng-change": "calculateAge()"}],
        "optionsData": "<option ng-repeat=\"month in monthNames\" value=\"{{month.val}}\">{{month.name| translate}}</option>",
        "validation": [{"name": "required", "message": "This field is required"}]
    }, {
        "title": "",
        "name": "birth_year",
        "type": "select",
        "required": true,
        "classes": "select-block mini",
        "customAttrs": [{"required": "required"}, {"ng-options": "y for y in registrationData.years track by y"}, {"ng-change": "calculateAge()"}],
        "onChange": ["calculateAge"],
        "validation": [{"name": "required", "message": "This field is required"}]
    }, {
        "title": "Gender",
        "name": "gender",
        "type": "select",
        "required": true,
        "classes": "select-block big",
        "customAttrs": [{"ng-pattern": "/^[M,F]$/"}, {"ng-change": "calculateAge()"}],
        "optionsData": "<option ng-repeat=\"gender in genders\" value=\"{{gender.val}}\">{{gender.name| translate}}</option>",
        "validation": []
    }, {
        "title": "Username",
        "name": "username",
        "placeholder": "Enter here",
        "type": "text",
        "required": true,
        "classes": "form-text",
        "customAttrs": [{"required": "required"}, {"ng-pattern": "/^[a-zA-Z0-9\\_\\-]+$/"}],
        "validation": [{"name": "required", "message": "This field is required"}, {
            "name": "exists",
            "message": "Sorry, this username has been used already"
        }, {
            "name": "pattern",
            "message": "Please, enter valid Username: only English letters, digits and symbols - _ no space is allowed"
        }]
    }, {
        "title": "Password",
        "name": "password",
        "placeholder": "Password should contain at least 8 characters",
        "tooltip": 'Password should contain upper and lower-case English letters, at least one digit and no spaces.',
        "type": "password",
        "required": true,
        "classes": "form-text",
        "customAttrs": [{"ng-minlength": "8"}, {"type": "password"}, {"required": "required"}, {"ng-pattern": "/^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)[a-zA-Z\\d\\[\\]\\\\`~!@#$%^&*()_+={};:<>|./?,\"'-]+$/"}],
        "validation": [{"name": "required", "message": "This field is required"}, {
            "name": "minlength",
            "message": "Password should contain at least 8 characters"
        }, {"name": "sameAsLogin", "message": "Password cannot be same as login"}, {
            "name": "tooShort",
            "message": "Password is too short"
        }, {"name": "pattern", "message": "Password should contain upper and lower-case English letters, at least one digit and no spaces."}]
    }, {
        "title": "Confirm Password",
        "name": "password2",
        "type": "password",
        "placeholder": "Confirm Password",
        "required": true,
        "classes": "form-text",
        "customAttrs": [{"match": "registrationData.password"}, {"required": "required"}, {"ng-disabled": "registerform.password.$invalid"}],
        "validation": [{"name": "required", "message": "This field is required"}, {
            "name": "match",
            "message": "Passwords don't match"
        }]
    }, {
        "title": "Email Address",
        "name": "email",
        "type": "email",
        "placeholder": "Enter here",
        "required": true,
        "classes": "form-text",
        "customAttrs": [{"required": "required"}, {"ng-pattern": "/^([a-zA-Z0-9]+([_+\.-]?[a-zA-Z0-9]+)*)@([a-zA-Z0-9]+)(([\\-\.]?[a-zA-Z0-9]+)*)([\.])([a-z]+)([^~@!#$%^&*()_+|{}:<>?,/;'-=\\[\\]\\`\"\.\\\\])$/"}, {"prevent-input": "/^[\\S ]+$/"}],
        "validation": [{"name": "required", "message": "This field is required"},
                        //{"name": "email", "message": "Please enter a valid email address" },
                        {"name": "pattern", "message": 'Please enter a valid email address'},
                        {"name": "exists", "message": "This email already exists in our database, please enter another"
        }]
    }],
    "rightCol": [{
        "title": "Country",
        "name": "country_id",
        "type": "select",
        "required": true,
        "classes": "city-form-block new",
        "customAttrs": [{"ng-include": "getTemplate(\"templates/slider/countries.html\")"}, {"ng-init": "preFillRegionalData()"}, {"ng-change": "checkIfCountryIsRestricted();"}],
        "customValidation": "<div class=\"city-form-block\" ng-class=\"{error: countryIsRestricted}\"> <div class=\"form-error-text\"> <div class=\"error-icon-f\"></div><p trans ng-show=\"countryIsRestricted\">Registration on this site is not permitted in selected country.</p><p ng-show=\"altUrl4RestrictedCountry\"><span trans>You can register here:</span> <a href=\"{{altUrl4RestrictedCountry}}\">{{altUrl4RestrictedCountry}}</a></p></div>"
    }, {
        "title": "City",
        "name": "city",
        "placeholder": "Enter here",
        "type": "text",
        "required": true,
        "classes": "registration-form-city city",
        "customAttrs": [{"required": "required"}],
        "validation": [{"name": "required", "message": "This field is required"}]
    }, {
        "title": "Address",
        "name": "address",
        "type": "text",
        "placeholder": "Enter here",
        "required": true,
        "classes": "form-text",
        "customAttrs": [{"required": "required"}],
        "validation": [{"name": "required", "message": "This field is required"}]
    }, {
        "title": "Contact number",
        "name": "phone_code",
        "type": "text",
        "required": true,
        "classes": "form-text phone-code",
        "customAttrs": [{"country-code-validate": ""}, {"deValidate": ""}, {"ng-maxlength": "5"}, {"required": "required"}, {"prevent-input": "[^0-9]+"}],
        "validation": [{"name": "countryCode", "message": "Country code is not correct"}, {
            "name": "required",
            "message": "Country code is not correct"
        }]
    }, {
        "title": "",
        "name": "phone_number",
        "type": "text",
        "required": true,
        "placeholder": "Enter number",
        "hasCustomHtml": true,
        "classes": "reg-form-input-number phone_number",
        "customAttrs": [{"ng-pattern": "/^[0-9 ]+$/"}, {"required": "required"}, {"prevent-input": "/^[\\S ]+$/"}],
        "validation": [{"name": "invalid", "message": "Invalid phone number"}, {
            "name": "duplicate",
            "message": "Duplicate phone number"
        }, {"name": "failedsms", "message": "Failed to send sms"}, {
            "name": "required",
            "message": "This field is required"
        }, {"name": "pattern", "message": "Please, enter valid phone number: only digits are allowed - no spaces, letters and/or symbols"}]
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
        "required": false,
        "placeholder": "Enter here",
        "classes": "form-text",
        "customAttrs": [{"ng-disabled": "hasPromoCode"}],
        "validation": []
    }],
    "bottomCol": []
});
