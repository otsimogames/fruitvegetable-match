import config from '../config.js';
import gulp from 'gulp';
import util from 'gulp-util';

gulp.task('otsimojson:dev', () => {
    return gulp.src(config.paths.src.otsimojson)
        .pipe(gulp.dest(config.paths.builds.dev.root))
        .on('error', util.log);
});

gulp.task('settingsjson:dev', () => {
    return gulp.src(config.paths.src.settingsjson)
        .pipe(gulp.dest(config.paths.builds.dev.root))
        .on('error', util.log);
});