import options from '../../options';
import { GameObjects, Scene, Tilemaps } from 'phaser';

import '../../types';
import { UIScene } from '../ui/uiScene';

export type KeyMap = {
    Up: Phaser.Input.Keyboard.Key;
    Left: Phaser.Input.Keyboard.Key;
    Right: Phaser.Input.Keyboard.Key;
    Down: Phaser.Input.Keyboard.Key;
    Z: Phaser.Input.Keyboard.Key;
    X: Phaser.Input.Keyboard.Key;
    Y: Phaser.Input.Keyboard.Key;
    Shift: Phaser.Input.Keyboard.Key;
};

export type PlayerDirection = 'up' | 'down' | 'left' | 'right';

export class WorldScene extends Scene {
    keymap!: KeyMap;
    
    // Map related properties
    map!: Tilemaps.Tilemap;
    tileset!: Tilemaps.Tileset;
    grassLayer!: Tilemaps.TilemapLayer;
    pathLayer!: Tilemaps.TilemapLayer;
    obstaclesLayer!: Tilemaps.TilemapLayer;
    
    // Player properties
    player?: GameObjects.Sprite;
    playerSpeed: number = 100;
    currentPlayerDirection: PlayerDirection = 'down';
    isPlayerMoving: boolean = false;
    
    // Game state
    gameTicks = 0;
    score = 0;
    bgm?: Phaser.Sound.BaseSound;

    constructor(config: Phaser.Types.Scenes.SettingsConfig) {
        if (!config) {
            config = {};
        }
        config.key = 'WorldScene';
        super(config);
    }

    preload() {
        // Load the atlas containing our player sprites and other game objects
        this.load.atlas('packed', 'assets/gfx/packed.png', 'assets/gfx/packed.json');
        
        // Load a tilemap if you have one (for a real project, you would create this in Tiled)
        // this.load.tilemapTiledJSON('map', 'assets/maps/worldmap.json');
        
        // Load a tileset for our map tiles
        // this.load.image('tiles', 'assets/gfx/tileset.png');
    }

    create() {
        this.score = 0;
        this.sound.pauseOnBlur = false;

        // Stop any BGM that might be running already
        if (this.bgm) {
            this.bgm.stop();
            this.bgm.destroy();
            this.bgm = undefined;
        }

        const ui = this.scene.get('UIScene') as UIScene;
        ui.events.emit('reset');

        // Setup keyboard controls
        this.keymap = this.input?.keyboard?.addKeys(
            'Up,Left,Right,Down,X,Z,Shift,Y'
        ) as KeyMap || {} as KeyMap;
        
        this.gameTicks = 0;

        // Create a simple tilemap programmatically
        this.createSimpleTilemap();
        
        // Setup camera and world bounds
        const mapWidth = this.map.widthInPixels;
        const mapHeight = this.map.heightInPixels;
        this.physics.world.setBounds(0, 0, mapWidth, mapHeight);
        this.cameras.main.setBounds(0, 0, mapWidth, mapHeight);
        
        // Create player animations
        this.createPlayerAnimations();
        
        // Add player sprite
        this.player = this.add.sprite(
            this.map.widthInPixels / 2,
            this.map.heightInPixels / 2,
            'packed',
            'player_0'
        );
        this.player.setOrigin(0.5, 0.5);
        this.player.setScale(0.5); // Make the player a little smaller to match tile size better
        
        // Add physics to player
        this.physics.add.existing(this.player);
        const playerBody = this.player.body as Phaser.Physics.Arcade.Body;
        playerBody.setCollideWorldBounds(true);
        
        // Make camera follow player with a slight delay for a smoother effect
        this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
        this.cameras.main.setZoom(1.5); // Zoom in a bit for a more detailed view
        
        // Add collision between player and obstacles layer if it exists
        if (this.obstaclesLayer) {
            this.physics.add.collider(this.player, this.obstaclesLayer);
        }
        
        // Start with player facing down
        this.player.anims.play('player_idle_down');
    }
    
    createSimpleTilemap() {
        // Create a simple tilemap programmatically (32x32 tiles)
        this.map = this.make.tilemap({
            tileWidth: 32,
            tileHeight: 32,
            width: 30,
            height: 30
        });
        
        // Create a tileset from the existing texture
        // Add a simple tileset with our existing sprites
        const tilesetData = this.map.addTilesetImage('tiles', 'packed');
        if (!tilesetData) {
            console.error("Failed to create tileset");
            return;
        }
        this.tileset = tilesetData;
        
        // Create grass layer (base layer)
        const grassLayerData = this.map.createBlankLayer('grass', this.tileset);
        if (!grassLayerData) {
            console.error("Failed to create grass layer");
            return;
        }
        this.grassLayer = grassLayerData;
        
        // Fill the grass layer with a basic tile (using the sky sprite as a placeholder)
        // Use indices from the texture atlas
        const skyTileIndex = 2; // Index of the sky sprite in our packed texture
        this.grassLayer.fill(skyTileIndex);
        
        // Create path layer
        const pathLayerData = this.map.createBlankLayer('path', this.tileset);
        if (!pathLayerData) {
            console.error("Failed to create path layer");
            return;
        }
        this.pathLayer = pathLayerData;
        
        // Create some paths - just a simple cross pattern for now
        // Use the void sprite as the path tile
        const voidTileIndex = 3; // Index of the void sprite in our packed texture
        this.pathLayer.fill(voidTileIndex, 13, 0, 4, 30); // Vertical path
        this.pathLayer.fill(voidTileIndex, 0, 13, 30, 4); // Horizontal path
        
        // Create obstacles layer
        const obstaclesLayerData = this.map.createBlankLayer('obstacles', this.tileset);
        if (!obstaclesLayerData) {
            console.error("Failed to create obstacles layer");
            return;
        }
        this.obstaclesLayer = obstaclesLayerData;
        
        // Add some random obstacles
        // Use the player sprite as obstacles
        const playerTileIndex = 1; // Index of player_1 in our packed texture
        for (let i = 0; i < 20; i++) {
            const x = Phaser.Math.Between(0, 29);
            const y = Phaser.Math.Between(0, 29);
            // Avoid placing obstacles on the paths
            if (!((x >= 13 && x <= 16) || (y >= 13 && y <= 16))) {
                this.obstaclesLayer.putTileAt(playerTileIndex, x, y);
            }
        }
        this.obstaclesLayer.setCollisionByExclusion([-1]);
    }
    
