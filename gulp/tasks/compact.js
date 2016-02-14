/**
 * @author    Junxiang Wei {@link http://www.nodeunify.com}
 * @copyright Copyright (c) 2016, Junxiang Wei
 * @license   MIT
 */
'use strict';

import gulp from 'gulp';
import fs from 'fs';
import path from 'path';
import readdirp from 'readdirp';
import jsonld from 'jsonld';

import paths from '../paths';

const dataModelContext = {
  '@context': {
    'id': '@id',
    'type': '@type',
    'graph': '@graph',
    'dc': 'http://purl.org/dc/terms/',
    'dcterms': 'http://purl.org/dc/terms/',
    'foaf': 'http://xmlns.com/foaf/0.1/',
    'gr': 'http://purl.org/goodrelations/v1#',
    'owl': 'http://www.w3.org/2002/07/owl#',
    'rdf': 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
    'rdfs': 'http://www.w3.org/2000/01/rdf-schema#',
    'schema': 'http://schema.org/',
    'void': 'http://rdfs.org/ns/void#',
    'xsd': 'http://www.w3.org/2001/XMLSchema#',
    'source': {
      '@id': 'dc:source',
      '@type': '@id'
    },
    'subClassOf': {
      '@id': 'rdfs:subClassOf',
      '@type': '@id'
    },
    'subPropertyOf': {
      '@id': 'rdfs:subPropertyOf',
      '@type': '@id'
    },
    'comment': 'rdfs:comment',
    'label': 'rdfs:label',
    'domainIncludes': {
      '@id': 'schema:domainIncludes',
      '@container': '@set',
      '@type': '@id'
    },
    'rangeIncludes': {
      '@id': 'schema:rangeIncludes',
      '@container': '@set',
      '@type': '@id'
    }
  }
};

const vocabContext = {
  '@context': {
    'id': '@id',
    'type': '@type',
    'graph': '@graph',
    'rdf': 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
    'rdfa': 'http://www.w3.org/ns/rdfa#',
    'rdfs': 'http://www.w3.org/2000/01/rdf-schema#',
    'schema': 'http://schema.org/',
    'xsd': 'http://www.w3.org/2001/XMLSchema#',
    'usesVocabulary': {
      '@id': 'rdfa:usesVocabulary',
      '@type': '@id'
    },
    'subClassOf': {
      '@id': 'rdfs:subClassOf',
      '@type': '@id'
    },
    'subPropertyOf': {
      '@id': 'rdfs:subPropertyOf',
      '@type': '@id'
    },
    'comment': {
      '@id': 'rdfs:comment',
      '@language': 'en'
    },
    'label': {
      '@id': 'rdfs:label',
      '@language': 'en'
    },
    'rangeIncludes': {
      '@id': 'schema:rangeIncludes',
      '@container': '@set',
      '@type': '@id'
    }
  }
};

const readJSONFromFile = (filePath, cb) => {
  fs.readFile(filePath, (readErr, data) => {
    if (readErr) {
      return cb(readErr);
    }
    let document;
    try {
      document = JSON.parse(data);
    } catch (err) {
      return cb(err);
    }
    cb(null, document);
  });
};

const writeJSONToFile = (filePath, document, cb) => {
  let data = JSON.stringify(document, null, 2);
  fs.writeFile(filePath, data, cb);
};

const refactorBlankNode = (document) => {
  let graph = document.graph;
  document.graph = graph.filter(node => !node.id.startsWith('_:'));
};

const refactorSubClassOf = (document, subClassOf) => {
  let graph = document.graph;
  for (let node of graph) {
    if (node.id) {
      // Replace `subClassOf` of other classes with correct one
      if (node.subClassOf) {
        node.subClassOf = subClassOf;
      }
      // Replace `subClassOf` of Thing with `rdfs:Class`
      if (node['rdfs:subClassOf']) {
        let subClassOfObj = node['rdfs:subClassOf'];
        if (subClassOfObj['@language'] && subClassOfObj['@value']) {
          node.subClassOf = subClassOfObj['@value'];
          delete node['rdfs:subClassOf'];
        }
      }
    }
  }
};

gulp.task('compactDataModel', (cb) => {
  readJSONFromFile(paths.tmp.dataModel, (readErr, document) => {
    if (readErr) {
      return cb(readErr);
    }
    jsonld.compact(document, dataModelContext, (compactErr, compacted) => {
      if (compactErr) {
        return cb(compactErr);
      }
      writeJSONToFile(paths.tmp.dataModel, compacted, cb);
    });
  });
});

gulp.task('compactVocab', (cb) => {
  let entryStream = readdirp({ 'root': paths.tmp.vocabPath, 'fileFilter': '*.jsonld'})
    .on('data', (entry) => {
      readJSONFromFile(entry.fullPath, (readErr, document) => {
        if (readErr) {
          entryStream.emit('close');
          return cb(readErr);
        }
        jsonld.compact(document, vocabContext, (compactErr, compacted) => {
          if (compactErr) {
            return cb(compactErr);
          }
          // hack here
          let dirname = path.dirname(entry.fullPath);
          let subClassOf = 'schema:' + path.basename(dirname);
          refactorBlankNode(compacted);
          refactorSubClassOf(compacted, subClassOf);
          writeJSONToFile(entry.fullPath, compacted, () => {
            // console.log('Compacted file `' + entry.fullPath + '`');
          });
        });
      });
    })
    .on('error', cb)
    .on('end', cb);
});

gulp.task('compact', ['compactDataModel', 'compactVocab']);
