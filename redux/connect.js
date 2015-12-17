

import React, {Component} from 'react'
import storeShape from './utils/storeShape'
import shallowEqual from '../utils/shallowEqual'
import isPlainObject from '../utils/isPlainObject'
import wrapActionCreators from '../utils/wrapActionCreators'
import hoistStatics from 'hoist-non-react-statics'
import invariant from 'invariant'