    createPlayerAnimations() {
        // For now we'll just use the existing player sprites and create basic animations
        // In a real Pokemon-like game, you'd want sprites for different directions
        
        // Idle animations
        this.anims.create({
            key: 'player_idle_down',
            frames: [{ key: 'packed', frame: 'player_0' }],
            frameRate: 10,
            repeat: 0
        });
        
        this.anims.create({
            key: 'player_idle_up',
            frames: [{ key: 'packed', frame: 'player_0' }],
            frameRate: 10,
            repeat: 0
        });
        
        this.anims.create({
            key: 'player_idle_left',
            frames: [{ key: 'packed', frame: 'player_0' }],
            frameRate: 10,
            repeat: 0
        });
        
        this.anims.create({
            key: 'player_idle_right',
            frames: [{ key: 'packed', frame: 'player_0' }],
            frameRate: 10,
            repeat: 0
        });
        
        // Walking animations
        this.anims.create({
            key: 'player_walk_down',
            frames: [
                { key: 'packed', frame: 'player_0' },
                { key: 'packed', frame: 'player_1' },
                { key: 'packed', frame: 'player_2' },
                { key: 'packed', frame: 'player_1' }
            ],
            frameRate: 8,
            repeat: -1
        });
        
        this.anims.create({
            key: 'player_walk_up',
            frames: [
                { key: 'packed', frame: 'player_0' },
                { key: 'packed', frame: 'player_1' },
                { key: 'packed', frame: 'player_2' },
                { key: 'packed', frame: 'player_1' }
            ],
            frameRate: 8,
            repeat: -1
        });
        
        this.anims.create({
            key: 'player_walk_left',
            frames: [
                { key: 'packed', frame: 'player_0' },
                { key: 'packed', frame: 'player_1' },
                { key: 'packed', frame: 'player_2' },
                { key: 'packed', frame: 'player_1' }
            ],
            frameRate: 8,
            repeat: -1
        });
        
        this.anims.create({
            key: 'player_walk_right',
            frames: [
                { key: 'packed', frame: 'player_0' },
                { key: 'packed', frame: 'player_1' },
                { key: 'packed', frame: 'player_2' },
                { key: 'packed', frame: 'player_1' }
            ],
            frameRate: 8,
            repeat: -1
        });
    }

    update(time: number, delta: number) {
        this.gameTicks += delta;
        
        if (!this.player) return;
        
        const playerBody = this.player.body as Phaser.Physics.Arcade.Body;
        
        // Reset velocity
        playerBody.setVelocity(0);
        
        // Handle player movement
        if (this.keymap.Left.isDown) {
            playerBody.setVelocityX(-this.playerSpeed);
            this.currentPlayerDirection = 'left';
            this.isPlayerMoving = true;
        } else if (this.keymap.Right.isDown) {
            playerBody.setVelocityX(this.playerSpeed);
            this.currentPlayerDirection = 'right';
            this.isPlayerMoving = true;
        }
        
        if (this.keymap.Up.isDown) {
            playerBody.setVelocityY(-this.playerSpeed);
            this.currentPlayerDirection = 'up';
            this.isPlayerMoving = true;
        } else if (this.keymap.Down.isDown) {
            playerBody.setVelocityY(this.playerSpeed);
            this.currentPlayerDirection = 'down';
            this.isPlayerMoving = true;
        }
        
        // If no movement keys are pressed, player is not moving
        if (!this.keymap.Left.isDown && !this.keymap.Right.isDown && 
            !this.keymap.Up.isDown && !this.keymap.Down.isDown) {
            this.isPlayerMoving = false;
        }
        
        // Normalize speed for diagonal movement
        playerBody.velocity.normalize().scale(this.playerSpeed);
        
        // Update player animation based on movement state and direction
        if (this.isPlayerMoving) {
            this.player.anims.play(`player_walk_${this.currentPlayerDirection}`, true);
        } else {
            this.player.anims.play(`player_idle_${this.currentPlayerDirection}`, true);
        }
    }
}
