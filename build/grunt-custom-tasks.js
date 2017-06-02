// custom tasks
module.exports = function (grunt) {
    'use strict';
    // add-sass --content = 'CssText'  This task will add given css text to all skins skin.scss files
    grunt.registerTask('add-sass', function () {

        var pattern = '../skins/**/sass/skin.scss',
            files = grunt.file.expand(pattern),
            cssText = grunt.option('content');
        files.forEach(function (item) {
            var currentContent = grunt.file.read(item);
            var finalOutput = currentContent + '\n' + cssText;
            grunt.file.write(item, finalOutput);

        });
    });

    grunt.registerTask('load-css-filelist', 'loads css files list for skin', function () {
        var cssFiles = grunt.config.get('angularValue').VBET5.SkinConfig.main.cssFiles  || grunt.config.get('defaultCssFileList');
        grunt.config.set("cssFilesArray", JSON.stringify(cssFiles).replace(/\"/g, "'")); //this stores list in a value to use for generating skin launcher html
        cssFiles = cssFiles.map(function (path) { return path = '../css/' + path; });
        console.log("CSS files:", cssFiles);
        var configObject = {
            files: {
                'main.min.css': cssFiles,
                'skin.min.css': [ '../skins/<%=skin%>/css/main.css', '../skins/<%=skin%>/css/skin.css']
            }
        };
        grunt.file.expand({matchBase: true,  filter: 'isFile'}, ['../skins/' + grunt.option('skin') + '/css/additional/*.css']).forEach(function (file) {
            configObject.files[file] = file;
        });
        grunt.config.set('cssmin', {combine: configObject});
    });


    grunt.registerTask('load-language-filelist', 'loads language files list for skin', function () {
        var files = [];
        var config = grunt.config.get('angularValue');
        if (config.VBET5.SkinConfig.main.availableLanguages === undefined) {
            grunt.fail.fatal("availableLanguages not set in skin config, cannot get language list for skin");
        }
        console.log("language files to be downloaded:");
        Object.keys(config.VBET5.SkinConfig.main.availableLanguages).forEach(function (lang) {
            if (lang[0] === '@') {
                return;
            }
            var url = grunt.config.get('translationsJsonUrl') + grunt.config.get('skinConfig') + '/languages/' + lang + '.json';
            files.push({url: url, dest: 'languages_tmp'});
            console.log(url);
        });
        grunt.config.set('downloadfile', {files: files});
    });

    // generates source list for skin's local html file
    grunt.registerTask('get-src-list', 'test', function () {
        var html = "";
        var conf = grunt.config.get('angularValue');

        // include  skin specific js files
        grunt.file.expand({matchBase: true,  filter: 'isFile'}, ['../skins/' + grunt.option('skin') + '/js/**/*.js']).forEach(function (file) {
            html += "<script src='" + file.replace('../skins', 'skins') + "'></script>\n";
        });
        grunt.config.set('sourceFiles', html);
        console.log("skin js files:\n", html);
        html = "";

        // include optional module js files
        if (conf && conf.VBET5 && conf.VBET5.SkinConfig && conf.VBET5.SkinConfig.additionalModules) {
            conf.VBET5.SkinConfig.additionalModules.map(function (module) {
                console.log(" additional module:" + module + "\n");
                html += "\n<!-- " + module + " module start -->\n";
                grunt.file.expand({matchBase: true,  filter: 'isFile'}, ['../optional_modules/' + module + '/*/**/*.js']).
                sort(function(a){ return a.match("js\/main.js")? -1 : 1 }). //main.js must be loaded first
                forEach(function (file) {
                    html += "<script src='" + file.replace('../optional_modules', 'optional_modules') + "'></script>\n";
                });
                html += "<!-- " + module + " module end -->\n\n";
            });
        }
        grunt.config.set('optionalSourceFiles', html);
        console.log("optional js files:\n", html);
    });

    grunt.registerTask('create-conf', 'creates conf.json', function () {
        var conf = grunt.config.get('angularValue');
        var configObj = {};
        for (var moduleName in conf) {
            var moduleConfigName = Object.keys(conf[moduleName])[0];
            console.log("Loaded config for module ", moduleName, moduleConfigName);
            if (moduleConfigName) {
                configObj[moduleConfigName] = conf[moduleName][moduleConfigName]
            }
        }
        grunt.file.write("conf.json", JSON.stringify(configObj, null, 2));
        console.log("conf.json created");
    });

    grunt.registerTask('load-additional-modules', 'adds additional module files into build if specified in config', function () {
        var conf = grunt.config.get('angularValue');
        var tplConfig = grunt.config.get('ngtemplates');
        var jsConfig = grunt.config.get('closure-compiler');
        if (conf && conf.VBET5 && conf.VBET5.SkinConfig && conf.VBET5.SkinConfig.additionalModules) {
            conf.VBET5.SkinConfig.additionalModules.map(function (module) {
                console.log("building with additional module:" + module + "\n");
                tplConfig.app.src.push('optional_modules/' + module + '/templates/**/*.html');
                jsConfig.frontend.js.unshift('../optional_modules/' + module + '/lib/**/*.js');
                jsConfig.frontend.js.splice(jsConfig.frontend.js.length - 4, 0, '../optional_modules/' + module + '/js/main.js');
                jsConfig.frontend.js.splice(jsConfig.frontend.js.length - 4, 0, '../optional_modules/' + module + '/js/**/*.js');
            });
            grunt.config.set('ngtemplates', tplConfig);
            grunt.config.set('closure-compiler', jsConfig);
        }
        console.log("files to be included in build:", tplConfig, jsConfig);
    });

    grunt.registerTask('no-cdn-libs', 'replaces cdn lib links with local ones if specified in config', function () {
        var conf = grunt.config.get('angularValue');
        var replaceConfig = grunt.config.get('replace');
        var copyConfig = grunt.config.get('copy');
        if (conf && conf.VBET5 && conf.VBET5.SkinConfig && conf.VBET5.SkinConfig.main && conf.VBET5.SkinConfig.main.loadLibsLocally) {
            console.log("libs will be loaded locally (not from CDN)");
            replaceConfig.noCdnLibs.options.patterns = [{match: /\/\/ajax.googleapis.com\/ajax\/libs/g, replacement: 'libs'}];
            copyConfig.main.files.push({expand: true, cwd: '../lib/min', src: ['**'], dest: 'app/<%=skin%>/libs/'});
        }
        console.log(replaceConfig.noCdnLibs.options);
        grunt.config.set('replace', replaceConfig);
        grunt.config.set('copy', copyConfig);

    });
};