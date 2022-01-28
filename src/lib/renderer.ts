import * as PIXI from "pixi.js";

export type Engine = typeof PIXI;
export type EngineApplication = PIXI.Application;
export type Container = PIXI.Container;
export type Texture = PIXI.Texture;
export type Sprite = PIXI.Sprite;

export class Renderer {
  static readonly engine: Engine = PIXI;
  readonly instance: EngineApplication;

  constructor(
    options: {
      targetSelector: string;
      width?: number;
      height?: number;
    } = { targetSelector: "#target" }
  ) {
    Renderer.engine.settings.SCALE_MODE = Renderer.engine.SCALE_MODES.NEAREST;
    Renderer.engine.settings.ROUND_PIXELS = true;

    this.instance = new Renderer.engine.Application({
      width: options.width ?? 200,
      height: options.height ?? 200,
    });

    const targetHTMLElement = document.querySelector(options.targetSelector);

    if (!targetHTMLElement) {
      throw new Error("No target element available.");
    }

    targetHTMLElement.appendChild(this.instance.view);
  }

  static readonly registered = new WeakMap<Renderable>();

  static register(renderable: Renderable) {
    Renderer.registered.set(renderable, (delta: number) =>
      renderable.update(delta, Date.now())
    );
    Renderer.engine.Ticker.shared.add(Renderer.registered.get(renderable));

    return renderable;
  }

  static unregister(renderable: Renderable) {
    Renderer.engine.Ticker.shared.remove(Renderer.registered.get(renderable));
    Renderer.registered.delete(renderable);

    return renderable;
  }

  static readonly textureCache = new Map<string, Texture>();

  static createTexture(
    id: string,
    options: {
      buffer: Uint8Array;
      width: number;
      height: number;
    }
  ) {
    const cacheHit = this.textureCache.get(id);
    if (!cacheHit) {
      this.textureCache.set(
        id,
        this.engine.Texture.fromBuffer(
          options.buffer,
          options.width,
          options.height
        )
      );
    }

    const texture = this.textureCache.get(id)!;
    return texture;
  }

  static createContainer(
    options: {
      x?: number;
      y?: number;
      z?: number;
      visible?: boolean;
    } = {}
  ) {
    const container = new this.engine.Container();
    container.position.set(options.x ?? 0, options.y ?? 0);
    container.zIndex = options.z ?? 1;
    container.visible = options.visible ?? true;

    return container;
  }

  static createSprite(
    textureId: string,
    options: { x?: number; y?: number; z?: number } = {}
  ) {
    const sprite = new Renderer.engine.Sprite(
      this.textureCache.get(textureId) ?? Renderer.engine.Texture.EMPTY
    );

    sprite.position.set(options.x ?? 0, options.y ?? 0);

    return sprite;
  }
}

class Renderable {
  readonly container: Container;
  protected destroyed = false;

  constructor(
    private readonly id: string = "",
    options: { x?: number; y?: number; z?: number; visible?: boolean } = {}
  ) {
    this.container = Renderer.createContainer(options);

    Renderer.register(this);
  }

  destructor() {
    Renderer.unregister(this);
    this.container.parent?.removeChild(this.container);
    this.container.destroy({ children: true });
    this.destroyed = true;
  }

  init(parent: Renderable | EngineApplication) {
    if ("stage" in parent) {
      // EngineApplication
      parent.stage.addChild(this.container);
    } else {
      // Renderable
      parent.container.addChild(this.container);
    }
  }

  update(delta: number, time: number) {
    if (this.destroyed) {
      return;
    }
  }
}

export class Tile extends Renderable {
  constructor(options: {
    textureId: string;
    x: number;
    y: number;
    z?: number;
  }) {
    const timeId = `${Date.now()}`;
    super();
    this.container.addChild(Renderer.createSprite(options.textureId));

    this.container.position.set(options.x, options.y);
    this.container.zIndex = options.z ?? 1;
  }
}

export class TileMap extends Renderable {
  constructor(tiles: Tile[]) {
    super();
    tiles.forEach((tile) => {
      this.container.addChild(tile.container);
    });
  }
}
