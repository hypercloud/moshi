/**
 * @author    Junxiang Wei {@link http://www.nodeunify.com}
 * @copyright Copyright (c) 2016, Junxiang Wei
 * @license   MIT
 */
'use strict';

import gulp from 'gulp';
import util from 'util';
import urlMod from 'url';
import fs from 'fs';
import path from 'path';

import paths from '../paths';

const PREDICATE_ID = '@id';
const PREDICATE_REVERSE = '@reverse';
const PREDICATE_VALUE = '@value';
const PREDICATE_LABEL = 'http://www.w3.org/2000/01/rdf-schema#label';
const PREDICATE_LAYER = 'http://schema.org/layer';
const PREDICATE_SUBCLASSOF = 'http://www.w3.org/2000/01/rdf-schema#subClassOf';

const getID = (clazz) => {
  return clazz[PREDICATE_ID];
};

const getLabel = (clazz) => {
  let labelObject = clazz[PREDICATE_LABEL];
  if (util.isArray(labelObject)) {
    labelObject = labelObject[0];
    return labelObject[PREDICATE_VALUE];
  }
};

const getLayer = (clazz) => {
  let layerObject = clazz[PREDICATE_LAYER];
  if (util.isArray(layerObject)) {
    layerObject = layerObject[0];
    return layerObject[PREDICATE_VALUE];
  }
};

const getReverse = (clazz) => {
  return clazz[PREDICATE_REVERSE];
};

const getSubClasses = (clazz) => {
  let reverse = getReverse(clazz);
  if (reverse) {
    return reverse[PREDICATE_SUBCLASSOF];
  }
};

const getURL = (id, layer) => {
  if (layer === 'core') {
    return id;
  }
  let urlObj = urlMod.parse(id);
  let host = urlObj.host;
  urlObj.host = layer + '.' + host;
  return urlMod.format(urlObj);
};

const getDirPath = (label, rootPath) => {
  if (util.isString(label)) {
    return path.join(rootPath, label);
  }
};

const parse = (classes, rootPath) => {
  let map = {};
  for (let clazz of classes) {
    let id = getID(clazz);
    let label = getLabel(clazz);
    let layer = getLayer(clazz);
    let url = getURL(id, layer);
    let filePath = path.resolve(rootPath, label + '.jsonld');
    map[filePath] = url;
    let subClasses = getSubClasses(clazz);
    let dirPath = getDirPath(label, rootPath);
    if (util.isArray(subClasses)) {
      let result = parse(subClasses, dirPath);
      for (let key in result) {
        if (result.hasOwnProperty(key)) {
          let value = result[key];
          map[key] = value;
        }
      }
    }
  }
  return map;
};

gulp.task('parse', (cb) => {
  fs.readFile(paths.tmp.fullTree, (readErr, data) => {
    if (readErr) {
      return cb(readErr);
    }
    let tree;
    try {
      tree = JSON.parse(data);
    } catch (parseErr) {
      return cb(parseErr);
    }
    if (!tree) {
      return cb(new Error('The full type hierarchy is undefined'));
    }
    let rootPath = paths.tmp.vocabPath;
    let result = parse(tree, rootPath);
    fs.writeFile(paths.tmp.classes, JSON.stringify(result, null, 2), cb);
  });
});
