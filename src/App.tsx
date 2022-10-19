import { useRef, useState } from 'react'
import {
  LayersControl,
  MapContainer,
  TileLayer,
  useMapEvents,
} from 'react-leaflet'
import { ControlUi } from './components/ControlUI'
import 'leaflet/dist/leaflet.css'
import { LatLng, LatLngBounds } from 'leaflet'
import type { Map } from 'leaflet'
import { getTileByLatLng } from './lib/tile'
import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Progress,
  useDisclosure,
} from '@chakra-ui/react'

const defaultCenter: [number, number] = [36.081771, 140.113755]
const TILE_SIZE = 256

function App() {
  const [tileUrlTemplate, setTileUrlTemplate] = useState(
    'https://cyberjapandata.gsi.go.jp/xyz/seamlessphoto/{z}/{x}/{y}.jpg'
  )
  const [zoomLevel, setZoomLevelChange] = useState(15)
  const [currentZoomLevel, setCurrentZoomLevel] = useState(zoomLevel)
  const [currentBounds, setCurrentBounds] = useState<LatLngBounds>()
  const [tileLength, setTileLength] = useState(0)
  const [processedTileLength, setProcessedTileLength] = useState(0)
  const [wTiles, setWTiles] = useState(0)

  const getTilesByLatLngAndZoom = (bounds: LatLngBounds, zoom: number) => {
    const ne = bounds.getNorthEast(),
      sw = bounds.getSouthWest()
    const [neX, neY] = getTileByLatLng(ne.lat, ne.lng, zoom)
    const [swX, swY] = getTileByLatLng(sw.lat, sw.lng, zoom)

    const tileList: [number, number][] = []
    for (let y = Math.min(neY, swY); y <= Math.max(neY, swY); y++) {
      for (let x = Math.min(neX, swX); x <= Math.max(neX, swX); x++) {
        tileList.push([x, y])
      }
    }

    const [w, h] = [Math.abs(neX - swX) + 1, Math.abs(neY - swY) + 1]

    return { tileList, w, h }
  }

  const generate = async (bounds: LatLngBounds, zoom: number) => {
    setProcessedTileLength(0)
    const {
      tileList,
      w: wTiles,
      h: hTiles,
    } = getTilesByLatLngAndZoom(bounds, zoom)

    // Provide size information to UI
    setTileLength(tileList.length)
    setWTiles(wTiles)

    if (typeof OffscreenCanvas === 'undefined') {
      alert('Error: Cannot render.\nOffscreenCanvas is not supported')
      return
    }

    const canvas = new OffscreenCanvas(TILE_SIZE * wTiles, TILE_SIZE * hTiles)
    const ctx = canvas.getContext('2d')

    if (!ctx) {
      alert(
        'Error: Cannot render.\nOffscreenCanvas does not provide 2d context'
      )
      return
    }

    // Create promises that request and render tiles
    const reqs = tileList.map(([x, y], i) => async () => {
      // Make requests
      const req = await fetch(
        tileUrlTemplate
          .replace('{x}', x.toString())
          .replace('{y}', y.toString())
          .replace('{z}', zoom.toString())
      )
      const blob = await req.blob()

      // Create image object
      const img = await new Promise<HTMLImageElement>((resolve) => {
        const img = new Image()
        img.addEventListener('load', () => resolve(img))
        img.src = URL.createObjectURL(blob)
      })

      // Draw on canvas
      ctx.drawImage(
        img,
        (i % wTiles) * TILE_SIZE,
        Math.floor(i / wTiles) * TILE_SIZE
      )
      setProcessedTileLength((v) => v + 1)
    })

    // Split requests into chunks and execute them sequentially
    for (let i = 0; i < Math.floor(reqs.length / 5) + 1; i++) {
      await Promise.all(
        reqs
          .slice(i * 5, Math.min((i + 1) * 5, reqs.length + 1))
          .map((x) => x())
      )
    }

    // Download the generated image
    window.open(URL.createObjectURL(await canvas.convertToBlob()))
  }

  const generateWithConfirm = async (confirmed?: boolean) => {
    if (!currentBounds) return

    if (!confirmed) {
      const { tileList, w } = getTilesByLatLngAndZoom(currentBounds, zoomLevel)

      // If requests over 100, show confirmation dialog
      if (tileList.length > 100) {
        setTileLength(tileList.length)
        setWTiles(w)
        return onWarningOpen()
      }
    }

    onWarningClose()
    onProcModalOpen()
    await generate(currentBounds, zoomLevel)
    onProcModalClose()
  }

  const {
    isOpen: isWarningOpen,
    onOpen: onWarningOpen,
    onClose: onWarningClose,
  } = useDisclosure()
  const cancelRef = useRef(null)
  const {
    isOpen: isProcModalOpen,
    onOpen: onProcModalOpen,
    onClose: onProcModalClose,
  } = useDisclosure()

  return (
    <div>
      <ControlUi
        tileUrlTemplate={tileUrlTemplate}
        zoomLevel={zoomLevel}
        currentZoomLevel={currentZoomLevel}
        onTileUrlTemplateChange={setTileUrlTemplate}
        onZoomLevelChange={setZoomLevelChange}
        generateDisabled={currentZoomLevel > zoomLevel || !currentBounds}
        onSubmit={() => generateWithConfirm()}
      />
      <MapContainer
        center={defaultCenter}
        zoom={14}
        style={{ width: '100%', height: '500px' }}
      >
        <LayersControl position="topright">
          {/* Base Layer */}
          <LayersControl.BaseLayer name="OpenStreetMap" checked={true}>
            <TileLayer key={tileUrlTemplate} url={tileUrlTemplate} />
          </LayersControl.BaseLayer>

          {/* Guide Overlay */}
          <LayersControl.Overlay name="Guide overlay" checked={false}>
            <TileLayer
              url="https://tile.openstreetmap.jp/styles/maptiler-toner-en/{z}/{x}/{y}.png"
              zIndex={15}
              opacity={0.5}
            />
          </LayersControl.Overlay>
        </LayersControl>
        <MapSensor
          onZoomLevelChange={setCurrentZoomLevel}
          onBoundsChange={setCurrentBounds}
        />
      </MapContainer>

      <h2>Tile attributions:</h2>
      <ul>
        <li>
          <a
            href="https://maps.gsi.go.jp/development/ichiran.html"
            rel="noopener"
            target="_blank"
          >
            GSIMap Tiles (地理院タイル)
          </a>
        </li>
        <li>
          <a
            href="https://github.com/openmaptiles/openmaptiles/blob/master/LICENSE.md"
            rel="noopener"
            target="_blank"
          >
            OpenMapTiles (under BSD/CC-BY): MapTiler.com &amp; OpenMapTiles
            contributors
          </a>
        </li>
      </ul>

      <AlertDialog
        isOpen={isWarningOpen}
        leastDestructiveRef={cancelRef}
        onClose={onWarningClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader>Going to large request</AlertDialogHeader>
            <AlertDialogBody>
              <strong>
                This will make {tileLength} requests to tile server, and{' '}
                {wTiles * TILE_SIZE}px-width image.
              </strong>{' '}
              This tool will do concurrency control, but please re-check not to
              cause them trouble. Continue these requests with your own risk.
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onWarningClose}>
                Cancel
              </Button>
              <Button
                colorScheme="red"
                onClick={() => generateWithConfirm(true)}
              >
                Continue
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>

      <Modal
        isOpen={isProcModalOpen}
        onClose={onProcModalClose}
        closeOnEsc={false}
        closeOnOverlayClick={false}
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Requesting and rendering tiles...</ModalHeader>
          <ModalBody>
            <Progress
              value={(processedTileLength / tileLength) * 100}
            ></Progress>
            <div>
              {processedTileLength}/{tileLength}
            </div>
          </ModalBody>
        </ModalContent>
      </Modal>
    </div>
  )
}

export default App

type MapSensorProps = {
  onZoomLevelChange?: (zoomLevel: number, map: Map) => unknown
  onMoveEnd?: (latlng: LatLng, map: Map) => unknown
  onBoundsChange?: (bound: LatLngBounds, map: Map) => unknown
}

const MapSensor: React.FC<MapSensorProps> = ({
  onZoomLevelChange,
  onMoveEnd,
  onBoundsChange,
}) => {
  useMapEvents({
    zoomend: (e) => {
      const map: Map = e.target
      onZoomLevelChange?.(map.getZoom(), map)
      onBoundsChange?.(map.getBounds(), map)
    },
    moveend: (e) => {
      const map: Map = e.target
      onMoveEnd?.(e.target.getCenter(), map)
      onBoundsChange?.(map.getBounds(), map)
    },
  })
  return <></>
}
