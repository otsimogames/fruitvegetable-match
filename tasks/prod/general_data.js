import config from '../config.js';
import gulp from 'gulp';
import util from 'gulp-util';
import jsonMinify from 'gulp-json-minify';
import replace from 'gulp-replace';

gulp.task('otsimojson:prod', () => {
    return gulp.src(config.paths.src.otsimojson)
        .pipe(jsonMinify())
        .pipe(replace(/,"meta":\{.*}$/, '}'))
        .pipe(gulp.dest(config.paths.builds.prod.root))
        .on('error', util.log);
});

gulp.task('settingsjson:prod', () => {
    return gulp.src(config.paths.src.settingsjson)
        .pipe(jsonMinify())
        .pipe(replace(/,"meta":\{.*}$/, '}'))
        .pipe(gulp.dest(config.paths.builds.prod.root))
        .on('error', util.log);
});