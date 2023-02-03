export const sortObjectKeys = function (object, ...keys) {
    return Object.keys(object).sort((a, b) => {
        return keys.indexOf(a) - keys.indexOf(b);
    }).reduce((r, k) => (r[k] = object[k], r), {});
}