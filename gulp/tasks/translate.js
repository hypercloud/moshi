/**
 * @author    Junxiang Wei {@link http://www.nodeunify.com}
 * @copyright Copyright (c) 2016, Junxiang Wei
 * @license   MIT
 */
'use strict';

import gulp from 'gulp';
import fs from 'fs';
import path from 'path';
import Promise from 'bluebird';
import mkdirp from 'mkdirp';
import retry from 'retry';
import request from 'request';
import {is as typeis} from 'type-is';

import paths from '../paths';

const translatorURL = 'http://rdf-translator.appspot.com/convert/rdfa/json-ld/';
const dataModelURL = 'http://schema.org/docs/schema_org_rdfa.html';

const ensureDirExists = (filePath) => {
  let dirname = path.dirname(filePath);
  return new Promise((resolve, reject) => {
    mkdirp(dirname, (err) => {
      if (err) {
        return reject(err);
      }
      resolve();
    });
  });
};

const translate = (url, filePath, cb) => {
  let requestStream = request(translatorURL + url);
  let writeStream = fs.createWriteStream(filePath);

  let onError = (err) => {
    requestStream.removeAllListeners();
    writeStream.removeAllListeners();
    writeStream.end();
    cb(err);
  };

  requestStream
    .on('response', (response) => {
      let status = response.statusCode;
      let type = response.headers['content-type'];
      if (status !== 200 || !typeis(type, ['jsonld'])) {
        onError(new Error('Request failed'));
      }
    })
    .on('error', onError);

  writeStream
    .on('error', onError)
    .on('finish', cb);

  requestStream.pipe(writeStream);
};

const faultTolerantTranslate = (url, filePath) => {
  return new Promise((resolve) => {
    let operation = retry.operation({ 'retries': 20 });
    operation.attempt(() => {
      translate(url, filePath, (err) => {
        if (operation.retry(err)) {
          return;
        }
        // If all retries failed, just ignore and continue
        // console.log('Translated schema `' + url + '`');
        resolve();
      });
    });
  });
};

gulp.task('translateDataModel', () => {
  return ensureDirExists(paths.tmp.dataModel).then(() => {
    return faultTolerantTranslate(dataModelURL, paths.tmp.dataModel);
  });
});

gulp.task('translateVocab', () => {
  return new Promise((resolve, reject) => {
    fs.readFile(paths.tmp.classes, (readErr, data) => {
      if (readErr) {
        return reject(readErr);
      }
      let classes;
      try {
        classes = JSON.parse(data);
      } catch (parseErr) {
        return reject(parseErr);
      }
      if (!classes) {
        return reject(new Error(' The map of classes is undefined'));
      }
      Promise.map(Object.keys(classes), (filePath) => {
        return ensureDirExists(filePath).then(() => {
          let url = classes[filePath];
          return faultTolerantTranslate(url, filePath);
        });
      }, { 'concurrency': 100 }).then(resolve).catch(reject);
    });
  });
});

gulp.task('translate', ['translateDataModel', 'translateVocab']);
