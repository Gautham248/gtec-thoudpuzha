import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import { HomeReelsStrip } from "./HomeReelsStrip";
import { HomeVideoSection } from "./HomeVideoSection";
import { HomeMainVideo } from "./HomeMainVideo";
import { HOME_MAIN_VIDEO_URL, HOME_REEL_VIDEO_URLS } from "@/lib/home-videos";

const mockReducedMotion = vi.hoisted(() => vi.fn(() => false));
vi.mock("framer-motion", async (importOriginal) => ({
  ...(await importOriginal<typeof import("framer-motion")>()),
  useReducedMotion: mockReducedMotion,
}));

/** IntersectionObserver stand-in whose entries the test drives by hand. */
const observers: {
  callback: IntersectionObserverCallback;
  target?: Element;
}[] = [];
class FakeIntersectionObserver {
  constructor(private callback: IntersectionObserverCallback) {
    observers.push({ callback });
  }
  observe(target: Element) {
    observers.find((o) => o.callback === this.callback)!.target = target;
  }
  disconnect() {}
  unobserve() {}
  takeRecords() {
    return [];
  }
}

function setVisible(video: Element, isIntersecting: boolean) {
  const observer = observers.find((o) => o.target === video)!;
  act(() =>
    observer.callback(
      [{ isIntersecting, target: video } as IntersectionObserverEntry],
      {} as IntersectionObserver,
    ),
  );
}

let play: ReturnType<typeof vi.spyOn>;
let pause: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  observers.length = 0;
  vi.stubGlobal("IntersectionObserver", FakeIntersectionObserver);
  // jsdom has no media playback: track paused state and fire the events a
  // browser would.
  const playing = new WeakSet<HTMLMediaElement>();
  vi.spyOn(HTMLMediaElement.prototype, "paused", "get").mockImplementation(
    function (this: HTMLMediaElement) {
      return !playing.has(this);
    },
  );
  play = vi
    .spyOn(HTMLMediaElement.prototype, "play")
    .mockImplementation(async function (this: HTMLMediaElement) {
      playing.add(this);
      this.dispatchEvent(new Event("play"));
    });
  pause = vi
    .spyOn(HTMLMediaElement.prototype, "pause")
    .mockImplementation(function (this: HTMLMediaElement) {
      if (!playing.delete(this)) return;
      this.dispatchEvent(new Event("pause"));
    });
  mockReducedMotion.mockReturnValue(false);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const videos = () =>
  [...document.querySelectorAll("video")] as HTMLVideoElement[];

describe("HomeReelsStrip", () => {
  test("renders the four portrait videos muted, looping and inline", () => {
    render(<HomeReelsStrip videos={HOME_REEL_VIDEO_URLS} />);

    expect(videos()).toHaveLength(4);
    for (const [i, video] of videos().entries()) {
      expect(video.muted).toBe(true);
      expect(video.loop).toBe(true);
      expect(video).toHaveAttribute("playsinline");
      expect(video).toHaveAttribute("preload", "none");
      expect(video.poster).toContain("/ik-thumbnail.jpg");
      const sources = [...video.querySelectorAll("source")].map((s) =>
        s.getAttribute("src"),
      );
      expect(sources).toEqual([
        `${HOME_REEL_VIDEO_URLS[i]}?tr=w-480,f-auto,q-60`,
        HOME_REEL_VIDEO_URLS[i],
      ]);
    }
  });

  test("plays a video only while it is on screen", () => {
    render(<HomeReelsStrip videos={HOME_REEL_VIDEO_URLS} />);
    const [first] = videos();
    expect(play).not.toHaveBeenCalled();

    setVisible(first, true);
    expect(play).toHaveBeenCalledTimes(1);

    setVisible(first, false);
    expect(pause).toHaveBeenCalledTimes(1);
  });

  test("does not autoplay for visitors who prefer reduced motion", () => {
    mockReducedMotion.mockReturnValue(true);
    render(<HomeReelsStrip videos={HOME_REEL_VIDEO_URLS} />);

    expect(observers).toHaveLength(0);
    expect(play).not.toHaveBeenCalled();
    for (const video of videos()) expect(video).toHaveAttribute("controls");
  });
});

describe("HomeVideoSection", () => {
  test("shows the main ImageKit video followed by the reels", () => {
    render(
      <HomeVideoSection
        videoUrl={HOME_MAIN_VIDEO_URL}
        reels={HOME_REEL_VIDEO_URLS}
        t={{ badge: "Watch", heading: "See us", subhead: "", fallback: "" }}
      />,
    );

    const [main, ...reels] = videos();
    const mainSources = [...main.querySelectorAll("source")].map((s) =>
      s.getAttribute("src"),
    );
    expect(mainSources).toContain(HOME_MAIN_VIDEO_URL);
    expect(reels).toHaveLength(4);
    expect(screen.getByTestId("home-reels")).toBeInTheDocument();
  });
});

describe("HomeMainVideo", () => {
  const renderMain = () => {
    render(<HomeMainVideo url={HOME_MAIN_VIDEO_URL} fallback="" />);
    return videos()[0];
  };

  test("starts muted with controls when scrolled into view, pauses when scrolled away", () => {
    const video = renderMain();
    expect(video.muted).toBe(true);
    expect(video).toHaveAttribute("controls");
    expect(play).not.toHaveBeenCalled();

    setVisible(video, true);
    expect(play).toHaveBeenCalledTimes(1);

    setVisible(video, false);
    expect(pause).toHaveBeenCalledTimes(1);

    setVisible(video, true);
    expect(play).toHaveBeenCalledTimes(2);
  });

  test("stays paused after the visitor pauses it, until they press play", () => {
    const video = renderMain();
    setVisible(video, true);

    act(() => video.pause()); // the visitor's pause
    setVisible(video, false);
    setVisible(video, true);
    expect(play).toHaveBeenCalledTimes(1);

    act(() => void video.play()); // the visitor presses play again
    setVisible(video, false);
    setVisible(video, true);
    expect(play).toHaveBeenCalledTimes(3);
  });

  test("does not autoplay for visitors who prefer reduced motion", () => {
    mockReducedMotion.mockReturnValue(true);
    const video = renderMain();

    expect(observers).toHaveLength(0);
    expect(video).toHaveAttribute("controls");
    expect(play).not.toHaveBeenCalled();
  });
});
