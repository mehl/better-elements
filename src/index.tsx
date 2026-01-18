import register from "preact-custom-element";

import { BetterSlideshow } from "./better-slideshow"; "./better-slideshow.tsx";

register(BetterSlideshow, "better-slideshow", ["slides", "duration", "fade", "zoom"], { shadow: true });
