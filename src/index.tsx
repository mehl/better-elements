import register from "preact-custom-element";

import { BetterSlideshow } from "./better-slideshow"; "./better-slideshow.tsx";

register(BetterSlideshow, "better-slideshow", ["slides", "delay", "zoom"], { shadow: true });
