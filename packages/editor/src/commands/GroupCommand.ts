import { store } from '@xrengine/client-core/src/store'
import { EntityTreeNode } from '@xrengine/engine/src/ecs/classes/EntityTree'
import { createEntity } from '@xrengine/engine/src/ecs/functions/EntityFunctions'
import { ScenePrefabs } from '@xrengine/engine/src/scene/functions/registerPrefabs'

import EditorCommands from '../constants/EditorCommands'
import { serializeObject3D, serializeObject3DArray } from '../functions/debug'
import { CommandManager } from '../managers/CommandManager'
import { ControlManager } from '../managers/ControlManager'
import { SceneManager } from '../managers/SceneManager'
import { SelectionAction } from '../services/SelectionServices'
import Command, { CommandParams } from './Command'

export interface GroupCommandParams extends CommandParams {
  /** Parent object which will hold objects being added by this command */
  parents?: EntityTreeNode | EntityTreeNode[]

  /** Child object before which all objects will be added */
  befores?: EntityTreeNode | EntityTreeNode[]
}

export default class GroupCommand extends Command {
  groupParents?: EntityTreeNode[]

  groupBefores?: EntityTreeNode[]

  oldParents: EntityTreeNode[]

  oldBefores: EntityTreeNode[]

  groupNode: EntityTreeNode

  constructor(objects: EntityTreeNode[], params: GroupCommandParams) {
    super(objects, params)

    this.groupParents = params.parents ? (Array.isArray(params.parents) ? params.parents : [params.parents]) : undefined
    this.groupBefores = params.befores ? (Array.isArray(params.befores) ? params.befores : [params.befores]) : undefined

    if (this.keepHistory) {
      this.oldParents = []
      this.oldBefores = []
      this.oldSelection = CommandManager.instance.selected.slice(0)

      for (let i = this.affectedObjects.length - 1; i >= 0; i--) {
        const object = this.affectedObjects[i]

        if (object.parentNode) {
          this.oldParents.push(object.parentNode)
          this.oldBefores.push(object.parentNode.children![object.parentNode.children!.indexOf(object) + 1])
        }
      }
    }
  }

  execute() {
    this.emitBeforeExecuteEvent()

    this.groupNode = new EntityTreeNode(createEntity())
    CommandManager.instance.executeCommand(EditorCommands.ADD_OBJECTS, this.groupNode, {
      parents: this.groupParents,
      befores: this.groupBefores,
      shouldEmitEvent: false,
      isObjectSelected: false,
      prefabTypes: ScenePrefabs.group
    })

    CommandManager.instance.executeCommand(EditorCommands.REPARENT, this.affectedObjects, {
      parents: this.groupNode,
      shouldEmitEvent: false,
      isObjectSelected: false
    })

    if (this.isSelected) {
      CommandManager.instance.executeCommand(EditorCommands.REPLACE_SELECTION, this.groupNode, {
        shouldEmitEvent: false,
        shouldGizmoUpdate: false
      })
    }

    CommandManager.instance.updateTransformRoots()

    this.emitAfterExecuteEvent()
  }

  undo() {
    CommandManager.instance.executeCommand(EditorCommands.REPARENT, this.affectedObjects, {
      parents: this.oldParents,
      befores: this.oldBefores,
      shouldEmitEvent: false,
      isObjectSelected: false
    })
    CommandManager.instance.executeCommand(EditorCommands.REMOVE_OBJECTS, this.groupNode, {
      deselectObject: false,
      shouldEmitEvent: false,
      skipSerialization: true
    })
    CommandManager.instance.updateTransformRoots()
    CommandManager.instance.executeCommand(EditorCommands.REPLACE_SELECTION, this.oldSelection, {
      shouldGizmoUpdate: false
    })
    this.emitAfterExecuteEvent()
  }

  toString() {
    return `GroupMultipleObjectsCommand id: ${this.id} objects: ${serializeObject3DArray(
      this.affectedObjects
    )} groupParent: ${serializeObject3D(this.groupParents)} groupBefore: ${serializeObject3D(this.groupBefores)}`
  }

  emitBeforeExecuteEvent() {
    if (this.shouldEmitEvent && this.isSelected) {
      ControlManager.instance.onBeforeSelectionChanged()
      store.dispatch(SelectionAction.changedBeforeSelection())
    }
  }

  emitAfterExecuteEvent() {
    if (this.shouldEmitEvent) {
      if (this.isSelected) {
        ControlManager.instance.onSelectionChanged()
        SceneManager.instance.updateOutlinePassSelection()
        store.dispatch(SelectionAction.changedSelection())
      }

      SceneManager.instance.onEmitSceneModified
      store.dispatch(SelectionAction.changedSceneGraph())
    }
  }
}
