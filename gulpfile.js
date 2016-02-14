/**
 * @author    Junxiang Wei {@link http://www.nodeunify.com}
 * @copyright Copyright (c) 2016, Junxiang Wei
 * @license   MIT
 */
'use strict';

require('babel-core/register');
require('require-dir')('./gulp/tasks', {'recurse': true});
