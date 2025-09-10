import { createStaticKitConfig } from "@vojtaholik/static-kit-core/vite";

export default createStaticKitConfig({
  useTailwind: false,
  stylesEntry: "src/styles/main.scss"
});