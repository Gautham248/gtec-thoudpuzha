/**
 * Homepage videos, hosted on ImageKit. To change a video, upload it to
 * ImageKit and replace its URL here.
 */

/** The wide intro video under the hero. */
export const HOME_MAIN_VIDEO_URL =
  "https://ik.imagekit.io/jr7ifutrz/GTEC-Thodupuzha/gtec%201%20(1).mp4";

/** Portrait (9:16) clips shown as an autoplaying strip below the intro video. */
export const HOME_REEL_VIDEO_URLS = [
  "https://ik.imagekit.io/jr7ifutrz/GTEC-Thodupuzha/video1.mp4",
  "https://ik.imagekit.io/jr7ifutrz/GTEC-Thodupuzha/video2.mp4",
  "https://ik.imagekit.io/jr7ifutrz/GTEC-Thodupuzha/video3.mp4",
  "https://ik.imagekit.io/jr7ifutrz/GTEC-Thodupuzha/video4.mp4",
] as const;

/**
 * ImageKit transforms a video on the fly from URL parameters: `tr=` for
 * resize / format / quality, and `/ik-thumbnail.jpg` for a still frame.
 */
export function imagekitUrl(base: string, suffix: string) {
  return `${base.split("?")[0]}${suffix}`;
}
