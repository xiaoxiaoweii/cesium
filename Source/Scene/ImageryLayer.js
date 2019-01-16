define([
        '../Core/Cartesian2',
        '../Core/Cartesian4',
        '../Core/Cartesian3',
        '../Core/Cartographic',
        '../Core/defaultValue',
        '../Core/defined',
        '../Core/defineProperties',
        '../Core/destroyObject',
        '../Core/DeveloperError',
        '../Core/FeatureDetection',
        '../Core/GeographicProjection',
        '../Core/GeographicTilingScheme',
        '../Core/IndexDatatype',
        '../Core/Math',
        '../Core/PixelFormat',
        '../Core/Rectangle',
        '../Core/Request',
        '../Core/RequestState',
        '../Core/RequestType',
        '../Core/TerrainProvider',
        '../Core/TileProviderError',
        '../Core/WebMercatorProjection',
        '../Core/WebMercatorTilingScheme',
        '../Renderer/Buffer',
        '../Renderer/BufferUsage',
        '../Renderer/ComputeCommand',
        '../Renderer/ContextLimits',
        '../Renderer/MipmapHint',
        '../Renderer/Sampler',
        '../Renderer/ShaderProgram',
        '../Renderer/ShaderSource',
        '../Renderer/Texture',
        '../Renderer/TextureMagnificationFilter',
        '../Renderer/TextureMinificationFilter',
        '../Renderer/TextureWrap',
        '../Renderer/VertexArray',
        '../Shaders/ReprojectWebMercatorFS',
        '../Shaders/ReprojectWebMercatorVS',
        '../Shaders/ReprojectArbitraryFS',
        '../Shaders/ReprojectArbitraryVS',
        '../ThirdParty/when',
        './Imagery',
        './ImagerySplitDirection',
        './ImageryState',
        './TileImagery'
    ], function(
        Cartesian2,
        Cartesian4,
        Cartesian3,
        Cartographic,
        defaultValue,
        defined,
        defineProperties,
        destroyObject,
        DeveloperError,
        FeatureDetection,
        GeographicProjection,
        GeographicTilingScheme,
        IndexDatatype,
        CesiumMath,
        PixelFormat,
        Rectangle,
        Request,
        RequestState,
        RequestType,
        TerrainProvider,
        TileProviderError,
        WebMercatorProjection,
        WebMercatorTilingScheme,
        Buffer,
        BufferUsage,
        ComputeCommand,
        ContextLimits,
        MipmapHint,
        Sampler,
        ShaderProgram,
        ShaderSource,
        Texture,
        TextureMagnificationFilter,
        TextureMinificationFilter,
        TextureWrap,
        VertexArray,
        ReprojectWebMercatorFS,
        ReprojectWebMercatorVS,
        ReprojectArbitraryFS,
        ReprojectArbitraryVS,
        when,
        Imagery,
        ImagerySplitDirection,
        ImageryState,
        TileImagery) {
    'use strict';

    /**
     * An imagery layer that displays tiled image data from a single imagery provider
     * on a {@link Globe}.
     *
     * @alias ImageryLayer
     * @constructor
     *
     * @param {ImageryProvider} imageryProvider The imagery provider to use.
     * @param {Object} [options] Object with the following properties:
     * @param {Rectangle} [options.rectangle=imageryProvider.rectangle] The rectangle of the layer.  This rectangle
     *        can limit the visible portion of the imagery provider.
     * @param {Number|Function} [options.alpha=1.0] The alpha blending value of this layer, from 0.0 to 1.0.
     *                          This can either be a simple number or a function with the signature
     *                          <code>function(frameState, layer, x, y, level)</code>.  The function is passed the
     *                          current frame state, this layer, and the x, y, and level coordinates of the
     *                          imagery tile for which the alpha is required, and it is expected to return
     *                          the alpha value to use for the tile.
     * @param {Number|Function} [options.brightness=1.0] The brightness of this layer.  1.0 uses the unmodified imagery
     *                          color.  Less than 1.0 makes the imagery darker while greater than 1.0 makes it brighter.
     *                          This can either be a simple number or a function with the signature
     *                          <code>function(frameState, layer, x, y, level)</code>.  The function is passed the
     *                          current frame state, this layer, and the x, y, and level coordinates of the
     *                          imagery tile for which the brightness is required, and it is expected to return
     *                          the brightness value to use for the tile.  The function is executed for every
     *                          frame and for every tile, so it must be fast.
     * @param {Number|Function} [options.contrast=1.0] The contrast of this layer.  1.0 uses the unmodified imagery color.
     *                          Less than 1.0 reduces the contrast while greater than 1.0 increases it.
     *                          This can either be a simple number or a function with the signature
     *                          <code>function(frameState, layer, x, y, level)</code>.  The function is passed the
     *                          current frame state, this layer, and the x, y, and level coordinates of the
     *                          imagery tile for which the contrast is required, and it is expected to return
     *                          the contrast value to use for the tile.  The function is executed for every
     *                          frame and for every tile, so it must be fast.
     * @param {Number|Function} [options.hue=0.0] The hue of this layer.  0.0 uses the unmodified imagery color.
     *                          This can either be a simple number or a function with the signature
     *                          <code>function(frameState, layer, x, y, level)</code>.  The function is passed the
     *                          current frame state, this layer, and the x, y, and level coordinates
     *                          of the imagery tile for which the hue is required, and it is expected to return
     *                          the contrast value to use for the tile.  The function is executed for every
     *                          frame and for every tile, so it must be fast.
     * @param {Number|Function} [options.saturation=1.0] The saturation of this layer.  1.0 uses the unmodified imagery color.
     *                          Less than 1.0 reduces the saturation while greater than 1.0 increases it.
     *                          This can either be a simple number or a function with the signature
     *                          <code>function(frameState, layer, x, y, level)</code>.  The function is passed the
     *                          current frame state, this layer, and the x, y, and level coordinates
     *                          of the imagery tile for which the saturation is required, and it is expected to return
     *                          the contrast value to use for the tile.  The function is executed for every
     *                          frame and for every tile, so it must be fast.
     * @param {Number|Function} [options.gamma=1.0] The gamma correction to apply to this layer.  1.0 uses the unmodified imagery color.
     *                          This can either be a simple number or a function with the signature
     *                          <code>function(frameState, layer, x, y, level)</code>.  The function is passed the
     *                          current frame state, this layer, and the x, y, and level coordinates of the
     *                          imagery tile for which the gamma is required, and it is expected to return
     *                          the gamma value to use for the tile.  The function is executed for every
     *                          frame and for every tile, so it must be fast.
     * @param {ImagerySplitDirection|Function} [options.splitDirection=ImagerySplitDirection.NONE] The {@link ImagerySplitDirection} split to apply to this layer.
     * @param {TextureMinificationFilter} [options.minificationFilter=TextureMinificationFilter.LINEAR] The
     *                                    texture minification filter to apply to this layer. Possible values
     *                                    are <code>TextureMinificationFilter.LINEAR</code> and
     *                                    <code>TextureMinificationFilter.NEAREST</code>.
     * @param {TextureMagnificationFilter} [options.magnificationFilter=TextureMagnificationFilter.LINEAR] The
     *                                     texture minification filter to apply to this layer. Possible values
     *                                     are <code>TextureMagnificationFilter.LINEAR</code> and
     *                                     <code>TextureMagnificationFilter.NEAREST</code>.
     * @param {Boolean} [options.show=true] True if the layer is shown; otherwise, false.
     * @param {Number} [options.maximumAnisotropy=maximum supported] The maximum anisotropy level to use
     *        for texture filtering.  If this parameter is not specified, the maximum anisotropy supported
     *        by the WebGL stack will be used.  Larger values make the imagery look better in horizon
     *        views.
     * @param {Number} [options.minimumTerrainLevel] The minimum terrain level-of-detail at which to show this imagery layer,
     *                 or undefined to show it at all levels.  Level zero is the least-detailed level.
     * @param {Number} [options.maximumTerrainLevel] The maximum terrain level-of-detail at which to show this imagery layer,
     *                 or undefined to show it at all levels.  Level zero is the least-detailed level.
     * @param {Rectangle} [options.cutoutRectangle] Cartographic rectangle for cutting out a portion of this ImageryLayer.
     * @param {Number} [options.projectedImageryReprojectionWidth=128] Width of the grid for reprojecting imagery that uses a {@link ProjectedImageryTilingScheme}. Clamps between 2-255 (inclusive).
     */
    function ImageryLayer(imageryProvider, options) {
        this._imageryProvider = imageryProvider;

        options = defaultValue(options, {});

        /**
         * The alpha blending value of this layer, with 0.0 representing fully transparent and
         * 1.0 representing fully opaque.
         *
         * @type {Number}
         * @default 1.0
         */
        this.alpha = defaultValue(options.alpha, defaultValue(imageryProvider.defaultAlpha, 1.0));

        /**
         * The brightness of this layer.  1.0 uses the unmodified imagery color.  Less than 1.0
         * makes the imagery darker while greater than 1.0 makes it brighter.
         *
         * @type {Number}
         * @default {@link ImageryLayer.DEFAULT_BRIGHTNESS}
         */
        this.brightness = defaultValue(options.brightness, defaultValue(imageryProvider.defaultBrightness, ImageryLayer.DEFAULT_BRIGHTNESS));

        /**
         * The contrast of this layer.  1.0 uses the unmodified imagery color.  Less than 1.0 reduces
         * the contrast while greater than 1.0 increases it.
         *
         * @type {Number}
         * @default {@link ImageryLayer.DEFAULT_CONTRAST}
         */
        this.contrast = defaultValue(options.contrast, defaultValue(imageryProvider.defaultContrast, ImageryLayer.DEFAULT_CONTRAST));

        /**
         * The hue of this layer in radians. 0.0 uses the unmodified imagery color.
         *
         * @type {Number}
         * @default {@link ImageryLayer.DEFAULT_HUE}
         */
        this.hue = defaultValue(options.hue, defaultValue(imageryProvider.defaultHue, ImageryLayer.DEFAULT_HUE));

        /**
         * The saturation of this layer. 1.0 uses the unmodified imagery color. Less than 1.0 reduces the
         * saturation while greater than 1.0 increases it.
         *
         * @type {Number}
         * @default {@link ImageryLayer.DEFAULT_SATURATION}
         */
        this.saturation = defaultValue(options.saturation, defaultValue(imageryProvider.defaultSaturation, ImageryLayer.DEFAULT_SATURATION));

        /**
         * The gamma correction to apply to this layer.  1.0 uses the unmodified imagery color.
         *
         * @type {Number}
         * @default {@link ImageryLayer.DEFAULT_GAMMA}
         */
        this.gamma = defaultValue(options.gamma, defaultValue(imageryProvider.defaultGamma, ImageryLayer.DEFAULT_GAMMA));

        /**
         * The {@link ImagerySplitDirection} to apply to this layer.
         *
         * @type {ImagerySplitDirection}
         * @default {@link ImageryLayer.DEFAULT_SPLIT}
         */
        this.splitDirection = defaultValue(options.splitDirection, defaultValue(imageryProvider.defaultSplit, ImageryLayer.DEFAULT_SPLIT));

        /**
         * The {@link TextureMinificationFilter} to apply to this layer.
         * Possible values are {@link TextureMinificationFilter.LINEAR} (the default)
         * and {@link TextureMinificationFilter.NEAREST}.
         *
         * To take effect, this property must be set immediately after adding the imagery layer.
         * Once a texture is loaded it won't be possible to change the texture filter used.
         *
         * @type {TextureMinificationFilter}
         * @default {@link ImageryLayer.DEFAULT_MINIFICATION_FILTER}
         */
        this.minificationFilter = defaultValue(options.minificationFilter, defaultValue(imageryProvider.defaultMinificationFilter, ImageryLayer.DEFAULT_MINIFICATION_FILTER));

        /**
         * The {@link TextureMagnificationFilter} to apply to this layer.
         * Possible values are {@link TextureMagnificationFilter.LINEAR} (the default)
         * and {@link TextureMagnificationFilter.NEAREST}.
         *
         * To take effect, this property must be set immediately after adding the imagery layer.
         * Once a texture is loaded it won't be possible to change the texture filter used.
         *
         * @type {TextureMagnificationFilter}
         * @default {@link ImageryLayer.DEFAULT_MAGNIFICATION_FILTER}
         */
        this.magnificationFilter = defaultValue(options.magnificationFilter, defaultValue(imageryProvider.defaultMagnificationFilter, ImageryLayer.DEFAULT_MAGNIFICATION_FILTER));

        /**
         * Determines if this layer is shown.
         *
         * @type {Boolean}
         * @default true
         */
        this.show = defaultValue(options.show, true);

        this._minimumTerrainLevel = options.minimumTerrainLevel;
        this._maximumTerrainLevel = options.maximumTerrainLevel;

        this._rectangle = defaultValue(options.rectangle, Rectangle.MAX_VALUE);
        this._maximumAnisotropy = options.maximumAnisotropy;

        this._imageryCache = {};

        this._skeletonPlaceholder = new TileImagery(Imagery.createPlaceholder(this));

        // The value of the show property on the last update.
        this._show = true;

        // The index of this layer in the ImageryLayerCollection.
        this._layerIndex = -1;

        // true if this is the base (lowest shown) layer.
        this._isBaseLayer = false;

        this._requestImageError = undefined;

        this._reprojectComputeCommands = [];

        var reprojectionVertexWidth = defaultValue(options.projectedImageryReprojectionWidth, ImageryLayer.DEFAULT_PROJECTED_IMAGERY_REPROJECTION_WIDTH);
        this._arbitraryReprojectionWidth = CesiumMath.clamp(reprojectionVertexWidth, 2, 255);

        /**
         * Rectangle cutout in this layer of imagery.
         *
         * @type {Rectangle}
         */
        this.cutoutRectangle = options.cutoutRectangle;
    }

    defineProperties(ImageryLayer.prototype, {

        /**
         * Gets the imagery provider for this layer.
         * @memberof ImageryLayer.prototype
         * @type {ImageryProvider}
         * @readonly
         */
        imageryProvider : {
            get: function() {
                return this._imageryProvider;
            }
        },

        /**
         * Gets the rectangle of this layer.  If this rectangle is smaller than the rectangle of the
         * {@link ImageryProvider}, only a portion of the imagery provider is shown.
         * @memberof ImageryLayer.prototype
         * @type {Rectangle}
         * @readonly
         */
        rectangle: {
            get: function() {
                return this._rectangle;
            }
        }
    });

    /**
     * This value is used as the default brightness for the imagery layer if one is not provided during construction
     * or by the imagery provider. This value does not modify the brightness of the imagery.
     * @type {Number}
     * @default 1.0
     */
    ImageryLayer.DEFAULT_BRIGHTNESS = 1.0;
    /**
     * This value is used as the default contrast for the imagery layer if one is not provided during construction
     * or by the imagery provider. This value does not modify the contrast of the imagery.
     * @type {Number}
     * @default 1.0
     */
    ImageryLayer.DEFAULT_CONTRAST = 1.0;
    /**
     * This value is used as the default hue for the imagery layer if one is not provided during construction
     * or by the imagery provider. This value does not modify the hue of the imagery.
     * @type {Number}
     * @default 0.0
     */
    ImageryLayer.DEFAULT_HUE = 0.0;
    /**
     * This value is used as the default saturation for the imagery layer if one is not provided during construction
     * or by the imagery provider. This value does not modify the saturation of the imagery.
     * @type {Number}
     * @default 1.0
     */
    ImageryLayer.DEFAULT_SATURATION = 1.0;
    /**
     * This value is used as the default gamma for the imagery layer if one is not provided during construction
     * or by the imagery provider. This value does not modify the gamma of the imagery.
     * @type {Number}
     * @default 1.0
     */
    ImageryLayer.DEFAULT_GAMMA = 1.0;

    /**
     * This value is used as the default split for the imagery layer if one is not provided during construction
     * or by the imagery provider.
     * @type {ImagerySplitDirection}
     * @default ImagerySplitDirection.NONE
     */
    ImageryLayer.DEFAULT_SPLIT = ImagerySplitDirection.NONE;

    /**
     * This value is used as the default texture minification filter for the imagery layer if one is not provided
     * during construction or by the imagery provider.
     * @type {TextureMinificationFilter}
     * @default TextureMinificationFilter.LINEAR
     */
    ImageryLayer.DEFAULT_MINIFICATION_FILTER = TextureMinificationFilter.LINEAR;

    /**
     * This value is used as the default texture magnification filter for the imagery layer if one is not provided
     * during construction or by the imagery provider.
     * @type {TextureMagnificationFilter}
     * @default TextureMagnificationFilter.LINEAR
     */
    ImageryLayer.DEFAULT_MAGNIFICATION_FILTER = TextureMagnificationFilter.LINEAR;

    /**
     * This value is used as the default grid width when reprojecting imagery that uses a {@link ProjectedImageryTilingScheme}.
     * @type {Number}
     * @default 128
     */
    ImageryLayer.DEFAULT_PROJECTED_IMAGERY_REPROJECTION_WIDTH = 128;

    /**
     * Gets a value indicating whether this layer is the base layer in the
     * {@link ImageryLayerCollection}.  The base layer is the one that underlies all
     * others.  It is special in that it is treated as if it has global rectangle, even if
     * it actually does not, by stretching the texels at the edges over the entire
     * globe.
     *
     * @returns {Boolean} true if this is the base layer; otherwise, false.
     */
    ImageryLayer.prototype.isBaseLayer = function() {
        return this._isBaseLayer;
    };

    /**
     * Returns true if this object was destroyed; otherwise, false.
     * <br /><br />
     * If this object was destroyed, it should not be used; calling any function other than
     * <code>isDestroyed</code> will result in a {@link DeveloperError} exception.
     *
     * @returns {Boolean} True if this object was destroyed; otherwise, false.
     *
     * @see ImageryLayer#destroy
     */
    ImageryLayer.prototype.isDestroyed = function() {
        return false;
    };

    /**
     * Destroys the WebGL resources held by this object.  Destroying an object allows for deterministic
     * release of WebGL resources, instead of relying on the garbage collector to destroy this object.
     * <br /><br />
     * Once an object is destroyed, it should not be used; calling any function other than
     * <code>isDestroyed</code> will result in a {@link DeveloperError} exception.  Therefore,
     * assign the return value (<code>undefined</code>) to the object as done in the example.
     *
     * @exception {DeveloperError} This object was destroyed, i.e., destroy() was called.
     *
     *
     * @example
     * imageryLayer = imageryLayer && imageryLayer.destroy();
     *
     * @see ImageryLayer#isDestroyed
     */
    ImageryLayer.prototype.destroy = function() {
        return destroyObject(this);
    };

    var imageryBoundsScratch = new Rectangle();
    var tileImageryBoundsScratch = new Rectangle();
    var clippedRectangleScratch = new Rectangle();
    var terrainRectangleScratch = new Rectangle();

    /**
     * Computes the intersection of this layer's rectangle with the imagery provider's availability rectangle,
     * producing the overall bounds of imagery that can be produced by this layer.
     *
     * @returns {Promise.<Rectangle>} A promise to a rectangle which defines the overall bounds of imagery that can be produced by this layer.
     *
     * @example
     * // Zoom to an imagery layer.
     * imageryLayer.getViewableRectangle().then(function (rectangle) {
     *     return camera.flyTo({
     *         destination: rectangle
     *     });
     * });
     */
    ImageryLayer.prototype.getViewableRectangle = function() {
        var imageryProvider = this._imageryProvider;
        var rectangle = this._rectangle;
        return imageryProvider.readyPromise.then(function() {
            return Rectangle.intersection(imageryProvider.rectangle, rectangle);
        });
    };

    /**
     * Create skeletons for the imagery tiles that partially or completely overlap a given terrain
     * tile.
     *
     * @private
     *
     * @param {Tile} tile The terrain tile.
     * @param {TerrainProvider} terrainProvider The terrain provider associated with the terrain tile.
     * @param {Number} insertionPoint The position to insert new skeletons before in the tile's imagery list.
     * @returns {Boolean} true if this layer overlaps any portion of the terrain tile; otherwise, false.
     */
    ImageryLayer.prototype._createTileImagerySkeletons = function(tile, terrainProvider, insertionPoint) {
        var surfaceTile = tile.data;

        if (defined(this._minimumTerrainLevel) && tile.level < this._minimumTerrainLevel) {
            return false;
        }
        if (defined(this._maximumTerrainLevel) && tile.level > this._maximumTerrainLevel) {
            return false;
        }

        var imageryProvider = this._imageryProvider;

        if (!defined(insertionPoint)) {
            insertionPoint = surfaceTile.imagery.length;
        }

        if (!imageryProvider.ready) {
            // The imagery provider is not ready, so we can't create skeletons, yet.
            // Instead, add a placeholder so that we'll know to create
            // the skeletons once the provider is ready.
            this._skeletonPlaceholder.loadingImagery.addReference();
            surfaceTile.imagery.splice(insertionPoint, 0, this._skeletonPlaceholder);
            return true;
        }

        // Use Web Mercator for our texture coordinate computations if this imagery layer uses
        // that projection and the terrain tile falls entirely inside the valid bounds of the
        // projection.
        var useWebMercatorT = imageryProvider.tilingScheme.projection instanceof WebMercatorProjection &&
                              tile.rectangle.north < WebMercatorProjection.MaximumLatitude &&
                              tile.rectangle.south > -WebMercatorProjection.MaximumLatitude;

        // Compute the rectangle of the imagery from this imageryProvider that overlaps
        // the geometry tile.  The ImageryProvider and ImageryLayer both have the
        // opportunity to constrain the rectangle.  The imagery TilingScheme's rectangle
        // always fully contains the ImageryProvider's rectangle.
        var imageryBounds = Rectangle.intersection(imageryProvider.rectangle, this._rectangle, imageryBoundsScratch);
        var rectangle = Rectangle.intersection(tile.rectangle, imageryBounds, tileImageryBoundsScratch);

        if (!defined(rectangle)) {
            // There is no overlap between this terrain tile and this imagery
            // provider.  Unless this is the base layer, no skeletons need to be created.
            // We stretch texels at the edge of the base layer over the entire globe.
            if (!this.isBaseLayer()) {
                return false;
            }

            var baseImageryRectangle = imageryBounds;
            var baseTerrainRectangle = tile.rectangle;
            rectangle = tileImageryBoundsScratch;

            if (baseTerrainRectangle.south >= baseImageryRectangle.north) {
                rectangle.north = rectangle.south = baseImageryRectangle.north;
            } else if (baseTerrainRectangle.north <= baseImageryRectangle.south) {
                rectangle.north = rectangle.south = baseImageryRectangle.south;
            } else {
                rectangle.south = Math.max(baseTerrainRectangle.south, baseImageryRectangle.south);
                rectangle.north = Math.min(baseTerrainRectangle.north, baseImageryRectangle.north);
            }

            if (baseTerrainRectangle.west >= baseImageryRectangle.east) {
                rectangle.west = rectangle.east = baseImageryRectangle.east;
            } else if (baseTerrainRectangle.east <= baseImageryRectangle.west) {
                rectangle.west = rectangle.east = baseImageryRectangle.west;
            } else {
                rectangle.west = Math.max(baseTerrainRectangle.west, baseImageryRectangle.west);
                rectangle.east = Math.min(baseTerrainRectangle.east, baseImageryRectangle.east);
            }
        }

        var latitudeClosestToEquator = 0.0;
        if (rectangle.south > 0.0) {
            latitudeClosestToEquator = rectangle.south;
        } else if (rectangle.north < 0.0) {
            latitudeClosestToEquator = rectangle.north;
        }

        // Compute the required level in the imagery tiling scheme.
        // The errorRatio should really be imagerySSE / terrainSSE rather than this hard-coded value.
        // But first we need configurable imagery SSE and we need the rendering to be able to handle more
        // images attached to a terrain tile than there are available texture units.  So that's for the future.
        var errorRatio = 1.0;
        var targetGeometricError = errorRatio * terrainProvider.getLevelMaximumGeometricError(tile.level);
        var imageryLevel = getLevelWithMaximumTexelSpacing(this, targetGeometricError, latitudeClosestToEquator);
        imageryLevel = Math.max(0, imageryLevel);
        var maximumLevel = imageryProvider.maximumLevel;
        if (imageryLevel > maximumLevel) {
            imageryLevel = maximumLevel;
        }

        if (defined(imageryProvider.minimumLevel)) {
            var minimumLevel = imageryProvider.minimumLevel;
            if (imageryLevel < minimumLevel) {
                imageryLevel = minimumLevel;
            }
        }

        var imageryTilingScheme = imageryProvider.tilingScheme;
        var northwestTileCoordinates = imageryTilingScheme.positionToTileXY(Rectangle.northwest(rectangle), imageryLevel);
        var southeastTileCoordinates = imageryTilingScheme.positionToTileXY(Rectangle.southeast(rectangle), imageryLevel);

        // If the southeast corner of the rectangle lies very close to the north or west side
        // of the southeast tile, we don't actually need the southernmost or easternmost
        // tiles.
        // Similarly, if the northwest corner of the rectangle lies very close to the south or east side
        // of the northwest tile, we don't actually need the northernmost or westernmost tiles.

        // We define "very close" as being within 1/512 of the width of the tile.
        var veryCloseX = tile.rectangle.width / 512.0;
        var veryCloseY = tile.rectangle.height / 512.0;

        var northwestTileRectangle = imageryTilingScheme.tileXYToRectangle(northwestTileCoordinates.x, northwestTileCoordinates.y, imageryLevel);
        if (Math.abs(northwestTileRectangle.south - tile.rectangle.north) < veryCloseY && northwestTileCoordinates.y < southeastTileCoordinates.y) {
            ++northwestTileCoordinates.y;
        }
        if (Math.abs(northwestTileRectangle.east - tile.rectangle.west) < veryCloseX && northwestTileCoordinates.x < southeastTileCoordinates.x) {
            ++northwestTileCoordinates.x;
        }

        var southeastTileRectangle = imageryTilingScheme.tileXYToRectangle(southeastTileCoordinates.x, southeastTileCoordinates.y, imageryLevel);
        if (Math.abs(southeastTileRectangle.north - tile.rectangle.south) < veryCloseY && southeastTileCoordinates.y > northwestTileCoordinates.y) {
            --southeastTileCoordinates.y;
        }
        if (Math.abs(southeastTileRectangle.west - tile.rectangle.east) < veryCloseX && southeastTileCoordinates.x > northwestTileCoordinates.x) {
            --southeastTileCoordinates.x;
        }

        // Create TileImagery instances for each imagery tile overlapping this terrain tile.
        // We need to do all texture coordinate computations in the imagery tile's tiling scheme.

        var terrainRectangle = Rectangle.clone(tile.rectangle, terrainRectangleScratch);
        var imageryRectangle = imageryTilingScheme.tileXYToRectangle(northwestTileCoordinates.x, northwestTileCoordinates.y, imageryLevel);
        var clippedImageryRectangle = Rectangle.intersection(imageryRectangle, imageryBounds, clippedRectangleScratch);

        var imageryTileXYToRectangle;
        if (useWebMercatorT) {
            imageryTilingScheme.rectangleToNativeRectangle(terrainRectangle, terrainRectangle);
            imageryTilingScheme.rectangleToNativeRectangle(imageryRectangle, imageryRectangle);
            imageryTilingScheme.rectangleToNativeRectangle(clippedImageryRectangle, clippedImageryRectangle);
            imageryTilingScheme.rectangleToNativeRectangle(imageryBounds, imageryBounds);
            imageryTileXYToRectangle = imageryTilingScheme.tileXYToNativeRectangle.bind(imageryTilingScheme);
            veryCloseX = terrainRectangle.width / 512.0;
            veryCloseY = terrainRectangle.height / 512.0;
        } else {
            imageryTileXYToRectangle = imageryTilingScheme.tileXYToRectangle.bind(imageryTilingScheme);
        }

        var minU;
        var maxU = 0.0;

        var minV = 1.0;
        var maxV;

        // If this is the northern-most or western-most tile in the imagery tiling scheme,
        // it may not start at the northern or western edge of the terrain tile.
        // Calculate where it does start.
        if (!this.isBaseLayer() && Math.abs(clippedImageryRectangle.west - terrainRectangle.west) >= veryCloseX) {
            maxU = Math.min(1.0, (clippedImageryRectangle.west - terrainRectangle.west) / terrainRectangle.width);
        }

        if (!this.isBaseLayer() && Math.abs(clippedImageryRectangle.north - terrainRectangle.north) >= veryCloseY) {
            minV = Math.max(0.0, (clippedImageryRectangle.north - terrainRectangle.south) / terrainRectangle.height);
        }

        var initialMinV = minV;

        for ( var i = northwestTileCoordinates.x; i <= southeastTileCoordinates.x; i++) {
            minU = maxU;

            imageryRectangle = imageryTileXYToRectangle(i, northwestTileCoordinates.y, imageryLevel);
            clippedImageryRectangle = Rectangle.simpleIntersection(imageryRectangle, imageryBounds, clippedRectangleScratch);

            if (!defined(clippedImageryRectangle)) {
                continue;
            }

            maxU = Math.min(1.0, (clippedImageryRectangle.east - terrainRectangle.west) / terrainRectangle.width);

            // If this is the eastern-most imagery tile mapped to this terrain tile,
            // and there are more imagery tiles to the east of this one, the maxU
            // should be 1.0 to make sure rounding errors don't make the last
            // image fall shy of the edge of the terrain tile.
            if (i === southeastTileCoordinates.x && (this.isBaseLayer() || Math.abs(clippedImageryRectangle.east - terrainRectangle.east) < veryCloseX)) {
                maxU = 1.0;
            }

            minV = initialMinV;

            for ( var j = northwestTileCoordinates.y; j <= southeastTileCoordinates.y; j++) {
                maxV = minV;

                imageryRectangle = imageryTileXYToRectangle(i, j, imageryLevel);
                clippedImageryRectangle = Rectangle.simpleIntersection(imageryRectangle, imageryBounds, clippedRectangleScratch);

                if (!defined(clippedImageryRectangle)) {
                    continue;
                }

                minV = Math.max(0.0, (clippedImageryRectangle.south - terrainRectangle.south) / terrainRectangle.height);

                // If this is the southern-most imagery tile mapped to this terrain tile,
                // and there are more imagery tiles to the south of this one, the minV
                // should be 0.0 to make sure rounding errors don't make the last
                // image fall shy of the edge of the terrain tile.
                if (j === southeastTileCoordinates.y && (this.isBaseLayer() || Math.abs(clippedImageryRectangle.south - terrainRectangle.south) < veryCloseY)) {
                    minV = 0.0;
                }

                var texCoordsRectangle = new Cartesian4(minU, minV, maxU, maxV);
                var imagery = this.getImageryFromCache(i, j, imageryLevel);
                surfaceTile.imagery.splice(insertionPoint, 0, new TileImagery(imagery, texCoordsRectangle, useWebMercatorT));
                ++insertionPoint;
            }
        }

        return true;
    };

    /**
     * Calculate the translation and scale for a particular {@link TileImagery} attached to a
     * particular terrain tile.
     *
     * @private
     *
     * @param {Tile} tile The terrain tile.
     * @param {TileImagery} tileImagery The imagery tile mapping.
     * @returns {Cartesian4} The translation and scale where X and Y are the translation and Z and W
     *          are the scale.
     */
    ImageryLayer.prototype._calculateTextureTranslationAndScale = function(tile, tileImagery) {
        var imageryRectangle = tileImagery.readyImagery.rectangle;
        var terrainRectangle = tile.rectangle;

        if (tileImagery.useWebMercatorT) {
            var tilingScheme = tileImagery.readyImagery.imageryLayer.imageryProvider.tilingScheme;
            imageryRectangle = tilingScheme.rectangleToNativeRectangle(imageryRectangle, imageryBoundsScratch);
            terrainRectangle = tilingScheme.rectangleToNativeRectangle(terrainRectangle, terrainRectangleScratch);
        }

        var terrainWidth = terrainRectangle.width;
        var terrainHeight = terrainRectangle.height;

        var scaleX = terrainWidth / imageryRectangle.width;
        var scaleY = terrainHeight / imageryRectangle.height;
        return new Cartesian4(
                scaleX * (terrainRectangle.west - imageryRectangle.west) / terrainWidth,
                scaleY * (terrainRectangle.south - imageryRectangle.south) / terrainHeight,
                scaleX,
                scaleY);
    };

    /**
     * Request a particular piece of imagery from the imagery provider.  This method handles raising an
     * error event if the request fails, and retrying the request if necessary.
     *
     * @private
     *
     * @param {Imagery} imagery The imagery to request.
     * @param {Function} [priorityFunction] The priority function used for sorting the imagery request.
     */
    ImageryLayer.prototype._requestImagery = function(imagery, priorityFunction) {
        var imageryProvider = this._imageryProvider;

        var that = this;

        function success(image) {
            if (!defined(image)) {
                return failure();
            }

            imagery.image = image;
            imagery.state = ImageryState.RECEIVED;
            imagery.request = undefined;

            TileProviderError.handleSuccess(that._requestImageError);
        }

        function failure(e) {
            if (imagery.request.state === RequestState.CANCELLED) {
                // Cancelled due to low priority - try again later.
                imagery.state = ImageryState.UNLOADED;
                imagery.request = undefined;
                return;
            }

            // Initially assume failure.  handleError may retry, in which case the state will
            // change to TRANSITIONING.
            imagery.state = ImageryState.FAILED;
            imagery.request = undefined;

            var message = 'Failed to obtain image tile X: ' + imagery.x + ' Y: ' + imagery.y + ' Level: ' + imagery.level + '.';
            that._requestImageError = TileProviderError.handleError(
                    that._requestImageError,
                    imageryProvider,
                    imageryProvider.errorEvent,
                    message,
                    imagery.x, imagery.y, imagery.level,
                    doRequest,
                    e);
        }

        function doRequest() {
            var request = new Request({
                throttle : true,
                throttleByServer : true,
                type : RequestType.IMAGERY,
                priorityFunction : priorityFunction
            });
            imagery.request = request;
            imagery.state = ImageryState.TRANSITIONING;
            var imagePromise = imageryProvider.requestImage(imagery.x, imagery.y, imagery.level, request);

            if (!defined(imagePromise)) {
                // Too many parallel requests, so postpone loading tile.
                imagery.state = ImageryState.UNLOADED;
                imagery.request = undefined;
                return;
            }

            if (defined(imageryProvider.getTileCredits)) {
                imagery.credits = imageryProvider.getTileCredits(imagery.x, imagery.y, imagery.level);
            }

            when(imagePromise, success, failure);
        }

        doRequest();
    };

    /**
     * Request a particular piece of projected imagery from the imagery provider that will be integrated into a
     * geographic-projected Imagery tile.
     *
     * This method handles raising an error event if the request fails, and retrying the request if necessary.
     *
     * @private
     *
     * @param {Imagery} imagery The imagery to request.
     * @param {Number[]} projectedIndices The x/y coordinates of the projected images to be requested.
     * @param {Number} level The level of the projected images to request.
     * @param {Number} imageIndex The index of the image to request.
     * @param {Function} [priorityFunction] The priority function used for sorting the imagery request.
     */
    ImageryLayer.prototype._requestProjectedImages = function(imagery, projectedIndices, level, imageIndex, priorityFunction) {
        var imageryProvider = this._imageryProvider;

        var indicesStart = imageIndex * 2;
        var x = projectedIndices[indicesStart];
        var y = projectedIndices[indicesStart + 1];
        var finalImage = indicesStart === (projectedIndices.length - 2);

        var that = this;

        function success(image) {
            if (!defined(image)) {
                return failure(undefined);
            }

            imagery.projectedImages[imageIndex] = image;
            imagery.request = undefined;

            if (finalImage) {
                imagery.state = ImageryState.RECEIVED;
                return;
            }

            TileProviderError.handleSuccess(that._requestImageError);

            that._requestProjectedImages(imagery, projectedIndices, level, imageIndex + 1, priorityFunction);
        }

        function failure(e) {
            if (imagery.request.state === RequestState.CANCELLED) {
                // Cancelled due to low priority - try again later.
                imagery.state = ImageryState.UNLOADED;
                imagery.request = undefined;
                return;
            }

            // Initially assume failure.  handleError may retry, in which case the state will
            // change to TRANSITIONING.
            imagery.state = ImageryState.FAILED;
            imagery.request = undefined;

            var message = 'Failed to obtain image tile X: ' + x + ' Y: ' + y + ' Level: ' + level + '. ';
            that._requestImageError = TileProviderError.handleError(
                    that._requestImageError,
                    imageryProvider,
                    imageryProvider.errorEvent,
                    message,
                    x, y, level,
                    doRequest,
                    e);
        }

        function doRequest() {
            var request = new Request({
                throttle : true,
                throttleByServer : true,
                type : RequestType.IMAGERY,
                priorityFunction : priorityFunction
            });
            imagery.request = request;
            imagery.state = ImageryState.TRANSITIONING;
            var imagePromise = imageryProvider.requestImage(x, y, level, request);

            if (!defined(imagePromise)) {
                // Too many parallel requests, so postpone loading tile.
                imagery.state = ImageryState.UNLOADED;
                imagery.request = undefined;
                return;
            }

            if (defined(imageryProvider.getTileCredits) && finalImage) {
                imagery.credits = imageryProvider.getTileCredits(x, y, level);
            }

            when(imagePromise, success, failure);
        }

        doRequest();
    };

    /**
     * Create a WebGL texture for a given {@link Imagery} instance.
     *
     * @private
     *
     * @param {Context} context The rendered context to use to create textures.
     * @param {Imagery} imagery The imagery for which to create a texture.
     */
    ImageryLayer.prototype._createTexture = function(context, imagery) {
        var imageryProvider = this._imageryProvider;
        var image = imagery.image;

        // If this imagery provider has a discard policy, use it to check if this
        // image should be discarded.
        if (defined(imageryProvider.tileDiscardPolicy)) {
            var discardPolicy = imageryProvider.tileDiscardPolicy;
            if (defined(discardPolicy)) {
                // If the discard policy is not ready yet, transition back to the
                // RECEIVED state and we'll try again next time.
                if (!discardPolicy.isReady()) {
                    imagery.state = ImageryState.RECEIVED;
                    return;
                }

                // Mark discarded imagery tiles invalid.  Parent imagery will be used instead.
                if (discardPolicy.shouldDiscardImage(image)) {
                    imagery.state = ImageryState.INVALID;
                    return;
                }
            }
        }

        //>>includeStart('debug', pragmas.debug);
        if (this.minificationFilter !== TextureMinificationFilter.NEAREST &&
            this.minificationFilter !== TextureMinificationFilter.LINEAR) {
            throw new DeveloperError('ImageryLayer minification filter must be NEAREST or LINEAR');
        }
        //>>includeEnd('debug');

        var sampler = new Sampler({
            minificationFilter : this.minificationFilter,
            magnificationFilter : this.magnificationFilter
        });

        // Imagery does not need to be discarded, so upload it to WebGL.
        var texture;
        if (defined(image.internalFormat)) {
            texture = new Texture({
                context : context,
                pixelFormat : image.internalFormat,
                width : image.width,
                height : image.height,
                source : {
                    arrayBufferView : image.bufferView
                },
                sampler : sampler
            });
        } else {
            texture = new Texture({
                context : context,
                source : image,
                pixelFormat : imageryProvider.hasAlphaChannel ? PixelFormat.RGBA : PixelFormat.RGB,
                sampler : sampler
            });
        }

        if (imageryProvider.tilingScheme.projection instanceof WebMercatorProjection) {
            imagery.textureWebMercator = texture;
        } else {
            imagery.texture = texture;
        }
        imagery.image = undefined;
        imagery.state = ImageryState.TEXTURE_LOADED;
    };

    /**
     * Creates WebGL textures for each image in a given multi-source {@link Imagery} instance.
     * @private
     *
     * @param {Context} context The rendered context to use to create textures.
     * @param {Imagery} imagery The imagery for which to create a texture.
     */
    ImageryLayer.prototype._createMultipleTextures = function(context, imagery) {
        var imageryProvider = this._imageryProvider;
        var projectedImages = imagery.projectedImages;
        var projectedImagesLength = projectedImages.length;

        // If this imagery provider has a discard policy, use it to check if the
        // images should be discarded.
        if (defined(imageryProvider.tileDiscardPolicy)) {
            var discardPolicy = imageryProvider.tileDiscardPolicy;
            if (defined(discardPolicy)) {
                // If the discard policy is not ready yet, transition back to the
                // RECEIVED state and we'll try again next time.
                if (!discardPolicy.isReady()) {
                    imagery.state = ImageryState.RECEIVED;
                    return;
                }

                // Mark discarded imagery tiles invalid.  Parent imagery will be used instead.
                if (discardPolicy.shouldDiscardImage(projectedImages[0])) {
                    imagery.state = ImageryState.INVALID;
                    return;
                }
            }
        }

        //>>includeStart('debug', pragmas.debug);
        if (this.minificationFilter !== TextureMinificationFilter.NEAREST &&
            this.minificationFilter !== TextureMinificationFilter.LINEAR) {
            throw new DeveloperError('ImageryLayer minification filter must be NEAREST or LINEAR');
        }
        //>>includeEnd('debug');

        var sampler = new Sampler({
            minificationFilter : this.minificationFilter,
            magnificationFilter : this.magnificationFilter
        });

        for (var i = 0; i < projectedImagesLength; i++) {
            var image = projectedImages[i];

            var texture;
            if (defined(image.internalFormat)) {
                texture = new Texture({
                    context : context,
                    pixelFormat : image.internalFormat,
                    width : image.width,
                    height : image.height,
                    source : {
                        arrayBufferView : image.bufferView
                    },
                    sampler : sampler
                });
            } else {
                texture = new Texture({
                    context : context,
                    source : image,
                    pixelFormat : imageryProvider.hasAlphaChannel ? PixelFormat.RGBA : PixelFormat.RGB,
                    sampler : sampler
                });
            }
            if (defined(image.destroy)) {
                image.destroy();
            }

            imagery.projectedTextures[i] = texture;
        }
        imagery.projectedImages.length = 0;
        imagery.state = ImageryState.TEXTURE_LOADED;
    };

    function getSamplerKey(minificationFilter, magnificationFilter, maximumAnisotropy) {
        return minificationFilter + ':' + magnificationFilter + ':' + maximumAnisotropy;
    }

    function finalizeReprojectTexture(imageryLayer, context, imagery, texture) {
        var minificationFilter = imageryLayer.minificationFilter;
        var magnificationFilter = imageryLayer.magnificationFilter;
        var usesLinearTextureFilter = minificationFilter === TextureMinificationFilter.LINEAR && magnificationFilter === TextureMagnificationFilter.LINEAR;
        // Use mipmaps if this texture has power-of-two dimensions.
        // In addition, mipmaps are only generated if the texture filters are both LINEAR.
        if (usesLinearTextureFilter && !PixelFormat.isCompressedFormat(texture.pixelFormat) && CesiumMath.isPowerOfTwo(texture.width) && CesiumMath.isPowerOfTwo(texture.height)) {
            minificationFilter = TextureMinificationFilter.LINEAR_MIPMAP_LINEAR;
            var maximumSupportedAnisotropy = ContextLimits.maximumTextureFilterAnisotropy;
            var maximumAnisotropy = Math.min(maximumSupportedAnisotropy, defaultValue(imageryLayer._maximumAnisotropy, maximumSupportedAnisotropy));
            var mipmapSamplerKey = getSamplerKey(minificationFilter, magnificationFilter, maximumAnisotropy);
            var mipmapSamplers = context.cache.imageryLayerMipmapSamplers;
            if (!defined(mipmapSamplers)) {
                mipmapSamplers = {};
                context.cache.imageryLayerMipmapSamplers = mipmapSamplers;
            }
            var mipmapSampler = mipmapSamplers[mipmapSamplerKey];
            if (!defined(mipmapSampler)) {
                mipmapSampler = mipmapSamplers[mipmapSamplerKey] = new Sampler({
                    wrapS : TextureWrap.CLAMP_TO_EDGE,
                    wrapT : TextureWrap.CLAMP_TO_EDGE,
                    minificationFilter : minificationFilter,
                    magnificationFilter : magnificationFilter,
                    maximumAnisotropy : maximumAnisotropy
                });
            }
            texture.generateMipmap(MipmapHint.NICEST);
            texture.sampler = mipmapSampler;
        } else {
            var nonMipmapSamplerKey = getSamplerKey(minificationFilter, magnificationFilter, 0);
            var nonMipmapSamplers = context.cache.imageryLayerNonMipmapSamplers;
            if (!defined(nonMipmapSamplers)) {
                nonMipmapSamplers = {};
                context.cache.imageryLayerNonMipmapSamplers = nonMipmapSamplers;
            }
            var nonMipmapSampler = nonMipmapSamplers[nonMipmapSamplerKey];
            if (!defined(nonMipmapSampler)) {
                nonMipmapSampler = nonMipmapSamplers[nonMipmapSamplerKey] = new Sampler({
                    wrapS : TextureWrap.CLAMP_TO_EDGE,
                    wrapT : TextureWrap.CLAMP_TO_EDGE,
                    minificationFilter : minificationFilter,
                    magnificationFilter : magnificationFilter
                });
            }
            texture.sampler = nonMipmapSampler;
        }

        imagery.state = ImageryState.READY;
    }

    /**
     * Enqueues a command re-projecting a texture to a {@link GeographicProjection} on the next update, if necessary, and generate
     * mipmaps for the geographic texture.
     *
     * @private
     *
     * @param {FrameState} frameState The frameState.
     * @param {Imagery} imagery The imagery instance to reproject.
     * @param {Boolean} [needGeographicProjection=true] True to reproject to geographic, or false if Web Mercator is fine.
     */
    ImageryLayer.prototype._reprojectTexture = function(frameState, imagery, needGeographicProjection) {
        var texture = imagery.textureWebMercator || imagery.texture;
        var rectangle = imagery.rectangle;
        var context = frameState.context;

        needGeographicProjection = defaultValue(needGeographicProjection, true);

        // Reproject this texture if it is not already in a geographic projection and
        // the pixels are more than 1e-5 radians apart.  The pixel spacing cutoff
        // avoids precision problems in the reprojection transformation while making
        // no noticeable difference in the georeferencing of the image.
        if (needGeographicProjection &&
            !(this._imageryProvider.tilingScheme.projection instanceof GeographicProjection) &&
            rectangle.width / texture.width > 1e-5) {
                var that = this;
                imagery.addReference();
                var computeCommand = new ComputeCommand({
                    persists : true,
                    owner : this,
                    // Update render resources right before execution instead of now.
                    // This allows different ImageryLayers to share the same vao and buffers.
                    preExecute : function(command) {
                        reprojectToGeographic(command, context, texture, imagery.rectangle);
                    },
                    postExecute : function(outputTexture) {
                        imagery.texture = outputTexture;
                        finalizeReprojectTexture(that, context, imagery, outputTexture);
                        imagery.releaseReference();
                    }
                });
                this._reprojectComputeCommands.push(computeCommand);
        } else {
            if (needGeographicProjection) {
                imagery.texture = texture;
            }
            finalizeReprojectTexture(this, context, imagery, texture);
        }
    };

    function MakeCommandOptions() {
        this.projectedCoordinates = undefined;
        this.shaderProgram = undefined;
        this.context = undefined;
        this.outputTexture = undefined;
        this.imagery = undefined;
        this.imageryLayer = undefined;
        this.vertexArray = undefined;
        this.projectedRectangle = undefined;
        this.projectedTexture = undefined;
        this.final = undefined;
    }

    var arbitraryReprojectAttributeIndices = {
        position : 0,
        projectedCoordinates : 1
    };

    var geographicCartographicScratch = new Cartographic();
    var projectedScratch = new Cartesian3();

    /**
     * Enqueues commands re-projecting multiple textures to a {@link GeographicProjection} on the next update
     * and generate mipmaps for the geographic texture.
     */
    ImageryLayer.prototype._multisourceReprojectTexture = function(frameState, imagery) {
        var projectedTextures = imagery.projectedTextures;
        var projectedRectangles = imagery.projectedRectangles;
        var projectedTexturesLength = projectedTextures.length;
        var someTexture = projectedTextures[0];

        var width = someTexture.width;
        var height = someTexture.height;

        var outputTexture = imagery.texture = new Texture({
            context : frameState.context,
            width : width,
            height : height,
            pixelFormat : someTexture.pixelFormat,
            pixelDatatype : someTexture.pixelDatatype,
            preMultiplyAlpha : someTexture.preMultiplyAlpha
        });

        // Allocate memory for the mipmaps.  Failure to do this before rendering
        // to the texture via the FBO, and calling generateMipmap later,
        // will result in the texture appearing blank.  I can't pretend to
        // understand exactly why this is.
        if (CesiumMath.isPowerOfTwo(width) && CesiumMath.isPowerOfTwo(height)) {
            outputTexture.generateMipmap(MipmapHint.NICEST);
        }
        var index;
        var w;
        var h;

        var projection = this._imageryProvider.tilingScheme.sourceProjection;
        var context = frameState.context;
        var verticesWidth = this._arbitraryReprojectionWidth;
        var contextCache = context.cache;

        var sampler = contextCache.imageryLayer_arbitraryReprojectionSampler;
        if (!defined(sampler)) {
            sampler = contextCache.imageryLayer_arbitraryReprojectionSampler = new Sampler({
                wrapS : TextureWrap.CLAMP_TO_EDGE,
                wrapT : TextureWrap.CLAMP_TO_EDGE,
                minificationFilter : TextureMinificationFilter.LINEAR,
                magnificationFilter : TextureMagnificationFilter.LINEAR
            });
        }

        var shaderProgram = contextCache.imageryLayer_arbitraryReprojectionShader;
        if (!defined(shaderProgram)) {
            shaderProgram = contextCache.imageryLayer_arbitraryReprojectionShader = ShaderProgram.fromCache({
                context : context,
                vertexShaderSource : ReprojectArbitraryVS,
                fragmentShaderSource : ReprojectArbitraryFS,
                attributeLocations : arbitraryReprojectAttributeIndices
            });
        }

        var cachedVertexArrayKey = 'imageryLayer_reproject' + verticesWidth + '_vertexArray';
        var vertexArray = contextCache[cachedVertexArrayKey];
        if (!defined(vertexArray)) {
            // Create reuseable position and index buffers
            var positions = new Float32Array(verticesWidth * verticesWidth * 2);
            index = 0;
            var widthIncrement = 1.0 / (verticesWidth - 1);
            var heightIncrement = 1.0 / (verticesWidth - 1);
            for (w = 0; w < verticesWidth; w++) {
                for (h = 0; h < verticesWidth; h++) {
                    positions[index++] = w * widthIncrement;
                    positions[index++] = h * heightIncrement;
                }
            }

            var positionsBuffer = Buffer.createVertexBuffer({
                context : context,
                typedArray : positions,
                usage : BufferUsage.STATIC_DRAW
            });

            var indexBuffer = Buffer.createIndexBuffer({
                context : context,
                typedArray : TerrainProvider.getRegularGridIndices(verticesWidth, verticesWidth),
                usage : BufferUsage.STATIC_DRAW,
                indexDatatype : IndexDatatype.UNSIGNED_SHORT
            });

            vertexArray = contextCache[cachedVertexArrayKey] = new VertexArray({
                context: context,
                attributes: [{
                    index: arbitraryReprojectAttributeIndices.position,
                    vertexBuffer: positionsBuffer,
                    componentsPerAttribute: 2
                }, {
                    index: arbitraryReprojectAttributeIndices.projectedCoordinates,
                    vertexBuffer : Buffer.createVertexBuffer({
                        context : context,
                        sizeInBytes : verticesWidth * verticesWidth * 2 * 4,
                        usage : BufferUsage.STREAM_DRAW
                    }),
                    componentsPerAttribute: 2
                }],
                indexBuffer: indexBuffer
            });
        }

        // For each vertex in the target grid, project into the projection
        var cartographicRectangle = imagery.rectangle;
        var south = cartographicRectangle.south;
        var west = cartographicRectangle.west;

        var unprojectedWidthIncrement = cartographicRectangle.width / (verticesWidth - 1);
        var unprojectedHeightIncrement = cartographicRectangle.height / (verticesWidth - 1);
        var geographicCartographic = geographicCartographicScratch;
        var projected = projectedScratch;

        var projectedCoordinates = new Float32Array(verticesWidth * verticesWidth * 2);
        index = 0;
        for (w = 0; w < verticesWidth; w++) {
            for (h = 0; h < verticesWidth; h++) {
                geographicCartographic.longitude = west + w * unprojectedWidthIncrement;
                geographicCartographic.latitude = south + h * unprojectedHeightIncrement;

                projection.project(geographicCartographic, projected);

                projectedCoordinates[index++] = projected.x;
                projectedCoordinates[index++] = projected.y;
            }
        }

        for (var i = 0; i < projectedTexturesLength; i++) {
            imagery.addReference();
            var projectedTexture = projectedTextures[i];
            projectedTexture.sampler = sampler;

            var makeCommandOptions = new MakeCommandOptions();
            makeCommandOptions.shaderProgram = shaderProgram;
            makeCommandOptions.projectedCoordinates = projectedCoordinates;
            makeCommandOptions.context = context;
            makeCommandOptions.outputTexture = outputTexture;
            makeCommandOptions.imagery = imagery;
            makeCommandOptions.imageryLayer = this;
            makeCommandOptions.vertexArray = vertexArray;
            makeCommandOptions.projectedTexture = projectedTexture;
            makeCommandOptions.projectedRectangle = projectedRectangles[i];
            makeCommandOptions.final = (i === projectedTexturesLength - 1);

            var computeCommand = makeCommand(makeCommandOptions);
            this._reprojectComputeCommands.push(computeCommand);
        }
    };

    function makeCommand(makeCommandOptions) {
        var imagery = makeCommandOptions.imagery;
        return new ComputeCommand({
            persists : true,
            owner : this,
            // Update render resources right before execution instead of now.
            // This allows different ImageryLayers to share the same vao and buffers.
            preExecute : function(command) {
                reprojectFromArbitrary(command, makeCommandOptions);
            },
            postExecute : function(outputTexture) {
                if (makeCommandOptions.final) {
                    var projectedTextures = imagery.projectedTextures;
                    var projectedTexturesLength = projectedTextures.length;
                    for (var i = 0; i < projectedTexturesLength; i++) {
                        projectedTextures[i].destroy();
                    }

                    finalizeReprojectTexture(makeCommandOptions.imageryLayer, makeCommandOptions.context, imagery, outputTexture);
                    imagery.projectedTextures.length = 0;
                }
                imagery.releaseReference();
            }
        });
    }

    var arbitraryUniformMap = {
        u_textureDimensions : function() {
            return this.textureDimensions;
        },
        u_texture : function() {
            return this.texture;
        },
        u_westSouthInverseWidthHeight : function() {
            return this.westSouthInverseWidthHeight;
        },
        westSouthInverseWidthHeight : new Cartesian4(),
        textureDimensions : new Cartesian2(),
        texture : undefined
    };

    function reprojectFromArbitrary(command, makeCommandOptions) {
        var vertexArray = makeCommandOptions.vertexArray;
        vertexArray.getAttribute(arbitraryReprojectAttributeIndices.projectedCoordinates).vertexBuffer.copyFromArrayView(makeCommandOptions.projectedCoordinates);

        var texture = makeCommandOptions.projectedTexture;
        var projectedRectangle = makeCommandOptions.projectedRectangle;

        arbitraryUniformMap.textureDimensions.x = texture.width;
        arbitraryUniformMap.textureDimensions.y = texture.height;
        arbitraryUniformMap.texture = texture;

        arbitraryUniformMap.westSouthInverseWidthHeight.x = projectedRectangle.west;
        arbitraryUniformMap.westSouthInverseWidthHeight.y = projectedRectangle.south;
        arbitraryUniformMap.westSouthInverseWidthHeight.z = 1.0 / projectedRectangle.width;
        arbitraryUniformMap.westSouthInverseWidthHeight.w = 1.0 / projectedRectangle.height;

        command.clear = false;
        command.shaderProgram = makeCommandOptions.shaderProgram;
        command.outputTexture = makeCommandOptions.outputTexture;
        command.uniformMap = arbitraryUniformMap;
        command.vertexArray = vertexArray;
    }

    /**
     * Updates frame state to execute any queued texture re-projections.
     *
     * @private
     *
     * @param {FrameState} frameState The frameState.
     */
    ImageryLayer.prototype.queueReprojectionCommands = function(frameState) {
        var computeCommands = this._reprojectComputeCommands;
        var length = computeCommands.length;
        for (var i = 0; i < length; ++i) {
            frameState.commandList.push(computeCommands[i]);
        }
        computeCommands.length = 0;
    };

    /**
     * Cancels re-projection commands queued for the next frame.
     *
     * @private
     */
    ImageryLayer.prototype.cancelReprojections = function() {
        this._reprojectComputeCommands.length = 0;
    };

    ImageryLayer.prototype.getImageryFromCache = function(x, y, level, imageryRectangle) {
        var cacheKey = getImageryCacheKey(x, y, level);
        var imagery = this._imageryCache[cacheKey];

        if (!defined(imagery)) {
            imagery = new Imagery(this, x, y, level, imageryRectangle);
            this._imageryCache[cacheKey] = imagery;
        }

        imagery.addReference();
        return imagery;
    };

    ImageryLayer.prototype.removeImageryFromCache = function(imagery) {
        var cacheKey = getImageryCacheKey(imagery.x, imagery.y, imagery.level);
        delete this._imageryCache[cacheKey];
    };

    function getImageryCacheKey(x, y, level) {
        return JSON.stringify([x, y, level]);
    }

    var uniformMap = {
        u_textureDimensions : function() {
            return this.textureDimensions;
        },
        u_texture : function() {
            return this.texture;
        },

        textureDimensions : new Cartesian2(),
        texture : undefined
    };

    var float32ArrayScratch = FeatureDetection.supportsTypedArrays() ? new Float32Array(2 * 64) : undefined;

    function reprojectToGeographic(command, context, texture, rectangle) {
        // This function has gone through a number of iterations, because GPUs are awesome.
        //
        // Originally, we had a very simple vertex shader and computed the Web Mercator texture coordinates
        // per-fragment in the fragment shader.  That worked well, except on mobile devices, because
        // fragment shaders have limited precision on many mobile devices.  The result was smearing artifacts
        // at medium zoom levels because different geographic texture coordinates would be reprojected to Web
        // Mercator as the same value.
        //
        // Our solution was to reproject to Web Mercator in the vertex shader instead of the fragment shader.
        // This required far more vertex data.  With fragment shader reprojection, we only needed a single quad.
        // But to achieve the same precision with vertex shader reprojection, we needed a vertex for each
        // output pixel.  So we used a grid of 256x256 vertices, because most of our imagery
        // tiles are 256x256.  Fortunately the grid could be created and uploaded to the GPU just once and
        // re-used for all reprojections, so the performance was virtually unchanged from our original fragment
        // shader approach.  See https://github.com/AnalyticalGraphicsInc/cesium/pull/714.
        //
        // Over a year later, we noticed (https://github.com/AnalyticalGraphicsInc/cesium/issues/2110)
        // that our reprojection code was creating a rare but severe artifact on some GPUs (Intel HD 4600
        // for one).  The problem was that the GLSL sin function on these GPUs had a discontinuity at fine scales in
        // a few places.
        //
        // We solved this by implementing a more reliable sin function based on the CORDIC algorithm
        // (https://github.com/AnalyticalGraphicsInc/cesium/pull/2111).  Even though this was a fair
        // amount of code to be executing per vertex, the performance seemed to be pretty good on most GPUs.
        // Unfortunately, on some GPUs, the performance was absolutely terrible
        // (https://github.com/AnalyticalGraphicsInc/cesium/issues/2258).
        //
        // So that brings us to our current solution, the one you see here.  Effectively, we compute the Web
        // Mercator texture coordinates on the CPU and store the T coordinate with each vertex (the S coordinate
        // is the same in Geographic and Web Mercator).  To make this faster, we reduced our reprojection mesh
        // to be only 2 vertices wide and 64 vertices high.  We should have reduced the width to 2 sooner,
        // because the extra vertices weren't buying us anything.  The height of 64 means we are technically
        // doing a slightly less accurate reprojection than we were before, but we can't see the difference
        // so it's worth the 4x speedup.

        var reproject = context.cache.imageryLayer_reproject;

        if (!defined(reproject)) {
            reproject = context.cache.imageryLayer_reproject = {
                vertexArray : undefined,
                shaderProgram : undefined,
                sampler : undefined,
                destroy : function() {
                    if (defined(this.framebuffer)) {
                        this.framebuffer.destroy();
                    }
                    if (defined(this.vertexArray)) {
                        this.vertexArray.destroy();
                    }
                    if (defined(this.shaderProgram)) {
                        this.shaderProgram.destroy();
                    }
                }
            };

            var positions = new Float32Array(2 * 64 * 2);
            var index = 0;
            for (var j = 0; j < 64; ++j) {
                var y = j / 63.0;
                positions[index++] = 0.0;
                positions[index++] = y;
                positions[index++] = 1.0;
                positions[index++] = y;
            }

            var reprojectAttributeIndices = {
                position : 0,
                webMercatorT : 1
            };

            var indices = TerrainProvider.getRegularGridIndices(2, 64);
            var indexBuffer = Buffer.createIndexBuffer({
                context : context,
                typedArray : indices,
                usage : BufferUsage.STATIC_DRAW,
                indexDatatype : IndexDatatype.UNSIGNED_SHORT
            });

            reproject.vertexArray = new VertexArray({
                context : context,
                attributes : [{
                    index : reprojectAttributeIndices.position,
                    vertexBuffer : Buffer.createVertexBuffer({
                        context : context,
                        typedArray : positions,
                        usage : BufferUsage.STATIC_DRAW
                    }),
                    componentsPerAttribute : 2
                },{
                    index : reprojectAttributeIndices.webMercatorT,
                    vertexBuffer : Buffer.createVertexBuffer({
                        context : context,
                        sizeInBytes : 64 * 2 * 4,
                        usage : BufferUsage.STREAM_DRAW
                    }),
                    componentsPerAttribute : 1
                }],
                indexBuffer : indexBuffer
            });

            var vs = new ShaderSource({
                sources : [ReprojectWebMercatorVS]
            });

            reproject.shaderProgram = ShaderProgram.fromCache({
                context : context,
                vertexShaderSource : vs,
                fragmentShaderSource : ReprojectWebMercatorFS,
                attributeLocations : reprojectAttributeIndices
            });

            reproject.sampler = new Sampler({
                wrapS : TextureWrap.CLAMP_TO_EDGE,
                wrapT : TextureWrap.CLAMP_TO_EDGE,
                minificationFilter : TextureMinificationFilter.LINEAR,
                magnificationFilter : TextureMagnificationFilter.LINEAR
            });
        }

        texture.sampler = reproject.sampler;

        var width = texture.width;
        var height = texture.height;

        uniformMap.textureDimensions.x = width;
        uniformMap.textureDimensions.y = height;
        uniformMap.texture = texture;

        var sinLatitude = Math.sin(rectangle.south);
        var southMercatorY = 0.5 * Math.log((1 + sinLatitude) / (1 - sinLatitude));

        sinLatitude = Math.sin(rectangle.north);
        var northMercatorY = 0.5 * Math.log((1 + sinLatitude) / (1 - sinLatitude));
        var oneOverMercatorHeight = 1.0 / (northMercatorY - southMercatorY);

        var outputTexture = new Texture({
            context : context,
            width : width,
            height : height,
            pixelFormat : texture.pixelFormat,
            pixelDatatype : texture.pixelDatatype,
            preMultiplyAlpha : texture.preMultiplyAlpha
        });

        // Allocate memory for the mipmaps.  Failure to do this before rendering
        // to the texture via the FBO, and calling generateMipmap later,
        // will result in the texture appearing blank.  I can't pretend to
        // understand exactly why this is.
        if (CesiumMath.isPowerOfTwo(width) && CesiumMath.isPowerOfTwo(height)) {
            outputTexture.generateMipmap(MipmapHint.NICEST);
        }

        var south = rectangle.south;
        var north = rectangle.north;

        var webMercatorT = float32ArrayScratch;

        var outputIndex = 0;
        for (var webMercatorTIndex = 0; webMercatorTIndex < 64; ++webMercatorTIndex) {
            var fraction = webMercatorTIndex / 63.0;
            var latitude = CesiumMath.lerp(south, north, fraction);
            sinLatitude = Math.sin(latitude);
            var mercatorY = 0.5 * Math.log((1.0 + sinLatitude) / (1.0 - sinLatitude));
            var mercatorFraction = (mercatorY - southMercatorY) * oneOverMercatorHeight;
            webMercatorT[outputIndex++] = mercatorFraction;
            webMercatorT[outputIndex++] = mercatorFraction;
        }

        reproject.vertexArray.getAttribute(1).vertexBuffer.copyFromArrayView(webMercatorT);

        command.shaderProgram = reproject.shaderProgram;
        command.outputTexture = outputTexture;
        command.uniformMap = uniformMap;
        command.vertexArray = reproject.vertexArray;
    }

    /**
     * Gets the level with the specified world coordinate spacing between texels, or less.
     *
     * @param {ImageryLayer} layer The imagery layer to use.
     * @param {Number} texelSpacing The texel spacing for which to find a corresponding level.
     * @param {Number} latitudeClosestToEquator The latitude closest to the equator that we're concerned with.
     * @returns {Number} The level with the specified texel spacing or less.
     */
    function getLevelWithMaximumTexelSpacing(layer, texelSpacing, latitudeClosestToEquator) {
        // PERFORMANCE_IDEA: factor out the stuff that doesn't change.
        var imageryProvider = layer._imageryProvider;
        var tilingScheme = imageryProvider.tilingScheme;
        var ellipsoid = tilingScheme.ellipsoid;
        var latitudeFactor = !(layer._imageryProvider.tilingScheme.projection instanceof GeographicProjection) ? Math.cos(latitudeClosestToEquator) : 1.0;
        var tilingSchemeRectangle = tilingScheme.rectangle;
        var levelZeroMaximumTexelSpacing = ellipsoid.maximumRadius * tilingSchemeRectangle.width * latitudeFactor / (imageryProvider.tileWidth * tilingScheme.getNumberOfXTilesAtLevel(0));

        var twoToTheLevelPower = levelZeroMaximumTexelSpacing / texelSpacing;
        var level = Math.log(twoToTheLevelPower) / Math.log(2);
        var rounded = Math.round(level);
        return rounded | 0;
    }

    return ImageryLayer;
});
