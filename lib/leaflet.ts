import L from "leaflet";

// 👇 casteo seguro en vez de "any"
type DefaultIconPrototype = {
  _getIconUrl?: string;
};

delete (L.Icon.Default.prototype as DefaultIconPrototype)._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  iconUrl:
    "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
});