import DefaultTheme from "vitepress/theme";
import { setupCardPreview } from "./card-preview.js";
import "./style.css";

export default {
  extends: DefaultTheme,
  enhanceApp() {
    setupCardPreview();
  }
};
