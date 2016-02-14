/**
 * @author    Junxiang Wei {@link http://www.nodeunify.com}
 * @copyright Copyright (c) 2016, Junxiang Wei
 * @license   MIT
 */
'use strict';

import gulp from 'gulp';
import del from 'del';
import runSequence from 'run-sequence';

import paths from '../paths';

gulp.task('clean', (cb) => {
  const files = [].concat(paths.dist.basePath, paths.tmp.basePath);
  return del(files, cb);
});

gulp.task('buildDataModel', () => {
  return gulp.src([paths.tmp.dataModel])
    .pipe(gulp.dest(paths.dist.basePath));
});

gulp.task('buildVocab', () => {
  return gulp.src([paths.tmp.vocabPath + '**/*.jsonld'])
    .pipe(gulp.dest(paths.dist.vocabPath));
});

gulp.task('build', ['buildDataModel', 'buildVocab']);

gulp.task('moshi', (cb) => {
  runSequence(['clean'], ['expand'], ['parse'], ['translate'], ['compact'], ['build'], cb);
});

gulp.task('default', ['moshi']);

gulp.task('dataModel', (cb) => {
  runSequence(['translateDataModel'], ['compactDataModel'], ['buildDataModel'], cb);
});

gulp.task('vocab', (cb) => {
  runSequence(['expand'], ['parse'], ['translateVocab'], ['compactVocab'], ['buildVocab'], cb);
});
