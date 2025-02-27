export const devServerConfig = {
   entry: "./server.ts",
   exclude: [
      /.*\.tsx?($|\?)/,
      /^(?!.*\/__admin).*\.(s?css|less)($|\?)/,
      // exclude except /api
      /^(?!.*\/api).*\.(ico|mp4|jpg|jpeg|svg|png|vtt|mp3|js)($|\?)/,
      /^\/@.+$/,
      /\/components.*?\.json.*/, // @todo: improve
      /^\/(public|assets|static)\/.+/,
      /^\/node_modules\/.*/,
   ] as any,
   injectClientScript: false,
} as const;
