import * as THREE from 'three'
import 'three/examples/js/loaders/GLTFLoader.js' // -> THREE.GLTFLoader
import 'three/examples/js/controls/OrbitControls.js' // -> THREE.OrbitControls
import Stats from 'stats.js'

let camera
const clock = new THREE.Clock()
let controls
let dirLight
let dirLightHeper
let hemiLight
let hemiLightHelper
const mixers = []
let renderer
let scene
let stats

init()
animate()

function init () {

  const container = document.getElementById( 'container' )

  camera = new THREE.PerspectiveCamera(
    30, window.innerWidth / window.innerHeight, 1, 5000
  )
  camera.position.set( 0, 0, 250 )

  scene = new THREE.Scene()
  scene.background = new THREE.Color().setHSL( 0.6, 0, 1 )
  scene.fog = new THREE.Fog( scene.background, 1, 5000 )

  // LIGHTS

  hemiLight = new THREE.HemisphereLight( 0xffffff, 0xffffff, 0.6 )
  hemiLight.color.setHSL( 0.6, 1, 0.6 )
  hemiLight.groundColor.setHSL( 0.095, 1, 0.75 )
  hemiLight.position.set( 0, 50, 0 )
  scene.add( hemiLight )

  hemiLightHelper = new THREE.HemisphereLightHelper( hemiLight, 10 )
  scene.add( hemiLightHelper )

  dirLight = new THREE.DirectionalLight( 0xffffff, 1 )
  dirLight.color.setHSL( 0.1, 1, 0.95 )
  dirLight.position.set( -1, 1.75, 1 )
  dirLight.position.multiplyScalar( 30 )
  scene.add( dirLight )

  dirLight.castShadow = true

  dirLight.shadow.mapSize.width = 2048
  dirLight.shadow.mapSize.height = 2048

  const d = 50

  dirLight.shadow.camera.left = -d
  dirLight.shadow.camera.right = d
  dirLight.shadow.camera.top = d
  dirLight.shadow.camera.bottom = -d

  dirLight.shadow.camera.far = 3500
  dirLight.shadow.bias = -0.0001

  dirLightHeper = new THREE.DirectionalLightHelper( dirLight, 10 )
  scene.add( dirLightHeper )

  // GROUND

  const groundGeo = new THREE.PlaneBufferGeometry( 10000, 10000 )
  const groundMat = new THREE.MeshPhongMaterial( {
    color: 0xffffff,
    specular: 0x050505,
  } )
  groundMat.color.setHSL( 0.095, 1, 0.75 )

  const ground = new THREE.Mesh( groundGeo, groundMat )
  ground.rotation.x = -Math.PI / 2
  ground.position.y = -33
  scene.add( ground )

  ground.receiveShadow = true

  // SKYDOME

  const vertexShader = document.getElementById( 'vertexShader' ).textContent
  const fragmentShader = document.getElementById( 'fragmentShader' )
    .textContent
  const uniforms = {
    topColor: { value: new THREE.Color( 0x0077ff ) },
    bottomColor: { value: new THREE.Color( 0xffffff ) },
    offset: { value: 33 },
    exponent: { value: 0.6 },
  }
  uniforms.topColor.value.copy( hemiLight.color )

  scene.fog.color.copy( uniforms.bottomColor.value )

  const skyGeo = new THREE.SphereBufferGeometry( 4000, 32, 15 )
  const skyMat = new THREE.ShaderMaterial( {
    vertexShader: vertexShader,
    fragmentShader: fragmentShader,
    uniforms: uniforms,
    side: THREE.BackSide,
  } )

  const sky = new THREE.Mesh( skyGeo, skyMat )
  scene.add( sky )

  // MODEL

  const loader = new THREE.GLTFLoader()

  const models = [
    { file: 'models/gltf/Horse.glb', scale: 0.35, y: -33 },
    { file: 'models/gltf/Flamingo.glb', scale: 0.35, y: 15 },
    { file: 'models/gltf/Parrot.glb', scale: 0.5, y: 10 },
    { file: 'models/gltf/Stork.glb', scale: 0.35, y: 10 },
  ]
  const model = models[ Math.floor( Math.random() * 4 ) ]

  loader.load( model.file, function ( gltf ) {

    const mesh = gltf.scene.children[ 0 ]

    const s = model.scale
    mesh.scale.set( s, s, s )
    mesh.position.y = model.y
    mesh.rotation.y = -1

    mesh.castShadow = true
    mesh.receiveShadow = true

    scene.add( mesh )

    const mixer = new THREE.AnimationMixer( mesh )
    mixer.clipAction( gltf.animations[ 0 ] ).setDuration( 1 ).play()
    mixers.push( mixer )

  } )

  // RENDERER

  renderer = new THREE.WebGLRenderer( { antialias: true } )
  renderer.setPixelRatio( window.devicePixelRatio )
  renderer.setSize( window.innerWidth, window.innerHeight )
  container.appendChild( renderer.domElement )

  renderer.gammaInput = true
  renderer.gammaOutput = true

  renderer.shadowMap.enabled = true

  // controls
  controls = new THREE.OrbitControls( camera, renderer.domElement )

  // call this only in static scenes (i.e., if there is no animation loop)
  // controls.addEventListener( 'change', render )

  // damping & auto-rotation require an animation loop
  controls.enableDamping = true
  controls.dampingFactor = 0.25
  controls.autoRotate = true
  controls.autoRotateSpeed = 1.0 // 2.0 -> 30 seconds per round when fps is 60

  controls.screenSpacePanning = false
  controls.minDistance = 100
  controls.maxDistance = 500
  controls.maxPolarAngle = Math.PI / 2

  // STATS

  stats = new Stats()
  container.appendChild( stats.dom )

  // event listeners

  window.addEventListener( 'resize', onWindowResize, false )
  document.addEventListener( 'keydown', onKeyDown, false )

}

function onWindowResize () {

  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()

  renderer.setSize( window.innerWidth, window.innerHeight )

}

function onKeyDown ( event ) {

  switch ( event.keyCode ) {

  case 72: // h

    hemiLight.visible = !hemiLight.visible
    hemiLightHelper.visible = !hemiLightHelper.visible
    break

  case 68: // d

    dirLight.visible = !dirLight.visible
    dirLightHeper.visible = !dirLightHeper.visible
    break

  case 82: // r
    controls.autoRotate = !controls.autoRotate
    break

  }

}

// rendering loop

function animate () {

  requestAnimationFrame( animate )

  // only required if controls.enableDamping = true
  // or if controls.autoRotate = true
  controls.update()

  render()
  stats.update()

}

function render () {

  const delta = clock.getDelta()

  for ( let i = 0; i < mixers.length; i++ ) {
    mixers[ i ].update( delta )
  }

  renderer.render( scene, camera )
}
