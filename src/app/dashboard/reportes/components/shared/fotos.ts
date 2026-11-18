// Miniatura que sube LinkaForm junto con cada foto: misma URL con extensión .thumbnail
export const thumbUrl = (url?: string) => url?.replace(/\.[a-zA-Z0-9]+$/, ".thumbnail");
