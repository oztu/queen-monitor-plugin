module.exports = function(grunt) {
  // Project configuration.
  grunt.initConfig({
    pkg: '<json:package.json>',    
    files: {
      server: ['lib/server/**/*.js'],
      client: {
        libs: '',
        src: 'lib/client/*.js'
      },
      src: ['lib/**/*.js'],
      monitor: {
        src: 'lib/client/**/*.js'
      },
      test: {
        src: ['test/**/*.js']
      },
      thirdParty: {
        src: ["./components/angular/angular.js"]
      },
      styles: [ 
        './lib/client/style/external/**/*.css', 
        './lib/client/style/**/*.css', 
        './build/less.css'
      ]
    },
    meta: {
      banner: '/*! <%= pkg.title || pkg.name %> - v<%= pkg.version %> - ' +
        '<%= grunt.template.today("yyyy-mm-dd") %>\n' +
        '<%= pkg.homepage ? "* " + pkg.homepage + "\n" : "" %>' +
        '* Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author.name %>;' +
        ' Licensed <%= _.pluck(pkg.licenses, "type").join(", ") %> */'
    },
    hug: {
      monitor: {
        src: './lib/client/Monitor.js',
        dest: 'build/queen-monitor.js',
        exportedVariable: 'QueenMonitor',
        exports: './lib/client/Monitor.js',
        path: ['./components']
      }
    },
    min: {
      monitor: {
        src: ['<banner:meta.banner>', '<config:hug.monitor.dest>'],
        dest: 'dist/queen-monitor.js'
      }
    },
    copy: {
      dist: {
        files: {
          "./static/" : "./dist/**/*"
        }
      },
      dev: {
        files: {
          "./static/" : "./build/**/*"
        }
      }
    },    
    lint: {
      server: '<config:files.server>',
      client: '<config:files.client.src>'
    },
    nodeunit: {
      server: ['./test/server/**/*.js']
    },
    watch: {
      monitor: {
        files: '<config:files.monitor.src>',
        tasks: 'build-dev'
      }
    },
    less: {
      styles:{
        files: {
          './lib/client/style/less.css': './lib/client/style/**/*.less'
        }
      }
    },
    concat: {
      styles: {
        src: ['<config:files.styles>'],
        dest: 'static/queen-monitor.css'
      }
    },    
    bower: {},
    clean: {
      build: ['./build/']
    },
    jshint: {
      server: {
        options: {
          node: true,
          strict: false,
          sub: true,
          expr: true
        }
      },
      client: {
        options: {
          browser: true,
          sub: true
        }
      },
      options: {
        quotmark: 'single',
        camelcase: true,
        trailing: true,
        curly: true,
        eqeqeq: true,
        immed: true,
        latedef: true,
        newcap: true,
        noarg: true,
        sub: true,
        undef: true,
        boss: true
      },
      globals: {}
    }
  });

  grunt.loadNpmTasks('grunt-hug');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-less');
  
  grunt.registerTask('build-js', 'hug');
  grunt.registerTask('build-css', 'less concat:styles');
  grunt.registerTask('build', 'lint build-js build-css');

  grunt.registerTask('build-dev', 'build copy:dev');
  grunt.registerTask('build-release', 'clean bower build min copy:dist');

  grunt.renameTask('test','nodeunit');
  //grunt.registerTask('test', 'nodeunit');

  grunt.registerTask('default', 'clean bower build-dev');

  grunt.registerTask('bower', function(){
    var done = this.async();
    var bower = require('bower');
    bower.commands.
        install().
        on('end', function(data){
          if(data) grunt.log.writeln(data); 
          done(true);
        }).
        on('error', function(err){
          if(err) grunt.log.writeln(err);
          done(false);
        });
  });
};