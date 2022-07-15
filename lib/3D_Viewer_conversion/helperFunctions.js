function radToDeg(rad) {
    return rad * 180 / Math.PI;
}
function degToRad(deg) {
    return deg * Math.PI / 180;
}
const eps = 0.000001;
function floatsEqual(f1, f2, precision = eps) {
    /* Returns if floats f1 and f2 are equal */
    return Math.abs(f1 - f2) < precision;
}
function floatsLess(f1, f2, precision = eps) {
    /* Compares floats and returns true if f1 < f2 */
    if (floatsEqual(f1, f2, precision)) {
        return false;
    }
    return f1 < f2 + precision;
}
export { radToDeg, degToRad, floatsEqual, floatsLess, eps };
