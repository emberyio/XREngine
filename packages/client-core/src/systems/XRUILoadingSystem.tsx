import type { WebLayer3D } from '@etherealjs/web-layer/three'
import { DoubleSide, Mesh, MeshBasicMaterial, SphereGeometry } from 'three'

import { Engine } from '@xrengine/engine/src/ecs/classes/Engine'
import { EngineEvents } from '@xrengine/engine/src/ecs/classes/EngineEvents'
import { World } from '@xrengine/engine/src/ecs/classes/World'
import { getComponent } from '@xrengine/engine/src/ecs/functions/ComponentFunctions'
import { receiveActionOnce } from '@xrengine/engine/src/networking/functions/matchActionOnce'
import { ObjectLayers } from '@xrengine/engine/src/scene/constants/ObjectLayers'
import { textureLoader } from '@xrengine/engine/src/scene/constants/Util'
import { setObjectLayers } from '@xrengine/engine/src/scene/functions/setObjectLayers'
import { XRUIComponent } from '@xrengine/engine/src/xrui/components/XRUIComponent'
import { createTransitionState } from '@xrengine/engine/src/xrui/functions/createTransitionState'
import { ObjectFitFunctions } from '@xrengine/engine/src/xrui/functions/ObjectFitFunctions'

import { accessSceneState } from '../world/services/SceneService'
import { LoadingSystemState } from './state/LoadingState'
import { createLoaderDetailView } from './ui/XRUILoadingDetailView'

export default async function XRUILoadingSystem(world: World) {
  const transitionPeriodSeconds = 1
  const transition = createTransitionState(transitionPeriodSeconds)

  // todo: push timeout to accumulator
  receiveActionOnce(EngineEvents.EVENTS.JOINED_WORLD, () =>
    setTimeout(() => {
      mesh.visible = false
      transition.setState('OUT')
    }, 250)
  )

  const sceneState = accessSceneState()
  const thumbnailUrl = sceneState.currentScene.ornull?.thumbnailUrl.value.replace('thumbnail.jpeg', 'cubemap.png')
  const [ui, texture] = await Promise.all([
    createLoaderDetailView(),
    thumbnailUrl ? textureLoader.loadAsync(thumbnailUrl) : undefined
  ])

  const mesh = new Mesh(
    new SphereGeometry(0.3),
    new MeshBasicMaterial({ side: DoubleSide, map: texture, transparent: true })
  )
  // flip inside out
  mesh.scale.set(-1, 1, 1)
  Engine.camera.add(mesh)
  Engine.scene.add(Engine.camera)

  setObjectLayers(mesh, ObjectLayers.UI)

  return () => {
    // add a slow rotation to animate on desktop, otherwise just keep it static for VR
    // if (!Engine.xrSession && !Engine.hasJoinedWorld) {
    //   Engine.camera.rotateY(world.delta * 0.35)
    // } else {
    //   // todo: figure out how to make this work properly for VR
    // }

    const xrui = getComponent(ui.entity, XRUIComponent)

    if (xrui) {
      const dist = 0.1
      const ppu = xrui.container.options.manager.pixelsPerUnit
      const contentWidth = ui.state.imageWidth.value / ppu
      const contentHeight = ui.state.imageHeight.value / ppu

      const scale = ObjectFitFunctions.computeContentFitScaleForCamera(dist, contentWidth, contentHeight, 'cover')
      xrui.container.scale.x = xrui.container.scale.y = scale * 1.1
      xrui.container.position.z = -dist
      xrui.container.parent = Engine.camera

      transition.update(world, (opacity) => {
        if (opacity !== LoadingSystemState.opacity.value) LoadingSystemState.opacity.set(opacity)
        mesh.material.opacity = opacity
        mesh.visible = opacity > 0
        xrui.container.rootLayer.traverseLayersPreOrder((layer: WebLayer3D) => {
          const mat = layer.contentMesh.material as THREE.MeshBasicMaterial
          mat.opacity = opacity
          mat.visible = opacity > 0
          layer.visible = opacity > 0
        })
      })
    }
  }
}
