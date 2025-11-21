import React from 'react'
import { View, Text, Image, ImageSourcePropType } from 'react-native'

interface Props {
    denumirePlanta?: string
    poza?: string | ImageSourcePropType // acceptă URL sau require(...)
    ddlUdare?: string
}

const PlantCard = ({ denumirePlanta, poza, ddlUdare }: Props) => {
    // construiește sursa corectă
    let imageSource: ImageSourcePropType | undefined
    if (typeof poza === 'string' && poza.length > 0) {
        imageSource = { uri: poza } // remote URL
    } else if (poza) {
        imageSource = poza as ImageSourcePropType // local require(...)
    }

    return (
        <View
            style={{
                paddingVertical: 10,
                backgroundColor: '#b5e6ae',
                width: 160,
                borderRadius: 12,
                alignItems: 'center',
                marginRight: 15,
            }}
        >
            <Text
                style={{
                    color: '#22541c',
                    fontSize: 16,
                    fontWeight: 'bold',
                    paddingBottom: 5,
                }}
            >
                🌿 {denumirePlanta}
            </Text>

            {imageSource ? (
                <Image
                    source={imageSource}
                    style={{
                        width: 120,
                        height: 120,
                        borderRadius: 20,
                        marginBottom: 5,
                    }}
                    resizeMode="cover"
                />
            ) : (
                <View
                    style={{
                        width: 120,
                        height: 120,
                        borderRadius: 20,
                        backgroundColor: '#2f3a35',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: 5,
                    }}
                >
                    <Text style={{ color: '#9CA3AF' }}>No image</Text>
                </View>
            )}
            <Text
                style={{
                    color: '#000000',
                    fontSize: 14,
                    fontWeight: '500',
                }}
            >
                💧Next watering:
            </Text>
            <Text
                style={{
                    color: '#22541c',
                    fontSize: 14,
                    fontWeight: '600',
                }}
            >
                {ddlUdare}
            </Text>
        </View>
    )
}

export default PlantCard