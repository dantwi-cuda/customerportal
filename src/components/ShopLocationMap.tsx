import React, { useState, useMemo } from 'react'
import {
    ComposableMap,
    Geographies,
    Geography,
    Marker,
} from 'react-simple-maps'
import { scaleLinear } from 'd3-scale'
import { geoCentroid } from 'd3-geo'

const geoUrl = 'https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json'

const stateNameMapping: { [key: string]: string } = {
    AL: 'Alabama',
    AK: 'Alaska',
    AZ: 'Arizona',
    AR: 'Arkansas',
    CA: 'California',
    CO: 'Colorado',
    CT: 'Connecticut',
    DE: 'Delaware',
    DC: 'District of Columbia',
    FL: 'Florida',
    GA: 'Georgia',
    HI: 'Hawaii',
    ID: 'Idaho',
    IL: 'Illinois',
    IN: 'Indiana',
    IA: 'Iowa',
    KS: 'Kansas',
    KY: 'Kentucky',
    LA: 'Louisiana',
    ME: 'Maine',
    MD: 'Maryland',
    MA: 'Massachusetts',
    MI: 'Michigan',
    MN: 'Minnesota',
    MS: 'Mississippi',
    MO: 'Missouri',
    MT: 'Montana',
    NE: 'Nebraska',
    NV: 'Nevada',
    NH: 'New Hampshire',
    NJ: 'New Jersey',
    NM: 'New Mexico',
    NY: 'New York',
    NC: 'North Carolina',
    ND: 'North Dakota',
    OH: 'Ohio',
    OK: 'Oklahoma',
    OR: 'Oregon',
    PA: 'Pennsylvania',
    RI: 'Rhode Island',
    SC: 'South Carolina',
    SD: 'South Dakota',
    TN: 'Tennessee',
    TX: 'Texas',
    UT: 'Utah',
    VT: 'Vermont',
    VA: 'Virginia',
    WA: 'Washington',
    WV: 'West Virginia',
    WI: 'Wisconsin',
    WY: 'Wyoming',
}

interface Shop {
    state: string
    city: string
    // Add other shop properties as needed
}

const ShopLocationMap = ({ data }: { data: Shop[] }) => {
    const [selectedState, setSelectedState] = useState<string | null>(null)

    const shopsByState = useMemo(() => {
        const byState: { [key: string]: Shop[] } = {}
        data.forEach((shop) => {
            if (shop.state) {
                const fullStateName = stateNameMapping[shop.state.toUpperCase()]
                if (fullStateName) {
                    if (!byState[fullStateName]) {
                        byState[fullStateName] = []
                    }
                    byState[fullStateName].push(shop)
                } else {
                    console.warn(`State abbreviation not found: ${shop.state}`)
                }
            }
        })
        return byState
    }, [data])

    const shopsByCity = useMemo(() => {
        if (!selectedState || !shopsByState[selectedState]) return {}
        const byCity: { [key: string]: Shop[] } = {}
        shopsByState[selectedState].forEach((shop) => {
            if (shop.city) {
                if (!byCity[shop.city]) {
                    byCity[shop.city] = []
                }
                byCity[shop.city].push(shop)
            }
        })
        return byCity
    }, [selectedState, shopsByState])

    const handleStateClick = (stateId: any) => {
        const state = stateId.properties.name
        setSelectedState(state)
    }

    const handleBackToStates = () => {
        setSelectedState(null)
    }

    return (
        <div>
            {selectedState && (
                <button onClick={handleBackToStates} className="mb-4">
                    &larr; Back to States
                </button>
            )}
            <ComposableMap projection="geoAlbersUsa">
                <Geographies geography={geoUrl}>
                    {({ geographies }) => (
                        <>
                            {geographies.map((geo) => (
                                <Geography
                                    key={geo.rsmKey}
                                    geography={geo}
                                    fill="#E9E9E9"
                                    stroke="#FFFFFF"
                                    onClick={() => handleStateClick(geo)}
                                />
                            ))}
                            {!selectedState &&
                                Object.keys(shopsByState).map((state) => {
                                    const stateShops = shopsByState[state]
                                    const stateGeo = geographies.find(
                                        (geo) => geo.properties.name === state,
                                    )
                                    if (!stateGeo) {
                                        console.warn(
                                            `Could not find geography for state: ${state}`,
                                        )
                                        return null
                                    }
                                    const centroid = geoCentroid(stateGeo)
                                    return (
                                        centroid && (
                                            <Marker
                                                key={state}
                                                coordinates={centroid}
                                            >
                                                <circle
                                                    r={
                                                        Math.log(
                                                            stateShops.length +
                                                                1,
                                                        ) * 3
                                                    }
                                                    fill="#F5A623"
                                                />
                                                <text
                                                    y="-15"
                                                    textAnchor="middle"
                                                    style={{ fontSize: '10px' }}
                                                >
                                                    {state}: {stateShops.length}
                                                </text>
                                            </Marker>
                                        )
                                    )
                                })}
                            {selectedState &&
                                Object.keys(shopsByCity).map((city) => {
                                    const cityShops = shopsByCity[city]
                                    // This is a simplified approach. For accurate city markers, you would need city coordinates.
                                    // Here, we'll place markers randomly within the state for demonstration.
                                    const stateGeo = geographies.find(
                                        (geo) =>
                                            geo.properties.name ===
                                            selectedState,
                                    )
                                    if (!stateGeo) {
                                        console.warn(
                                            `Could not find geography for selected state: ${selectedState}`,
                                        )
                                        return null
                                    }
                                    const centroid = geoCentroid(stateGeo)
                                    return (
                                        centroid && (
                                            <Marker
                                                key={city}
                                                coordinates={[
                                                    centroid[0] +
                                                        (Math.random() - 0.5) *
                                                            2,
                                                    centroid[1] +
                                                        (Math.random() - 0.5) *
                                                            2,
                                                ]}
                                            >
                                                <circle
                                                    r={
                                                        Math.log(
                                                            cityShops.length +
                                                                1,
                                                        ) * 2
                                                    }
                                                    fill="#F8E71C"
                                                />
                                                <text
                                                    y="-10"
                                                    textAnchor="middle"
                                                    style={{ fontSize: '8px' }}
                                                >
                                                    {city}: {cityShops.length}
                                                </text>
                                            </Marker>
                                        )
                                    )
                                })}
                        </>
                    )}
                </Geographies>
            </ComposableMap>
        </div>
    )
}

export default ShopLocationMap
