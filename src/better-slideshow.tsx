import { render } from "preact";
import { useEffect, useMemo, useRef } from "preact/hooks";

type SlideshowProps = {
  slides?: string;
  duration?: number;
  fade?: number;
  zoom?: number;
};

type SlideImageConfig = {
  src: string;
  hotspot?: [number, number];
};

async function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = src;
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
  });
}

const DELAY = 5000;
const FADE = 1000;
const ZOOM = 1.3;

function createSlide(index: number, img: HTMLImageElement) {
  const root = document.createElement("div");
  const style = img.getAttribute("style");
  const slide = (
    <>
      <img className="slideImage" src={img.src} part="slide-image" style={style as any} />
      <div className="slideContent" part="slide-content">
        <slot name={`slide-${index}`} />
      </div>
    </>
  );
  render(slide, root);
  return {
    image: root.firstElementChild as HTMLElement,
    content: root.lastElementChild as HTMLElement
  };
}

export function BetterSlideshow({ slides, duration, fade, zoom }: SlideshowProps) {
  const slidesRaw: SlideImageConfig[] = useMemo(() => slides ? JSON.parse(slides) : [], [slides]);
  const durationRaw: number = useMemo(() => duration && !isNaN(duration) ? duration : DELAY, [duration]);
  const fadeRaw: number = useMemo(() => fade && !isNaN(fade) ? fade : FADE, [fade]);
  const zoomRaw: number = useMemo(() => ((zoom && !isNaN(zoom) ? zoom : ZOOM) - 1) / 2, [zoom]);

  const imageContainerRef = useRef<HTMLDivElement>(null);
  const contentContainerRef = useRef<HTMLDivElement>(null);

  const loadedSlides: { image: HTMLElement, content: HTMLElement; }[] = [];
  let currentIndex = -1;
  let nextIndex = -1;
  let progress = 0;
  useEffect(() => {
    currentIndex = -1;
    nextIndex = -1;
    progress = 0;
    imageContainerRef.current?.replaceChildren();
    loadedSlides.length = 0;
    const loadImages = async () => {
      for (const slide of slidesRaw) {
        if (slide.src) {
          const img = await loadImage(slide.src);
          if (slide.hotspot && slide.hotspot.length === 2) {
            img.style.transformOrigin = `${slide.hotspot[0] * 100}% ${slide.hotspot[1] * 100}%`;
            img.style.objectPosition = `${slide.hotspot[0] * 100}% ${slide.hotspot[1] * 100}%`;
          }
          const div = createSlide(loadedSlides.length, img);
          loadedSlides.push(div);
          if (currentIndex === -1 && loadedSlides.length >= 2) {
            resetToCurrentIndex(0);
          }
        }
      }
    };
    loadImages();
  }, [slidesRaw]);

  function resetToCurrentIndex(index: number) {
    loadedSlides[currentIndex]?.image.classList.remove("current");
    loadedSlides[nextIndex]?.image.classList.remove("next");
    loadedSlides[currentIndex]?.content.classList.remove("current");
    loadedSlides[nextIndex]?.content.classList.remove("next");
    currentIndex = index % loadedSlides.length;
    nextIndex = (index + 1) % loadedSlides.length;
    loadedSlides[currentIndex]?.image.classList.add("current");
    loadedSlides[nextIndex]?.image.classList.add("next");
    loadedSlides[currentIndex]?.content.classList.add("current");
    loadedSlides[nextIndex]?.content.classList.add("next");
    progress = 0;
    imageContainerRef.current?.replaceChildren();
    imageContainerRef.current?.appendChild(loadedSlides[currentIndex].image);
    imageContainerRef.current?.appendChild(loadedSlides[nextIndex].image);
    contentContainerRef.current?.replaceChildren();
    contentContainerRef.current?.appendChild(loadedSlides[currentIndex].content);
    contentContainerRef.current?.appendChild(loadedSlides[nextIndex].content);
  }
  const rafId = useRef<number | null>(null);

  useEffect(() => {
    let last = performance.now();
    const loop = (time: number) => {
      progress = Math.min(progress + (time - last) / durationRaw, 1);
      // progress = .5;
      last = time;
      if (progress >= 1 && loadedSlides.length >= 2) {
        resetToCurrentIndex(currentIndex + 1);
      }
      loadedSlides[currentIndex]?.image.style.setProperty("--progress", String(progress));
      loadedSlides[nextIndex]?.image.style.setProperty("--progress", String(progress));
      loadedSlides[currentIndex]?.content.style.setProperty("--progress", String(progress));
      loadedSlides[nextIndex]?.content.style.setProperty("--progress", String(progress));
      rafId.current = requestAnimationFrame(loop);
    };

    rafId.current = requestAnimationFrame(loop);

    return () => {
      if (rafId.current !== null) {
        cancelAnimationFrame(rafId.current);
      }
    };
  }, []);
  console.log(fadeRaw, durationRaw);
  const opacityAcc = 1 / Math.max(fadeRaw / Math.max(durationRaw, 1), 0.01);

  return <>
    <style>{`
        :host {
          overflow: hidden;
          position: relative;
        }

        .imageContainer,.contentContainer,.imageContainer img, .contentContainer .slideContent {
          position: absolute;
          inset: 0 0 0 0;
          overflow: hidden;
        }

        .imageContainer img, .contentContainer .slideContent {
          visibility: hidden;
          pointer-events: none;
        }


        .imageContainer img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .imageContainer img.current {
          visibility: visible;
          opacity: 1;
          transform: scale(calc(var(--progress, 0) * ${zoomRaw} + ${zoomRaw} + 1));
        }

        .imageContainer img.next {
          visibility: visible;
          opacity: min(calc(var(--progress, 0) * ${opacityAcc}), 1);
          transform: scale(calc(var(--progress, 0) * ${zoomRaw} + 1));
        }

        .contentContainer .slideContent.current {
          visibility: visible;
          opacity: calc(1 - min(calc(var(--progress, 0) * ${opacityAcc}), 1));
        }

        .contentContainer .slideContent.next {
          visibility: visible;
          opacity: min(calc(var(--progress, 0) * ${opacityAcc}), 1);
        }

      `}</style>
    <div className="imageContainer" ref={imageContainerRef} part="image-container">
    </div>
    <div className="contentContainer" ref={contentContainerRef} part="content-container">
    </div>
    <div className="defaultSlot">
      <slot />
    </div>
  </>;
}

