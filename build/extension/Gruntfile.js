/*global module:false*/
module.exports = function (grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        uglify: {
            main: {
                options: {
                    compress: {
                        drop_console: true
                    }
                },
                files: [
                    {expand: true, cwd: '../../extension/js', src: '**/*.js', dest: 'dist/<%=skin%>/js'},
                    {'dist/<%=skin%>/config.js': ['../../extension/config.js']},
                    {'dist/<%=skin%>/translations.js': ['../../extension/translations.js']},
                    {'dist/<%=skin%>/lib/angular/angular.js': ["../../extension/lib/angular/angular.js"]},
                    {'dist/<%=skin%>/lib/amplify.store.min.js': ["../../extension/lib/amplify.store.min.js"]},
                    {'dist/<%=skin%>/lib/moment-with-langs.min.js': ["../../extension/lib/moment-with-langs.min.js"]},
                    {'dist/<%=skin%>/services/authdata.js': ["../../extension/services/authdata.js"]},
                    {'dist/<%=skin%>/services/storage.js': ["../../extension/services/storage.js"]},
                    {'dist/<%=skin%>/services/translator.js': ["../../extension/services/translator.js"]},
                    {'dist/<%=skin%>/services/utils.js': ["../../extension/services/utils.js"]},
                    {'dist/<%=skin%>/services/websocket.js': ["../../extension/services/websocket.js"]},
                    {'dist/<%=skin%>/services/zergling.js': ["../../extension/services/zergling.js"]},
                    {'dist/<%=skin%>/services/moment.js': ["../../extension/services/moment.js"]},
                    {'dist/<%=skin%>/filters/translate.js': ["../../extension/filters/translate.js"]},
                    {'dist/<%=skin%>/filters/count.js': ["../../extension/filters/count.js"]},
                    {'dist/<%=skin%>/filters/formatdate.js': ["../../extension/filters/formatdate.js"]},
                    {'dist/<%=skin%>/filters/removeparts.js': ["../../extension/filters/removeparts.js"]},
                    {'dist/<%=skin%>/directives/trans.js': ["../../extension/directives/trans.js"]}
                ]
            }
        },
        copy: {
            main: {
                files: [
                    {expand: true, cwd: '../../extension', src: ['skin/**'], dest: './dist/<%=skin%>/'},
                    {expand: true, cwd: '../../extension', src: ['css/**'], dest: './dist/<%=skin%>/'},
                    {expand: true, cwd: '../../extension', src: ['images/**'], dest: './dist/<%=skin%>/'},
                    {expand: true, cwd: '../../extension', src: ['sounds/**'], dest: './dist/<%=skin%>/'},
                    {expand: true, cwd: '../../extension', src: ['fonts/**'], dest: './dist/<%=skin%>/'},
                    {expand: true, cwd: '../../extension', src: ['*.html'], dest: './dist/<%=skin%>/'},
                    {expand: true, cwd: '../../extension', src: ['manifest.json'], dest: './dist/<%=skin%>/'}
                ]
            }
        },
        replace: {
            main: {
                options: {
                    patterns: [
                        {match: /\"version\"\:\s\"(.*)\"/g,  replacement: '"version" : "1.0.<%=svninfo.rev%>"'}
                    ]
                },
                files: [
                    { src: ['dist/<%=skin%>/manifest.json'], dest: 'dist/<%=skin%>/manifest.json'}
                ]
            },
            config: {
                options: {
                    patterns: [
                        {match: /\"config\.js\"/g,  replacement: '"skin/<%=skin%>/config.js"'}
                    ]
                },
                files: [
                    { src: ['dist/<%=skin%>/content.html', 'dist/<%=skin%>/options.html'], dest: './'}
                ]
            }
        },
        compress: {
            main: {
                options: {
                    archive: '<%=skin%>.extension.<%=svninfo.rev%>.zip'
                },
                files: [
                    {expand: true, cwd: 'dist/<%=skin%>/', src: ['**/**'], dest: './'}
                ]
            }
        }
    });

    grunt.config.set('skin', grunt.option('skin') || 'vivarobet.am');

    grunt.loadNpmTasks('grunt-svninfo');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-compress');
    grunt.loadNpmTasks('grunt-replace');

    grunt.registerTask('default', ['svninfo', 'uglify', 'copy', 'replace', 'compress']);

};
