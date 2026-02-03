export const sortObjectKeys = function (object, ...keys) {
    if (!object) {
        return undefined;
    }
    return Object.keys(object).sort((a, b) => {
        if (keys.includes(a) && !keys.includes(b)) {
            return -1;
        } else if (!keys.includes(a) && keys.includes(b)) {
            return 1;
        }
        return keys.indexOf(a) - keys.indexOf(b);
    }).reduce((r, k) => (r[k] = object[k], r), {});
}

export const removeEmptyValues = function (object, ...ignores) {
    if (!object) {
        return undefined;
    }
    Object.keys(object).forEach((key) => {
        if (!object[key] && (!ignores || !ignores.includes(key))) {
            object[key] = undefined;
        }
    })
}