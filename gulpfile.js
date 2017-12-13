// Инициализация галп и его модулей
const gulp = require('gulp');
const gulpLoadPlugins = require('gulp-load-plugins');
const $ = gulpLoadPlugins();
const del = require('del');
const pngquant = require('imagemin-pngquant');
const browserSync = require('browser-sync').create();
const webpack = require('webpack');
const webpackConfig = require('./webpack.config.js');

const paths = {
    root: './dist',
    templates: {
        pages: 'app/pug/pages/*.pug',
        src: 'app/pug/**/*.pug'
    },
    styles: {
        srcMain:'app/scss/main.scss',
        src: 'app/scss/**/*.scss',
        dest: 'dist/css/'
    },    
    images: {
        src: 'app/img/**/*.*',
        dest: 'dist/img/'
    },
    svg: {
        src: 'app/img/icons/*.svg',
        dest: 'dist/img/icons'
    },
    fonts: {
        src: 'app/fonts/**/*.*',
        dest: 'dist/fonts/'
    },
    scripts: {
        src: 'app/js/app.js',
        dest: 'dist/js/'
    }
};

// Очистка
function clean() {
    return del(paths.root);
}

// Компиляция javaScript + webpack
function scripts() {
    return gulp.src(paths.scripts.src)
        .pipe($.plumber({
            errorHandler: $.notify.onError(function(error) {
                return {
                    title: 'Js',
                    message: error.message
                };
            })}))
        .pipe($.webpack(webpackConfig, webpack)) 
        .pipe($.babel())
        .pipe($.uglify())
        .pipe(gulp.dest(paths.scripts.dest));
}

// Компилим pug в html
function templates() {
    return gulp.src(paths.templates.pages)
        .pipe($.plumber({
            errorHandler: $.notify.onError(function(error) {
                return {
                    title: 'Pug',
                    message: error.message
                };
            })}))
        .pipe($.pug({ pretty: true }))
        .pipe(gulp.dest(paths.root));
}

// Компилим scss
function styles() {
    return gulp.src(paths.styles.srcMain)
        .pipe($.plumber({
            errorHandler: $.notify.onError(function(error) {
                return {
                    title: 'Style',
                    message: error.message
                };
            })}))
        .pipe($.sourcemaps.init())
        .pipe($.sass({
            outputStyle: 'compressed',
            includePaths: require('node-normalize-scss').includePaths
        }))
        .pipe($.autoprefixer({
            browsers: ['last 2 versions'],
            cascade: false
        }))
        .pipe($.sourcemaps.write())
        .pipe($.rename({suffix: '.min'}))
        .pipe(gulp.dest(paths.styles.dest))
}

// Перенос шрифтов
function fonts() {
    return gulp.src(paths.fonts.src)
        .pipe(gulp.dest(paths.fonts.dest));
}

// Перенос и минификация картинок
function images() {
    return gulp.src(paths.images.src)
        .pipe($.imagemin({
            progressive: true,
            svgoPlugins: [{removeViewBox: false}],
            use: [pngquant()]
        }))
        .pipe(gulp.dest(paths.images.dest));
}

// Перенос и создание svg спрайта
function svg() {
    return gulp.src(paths.svg.src)
        //минифицируем svg
        .pipe($.svgmin({
            js2svg: {
                pretty: true
            }
        }))
        // удадяем атрибуты
        .pipe($.cheerio({
            run: function ($) {
                $('[fill]').removeAttr('fill');
                $('[stroke]').removeAttr('stroke');
                $('[style]').removeAttr('style');
            },
            parserOptions: {xmlMode: true}
        }))
        // заменяем строку '& gt;' созданнуд плагином cheerio
        .pipe($.replacePath('&gt;', '>'))
        // собираем svg спрайт
        .pipe($.svgSprites({
            mode: "symbols",
            selector: "icon-%f",
            svg: {
                symbols: "sprite.svg"
            },
            preview: {
                sprite: "symbols.html"
            }
        }))
        .pipe(gulp.dest(paths.svg.dest));
}

// Локальный сервер + livereload
function server() {
    browserSync.init({
        server: paths.root
    });
    browserSync.watch(paths.root + '/**/*.*', browserSync.reload);
}

// Слежение за изменениями
function watch() {
    gulp.watch(paths.scripts.src, scripts);
    gulp.watch(paths.styles.src, styles);
    gulp.watch(paths.templates.src, templates);
    gulp.watch(paths.images.src, images);
    gulp.watch(paths.fonts.src, fonts);
}

exports.clean = clean;
exports.scripts = scripts;
exports.templates = templates;
exports.styles = styles;
exports.fonts = fonts;
exports.images = images;
exports.svg = svg;
exports.server = server;

gulp.task('default', gulp.series(
    clean,
    svg,
    gulp.parallel(scripts, styles, templates, images, fonts),
    gulp.parallel(watch, server)
));