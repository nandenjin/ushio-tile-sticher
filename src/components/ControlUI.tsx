import {
  Button,
  Input,
  InputGroup,
  InputLeftAddon,
  InputRightElement,
  NumberDecrementStepper,
  NumberIncrementStepper,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  Select,
} from '@chakra-ui/react'
import { LatLngBounds } from 'leaflet'
import React from 'react'

const MapType = {
  'GSI.std': 'https://cyberjapandata.gsi.go.jp/xyz/std/{z}/{x}/{y}.png',
  'GSI.pale': 'https://cyberjapandata.gsi.go.jp/xyz/pale/{z}/{x}/{y}.png',
  'GSI.seamlessphoto':
    'https://cyberjapandata.gsi.go.jp/xyz/seamlessphoto/{z}/{x}/{y}.jpg',
  'osm-bright':
    'https://tile.openstreetmap.jp/styles/osm-bright/{z}/{x}/{y}.png',
  'osm-bright-ja':
    'https://tile.openstreetmap.jp/styles/osm-bright-ja/{z}/{x}/{y}.png',
  'maptiler-basic-en':
    'https://tile.openstreetmap.jp/styles/maptiler-basic-en/{z}/{x}/{y}.png',
  'maptiler-basic-ja':
    'https://tile.openstreetmap.jp/styles/maptiler-basic-ja/{z}/{x}/{y}.png',
  'maptiler-toner-en':
    'https://tile.openstreetmap.jp/styles/maptiler-toner-en/{z}/{x}/{y}.png',
  'maptiler-toner-ja':
    'https://tile.openstreetmap.jp/styles/maptiler-toner-ja/{z}/{x}/{y}.png',
}

type Props = {
  tileUrlTemplate: string
  zoomLevel: number
  currentZoomLevel?: number
  generateDisabled?: boolean
  bounds?: L.LatLngBounds
  onTileUrlTemplateChange: (tileUrlTemplate: string) => unknown
  onBoundsChange: (bounds: L.LatLngBounds) => unknown
  onZoomLevelChange: (zoomLevel: number) => unknown
  onSubmit: () => unknown
}

export const ControlUi: React.FC<Props> = ({
  tileUrlTemplate,
  zoomLevel,
  currentZoomLevel,
  generateDisabled,
  bounds,
  onTileUrlTemplateChange,
  onBoundsChange,
  onZoomLevelChange,
  onSubmit,
}) => (
  <div>
    <InputGroup>
      <InputLeftAddon
        style={{ padding: 0 }}
        children={
          <Select
            variant="filled"
            value={tileUrlTemplate}
            onChange={(e) => onTileUrlTemplateChange(e.target.value)}
          >
            {Object.entries(MapType).map(([key, url]) => (
              <option key={key} value={url}>
                {key}
              </option>
            ))}
          </Select>
        }
      />
      <Input
        variant="filled"
        value={tileUrlTemplate}
        placeholder="https://cyberjapandata.gsi.go.jp/xyz/seamlessphoto/{z}/{x}/{y}.jpg"
        onChange={(e) => onTileUrlTemplateChange(e.target.value)}
      />
    </InputGroup>
    <InputGroup>
      <InputLeftAddon children="Zoom Level" />
      <NumberInput
        variant="filled"
        max={18}
        min={1}
        value={zoomLevel}
        onChange={(lv) => onZoomLevelChange(+lv)}
      >
        <NumberInputField size={2} />
        <NumberInputStepper>
          <NumberIncrementStepper />
          <NumberDecrementStepper />
        </NumberInputStepper>
      </NumberInput>
      {currentZoomLevel ? (
        <InputRightElement>
          x{Math.pow(2, zoomLevel - currentZoomLevel + 1)}
        </InputRightElement>
      ) : (
        ''
      )}
    </InputGroup>
    <Input
      value={
        bounds?.getNorthWest().lat +
        ',' +
        bounds?.getNorthWest().lng +
        ',' +
        bounds?.getSouthEast().lat +
        ',' +
        bounds?.getSouthEast().lng
      }
      onChange={(e) => {
        const v = e.target.value
        if (v.match(/(-?\d+\.\d+),(-?\d+\.\d+),(-?\d+\.\d+),(-?\d+\.\d+)/)) {
          const [lat1, lng1, lat2, lng2] = v.split(',').map((v) => +v)
          const bounds = new LatLngBounds([lat1, lng1], [lat2, lng2])
          onBoundsChange(bounds)
        }
      }}
    ></Input>
    <Button onClick={onSubmit} disabled={generateDisabled}>
      Generate
    </Button>
  </div>
)
