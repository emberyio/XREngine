import matches from 'ts-matches'

import { matchesWeightsParameters } from '../../avatar/animation/Util'
import {
  defineActionCreator,
  matchesNetworkId,
  matchesQuaternion,
  matchesUserId,
  matchesVector3,
  matchesWithDefault
} from '../../ecs/functions/Action'
import { useWorld } from '../../ecs/functions/SystemHooks'
import { matchPose } from '../../transform/TransformInterfaces'
import { matchesAvatarProps } from '../interfaces/WorldState'

export class NetworkWorldAction {
  static createClient = defineActionCreator({
    type: 'network.CREATE_CLIENT',
    name: matches.string,
    index: matches.number
  })

  static destroyClient = defineActionCreator({
    type: 'network.DESTROY_CLIENT'
  })

  static setXRMode = defineActionCreator({
    type: 'network.SET_XR_MODE',
    enabled: matches.boolean
  })

  static xrHandsConnected = defineActionCreator({
    type: 'network.XR_HANDS_CONNECTED'
  })

  static spawnObject = defineActionCreator(
    {
      type: 'network.SPAWN_OBJECT',
      prefab: matches.string,
      networkId: matchesWithDefault(matchesNetworkId, () => useWorld().createNetworkId()),
      ownerIndex: matches.number,
      parameters: matches.any.optional()
    },
    (action) => {
      action.$cache = true
    }
  )

  static spawnDebugPhysicsObject = defineActionCreator(
    {
      type: 'network.SPAWN_DEBUG_PHYSICS_OBJECT',
      config: matches.any.optional()
    },
    (action) => {
      action.$cache = true
    }
  )

  static spawnAvatar = defineActionCreator(
    {
      ...NetworkWorldAction.spawnObject.actionShape,
      prefab: 'avatar',
      parameters: matches.shape({
        position: matchesVector3,
        rotation: matchesQuaternion
      })
    },
    (action) => {
      action.$cache = true
    }
  )

  static destroyObject = defineActionCreator({
    type: 'network.DESTROY_OBJECT',
    networkId: matchesNetworkId
  })

  static setEquippedObject = defineActionCreator({
    type: 'network.SET_EQUIPPED_OBJECT',
    object: matches.shape({
      ownerId: matchesUserId,
      networkId: matchesNetworkId
    }),
    equip: matches.boolean,
    attachmentPoint: matches.number
  })

  static avatarAnimation = defineActionCreator({
    type: 'network.AVATAR_ANIMATION',
    newStateName: matches.string,
    params: matchesWeightsParameters
  })

  static avatarDetails = defineActionCreator(
    {
      type: 'network.AVATAR_DETAILS',
      avatarDetail: matchesAvatarProps
    },
    (action) => {
      action.$cache = { removePrevious: true }
    }
  )

  static teleportObject = defineActionCreator({
    type: 'network.TELEPORT_OBJECT',
    object: matches.shape({
      ownerId: matchesUserId,
      networkId: matchesNetworkId
    }),
    pose: matchPose
  })

  static requestAuthorityOverObject = defineActionCreator({
    type: 'network.REQUEST_AUTHORITY_OVER_OBJECT',
    object: matches.shape({
      ownerId: matchesUserId,
      networkId: matchesNetworkId
    }),
    requester: matchesUserId
  })

  static transferAuthorityOfObject = defineActionCreator({
    type: 'network.TRANSFER_AUTHORITY_OF_OBJECT',
    object: matches.shape({
      ownerId: matchesUserId,
      networkId: matchesNetworkId
    }),
    newAuthor: matchesUserId
  })
}
