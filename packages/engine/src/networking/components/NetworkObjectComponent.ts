import { Types } from 'bitecs'

import { NetworkId } from '@xrengine/common/src/interfaces/NetworkId'
import { UserId } from '@xrengine/common/src/interfaces/UserId'

import { createMappedComponent } from '../../ecs/functions/ComponentFunctions'

export type NetworkObjectComponentType = {
  /** The user who owns this object. */
  ownerId: UserId
  /** Index of the owner's UserId. */
  ownerIndex: number
  /** The network id for this object (this id is only unique per owner) */
  networkId: NetworkId
  /** All network objects need to be a registered prefab. */
  prefab: string
  /** The parameters by which the prefab was created */
  parameters: any
  /** The last tick when a packet containing state for this object was received */
  lastTick: number
}

const SCHEMA = {
  ownerIndex: Types.ui32,
  networkId: Types.ui32
}

export const NetworkObjectComponent = createMappedComponent<NetworkObjectComponentType, typeof SCHEMA>(
  'NetworkObjectComponent',
  SCHEMA
)
