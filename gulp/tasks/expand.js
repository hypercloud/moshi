/**
 * @author    Junxiang Wei {@link http://www.nodeunify.com}
 * @copyright Copyright (c) 2016, Junxiang Wei
 * @license   MIT
 */
'use strict';

import gulp from 'gulp';
import fs from 'fs';
import mkdirp from 'mkdirp';
import jsonld from 'jsonld';

import paths from '../paths';

const expandContext = {
  '@context': [
    'http://schema.org/docs/tree.jsonld',
    {
      'layer': 'http://schema.org/layer'
    }
  ]
};

gulp.task('expand', (cb) => {
  mkdirp(paths.tmp.basePath, (error) => {
    if (error) {
      return cb(error);
    }
    // Expand context with `layer` predicate
    let options = { 'expandContext': expandContext };
    jsonld.expand('http://schema.org/docs/tree.jsonld', options, (err, expanded) => {
      if (err) {
        return cb(err);
      }
      fs.writeFile(paths.tmp.fullTree, JSON.stringify(expanded, null, 2), cb);
    });
  });
});
