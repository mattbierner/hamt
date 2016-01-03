var babel = require("gulp-babel");
var gulp = require("gulp");
var sourcemaps = require("gulp-sourcemaps");
var plumber = require('gulp-plumber');

gulp.task("default", () =>
    gulp.src("lib/*.js")
        .pipe(plumber())
        .pipe(sourcemaps.init())
        .pipe(babel({
            presets: ['es2015']
        }))
        .pipe(sourcemaps.write("."))
        .pipe(gulp.dest("./")));

gulp.watch('lib/*.js', ['default']);

