export enum SERIALIZER_TYPES {
    JSON = 'JSON',
    MSGPACK = 'MSGPACK',
    NONE = 'NONE',
}

interface Serializer {
    encode: Function,
    decode: Function
}

export const defaults = {
    encode: JSON.stringify,
    decode: JSON.parse,
};

export function get(type: SERIALIZER_TYPES) : Serializer {
    switch(type) {
        case SERIALIZER_TYPES.JSON: {
            return {
                encode: JSON.stringify,
                decode: JSON.parse,
            }
        }
        case SERIALIZER_TYPES.MSGPACK: {
            return {
                encode: require('notepack.io').encode,
                decode: require('notepack.io').decode,
            }
        }
        case SERIALIZER_TYPES.NONE: {
            return {
                encode: null,
                decode: null,
            }
        }
    }
}