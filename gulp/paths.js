/**
 * @author    Junxiang Wei {@link http://www.nodeunify.com}
 * @copyright Copyright (c) 2016, Junxiang Wei
 * @license   MIT
 */
'use strict';

import path from 'path';

const root = path.dirname(__dirname);
const paths = {
  'root': root,
  'tmp': {
    'basePath': `${root}/.tmp/`,
    'vocabPath': `${root}/.tmp/vocab/`,
    'dataModel': `${root}/.tmp/dataModel.jsonld`,
    'fullTree': `${root}/.tmp/tree.jsonld`,
    'classes': `${root}/.tmp/classes.json`
  },
  'dist': {
    'basePath': `${root}/dist/`,
    'vocabPath': `${root}/dist/vocab/`,
    'dataModel': `${root}/dist/dataModel.jsonld`
  }
};

export default paths;
