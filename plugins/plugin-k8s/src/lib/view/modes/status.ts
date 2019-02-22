/*
 * Copyright 2018 IBM Corporation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import * as Debug from 'debug'
const debug = Debug('k8s/view/modes/status')

import repl = require('@kui-shell/core/core/repl')
import { formatMultiListResult } from '@kui-shell/core/webapp/views/table'

import { FinalState } from '../../model/states'
import IResource from '../../model/resource'

import insertView from '../insert-view'

export const statusButton = (command: string, resource: IResource, finalState: FinalState, overrides?) => Object.assign({}, {
  mode: 'status',
  direct: () => renderAndViewStatus(command, resource, finalState)
}, overrides || {})

/**
 * Render the multi-table status view. This just wraps some doms
 * around the formatMultiListResult() output.
 *
 */
export const renderStatus = async (command: string, resource: IResource, finalState: FinalState) => {
  debug('renderStatus', command, resource.filepathForDrilldown, resource.kind, resource.name, finalState)

    // TODO: helm status doesn't yet support watching; so no final-state for helm status
  const final = command === 'kubectl' ? `--final-state ${finalState.toString()}` : ''

  // kubectl status => k8s status
  const commandForRepl = command === 'kubectl' ? 'k8s' : command

  const fetchModels = `${commandForRepl} status ${repl.encodeComponent(resource.filepathForDrilldown || resource.kind)} ${repl.encodeComponent(resource.name)} ${final}`
  debug('issuing command', fetchModels)

  const models = await repl.qexec(fetchModels)
  // debug('renderStatus.models', models);

  const resultDomOuter = document.createElement('div')

  if (models.length > 0) {
    const resultDom = document.createElement('div')

    resultDomOuter.classList.add('result-vertical')
    resultDomOuter.classList.add('padding-content')
    resultDomOuter.classList.add('scrollable-auto')
    resultDomOuter.appendChild(resultDom)

    resultDom.classList.add('result-as-table')
    resultDom.classList.add('result-as-fixed-tables')
    resultDom.classList.add('repl-result')
    resultDom.classList.add('monospace')

    if (Array.isArray(models[0])) {
      formatMultiListResult(models, resultDom)
    } else {
      formatMultiListResult([ models ], resultDom)
            // formatListResult(models).forEach(row => resultDom.appendChild(row));
    }
  }

  return resultDomOuter
}

/**
 * Render status table, and then place it in a DOM
 *
 */
export const renderAndViewStatus = (command: string, resource: IResource, finalState: FinalState) => {
  renderStatus(command, resource, finalState).then(insertView)
}