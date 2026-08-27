var Module = self.Module || {};

Module.locateFile = function locateFile(path) {
  if (path.endsWith(".wasm")) {
    return new URL("./stockfish.wasm", self.location.href).toString();
  }

  return new URL(`./${path}`, self.location.href).toString();
};

self.Module = Module;
self.importScripts(new URL("./stockfish.wasm.js", self.location.href).toString());
